from flask import Flask, send_from_directory, jsonify, request, render_template
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from config import Config
from models import db, Order
import os

# Import blueprints
from routes.products import products_bp
from routes.customers import customers_bp
from routes.orders import orders_bp
from routes.stock import stock_bp
from routes.billing import billing_bp
from routes.statements import statements_bp

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize database
    db.init_app(app)
    
    # Create instance folder and upload directories
    os.makedirs(os.path.join(app.root_path, 'instance'), exist_ok=True)
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs('static/uploads', exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(statements_bp)
    app.register_blueprint(billing_bp)
    
    # Serve static files
    @app.route('/')
    def index():
        return send_from_directory('templates', 'index.html')
    
    @app.route('/stock-check')
    def stock_check():
        return send_from_directory('templates', 'stock_check.html')
    
    @app.route('/customers')
    def customer_list():
        return send_from_directory('templates', 'customer_list.html')

    @app.route('/statements')
    def statements():
        return send_from_directory('templates', 'statements.html')

    @app.route('/invoice/<order_number>')
    def view_invoice(order_number):
        """Render A4 invoice page for a given order number"""
        order = Order.query.filter_by(order_number=order_number).first_or_404()
        return render_template('invoice_a4.html', order=order.to_dict(),
                               shop_name=Config.SHOP_NAME,
                               shop_address=Config.SHOP_ADDRESS,
                               shop_phone=Config.SHOP_PHONE,
                               shop_gstin=Config.SHOP_GSTIN)
    
    @app.route('/images/<path:filename>')
    def serve_image(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)
    
    # Initialize database on first run
    with app.app_context():
        db.create_all()

    # Return JSON for exceptions on API routes to avoid HTML error pages in the UI
    @app.errorhandler(Exception)
    def handle_exception(e):
        # If request is for API, return JSON error
        if request.path.startswith('/api'):
            if isinstance(e, HTTPException):
                return jsonify({'error': e.description}), e.code
            return jsonify({'error': str(e)}), 500
        # For non-API requests, re-raise to let Flask render the default HTML error page
        raise e
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("=" * 50)
    print("WearWell Billing Software")
    print("=" * 50)
    print(f"Server running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
