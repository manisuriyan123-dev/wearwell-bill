import os
import sys

# Ensure project root is on sys.path so imports work when running this script
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import create_app
from models import db, Product, StockHistory


SAMPLES = [
    {"barcode": "8901234500012", "name": "Classic White Shirt", "price": 799.00, "category": "Shirts", "stock_quantity": 20},
    {"barcode": "8901234500029", "name": "Slim Fit Jeans", "price": 1299.00, "category": "Pants", "stock_quantity": 15},
    {"barcode": "8901234500036", "name": "Cotton Dhotis", "price": 499.00, "category": "Dhotis", "stock_quantity": 30},
    {"barcode": "8901234500043", "name": "Silk Saree", "price": 2999.00, "category": "Saree", "stock_quantity": 8},
    {"barcode": "8901234500050", "name": "Basic T-Shirt", "price": 299.00, "category": "Shirts", "stock_quantity": 50}
]


def seed():
    app = create_app()
    with app.app_context():
        created = 0
        for p in SAMPLES:
            existing = Product.query.filter_by(barcode=p['barcode']).first()
            if existing:
                print(f"Skipping existing product: {p['barcode']} - {existing.name}")
                continue

            prod = Product(
                barcode=p['barcode'],
                name=p['name'],
                price=float(p['price']),
                category=p.get('category', 'Other'),
                stock_quantity=int(p.get('stock_quantity', 0))
            )
            db.session.add(prod)
            db.session.flush()

            # Add a stock history entry for initial stock
            sh = StockHistory(
                product_id=prod.id,
                quantity_change=prod.stock_quantity,
                type='in',
                notes='Initial seed stock'
            )
            db.session.add(sh)
            created += 1

        if created > 0:
            db.session.commit()
        print(f"Seeding complete. Products created: {created}")


if __name__ == '__main__':
    seed()
