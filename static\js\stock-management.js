// Stock and Product Management
let currentEditingProductId = null;

// Scroll Page Method - Smoothly scroll to a specific element or position
window.scrollToPage = function(target, options = {}) {
    const {
        behavior = 'smooth',
        block = 'start',
        inline = 'nearest',
        offset = 0
    } = options;
    
    let element;
    
    // Handle different target types
    if (typeof target === 'string') {
        element = document.getElementById(target) || document.querySelector(target);
    } else if (target instanceof Element) {
        element = target;
    } else if (typeof target === 'number') {
        // Scroll to pixel position
        window.scrollTo({
            top: target + offset,
            behavior: behavior
        });
        return;
    }
    
    if (element) {
        const scrollOptions = {
            behavior: behavior,
            block: block,
            inline: inline
        };
        element.scrollIntoView(scrollOptions);
        
        // Apply offset if specified
        if (offset !== 0) {
            const elementTop = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementTop - offset,
                behavior: 'auto'
            });
        }
    } else {
        console.warn('Scroll target not found:', target);
    }
};

// Load products list for stock management (make it globally accessible)
window.loadProductsList = async function(selectedCategory = '') {
    try {
        const products = await API.getProducts();
        
        // Filter products by category if provided
        const filteredProducts = selectedCategory 
            ? products.filter(p => p.category === selectedCategory)
            : products;
        
        const productsListDiv = document.getElementById('products-list');
        
        if (filteredProducts.length === 0) {
            productsListDiv.innerHTML = '<p>No products found' + (selectedCategory ? ` in ${selectedCategory} category` : '') + '. Add a new product to get started.</p>';
            return;
        }
        
        productsListDiv.innerHTML = `
            <div style="max-height: 400px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                            <th style="padding: 10px; text-align: left; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Barcode</th>
                            <th style="padding: 10px; text-align: left; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Name</th>
                            <th style="padding: 10px; text-align: left; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Category</th>
                            <th style="padding: 10px; text-align: right; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Price</th>
                            <th style="padding: 10px; text-align: right; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Stock</th>
                            <th style="padding: 10px; text-align: center; position: sticky; top: 0; background: #f1f5f9; z-index: 1;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredProducts.map(product => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px;">${product.barcode}</td>
                                <td style="padding: 10px;">${product.name}</td>
                                <td style="padding: 10px;">${product.category}</td>
                                <td style="padding: 10px; text-align: right;">₹${product.price.toFixed(2)}</td>
                                <td style="padding: 10px; text-align: right;">
                                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                                        <div style="display: flex; align-items: center; gap: 5px;">
                                            <input type="number" id="stock-${product.id}" value="${product.stock_quantity}" 
                                                   min="0" style="width: 80px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                        </div>
                                        <button class="btn btn-small" onclick="updateStock(${product.id})" 
                                                id="update-stock-btn-${product.id}"
                                                style="padding: 5px 15px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            ✓ Confirm Stock
                                        </button>
                                    </div>
                                </td>
                                <td style="padding: 10px; text-align: center;">
                                    <button class="btn btn-small" onclick="handleEditProduct(${product.id})" 
                                            style="padding: 5px 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                                        Edit
                                    </button>
                                    <button class="btn btn-small" onclick="handleDeleteProduct(${product.id})" 
                                            style="padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                <button id="confirm-all-stocks-btn" class="btn btn-success">Confirm All Stocks</button>
            </div>
        `;

        // Attach Confirm All event (closure captures `filteredProducts`)
        const confirmAllBtn = document.getElementById('confirm-all-stocks-btn');
        if (confirmAllBtn) {
            confirmAllBtn.addEventListener('click', async () => {
                if (!confirm('Confirm update of all displayed stock quantities?')) return;
                // Disable button while running
                confirmAllBtn.disabled = true;
                confirmAllBtn.textContent = 'Updating...';
                for (const product of filteredProducts) {
                    try {
                        const input = document.getElementById(`stock-${product.id}`);
                        if (!input) continue;
                        const newStock = parseInt(input.value);
                        if (isNaN(newStock) || newStock < 0) continue;

                        const currentProd = await API.getProduct(product.id);
                        const quantityChange = newStock - currentProd.stock_quantity;
                        if (quantityChange === 0) continue;

                        await API.adjustStock({ product_id: product.id, quantity_change: quantityChange, notes: 'Bulk confirm from Manage Stocks' });
                    } catch (err) {
                        console.error('Error confirming product', product.id, err);
                    }
                }
                confirmAllBtn.textContent = 'Done';
                setTimeout(async () => {
                    confirmAllBtn.disabled = false;
                    confirmAllBtn.textContent = 'Confirm All Stocks';
                    await loadProductsList(selectedCategory);
                    if (typeof updateStockDisplay === 'function') updateStockDisplay();
                }, 1000);
            });
        }

        // If requested to open a specific product, focus/scroll it
        if (window.OPEN_PRODUCT_TO_EDIT) {
            const idToOpen = window.OPEN_PRODUCT_TO_EDIT;
            const el = document.getElementById(`stock-${idToOpen}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            delete window.OPEN_PRODUCT_TO_EDIT;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = '<p style="color: red;">Error loading products: ' + error.message + '</p>';
    }
};

// Update stock quantity (Confirm Stock button)
window.updateStock = async function(productId) {
    console.log('=== updateStock CALLED ===');
    console.log('Product ID:', productId);
    
    const stockInput = document.getElementById(`stock-${productId}`);
    if (!stockInput) {
        console.error('Stock input not found for product:', productId);
        alert('Error: Stock input not found');
        return;
    }
    
    const newStock = parseInt(stockInput.value);
    const updateBtn = document.getElementById(`update-stock-btn-${productId}`);
    
    console.log('New stock value:', newStock);
    
    if (isNaN(newStock) || newStock < 0) {
        console.error('Invalid stock quantity:', newStock);
        alert('Please enter a valid stock quantity');
        stockInput.focus();
        return;
    }
    
    try {
        console.log('Fetching current product data...');
        const product = await API.getProduct(productId);
        const oldStock = product.stock_quantity;
        const quantityChange = newStock - oldStock;
        
        console.log('Old stock:', oldStock, 'New stock:', newStock, 'Change:', quantityChange);
        
        if (quantityChange === 0) {
            alert(`Stock is already ${newStock}. No change needed.`);
            return;
        }
        
        // Show loading state
        if (updateBtn) {
            updateBtn.textContent = 'Updating...';
            updateBtn.disabled = true;
            updateBtn.style.background = '#94a3b8';
        }
        
        console.log('Calling adjustStock API...');
        await API.adjustStock({
            product_id: productId,
            quantity_change: quantityChange,
            notes: `Manual stock adjustment: ${oldStock} → ${newStock}`
        });
        
        console.log('Stock updated successfully!');
        // Show success
        if (updateBtn) {
            updateBtn.textContent = '✓ Confirmed!';
            updateBtn.style.background = '#10b981';
            setTimeout(() => {
                updateBtn.textContent = '✓ Confirm Stock';
                updateBtn.disabled = false;
                updateBtn.style.background = '#3b82f6';
            }, 2000);
        }
        
        // Update stock display if function exists
        if (typeof updateStockDisplay === 'function') {
            updateStockDisplay();
        }
        
        // Optionally reload products list to refresh all data
        await loadProductsList();
        
    } catch (error) {
        console.error('Error updating stock:', error);
        console.error('Error details:', error.message);
        alert('Error updating stock: ' + error.message);
        
        // Reset button on error
        if (updateBtn) {
            updateBtn.textContent = '✓ Confirm Stock';
            updateBtn.disabled = false;
            updateBtn.style.background = '#3b82f6';
        }
    }
};

// Add Product Button (guarded - element may not exist on every page)
const addProductBtn = document.getElementById('add-product-btn');
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        currentEditingProductId = null;
        const titleEl = document.getElementById('product-modal-title');
        const barcodeEl = document.getElementById('modal-product-barcode');
        const nameEl = document.getElementById('modal-product-name');
        const categoryEl = document.getElementById('modal-product-category');
        const priceEl = document.getElementById('modal-product-price');
        const stockEl = document.getElementById('modal-product-stock');
        const messageEl = document.getElementById('product-message');
        const buttonsEl = document.getElementById('product-buttons');
        const okButtonEl = document.getElementById('product-ok-button');
        const modalEl = document.getElementById('product-modal');

        if (titleEl) titleEl.textContent = 'Add Product';
        if (barcodeEl) barcodeEl.value = '';
        if (nameEl) nameEl.value = '';
        if (categoryEl) categoryEl.value = '';
        if (priceEl) priceEl.value = '';
        if (stockEl) stockEl.value = '0';
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.className = '';
        }
        if (buttonsEl) buttonsEl.style.display = 'flex';
        
        if (okButtonEl) okButtonEl.style.display = 'none';
        if (modalEl) modalEl.style.display = 'block';
    });
}

// Edit Product
window.editProduct = async function(productId) {
    console.log('=== editProduct CALLED ===');
    console.log('Product ID:', productId);
    
    try {
        console.log('Fetching product data...');
        const product = await API.getProduct(productId);
        console.log('Product loaded:', product);
        
        currentEditingProductId = productId;
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('modal-product-barcode').value = product.barcode;
        document.getElementById('modal-product-name').value = product.name;
        document.getElementById('modal-product-category').value = product.category;
        document.getElementById('modal-product-price').value = product.price;
        document.getElementById('modal-product-stock').value = product.stock_quantity;
        document.getElementById('product-message').textContent = '';
        document.getElementById('product-message').className = '';
        document.getElementById('product-buttons').style.display = 'flex';
        document.getElementById('product-ok-button').style.display = 'none';
        
        console.log('Displaying edit modal for product:', productId);
        document.getElementById('product-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading product:', error);
        console.error('Error details:', error.message);
        alert('Error loading product: ' + error.message);
    }
};

// Wrapper functions for better error handling and logging
window.handleEditProduct = async function(productId) {
    console.log('handleEditProduct wrapper called with ID:', productId);
    try {
        await editProduct(productId);
    } catch (error) {
        console.error('Error in handleEditProduct:', error);
        alert('Error loading product for editing: ' + error.message);
    }
};

window.handleDeleteProduct = async function(productId) {
    console.log('handleDeleteProduct wrapper called with ID:', productId);
    try {
        await deleteProduct(productId);
    } catch (error) {
        console.error('Error in handleDeleteProduct:', error);
        alert('Error deleting product: ' + error.message);
    }
};

// Delete Product
window.deleteProduct = async function(productId) {
    console.log('=== deleteProduct CALLED ===');
    console.log('Product ID:', productId);
    console.log('Type:', typeof productId);
    
    // Validate input
    if (!productId || isNaN(parseInt(productId))) {
        console.error('Invalid product ID:', productId);
        alert('Error: Invalid product ID');
        return;
    }
    
    const numId = parseInt(productId);
    console.log('Parsed product ID:', numId);
    
    if (!confirm('Are you sure you want to delete this product?')) {
        console.log('User cancelled delete');
        return;
    }

    try {
        console.log('Starting delete API call for product:', numId);
        await API.deleteProduct(numId);
        console.log('Delete successful!');
        alert('Product deleted successfully!');
        await loadProductsList();
        if (typeof updateStockDisplay === 'function') {
            updateStockDisplay();
        }
        return;
    } catch (error) {
        console.warn('Initial delete failed:', error);
        console.warn('Error message:', error.message);
        // Ask user if they want to force delete (this will remove related order items and stock history)
        const tryForce = confirm('Server prevented delete (product has related records). Force delete and remove related records? Click OK to force.');
        if (!tryForce) {
            console.log('User cancelled force delete');
            alert('Delete cancelled');
            return;
        }
        try {
            console.log('Attempting force delete for product:', numId);
            await API.deleteProduct(numId, true);
            console.log('Force delete successful!');
            alert('Product deleted (forced) successfully!');
            await loadProductsList();
            if (typeof updateStockDisplay === 'function') {
                updateStockDisplay();
            }
        } catch (err2) {
            console.error('Force delete failed:', err2);
            console.error('Error details:', err2.message);
            alert('Failed to delete product: ' + err2.message);
        }
    }
};

// Note: modal delete button removed per UX decision

// Save Product
const saveProductBtn = document.getElementById('save-product-btn');
if (saveProductBtn) {
    saveProductBtn.addEventListener('click', async () => {
    const barcode = document.getElementById('modal-product-barcode').value.trim();
    const name = document.getElementById('modal-product-name').value.trim();
    const category = document.getElementById('modal-product-category').value;
    const price = parseFloat(document.getElementById('modal-product-price').value);
    const stock = parseInt(document.getElementById('modal-product-stock').value);
    const messageDiv = document.getElementById('product-message');
    
    if (!barcode || !name || !category || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
        messageDiv.className = 'error';
        messageDiv.textContent = 'Please fill all required fields with valid values';
        return;
    }
    
    try {
        const productData = {
            barcode,
            name,
            category,
            price,
            stock_quantity: stock
        };
        
        if (currentEditingProductId) {
            await API.updateProduct(currentEditingProductId, productData);
            messageDiv.className = 'success';
            messageDiv.textContent = 'Product updated successfully!';
        } else {
            await API.createProduct(productData);
            messageDiv.className = 'success';
            messageDiv.textContent = 'Product added successfully!';
        }
        
        // Hide Save/Cancel buttons and show OK button
        document.getElementById('product-buttons').style.display = 'none';
        document.getElementById('product-ok-button').style.display = 'block';
        
        // Reload products list and refresh stock display
        await loadProductsList();
        if (typeof updateStockDisplay === 'function') {
            updateStockDisplay();
        }
    } catch (error) {
        messageDiv.className = 'error';
        messageDiv.textContent = error.message || 'Error saving product';
    }
    });
}

// Cancel Product Modal
const cancelProductBtn = document.getElementById('cancel-product-btn');
if (cancelProductBtn) {
    cancelProductBtn.addEventListener('click', () => {
        const modalEl = document.getElementById('product-modal');
        const buttonsEl = document.getElementById('product-buttons');
        const okButtonEl = document.getElementById('product-ok-button');
        if (modalEl) modalEl.style.display = 'none';
        if (buttonsEl) buttonsEl.style.display = 'flex';
        if (okButtonEl) okButtonEl.style.display = 'none';
    });
}

// OK Product Button
const okProductBtn = document.getElementById('ok-product-btn');
if (okProductBtn) {
    okProductBtn.addEventListener('click', () => {
        const modalEl = document.getElementById('product-modal');
        const messageEl = document.getElementById('product-message');
        const buttonsEl = document.getElementById('product-buttons');
        const okButtonEl = document.getElementById('product-ok-button');
        if (modalEl) modalEl.style.display = 'none';
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.className = '';
        }
        if (buttonsEl) buttonsEl.style.display = 'flex';
        if (okButtonEl) okButtonEl.style.display = 'none';
    });
}

// Close Product Modal
const productModal = document.getElementById('product-modal');
if (productModal) {
    const closeBtn = productModal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const buttonsEl = document.getElementById('product-buttons');
            const okButtonEl = document.getElementById('product-ok-button');
            productModal.style.display = 'none';
            if (buttonsEl) buttonsEl.style.display = 'flex';
            if (okButtonEl) okButtonEl.style.display = 'none';
        });
    }
}

// Close Stock Management Modal
const stockManagementModal = document.getElementById('stock-management-modal');
if (stockManagementModal) {
    const closeStockBtn = stockManagementModal.querySelector('.close');
    if (closeStockBtn) {
        closeStockBtn.addEventListener('click', () => {
            stockManagementModal.style.display = 'none';
        });
    }
}
