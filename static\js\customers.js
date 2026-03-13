// Customer management
let currentEditingCustomerId = null;

// Handle Update Customer button
async function handleUpdateCustomer() {
    console.log('=== handleUpdateCustomer CALLED ===');
    
    const name = document.getElementById('modal-customer-name').value.trim();
    const phone = document.getElementById('modal-customer-phone').value.trim();
    const email = document.getElementById('modal-customer-email').value.trim();
    const loyalty = document.getElementById('modal-customer-loyalty').value.trim();
    const address = document.getElementById('modal-customer-address').value.trim();
    const messageDiv = document.getElementById('customer-message');
    
    console.log('Form values:', {name, phone, email, loyalty, address});
    console.log('Currently editing customer ID:', currentEditingCustomerId);
    
    if (!name) {
        console.log('ERROR: Name is empty');
        messageDiv.className = 'error';
        messageDiv.textContent = 'Customer name is required';
        return;
    }
    
    messageDiv.textContent = 'Saving...';
    messageDiv.className = 'success';
    
    try {
        const customerData = {
            name,
            phone: phone || null,
            email: email || null,
            loyalty_card: loyalty || null,
            address: address || null
        };
        
        console.log('Sending to API:', customerData);
        
        let customer;
        let isUpdate = false;
        if (currentEditingCustomerId) {
            console.log('Updating customer ID:', currentEditingCustomerId);
            customer = await API.updateCustomer(currentEditingCustomerId, customerData);
            isUpdate = true;
        } else {
            console.log('Creating new customer');
            customer = await API.createCustomer(customerData);
        }
        
        console.log('API Response:', customer);
        
        if (!customer) {
            throw new Error('No customer data returned from API');
        }
        
        // Update the customer info fields on main page
        document.getElementById('customer-name').value = customer.name || '';
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-loyalty').value = customer.loyalty_card || '';
        
        // Update global customer ID reference
        if (typeof currentCustomerId !== 'undefined') {
            currentCustomerId = customer.id;
            console.log('Set currentCustomerId to:', customer.id);
        }
        
        messageDiv.className = 'success';
        messageDiv.textContent = isUpdate ? 'Customer updated successfully!' : 'Customer added successfully!';
        console.log('SUCCESS: Customer saved');
        
        // Reset editing state and UI
        currentEditingCustomerId = null;
        document.getElementById('customer-modal-title').textContent = 'Add Customer';
        document.getElementById('update-customer-btn').textContent = 'Add';
        
        // Close modal after 1.5 seconds to show success message
        setTimeout(() => {
            document.getElementById('customer-modal').style.display = 'none';
            document.getElementById('customer-ok-button').style.display = 'none';
            document.getElementById('customer-message').textContent = '';
            document.getElementById('customer-message').className = '';
            console.log('Modal closed automatically');
        }, 1500);
        
    } catch (error) {
        console.error('ERROR in Update:', error);
        console.error('Error details:', error.message);
        messageDiv.className = 'error';
        messageDiv.textContent = 'Error: ' + (error.message || 'Failed to save customer');
    }
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add Customer Modal
    const addBtn = document.getElementById('add-customer-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            currentEditingCustomerId = null;
            document.getElementById('customer-modal-title').textContent = 'Add Customer';
            document.getElementById('update-customer-btn').textContent = 'Add';
            document.getElementById('modal-customer-name').value = '';
            document.getElementById('modal-customer-phone').value = '';
            document.getElementById('modal-customer-email').value = '';
            document.getElementById('modal-customer-loyalty').value = '';
            document.getElementById('modal-customer-address').value = '';
            document.getElementById('modal-search-customer').value = '';
            document.getElementById('modal-customer-results').innerHTML = '';
            document.getElementById('customer-message').textContent = '';
            document.getElementById('customer-message').className = '';
            document.getElementById('customer-ok-button').style.display = 'none';
            document.getElementById('customer-modal').style.display = 'block';
        });
    }

    // Note: Save/Update handled by handleUpdateCustomer() via onclick attribute

    // Cancel Customer Modal
    const cancelBtn = document.getElementById('cancel-customer-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('customer-modal').style.display = 'none';
            document.getElementById('customer-ok-button').style.display = 'none';
        });
    }

    // Note: Clear button is clear-top-customer-btn in index.html, see below

    // OK Customer Button
    const okBtn = document.getElementById('ok-customer-btn');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            document.getElementById('customer-modal').style.display = 'none';
            document.getElementById('customer-message').textContent = '';
            document.getElementById('customer-message').className = '';
            document.getElementById('customer-ok-button').style.display = 'none';
        });
    }

    // Note: Update button uses onclick="handleUpdateCustomer()" in HTML, no event listener needed


    // Clear Customer Form (from top button)
    const clearTopBtn = document.getElementById('clear-top-customer-btn');
    if (clearTopBtn) {
        clearTopBtn.addEventListener('click', () => {
            document.getElementById('modal-customer-name').value = '';
            document.getElementById('modal-customer-phone').value = '';
            document.getElementById('modal-customer-email').value = '';
            document.getElementById('modal-customer-loyalty').value = '';
            document.getElementById('modal-customer-address').value = '';
            document.getElementById('customer-message').textContent = '';
            document.getElementById('customer-message').className = '';
            document.getElementById('modal-search-customer').value = '';
            document.getElementById('modal-customer-results').innerHTML = '';
            // Reset editing state when clear is clicked
            currentEditingCustomerId = null;
            // Reset button and title to Add mode
            document.getElementById('customer-modal-title').textContent = 'Add Customer';
            document.getElementById('update-customer-btn').textContent = 'Add';
        });
    }

    // Search existing customers in modal
    const searchInput = document.getElementById('modal-search-customer');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            const resultsDiv = document.getElementById('modal-customer-results');
            
            if (!query) {
                resultsDiv.innerHTML = '';
                return;
            }
            
            try {
                const customers = await API.searchCustomers(query);
                
                if (!customers || customers.length === 0) {
                    resultsDiv.innerHTML = '<p style="color: #666; font-size: 14px;">No customers found</p>';
                    return;
                }
                
                resultsDiv.innerHTML = customers.map(customer => `
                    <div class="customer-search-result" data-customer-id="${customer.id}" 
                         style="padding: 8px; background: white; margin-bottom: 5px; border-radius: 4px; 
                                border: 1px solid #cbd5e1; cursor: pointer; hover: background-color: #f0f4f8;">
                        <strong>${customer.name}</strong><br>
                        <small style="color: #666;">
                            Phone: ${customer.phone || 'N/A'} | Card: ${customer.loyalty_card || 'N/A'}
                        </small>
                    </div>
                `).join('');
                
                // Add click handlers to results
                resultsDiv.querySelectorAll('.customer-search-result').forEach(item => {
                    item.addEventListener('click', () => {
                        const customerId = parseInt(item.dataset.customerId);
                        const customer = customers.find(c => c.id === customerId);
                        
                        if (customer) {
                            // Fill the form with customer details
                            document.getElementById('modal-customer-name').value = customer.name || '';
                            document.getElementById('modal-customer-phone').value = customer.phone || '';
                            document.getElementById('modal-customer-email').value = customer.email || '';
                            document.getElementById('modal-customer-loyalty').value = customer.loyalty_card || '';
                            document.getElementById('modal-customer-address').value = customer.address || '';
                            
                            // Set editing mode
                            currentEditingCustomerId = customer.id;
                            document.getElementById('customer-modal-title').textContent = 'Edit Customer';
                            document.getElementById('update-customer-btn').textContent = 'Update';
                            
                            // Clear search results
                            document.getElementById('modal-search-customer').value = '';
                            resultsDiv.innerHTML = '';
                            
                            console.log('Loaded customer for editing:', customer.id);
                        }
                    });
                });
                
            } catch (error) {
                console.error('Error searching customers:', error);
                resultsDiv.innerHTML = '<p style="color: red; font-size: 14px;">Error searching customers</p>';
            }
        });
    }

    // Close Customer Modal
    const modal = document.getElementById('customer-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('customer-modal').style.display = 'none';
                document.getElementById('customer-buttons').style.display = 'flex';
                document.getElementById('customer-ok-button').style.display = 'none';
            });
        }
    }
});

