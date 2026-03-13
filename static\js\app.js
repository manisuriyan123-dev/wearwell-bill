// Main application initialization
// Global variable for order notes
let orderNotes = '';

document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    document.getElementById('current-date').textContent = dateStr;
    
    // Initialize cart display
    cart.render();
    
    // Cashier Profile Modal
    const cashierModal = document.getElementById('cashier-modal');
    const cashierNameElement = document.getElementById('cashier-name');
    const cashierClose = cashierModal.querySelector('.close');
    const saveCashierBtn = document.getElementById('save-cashier-btn');
    
    cashierNameElement.addEventListener('click', () => {
        document.getElementById('cashier-name-input').value = cashierNameElement.textContent;
        cashierModal.style.display = 'block';
    });
    
    cashierClose.addEventListener('click', () => {
        cashierModal.style.display = 'none';
    });
    
    saveCashierBtn.addEventListener('click', () => {
        const newName = document.getElementById('cashier-name-input').value.trim();
        if (newName) {
            cashierNameElement.textContent = newName;
            cashierModal.style.display = 'none';
            alert('Cashier name updated!');
        } else {
            alert('Please enter a cashier name');
        }
    });
    
    // Add Note Modal
    const noteModal = document.getElementById('note-modal');
    const noteBtn = document.getElementById('add-note-btn');
    const noteClose = noteModal.querySelector('.close');
    const saveNoteBtn = document.getElementById('save-note-btn');
    
    noteBtn.addEventListener('click', () => {
        document.getElementById('order-note').value = orderNotes;
        noteModal.style.display = 'block';
    });
    
    noteClose.addEventListener('click', () => {
        noteModal.style.display = 'none';
    });
    
    saveNoteBtn.addEventListener('click', () => {
        orderNotes = document.getElementById('order-note').value;
        noteModal.style.display = 'none';
        alert('Note saved');
    });
    
    // Stock Check: open dedicated stock-check page
    document.getElementById('stock-check-btn').addEventListener('click', (e) => {
        window.location = '/stock-check';
    });
    
    // Customers: open customers list page
    document.getElementById('customers-btn').addEventListener('click', (e) => {
        window.location = '/customers';
    });
    
    // Manage Stock Modal
    const stockModal = document.getElementById('stock-management-modal');
    const manageStockBtn = document.getElementById('manage-stock-btn');
    const stockClose = stockModal.querySelector('.close');
    
    manageStockBtn.addEventListener('click', async () => {
        stockModal.style.display = 'block';
        if (typeof loadProductsList === 'function') {
            await loadProductsList();
        } else {
            console.error('loadProductsList function not found');
            document.getElementById('products-list').innerHTML = '<p style="color: red;">Error: Stock management functions not loaded. Please refresh the page.</p>';
        }
    });

    // Category filter in stock management modal
    const categoryFilter = document.getElementById('stock-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', async (e) => {
            const selectedCategory = e.target.value;
            console.log('Filter category:', selectedCategory);
            if (typeof loadProductsList === 'function') {
                await loadProductsList(selectedCategory);
            }
        });
    }

    // If opened with ?open_stock=<id>, open manage stock modal and focus that product
    try {
        const params = new URLSearchParams(window.location.search);
        const openStockId = params.get('open_stock');
        if (openStockId) {
            window.OPEN_PRODUCT_TO_EDIT = parseInt(openStockId);
            manageStockBtn.click();
        }
    } catch (e) {
        // ignore
    }
    
    stockClose.addEventListener('click', () => {
        stockModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const customerModal = document.getElementById('customer-modal');
        if (e.target === cashierModal) {
            cashierModal.style.display = 'none';
        }
        if (e.target === noteModal) {
            noteModal.style.display = 'none';
        }
        if (e.target === stockModal) {
            stockModal.style.display = 'none';
        }
        if (e.target === customerModal) {
            customerModal.style.display = 'none';
        }
    });
    
    // Check for query params to open modals
    if (window.location.search.includes('add_customer')) {
        document.getElementById('add-customer-btn').click();
    }
    if (window.location.search.includes('edit_customer=')) {
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('edit_customer');
        if (customerId && window.editCustomer) {
            window.editCustomer(customerId);
        }
    }
    
    // Auto-refresh stock display every 30 seconds
    setInterval(() => {
        updateStockDisplay();
    }, 30000);

    // Billing style selector initialization
    const billingSelect = document.getElementById('billing-style-select');
    if (billingSelect) {
        // initialize from localStorage
        const saved = localStorage.getItem('billingStyle') || 'thermal';
        billingSelect.value = saved;
        billingSelect.addEventListener('change', (e) => {
            localStorage.setItem('billingStyle', e.target.value);
            // optional feedback
            console.log('Billing style set to', e.target.value);
        });
    }

    // Bill search handler (open existing invoice by bill number)
    const billInput = document.getElementById('bill-search-input');
    const billBtn = document.getElementById('bill-search-btn');
    if (billInput && billBtn) {
        billBtn.addEventListener('click', () => {
            const val = billInput.value.trim();
            if (!val) {
                alert('Please enter a bill number to search');
                billInput.focus();
                return;
            }
            const encoded = encodeURIComponent(val);
            window.open(`/invoice/${encoded}`, '_blank');
        });
        billInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') billBtn.click();
        });
    }
});
