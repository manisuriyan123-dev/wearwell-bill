// Order processing
let currentCustomerId = null;

// Customer search (guarded: some templates may not include a dedicated select button)
const selectCustomerBtn = document.getElementById('select-customer-btn');
if (selectCustomerBtn) {
    selectCustomerBtn.addEventListener('click', async () => {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const loyalty = document.getElementById('customer-loyalty').value.trim();
        
        if (!name && !phone && !loyalty) {
            alert('Please enter at least one customer detail');
            return;
        }
        
        try {
            let customers = [];
            if (loyalty) {
                customers = await API.searchCustomers(loyalty);
            } else if (phone) {
                customers = await API.searchCustomers(phone);
            } else if (name) {
                customers = await API.searchCustomers(name);
            }
            
            if (customers.length === 0) {
                // Create new customer
                const customer = await API.createCustomer({
                    name: name || 'Walk-in Customer',
                    phone: phone || null,
                    loyalty_card: loyalty || null
                });
                currentCustomerId = customer.id;
                displayCustomerInfo(customer);
            } else if (customers.length === 1) {
                currentCustomerId = customers[0].id;
                displayCustomerInfo(customers[0]);
            } else {
                displayCustomerResults(customers);
            }
        } catch (error) {
            console.error('Customer error:', error);
            alert('Error processing customer: ' + error.message);
        }
    });
}

function displayCustomerInfo(customer) {
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-loyalty').value = customer.loyalty_card || '';
    document.getElementById('customer-results').innerHTML = '';
}

function displayCustomerResults(customers) {
    const resultsDiv = document.getElementById('customer-results');
    resultsDiv.innerHTML = customers.map(customer => `
        <div class="customer-result-item" data-customer-id="${customer.id}">
            <strong>${customer.name}</strong><br>
            <small>Phone: ${customer.phone || 'N/A'} | Card: ${customer.loyalty_card || 'N/A'}</small>
        </div>
    `).join('');
    
    resultsDiv.querySelectorAll('.customer-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const customerId = parseInt(item.dataset.customerId);
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                currentCustomerId = customer.id;
                displayCustomerInfo(customer);
            }
        });
    });
}

// Payment method selection
document.querySelectorAll('.btn-payment').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-payment').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function getSelectedPaymentMethod() {
    const activeBtn = document.querySelector('.btn-payment.active');
    return activeBtn ? activeBtn.dataset.method : 'Cash';
}

// Print Bill
document.getElementById('print-bill-btn').addEventListener('click', async () => {
    if (cart.items.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const cashierName = document.getElementById('cashier-name').textContent;
    const paymentMethod = getSelectedPaymentMethod();
    
    try {
        const orderData = cart.getOrderData(cashierName, currentCustomerId, paymentMethod, orderNotes);
        const order = await API.createOrder(orderData);
        
        // Print bill
        await printBill(order.order_number);
        
        // Clear cart after successful order
        cart.clear();
        currentCustomerId = null;
        orderNotes = '';
        
        alert(`Order ${order.order_number} created successfully!`);
    } catch (error) {
        console.error('Order error:', error);
        alert('Error creating order: ' + error.message);
    }
});

// Save Draft
document.getElementById('save-draft-btn').addEventListener('click', async () => {
    if (cart.items.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const cashierName = document.getElementById('cashier-name').textContent;
    const paymentMethod = getSelectedPaymentMethod();
    
    try {
        const orderData = cart.getOrderData(cashierName, currentCustomerId, paymentMethod, orderNotes);
        orderData.status = 'draft';
        const order = await API.createOrder(orderData);
        
        alert(`Draft saved: ${order.order_number}`);
    } catch (error) {
        console.error('Draft error:', error);
        alert('Error saving draft: ' + error.message);
    }
});

// Hold Order
document.getElementById('hold-order-btn').addEventListener('click', async () => {
    if (cart.items.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const cashierName = document.getElementById('cashier-name').textContent;
    const paymentMethod = getSelectedPaymentMethod();
    
    try {
        const orderData = cart.getOrderData(cashierName, currentCustomerId, paymentMethod, orderNotes);
        orderData.status = 'held';
        const order = await API.createOrder(orderData);
        
        // Clear cart but keep customer
        cart.clear();
        orderNotes = '';
        
        alert(`Order held: ${order.order_number}`);
    } catch (error) {
        console.error('Hold error:', error);
        alert('Error holding order: ' + error.message);
    }
});

// Remove Item
document.getElementById('remove-item-btn').addEventListener('click', () => {
    // Open remove-item modal and show cart items for selection
    const modal = document.getElementById('remove-item-modal');
    const list = document.getElementById('remove-item-list');
    const confirmBtn = document.getElementById('remove-item-confirm-selected');
    const cancelBtn = document.getElementById('remove-item-cancel');

    function renderList() {
        if (cart.items.length === 0) {
            list.innerHTML = '<p>The cart is empty.</p>';
            confirmBtn.disabled = true;
            return;
        }

        list.innerHTML = cart.items.map((item, idx) => `
            <div class="product-select-item" data-idx="${idx}" style="padding:8px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${item.product.name}</strong><br>
                    <small>Barcode: ${item.product.barcode || '-'} | Qty: ${item.quantity}</small>
                </div>
                <div>
                    <button class="btn btn-danger btn-remove-single" data-idx="${idx}" style="padding:6px 10px;">Remove</button>
                </div>
            </div>
        `).join('');

        // Highlight selectedItemIndex if any
        if (cart.selectedItemIndex !== null) {
            const selEl = list.querySelector(`[data-idx=\"${cart.selectedItemIndex}\"]`);
            if (selEl) selEl.style.background = '#fee2e2';
        }

        // Attach handlers for per-item remove buttons
        list.querySelectorAll('.btn-remove-single').forEach(b => {
            b.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (confirm('Remove this item from the cart?')) {
                    cart.removeItem(idx);
                    cart.selectedItemIndex = null;
                    renderList();
                }
            });
        });

        confirmBtn.disabled = false;
    }

    // Open modal
    modal.style.display = 'block';
    renderList();

    // Confirm remove selected
    confirmBtn.onclick = () => {
        if (cart.selectedItemIndex !== null) {
            if (confirm('Remove selected item from the cart?')) {
                cart.removeItem(cart.selectedItemIndex);
                cart.selectedItemIndex = null;
                modal.style.display = 'none';
            }
        } else {
            alert('No item selected. Use the Remove buttons next to items to remove a specific product.');
        }
    };

    // Cancel
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close handler (close icon)
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };

    // Click outside to close
    window.addEventListener('click', function onWindowClick(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            window.removeEventListener('click', onWindowClick);
        }
    });
});

// Clear Cart
document.getElementById('clear-cart-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the cart?')) {
        cart.clear();
    }
});
