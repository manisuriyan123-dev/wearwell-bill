from datetime import datetime
from models import Order

def generate_bill_number():
    """Generate unique bill number in format: BILL-YYYYMMDD-XXXX"""
    today = datetime.now().strftime('%Y%m%d')
    
    # Get the last order number for today
    last_order = Order.query.filter(
        Order.order_number.like(f'BILL-{today}-%')
    ).order_by(Order.id.desc()).first()
    
    if last_order:
        # Extract the sequence number
        try:
            sequence = int(last_order.order_number.split('-')[-1])
            sequence += 1
        except (ValueError, IndexError):
            sequence = 1
    else:
        sequence = 1
    
    # Format with 4 digits
    bill_number = f'BILL-{today}-{sequence:04d}'
    return bill_number

def validate_barcode(barcode):
    """Validate EAN-13 barcode format"""
    if not barcode:
        return False
    # Basic validation: should be numeric and 8-13 digits
    if not barcode.isdigit():
        return False
    if len(barcode) < 8 or len(barcode) > 13:
        return False
    return True

def calculate_item_total(quantity, unit_price, discount_percent=0):
    """Calculate total price for an item with discount"""
    subtotal = quantity * unit_price
    discount_amount = subtotal * (discount_percent / 100)
    total = subtotal - discount_amount
    return round(total, 2), round(discount_amount, 2)

def format_currency(amount):
    """Format amount as Indian Rupee"""
    return f"₹{amount:,.2f}"
