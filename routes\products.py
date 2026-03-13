from flask import Blueprint, request, jsonify, send_from_directory
from models import db, Product, OrderItem, StockHistory
from utils.helpers import validate_barcode
from werkzeug.utils import secure_filename
import os
from config import Config
from sqlalchemy.exc import IntegrityError

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products_bp.route('', methods=['GET'])
def get_products():
    """Get all products with optional filters"""
    category = request.args.get('category')
    search = request.args.get('search')
    low_stock = request.args.get('low_stock', 'false').lower() == 'true'
    
    query = Product.query
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            (Product.name.like(search_pattern)) |
            (Product.barcode.like(search_pattern))
        )
    
    if low_stock:
        query = query.filter(Product.stock_quantity <= Config.LOW_STOCK_THRESHOLD)
    
    products = query.order_by(Product.name).all()
    return jsonify([p.to_dict() for p in products])

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())

@products_bp.route('/barcode/<barcode>', methods=['GET'])
def get_product_by_barcode(barcode):
    """Get product by barcode"""
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict())

@products_bp.route('/search', methods=['GET'])
def search_products():
    """Search products by name or barcode"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    search_pattern = f'%{query}%'
    products = Product.query.filter(
        (Product.name.like(search_pattern)) |
        (Product.barcode.like(search_pattern))
    ).limit(20).all()
    
    return jsonify([p.to_dict() for p in products])

@products_bp.route('', methods=['POST'])
def create_product():
    """Create new product"""
    data = request.get_json()
    
    # Validation
    if not data.get('barcode'):
        return jsonify({'error': 'Barcode is required'}), 400
    if not validate_barcode(data['barcode']):
        return jsonify({'error': 'Invalid barcode format'}), 400
    if not data.get('name'):
        return jsonify({'error': 'Product name is required'}), 400
    if not data.get('price') or float(data['price']) < 0:
        return jsonify({'error': 'Valid price is required'}), 400
    
    # Check if barcode already exists
    if Product.query.filter_by(barcode=data['barcode']).first():
        return jsonify({'error': 'Barcode already exists'}), 400
    
    product = Product(
        barcode=data['barcode'],
        name=data['name'],
        price=float(data['price']),
        category=data.get('category', 'Other'),
        stock_quantity=int(data.get('stock_quantity', 0)),
        image_path=data.get('image_path')
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 201

@products_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update product"""
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    if 'barcode' in data:
        if not validate_barcode(data['barcode']):
            return jsonify({'error': 'Invalid barcode format'}), 400
        # Check if barcode is already used by another product
        existing = Product.query.filter_by(barcode=data['barcode']).first()
        if existing and existing.id != product_id:
            return jsonify({'error': 'Barcode already exists'}), 400
        product.barcode = data['barcode']
    
    if 'name' in data:
        product.name = data['name']
    if 'price' in data:
        product.price = float(data['price'])
    if 'category' in data:
        product.category = data['category']
    if 'stock_quantity' in data:
        product.stock_quantity = int(data['stock_quantity'])
    if 'image_path' in data:
        product.image_path = data['image_path']
    
    db.session.commit()
    return jsonify(product.to_dict())

@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product"""
    print(f'\n=== DELETE PRODUCT {product_id} ===')
    
    product = Product.query.get_or_404(product_id)
    print(f'Product found: {product.name}')
    
    # Support forced deletion: ?force=true will remove related OrderItems and StockHistory
    force_delete = request.args.get('force', 'false').lower() == 'true'
    print(f'Force delete: {force_delete}')

    related_orders = getattr(product, 'order_items', None)
    related_stock = getattr(product, 'stock_history', None)
    
    print(f'Related order items: {len(related_orders) if related_orders else 0}')
    print(f'Related stock history: {len(related_stock) if related_stock else 0}')

    if not force_delete:
        if (related_orders and len(related_orders) > 0) or (related_stock and len(related_stock) > 0):
            error_msg = f'Cannot delete product with existing order items ({len(related_orders or [])} items) or stock history ({len(related_stock or [])} entries). To force delete, call with ?force=true'
            print(f'Error: {error_msg}')
            return jsonify({'error': error_msg}), 400

    try:
        # If forcing, remove related records first to satisfy FK constraints
        if force_delete:
            print('Force delete enabled - removing related records...')
            
            # Delete stock history entries for this product FIRST (no dependencies)
            stock_count = StockHistory.query.filter_by(product_id=product_id).delete(synchronize_session='fetch')
            print(f'Deleted {stock_count} stock history records')
            db.session.flush()
            
            # Delete order items referencing this product
            # Using synchronize_session='fetch' to properly update the session
            order_items_count = OrderItem.query.filter_by(product_id=product_id).delete(synchronize_session='fetch')
            print(f'Deleted {order_items_count} order items')
            db.session.flush()

        print(f'Deleting product {product_id}...')
        db.session.delete(product)
        db.session.commit()
        print(f'Product deleted successfully!')
        
    except IntegrityError as e:
        print(f'IntegrityError caught: {str(e)}')
        db.session.rollback()
        return jsonify({'error': f'Failed to delete product due to database constraints: {str(e)}'}), 400
    except Exception as e:
        print(f'Unexpected error: {type(e).__name__}: {str(e)}')
        db.session.rollback()
        return jsonify({'error': f'Failed to delete product: {str(e)}'}), 400

    msg = 'Product deleted successfully'
    if force_delete:
        msg += ' (forced: related order items and stock history removed)'

    print(f'Response: {msg}')
    return jsonify({'message': msg})

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all product categories"""
    categories = db.session.query(Product.category).distinct().all()
    return jsonify([cat[0] for cat in categories])

@products_bp.route('/stock-summary', methods=['GET'])
def get_stock_summary():
    """Get stock summary by category"""
    # Derive categories from database to avoid hard-coded lists
    db_categories = db.session.query(Product.category).distinct().all()
    categories = [c[0] for c in db_categories if c[0]]

    summary = []
    for category in categories:
        products = Product.query.filter_by(category=category).all()
        total_stock = sum((p.stock_quantity or 0) for p in products)
        summary.append({
            'category': category,
            'total_stock': total_stock,
            'product_count': len(products)
        })

    # Ensure consistent ordering (categories with highest stock first)
    summary.sort(key=lambda x: x['total_stock'], reverse=True)
    return jsonify(summary)
