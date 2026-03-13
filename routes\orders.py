from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem, Product, StockHistory
from utils.helpers import generate_bill_number, calculate_item_total
from datetime import datetime

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@orders_bp.route('', methods=['POST'])
def create_order():
    """Create new order"""
    data = request.get_json()
    
    # Validation
    if not data.get('items') or len(data['items']) == 0:
        return jsonify({'error': 'Order must have at least one item'}), 400
    if not data.get('cashier_name'):
        return jsonify({'error': 'Cashier name is required'}), 400
    if not data.get('payment_method'):
        return jsonify({'error': 'Payment method is required'}), 400
    
    # Generate bill number
    order_number = generate_bill_number()
    
    # Calculate totals
    subtotal = 0.0
    items_data = []
    
    for item_data in data['items']:
        product = Product.query.get(item_data['product_id'])
        if not product:
            return jsonify({'error': f'Product {item_data["product_id"]} not found'}), 400
        
        quantity = int(item_data['quantity'])
        discount_percent = float(item_data.get('discount_percent', 0))
        
        if quantity > product.stock_quantity and data.get('status') == 'completed':
            return jsonify({'error': f'Insufficient stock for {product.name}'}), 400
        
        total_price, discount_amount = calculate_item_total(
            quantity, 
            product.price, 
            discount_percent
        )
        
        subtotal += total_price
        items_data.append({
            'product': product,
            'quantity': quantity,
            'unit_price': product.price,
            'discount_percent': discount_percent,
            'total_price': total_price
        })
    
    # Apply cart-level discount/coupon
    cart_discount = float(data.get('discount_amount', 0))
    grand_total = subtotal - cart_discount
    
    # Create order
    order = Order(
        order_number=order_number,
        customer_id=data.get('customer_id'),
        cashier_name=data['cashier_name'],
        order_date=datetime.utcnow(),
        subtotal=subtotal,
        discount_amount=cart_discount,
        grand_total=grand_total,
        payment_method=data['payment_method'],
        status=data.get('status', 'completed'),
        notes=data.get('notes')
    )
    
    db.session.add(order)
    db.session.flush()  # Get order ID
    
    # Create order items and update stock
    for item_data in items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data['product'].id,
            quantity=item_data['quantity'],
            unit_price=item_data['unit_price'],
            discount_percent=item_data['discount_percent'],
            total_price=item_data['total_price']
        )
        db.session.add(order_item)
        
        # Update stock if order is completed
        if order.status == 'completed':
            product = item_data['product']
            old_stock = product.stock_quantity
            product.stock_quantity -= item_data['quantity']
            
            # Record stock history
            stock_history = StockHistory(
                product_id=product.id,
                quantity_change=-item_data['quantity'],
                type='out',
                reference_order_id=order.id,
                notes=f'Order {order_number}'
            )
            db.session.add(stock_history)
    
    db.session.commit()
    
    return jsonify(order.to_dict()), 201

@orders_bp.route('', methods=['GET'])
def get_orders():
    """Get all orders with optional filters"""
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    limit = int(request.args.get('limit', 50))
    
    query = Order.query
    
    if status:
        query = query.filter(Order.status == status)
    
    if date_from:
        try:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Order.order_date >= date_from_obj)
        except:
            pass
    
    if date_to:
        try:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Order.order_date <= date_to_obj)
        except:
            pass
    
    orders = query.order_by(Order.id.desc()).limit(limit).all()
    return jsonify([o.to_dict() for o in orders])

@orders_bp.route('/<order_number>', methods=['GET'])
def get_order(order_number):
    """Get order by order number"""
    order = Order.query.filter_by(order_number=order_number).first_or_404()
    return jsonify(order.to_dict())

@orders_bp.route('/<order_number>/status', methods=['PUT'])
def update_order_status(order_number):
    """Update order status"""
    order = Order.query.filter_by(order_number=order_number).first_or_404()
    data = request.get_json()
    
    new_status = data.get('status')
    if new_status not in ['draft', 'held', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    
    old_status = order.status
    order.status = new_status
    
    # If changing to completed, update stock
    if new_status == 'completed' and old_status != 'completed':
        for item in order.items:
            product = item.product
            if item.quantity > product.stock_quantity:
                return jsonify({'error': f'Insufficient stock for {product.name}'}), 400
            
            product.stock_quantity -= item.quantity
            
            # Record stock history if not already recorded
            existing_history = StockHistory.query.filter_by(
                reference_order_id=order.id,
                product_id=product.id
            ).first()
            
            if not existing_history:
                stock_history = StockHistory(
                    product_id=product.id,
                    quantity_change=-item.quantity,
                    type='out',
                    reference_order_id=order.id,
                    notes=f'Order {order_number}'
                )
                db.session.add(stock_history)
    
    # If cancelling a completed order, restore stock
    if new_status == 'cancelled' and old_status == 'completed':
        for item in order.items:
            product = item.product
            product.stock_quantity += item.quantity
            
            # Record stock history
            stock_history = StockHistory(
                product_id=product.id,
                quantity_change=item.quantity,
                type='in',
                reference_order_id=order.id,
                notes=f'Order {order_number} cancelled'
            )
            db.session.add(stock_history)
    
    db.session.commit()
    return jsonify(order.to_dict())
