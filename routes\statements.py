from flask import Blueprint, request, jsonify, render_template
from models import Order
from datetime import datetime

statements_bp = Blueprint('statements', __name__, url_prefix='/api/statements')


@statements_bp.route('', methods=['GET'])
def get_statement():
    """Return orders within a date range (inclusive).
    Query params: start=YYYY-MM-DD, end=YYYY-MM-DD
    """
    start = request.args.get('start')
    end = request.args.get('end')
    if not start or not end:
        return jsonify({'error': 'start and end query params required (YYYY-MM-DD)'}), 400

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except Exception:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # include the whole end day
    end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

    orders = Order.query.filter(Order.order_date >= start_dt, Order.order_date <= end_dt).order_by(Order.order_date).all()
    orders_list = [o.to_dict() for o in orders]

    totals = {
        'count': len(orders_list),
        'subtotal': sum(o.get('subtotal', 0) for o in orders_list),
        'discount_amount': sum(o.get('discount_amount', 0) for o in orders_list),
        'grand_total': sum(o.get('grand_total', 0) for o in orders_list)
    }

    return jsonify({'orders': orders_list, 'totals': totals})


@statements_bp.route('/print', methods=['POST'])
def print_statement():
    """Render statement for printing. Accepts JSON: {start, end, manual_entries:[{desc,amount}], format:'a4'|'thermal'|'browser'}"""
    data = request.get_json() or {}
    start = data.get('start') or request.args.get('start')
    end = data.get('end') or request.args.get('end')
    manual_entries = data.get('manual_entries', [])
    fmt = (data.get('format') or 'a4').lower()

    if not start or not end:
        return jsonify({'error': 'start and end are required'}), 400

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except Exception:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    orders = Order.query.filter(Order.order_date >= start_dt, Order.order_date <= end_dt).order_by(Order.order_date).all()
    orders_list = [o.to_dict() for o in orders]

    totals = {
        'count': len(orders_list),
        'subtotal': sum(o.get('subtotal', 0) for o in orders_list),
        'discount_amount': sum(o.get('discount_amount', 0) for o in orders_list),
        'grand_total': sum(o.get('grand_total', 0) for o in orders_list)
    }

    # include manual entries into totals
    manual_total = sum(float(m.get('amount', 0) or 0) for m in manual_entries)
    totals['grand_total_with_manual'] = totals['grand_total'] + manual_total

    if fmt == 'thermal':
        # produce plain text
        lines = []
        lines.append('STATEMENT')
        lines.append(f"From: {start}  To: {end}")
        lines.append('-' * 40)
        for o in orders_list:
            dt = o.get('order_date') or ''
            lines.append(f"{dt} {o.get('order_number')} {o.get('customer', {}).get('name','-')[:20]:20} ₹{o.get('grand_total',0):.2f}")
        lines.append('-' * 40)
        lines.append(f"Orders total: ₹{totals['grand_total']:.2f}")
        if manual_entries:
            lines.append('Manual entries:')
            for m in manual_entries:
                lines.append(f"  {m.get('desc','')} ₹{float(m.get('amount',0)):.2f}")
            lines.append(f"Manual total: ₹{manual_total:.2f}")
        lines.append(f"Grand total: ₹{totals['grand_total_with_manual']:.2f}")
        text = "\n".join(lines)
        return jsonify({'text': text})

    # default: render HTML (A4 / browser)
    rendered = render_template('statement_print.html', orders=orders_list, totals=totals, manual_entries=manual_entries, start=start, end=end)
    return jsonify({'html': rendered})
