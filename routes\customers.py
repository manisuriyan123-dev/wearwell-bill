from flask import Blueprint, request, jsonify
from models import db, Customer

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('', methods=['GET'])
def get_customers():
    """Get all customers"""
    search = request.args.get('search')
    
    query = Customer.query
    
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            (Customer.name.like(search_pattern)) |
            (Customer.phone.like(search_pattern)) |
            (Customer.loyalty_card.like(search_pattern))
        )
    
    customers = query.order_by(Customer.name).limit(100).all()
    return jsonify([c.to_dict() for c in customers])

@customers_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get single customer by ID"""
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer.to_dict())

@customers_bp.route('/search', methods=['GET'])
def search_customers():
    """Search customers by name, phone, or loyalty card"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    search_pattern = f'%{query}%'
    customers = Customer.query.filter(
        (Customer.name.like(search_pattern)) |
        (Customer.phone.like(search_pattern)) |
        (Customer.loyalty_card.like(search_pattern))
    ).limit(20).all()
    
    return jsonify([c.to_dict() for c in customers])

@customers_bp.route('', methods=['POST'])
def create_customer():
    """Create new customer"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Customer name is required'}), 400
    
    # Check if loyalty card already exists
    if data.get('loyalty_card'):
        existing = Customer.query.filter_by(loyalty_card=data['loyalty_card']).first()
        if existing:
            return jsonify({'error': 'Loyalty card already exists'}), 400
    
    customer = Customer(
        name=data['name'],
        phone=data.get('phone'),
        loyalty_card=data.get('loyalty_card'),
        email=data.get('email'),
        address=data.get('address')
    )
    
    db.session.add(customer)
    db.session.commit()
    
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update customer"""
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()
    
    if 'name' in data:
        customer.name = data['name']
    if 'phone' in data:
        customer.phone = data.get('phone')
    if 'loyalty_card' in data:
        # Check if loyalty card is already used by another customer
        new_loyalty = data.get('loyalty_card')
        if new_loyalty:  # Only check if not empty
            existing = Customer.query.filter_by(loyalty_card=new_loyalty).first()
            if existing and existing.id != customer_id:
                return jsonify({'error': 'Loyalty card already exists'}), 400
        customer.loyalty_card = new_loyalty
    if 'email' in data:
        customer.email = data.get('email')
    if 'address' in data:
        customer.address = data.get('address')
    
    db.session.commit()
    return jsonify(customer.to_dict())

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete customer"""
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted successfully'})
