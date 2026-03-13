from app import create_app
app = create_app()
with app.app_context():
    from models import Product
    products = Product.query.all()
    print(f'Total products: {len(products)}')
    for p in products[:5]:
        print(f'{p.barcode} - {p.name}')