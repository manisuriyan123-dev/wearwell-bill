"""
ESC/POS commands for 3-inch thermal printer
Bill printing utility
"""

class ThermalPrinter:
    """Thermal printer ESC/POS command generator"""
    
    # ESC/POS commands
    ESC = '\x1B'
    GS = '\x1D'
    
    def __init__(self, shop_name="Wear Well", shop_address="", shop_phone="", shop_gstin=""):
        self.shop_name = shop_name
        self.shop_address = shop_address
        self.shop_phone = shop_phone
        self.shop_gstin = shop_gstin
    
    def reset(self):
        """Reset printer"""
        return self.ESC + '@'
    
    def center_align(self):
        """Center align text"""
        return self.ESC + 'a' + '\x01'
    
    def left_align(self):
        """Left align text"""
        return self.ESC + 'a' + '\x00'
    
    def bold_on(self):
        """Turn on bold"""
        return self.ESC + 'E' + '\x01'
    
    def bold_off(self):
        """Turn off bold"""
        return self.ESC + 'E' + '\x00'
    
    def double_height(self):
        """Double height text"""
        return self.ESC + 'd' + '\x01'
    
    def normal_size(self):
        """Normal size text"""
        return self.ESC + 'd' + '\x00'
    
    def cut_paper(self):
        """Cut paper"""
        return self.GS + 'V' + '\x41' + '\x03'
    
    def feed_lines(self, n=1):
        """Feed n lines"""
        return self.ESC + 'd' + chr(n)
    
    def generate_bill(self, order):
        """Generate formatted text bill content"""
        bill = []
        width = 48
        separator = "-" * width
        
        # LOGO and Shop header
        bill.append(f"{'(WEAR WELL LOGO)':^{width}}\n")
        bill.append(f"{self.shop_name:^{width}}\n")
        if self.shop_phone:
            bill.append(f"Phone: {self.shop_phone}\n")
        if self.shop_address:
            bill.append(f"Address: {self.shop_address}\n")
        bill.append(separator + "\n")
        
        # Bill details
        bill.append(f"Bill No : {order['order_number']}\n")
        from datetime import datetime
        date_str = order['order_date']
        bill.append(f"Date    : {date_str}        Time: {datetime.now().strftime('%I:%M %p')}\n")
        bill.append(f"Cashier : {order['cashier_name']}\n")
        bill.append(separator + "\n")
        
        # Customer details
        if order.get('customer'):
            bill.append(f"Customer Name : {order['customer'].get('name', '')}\n")
            bill.append(f"Customer Ph   : {order['customer'].get('phone', '')}\n")
        bill.append(separator + "\n")
        
        # Items header
        bill.append(f"{'Item':<28} {'Qty':>8} {'Price':>10}\n")
        bill.append(separator + "\n")
        
        # Items
        for item in order['items']:
            product = item.get('product', {})
            name = product.get('name', 'Unknown')[:27]
            qty = item['quantity']
            price = item['total_price']
            
            bill.append(f"{name:<28} {qty:>8} {price:>10.2f}\n")
            
            if item.get('discount_percent', 0) > 0:
                discount_value = (item.get('discount_percent', 0) * price) / 100
                bill.append(f"{'(Discount ' + str(item['discount_percent']) + '%)':<28} {'-':>8} {-discount_value:>10.2f}\n")
        
        bill.append(separator + "\n")
        
        # Totals
        bill.append(f"{'Subtotal':<28} {' ':>8} {order['subtotal']:>10.2f}\n")
        bill.append(separator + "\n")
        if order.get('discount_amount', 0) > 0:
            bill.append(f"{'Discount':<28} {' ':>8} {order['discount_amount']:>10.2f}\n")
        bill.append(f"{'Grand Total':<28} {' ':>8} {order['grand_total']:>10.2f}\n")
        bill.append(separator + "\n")
        
        # Payment mode
        bill.append(f"Payment Mode : {order['payment_method']}\n")
        bill.append(separator + "\n")
        
        # Thank you message
        bill.append(f"{'THANK YOU FOR SHOPPING!':^{width}}\n")
        bill.append(f"{'😊 VISIT AGAIN 😊':^{width}}\n")
        
        return ''.join(bill)

    def generate_plain_bill(self, order):
        """Generate plain text bill (simple text format)"""
        return self.generate_bill(order)
    
    def print_to_file(self, order, filename=None):
        """Generate bill and save to file (for testing/backup)"""
        if not filename:
            filename = f"bill_{order['order_number']}.txt"
        
        bill_content = self.generate_bill(order)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(bill_content)
        
        return filename
