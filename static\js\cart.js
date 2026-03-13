// Shopping cart management
class Cart {
    constructor() {
        this.items = this.loadFromStorage();
        this.selectedItemIndex = null;
        this.couponDiscount = 0;
        this.couponCode = null;
    }

    loadFromStorage() {
        const stored = localStorage.getItem('wearwell_cart');
        return stored ? JSON.parse(stored) : [];
    }

    saveToStorage() {
        localStorage.setItem('wearwell_cart', JSON.stringify(this.items));
    }

    addItem(product, quantity = 1, discountPercent = 0) {
        const existingIndex = this.items.findIndex(item => item.product_id === product.id);
        
        if (existingIndex >= 0) {
            // Update existing item
            this.items[existingIndex].quantity += quantity;
        } else {
            // Add new item
            const totalPrice = (product.price * quantity) * (1 - discountPercent / 100);
            this.items.push({
                product_id: product.id,
                product: product,
                quantity: quantity,
                unit_price: product.price,
                discount_percent: discountPercent,
                total_price: totalPrice
            });
        }
        
        this.updateItemTotals();
        this.saveToStorage();
        this.render();
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.saveToStorage();
            this.render();
        }
    }

    updateQuantity(index, quantity) {
        if (index >= 0 && index < this.items.length && quantity > 0) {
            this.items[index].quantity = quantity;
            this.updateItemTotals();
            this.saveToStorage();
            this.render();
        }
    }

    updateDiscount(index, discountPercent) {
        if (index >= 0 && index < this.items.length) {
            this.items[index].discount_percent = discountPercent;
            this.updateItemTotals();
            this.saveToStorage();
            this.render();
        }
    }

    updateItemTotals() {
        this.items.forEach(item => {
            const subtotal = item.quantity * item.unit_price;
            const discountAmount = subtotal * (item.discount_percent / 100);
            item.total_price = subtotal - discountAmount;
        });
    }

    clear() {
        this.items = [];
        this.couponDiscount = 0;
        this.couponCode = null;
        this.saveToStorage();
        this.render();
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + item.total_price, 0);
    }

    getTotalDiscount() {
        return this.items.reduce((sum, item) => {
            const subtotal = item.quantity * item.unit_price;
            return sum + (subtotal * item.discount_percent / 100);
        }, 0) + this.couponDiscount;
    }

    getGrandTotal() {
        return this.getSubtotal() - this.couponDiscount;
    }

    applyCoupon(discountAmount, code) {
        this.couponDiscount = discountAmount;
        this.couponCode = code;
        this.render();
    }

    removeCoupon() {
        this.couponDiscount = 0;
        this.couponCode = null;
        this.render();
    }

    render() {
        const tbody = document.getElementById('cart-items');
        
        if (this.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-cart">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <p>Cart is empty</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = this.items.map((item, index) => `
                <tr class="${this.selectedItemIndex === index ? 'selected' : ''}" data-index="${index}">
                    <td>${item.product.barcode || '-'}</td>
                    <td>${item.product.name}</td>
                    <td>₹${item.unit_price.toFixed(2)}</td>
                    <td>
                        <input type="number" 
                               value="${item.quantity}" 
                               min="1" 
                               class="qty-input"
                               data-index="${index}"
                               style="width: 60px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    </td>
                    <td>
                        <input type="number" 
                               value="${item.discount_percent}" 
                               min="0" 
                               max="100"
                               step="1"
                               class="discount-input"
                               data-index="${index}"
                               style="width: 70px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        %
                    </td>
                    <td>₹${item.total_price.toFixed(2)}</td>
                </tr>
            `).join('');

            // Add event listeners for quantity and discount inputs
            tbody.querySelectorAll('.qty-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const qty = parseInt(e.target.value) || 1;
                    this.updateQuantity(index, qty);
                });
            });

            tbody.querySelectorAll('.discount-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const discount = parseFloat(e.target.value) || 0;
                    this.updateDiscount(index, discount);
                });
            });

            // Add click handler for row selection
            tbody.querySelectorAll('tr[data-index]').forEach(row => {
                row.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        const index = parseInt(row.dataset.index);
                        this.selectedItemIndex = this.selectedItemIndex === index ? null : index;
                        this.render();
                    }
                });
            });
        }

        // Update totals
        this.updateTotals();
    }

    updateTotals() {
        const subtotal = this.getSubtotal();
        const discount = this.getTotalDiscount();
        const grandTotal = this.getGrandTotal();

        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('discount').textContent = `- ₹${discount.toFixed(2)}`;
        document.getElementById('grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
        document.getElementById('footer-total').textContent = `₹${grandTotal.toFixed(2)}`;
    }

    getOrderData(cashierName, customerId, paymentMethod, notes) {
        return {
            items: this.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                discount_percent: item.discount_percent
            })),
            customer_id: customerId,
            cashier_name: cashierName,
            payment_method: paymentMethod,
            discount_amount: this.couponDiscount,
            status: 'completed',
            notes: notes
        };
    }
}

// Global cart instance
const cart = new Cart();
