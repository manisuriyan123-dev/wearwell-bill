from flask import Blueprint, request, jsonify
from models import db, StockHistory, Product, Order, OrderItem
from datetime import datetime
from sqlalchemy import func

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

@stock_bp.route('/history', methods=['GET'])
def get_stock_history():
    """Get stock movement history"""
    product_id = request.args.get('product_id', type=int)
    limit = int(request.args.get('limit', 100))
    
    query = StockHistory.query
    
    if product_id:
        query = query.filter(StockHistory.product_id == product_id)
    
    history = query.order_by(StockHistory.created_at.desc()).limit(limit).all()
    return jsonify([h.to_dict() for h in history])

@stock_bp.route('/adjust', methods=['POST'])
def adjust_stock():
    """Adjust stock quantity for a product"""
    data = request.get_json()
    
    product_id = data.get('product_id')
    quantity_change = data.get('quantity_change')
    notes = data.get('notes', '')
    
    if not product_id or quantity_change is None:
        return jsonify({'error': 'product_id and quantity_change are required'}), 400
    
    product = Product.query.get_or_404(product_id)
    
    # Update stock
    old_stock = product.stock_quantity
    product.stock_quantity += quantity_change
    
    if product.stock_quantity < 0:
        return jsonify({'error': 'Stock cannot be negative'}), 400
    
    # Record history
    stock_history = StockHistory(
        product_id=product_id,
        quantity_change=quantity_change,
        type='in' if quantity_change > 0 else 'out',
        notes=notes or 'Manual adjustment'
    )
    
    db.session.add(stock_history)
    db.session.commit()
    
    return jsonify({
        'message': 'Stock adjusted successfully',
        'product': product.to_dict(),
        'old_stock': old_stock,
        'new_stock': product.stock_quantity
    })

@stock_bp.route('/low-stock', methods=['GET'])
def get_low_stock():
    """Get products with low stock"""
    threshold = int(request.args.get('threshold', 10))
    
    products = Product.query.filter(Product.stock_quantity <= threshold).all()
    return jsonify([p.to_dict() for p in products])

@stock_bp.route('/daily-sales', methods=['GET'])
def get_daily_sales():
    """Get daily product sales summary"""
    date_str = request.args.get('date')
    if not date_str:
        today = datetime.utcnow().date()
    else:
        try:
            today = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Query for sales data
    sales_query = db.session.query(
        Product.id,
        Product.barcode,
        Product.name,
        Product.category,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.total_price).label('total_revenue')
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .filter(Order.order_date >= datetime.combine(today, datetime.min.time()),
             Order.order_date < datetime.combine(today, datetime.max.time()),
             Order.status == 'completed')\
     .group_by(Product.id, Product.barcode, Product.name, Product.category)\
     .order_by(func.sum(OrderItem.total_price).desc())\
     .all()
    
    sales_data = []
    grand_total = 0.0
    for row in sales_query:
        sales_data.append({
            'id': row.id,
            'barcode': row.barcode,
            'name': row.name,
            'category': row.category,
            'total_quantity': int(row.total_quantity),
            'total_revenue': float(row.total_revenue)
        })
        grand_total += float(row.total_revenue)
    
    return jsonify({
        'date': today.isoformat(),
        'sales': sales_data,
        'grand_total': grand_total
    })
@stock_bp.route('/daily-sales/delete', methods=['DELETE'])
def delete_daily_sale():
    """Delete all order items for a product on a specific date"""
    data = request.get_json()
    
    product_id = data.get('product_id')
    date_str = data.get('date')
    
    if not product_id or not date_str:
        return jsonify({'error': 'product_id and date are required'}), 400
    
    try:
        sale_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Verify product exists
    product = Product.query.get_or_404(product_id)
    
    # Find and delete all order items for this product on this date
    order_items = db.session.query(OrderItem).join(Order).filter(
        OrderItem.product_id == product_id,
        Order.order_date >= datetime.combine(sale_date, datetime.min.time()),
        Order.order_date < datetime.combine(sale_date, datetime.max.time()),
        Order.status == 'completed'
    ).all()
    
    if not order_items:
        return jsonify({'error': 'No sales found for this product on the specified date'}), 404
    
    deleted_count = 0
    deleted_quantity = 0
    deleted_revenue = 0.0
    
    # Delete items and update order totals
    for item in order_items:
        deleted_count += 1
        deleted_quantity += item.quantity
        deleted_revenue += item.total_price
        
        order = item.order
        order.subtotal -= item.total_price
        order.grand_total -= item.total_price
        if order.grand_total < 0:
            order.grand_total = 0
        
        db.session.delete(item)
    
    db.session.commit()
    
    return jsonify({
        'message': f'Successfully deleted {deleted_count} sale items',
        'product': product.to_dict(),
        'deleted_count': deleted_count,
        'deleted_quantity': deleted_quantity,
        'deleted_revenue': deleted_revenue,
        'date': date_str
    })