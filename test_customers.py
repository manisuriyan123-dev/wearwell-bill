from app import create_app
from models import db, Customer

app = create_app()
with app.app_context():
    count = Customer.query.count()
    print(f"Customer count: {count}")
    if count > 0:
        customers = Customer.query.limit(5).all()
        for c in customers:
            print(f"{c.id}: {c.name} - {c.phone}")