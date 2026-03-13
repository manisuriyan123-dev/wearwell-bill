// Product search and management
let searchTimeout;
let autoScanEnabled = true;

// Function to play beep sound
function playBeep() {
    try {
        // Check if Web Audio API is supported
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.log('Web Audio API not supported, skipping beep');
            return;
        }
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequency in Hz
        oscillator.type = 'sine'; // Waveform type
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2); // Fade out
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2); // Duration
        
        console.log('Beep sound played');
    } catch (error) {
        console.log('Beep sound not supported or failed:', error);
    }
}

// Auto scan is now default enabled
const searchInput = document.getElementById('product-search');
searchInput.placeholder = "Auto scan enabled - scan barcode...";

document.getElementById('product-search').addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    // Regular search logic for all cases
    if (query.length < 2) {
        document.getElementById('product-results').innerHTML = '';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            console.log('Searching for products:', query);
            const products = await API.searchProducts(query);
            console.log('Search results:', products);
            displayProductResults(products);
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('product-results').innerHTML = '<div class="product-result-item" style="color: red;">Search error: ' + error.message + '</div>';
        }
    }, 300);
});

document.getElementById('product-search').addEventListener('keypress', async (e) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter') {
        console.log('Enter key detected');
        e.preventDefault(); // Prevent form submission
        const query = e.target.value.trim();
        console.log('Query:', query);
        if (!query) {
            console.log('Empty query, returning');
            return;
        }
        
        console.log('Enter pressed with query:', query);
        
        try {
            // Try barcode first
            if (/^\d{8,13}$/.test(query)) {
                console.log('Trying barcode lookup for:', query);
                try {
                    const product = await API.getProductByBarcode(query);
                    console.log('Barcode product found:', product);
                    addProductToCart(product);
                    playBeep(); // Play beep sound on successful scan
                    e.target.value = '';
                    document.getElementById('product-results').innerHTML = '';
                    return;
                } catch (barcodeError) {
                    console.log('Barcode not found, trying search:', barcodeError);
                }
            }
            
            // If barcode fails or not a barcode, search by name
            console.log('Searching by name for:', query);
            const products = await API.searchProducts(query);
            console.log('Search results:', products);
            
            if (products.length === 1) {
                console.log('Single product found, adding to cart');
                addProductToCart(products[0]);
                playBeep();
                e.target.value = '';
                document.getElementById('product-results').innerHTML = '';
            } else if (products.length > 1) {
                console.log('Multiple products found, showing results');
                displayProductResults(products);
            } else {
                console.log('No products found');
                document.getElementById('product-results').innerHTML = '<div class="product-result-item">No products found</div>';
            }
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('product-results').innerHTML = '<div class="product-result-item" style="color: red;">Error: ' + error.message + '</div>';
        }
    }
});

function displayProductResults(products) {
    const resultsDiv = document.getElementById('product-results');
    
    if (products.length === 0) {
        resultsDiv.innerHTML = '<div class="product-result-item">No products found</div>';
        return;
    }
    
    resultsDiv.innerHTML = products.map(product => `
        <div class="product-result-item" data-product-id="${product.id}">
            <strong>${product.name}</strong><br>
            <small>Barcode: ${product.barcode} | Price: ₹${product.price.toFixed(2)} | Stock: ${product.stock_quantity}</small>
        </div>
    `).join('');
    
    resultsDiv.querySelectorAll('.product-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = parseInt(item.dataset.productId);
            const product = products.find(p => p.id === productId);
            if (product) {
                addProductToCart(product);
                document.getElementById('product-search').value = '';
                resultsDiv.innerHTML = '';
            }
        });
    });
}

function addProductToCart(product) {
    console.log('Adding product to cart:', product);
    if (product.stock_quantity <= 0) {
        alert('Product is out of stock!');
        return;
    }
    
    console.log('Calling cart.addItem');
    cart.addItem(product, 1, 0);
    console.log('Cart items after add:', cart.items);
    updateStockDisplay();
}

// Scan button
document.getElementById('scan-btn').addEventListener('click', () => {
    const searchInput = document.getElementById('product-search');
    searchInput.focus();
    // In a real implementation, this would trigger barcode scanner
    alert('Barcode scanner would activate here. Enter barcode manually in the search field.');
});

// Load stock summary on page load
async function updateStockDisplay() {
    try {
        const summary = await API.getStockSummary();
        summary.forEach(item => {
            const element = document.getElementById(`stock-${item.category.toLowerCase()}`);
            if (element) {
                element.textContent = `${item.total_stock} in Stock`;
            }
        });
    } catch (error) {
        console.error('Error loading stock:', error);
    }
}

// Stock card click handler
document.querySelectorAll('.stock-card').forEach(card => {
    card.addEventListener('click', async () => {
        const category = card.dataset.category;
        try {
            const products = await API.getProducts({ category });
            // Display products in a modal or update search
            console.log(`Loaded ${products.length} products in ${category}`);
            // You can implement a product list modal here
        } catch (error) {
            console.error('Error loading products:', error);
        }
    });
});

// Initialize stock display
updateStockDisplay();
