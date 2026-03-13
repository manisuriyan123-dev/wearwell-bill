from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Product(db.Model):
    """Product catalog model"""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    stock_quantity = db.Column(db.Integer, default=0, nullable=False)
    image_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    stock_history = db.relationship('StockHistory', backref='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'barcode': self.barcode,
            'name': self.name,
            'price': float(self.price),
            'category': self.category,
            'stock_quantity': self.stock_quantity,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Product {self.barcode}: {self.name}>'


class Customer(db.Model):
    """Customer information model"""
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), index=True)
    loyalty_card = db.Column(db.String(50), unique=True, index=True)
    email = db.Column(db.String(200))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = db.relationship('Order', backref='customer', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'loyalty_card': self.loyalty_card,
            'email': self.email,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Customer {self.id}: {self.name}>'


class Order(db.Model):
    """Order records model"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    cashier_name = db.Column(db.String(100), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    grand_total = db.Column(db.Float, nullable=False, default=0.0)
    payment_method = db.Column(db.String(20), nullable=False)  # Cash, Card, UPI
    status = db.Column(db.String(20), default='completed', nullable=False)  # draft, held, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'customer': self.customer.to_dict() if self.customer else None,
            'cashier_name': self.cashier_name,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'subtotal': float(self.subtotal),
            'discount_amount': float(self.discount_amount),
            'grand_total': float(self.grand_total),
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data
    
    def __repr__(self):
        return f'<Order {self.order_number}>'


class OrderItem(db.Model):
    """Order line items model"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    discount_percent = db.Column(db.Float, default=0.0)
    total_price = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'discount_percent': float(self.discount_percent),
            'total_price': float(self.total_price)
        }
    
    def __repr__(self):
        return f'<OrderItem {self.id}: {self.product_id} x {self.quantity}>'


class StockHistory(db.Model):
    """Stock movement tracking model"""
    __tablename__ = 'stock_history'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity_change = db.Column(db.Integer, nullable=False)  # Positive for in, negative for out
    type = db.Column(db.String(20), nullable=False)  # 'in' or 'out'
    reference_order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity_change': self.quantity_change,
            'type': self.type,
            'reference_order_id': self.reference_order_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<StockHistory {self.id}: {self.type} {self.quantity_change}>'


class Coupon(db.Model):
    """Discount coupons model"""
    __tablename__ = 'coupons'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    discount_percent = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    valid_from = db.Column(db.DateTime, nullable=False)
    valid_until = db.Column(db.DateTime, nullable=False)
    usage_limit = db.Column(db.Integer, default=0)  # 0 means unlimited
    used_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_percent': float(self.discount_percent),
            'discount_amount': float(self.discount_amount),
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'usage_limit': self.usage_limit,
            'used_count': self.used_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_valid(self):
        """Check if coupon is valid"""
        from datetime import datetime
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.usage_limit > 0 and self.used_count >= self.usage_limit:
            return False
        return True
    
    def __repr__(self):
        return f'<Coupon {self.code}>'
