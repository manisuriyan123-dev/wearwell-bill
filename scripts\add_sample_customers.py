import os
import sys

# Ensure project root is on sys.path so imports work when running this script
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import create_app
from models import db, Customer


SAMPLES = [
    {"name": "Rajesh Kumar", "phone": "9876543210", "loyalty_card": "LOYAL001", "email": "rajesh@example.com", "address": "123 Main Street, Mumbai"},
    {"name": "Priya Sharma", "phone": "9876543211", "loyalty_card": "LOYAL002", "email": "priya@example.com", "address": "456 Park Avenue, Delhi"},
    {"name": "Amit Singh", "phone": "9876543212", "loyalty_card": "LOYAL003", "email": "amit@example.com", "address": "789 Market Road, Bangalore"},
    {"name": "Sneha Patel", "phone": "9876543213", "loyalty_card": "LOYAL004", "email": "sneha@example.com", "address": "321 Garden Colony, Ahmedabad"},
    {"name": "Vikram Rao", "phone": "9876543214", "loyalty_card": "LOYAL005", "email": "vikram@example.com", "address": "654 Temple Street, Chennai"},
    {"name": "Meera Joshi", "phone": "9876543215", "loyalty_card": "LOYAL006", "email": "meera@example.com", "address": "987 Lake View, Pune"},
    {"name": "Arun Gupta", "phone": "9876543216", "loyalty_card": "LOYAL007", "email": "arun@example.com", "address": "147 Hill Station, Kolkata"},
    {"name": "Kavita Nair", "phone": "9876543217", "loyalty_card": "LOYAL008", "email": "kavita@example.com", "address": "258 River Side, Hyderabad"},
    {"name": "Suresh Reddy", "phone": "9876543218", "loyalty_card": "LOYAL009", "email": "suresh@example.com", "address": "369 Mountain View, Jaipur"},
    {"name": "Anjali Verma", "phone": "9876543219", "loyalty_card": "LOYAL010", "email": "anjali@example.com", "address": "741 Valley Road, Lucknow"}
]


def seed():
    app = create_app()
    with app.app_context():
        created = 0
        for c in SAMPLES:
            existing = Customer.query.filter_by(loyalty_card=c['loyalty_card']).first()
            if existing:
                print(f"Skipping existing customer: {c['loyalty_card']} - {existing.name}")
                continue

            customer = Customer(
                name=c['name'],
                phone=c.get('phone'),
                loyalty_card=c.get('loyalty_card'),
                email=c.get('email'),
                address=c.get('address')
            )
            db.session.add(customer)
            created += 1

        if created > 0:
            db.session.commit()
        print(f"Seeding complete. Customers created: {created}")


if __name__ == '__main__':
    seed()