// Function to display multiple customer results for editing
function displayCustomerResultsForEdit(customers) {
    const resultsDiv = document.getElementById('customer-results');
    resultsDiv.innerHTML = customers.map(customer => `
        <div class="customer-result-item" data-customer-id="${customer.id}" style="cursor: pointer; padding: 10px; background: white; margin-bottom: 5px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <strong>${customer.name}</strong><br>
            <small>Phone: ${customer.phone || 'N/A'} | Card: ${customer.loyalty_card || 'N/A'}</small>
        </div>
    `).join('');
    
    resultsDiv.querySelectorAll('.customer-result-item').forEach(item => {
        item.addEventListener('click', async () => {
            const customerId = parseInt(item.dataset.customerId);
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                currentEditingCustomerId = customer.id;
                document.getElementById('customer-modal-title').textContent = 'Edit Customer';
                document.getElementById('modal-customer-name').value = customer.name || '';
                document.getElementById('modal-customer-phone').value = customer.phone || '';
                document.getElementById('modal-customer-email').value = customer.email || '';
                document.getElementById('modal-customer-loyalty').value = customer.loyalty_card || '';
                document.getElementById('modal-customer-address').value = customer.address || '';
                document.getElementById('customer-message').textContent = '';
                document.getElementById('customer-message').className = '';
                document.getElementById('customer-ok-button').style.display = 'none';
                document.getElementById('customer-modal').style.display = 'block';
                resultsDiv.innerHTML = '';
            }
        });
    });
}



