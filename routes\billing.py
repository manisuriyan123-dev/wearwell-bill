from flask import Blueprint, request, jsonify, render_template
from models import db, Order, Coupon
from utils.thermal_printer import ThermalPrinter
from config import Config

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')

@billing_bp.route('/orders/<order_number>/print', methods=['POST'])
def print_bill(order_number):
    """Generate bill for printing"""
    order = Order.query.filter_by(order_number=order_number).first_or_404()
    data = request.get_json(silent=True) or {}
    style = data.get('style', '').lower()

    order_dict = order.to_dict()

    # Create printer instance for legacy/plain text
    printer = ThermalPrinter(
        shop_name=Config.SHOP_NAME,
        shop_address=Config.SHOP_ADDRESS,
        shop_phone=Config.SHOP_PHONE,
        shop_gstin=Config.SHOP_GSTIN
    )

    if style == 'a4':
        # Render A4 HTML invoice including customer details
        rendered = render_template('invoice_a4.html', order=order_dict,
                                   shop_name=Config.SHOP_NAME,
                                   shop_address=Config.SHOP_ADDRESS,
                                   shop_phone=Config.SHOP_PHONE,
                                   shop_gstin=Config.SHOP_GSTIN)
        # Optionally save to file
        filename = f"invoice_{order_number}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(rendered)
        return jsonify({'order_number': order_number, 'bill_html': rendered, 'file_path': filename, 'message': 'A4 invoice generated'})

    # Default: legacy plain text / thermal
    bill_content = printer.generate_plain_bill(order_dict)
    filename = printer.print_to_file(order_dict)
    return jsonify({
        'order_number': order_number,
        'bill_content': bill_content,
        'file_path': filename,
        'message': 'Bill generated successfully'
    })

@billing_bp.route('/coupons/validate', methods=['POST'])
def validate_coupon():
    """Validate and get coupon details"""
    data = request.get_json()
    code = data.get('code')
    
    if not code:
        return jsonify({'error': 'Coupon code is required'}), 400
    
    coupon = Coupon.query.filter_by(code=code.upper()).first()
    
    if not coupon:
        return jsonify({'error': 'Invalid coupon code'}), 404
    
    if not coupon.is_valid():
        return jsonify({'error': 'Coupon is not valid or has expired'}), 400
    
    return jsonify({
        'valid': True,
        'coupon': coupon.to_dict()
    })

@billing_bp.route('/coupons', methods=['GET'])
def get_coupons():
    """Get all active coupons"""
    coupons = Coupon.query.filter_by(is_active=True).all()
    return jsonify([c.to_dict() for c in coupons])

@billing_bp.route('/coupons', methods=['POST'])
def create_coupon():
    """Create new coupon"""
    data = request.get_json()
    
    if not data.get('code'):
        return jsonify({'error': 'Coupon code is required'}), 400
    
    # Check if code already exists
    existing = Coupon.query.filter_by(code=data['code'].upper()).first()
    if existing:
        return jsonify({'error': 'Coupon code already exists'}), 400
    
    from datetime import datetime
    valid_from = datetime.fromisoformat(data['valid_from']) if data.get('valid_from') else datetime.utcnow()
    valid_until = datetime.fromisoformat(data['valid_until']) if data.get('valid_until') else datetime.utcnow()
    
    coupon = Coupon(
        code=data['code'].upper(),
        discount_percent=float(data.get('discount_percent', 0)),
        discount_amount=float(data.get('discount_amount', 0)),
        valid_from=valid_from,
        valid_until=valid_until,
        usage_limit=int(data.get('usage_limit', 0)),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(coupon)
    db.session.commit()
    
    return jsonify(coupon.to_dict()), 201
