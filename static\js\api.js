// API communication layer
const API_BASE_URL = '';

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const text = await response.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                data = null;
            }

            if (!response.ok) {
                const serverMessage = data && (data.error || data.message) ? (data.error || data.message) : null;
                const message = serverMessage || text || `HTTP error! status: ${response.status}`;
                const err = new Error(message);
                err.status = response.status;
                err.body = data || text;
                throw err;
            }

            // Prefer returning parsed JSON when available, otherwise raw text
            return data !== null ? data : text;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Products
    static async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/products?${queryString}`);
    }

    static async getProduct(id) {
        return this.request(`/api/products/${id}`);
    }

    static async getProductByBarcode(barcode) {
        return this.request(`/api/products/barcode/${barcode}`);
    }

    static async searchProducts(query) {
        return this.request(`/api/products/search?q=${encodeURIComponent(query)}`);
    }

    static async createProduct(productData) {
        return this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    static async updateProduct(id, productData) {
        return this.request(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    static async deleteProduct(id, force = false) {
        const endpoint = `/api/products/${id}${force ? '?force=true' : ''}`;
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    static async getStockSummary() {
        return this.request('/api/products/stock-summary');
    }

    // Customers
    static async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/customers?${queryString}`);
    }

    static async getCustomer(id) {
        return this.request(`/api/customers/${id}`);
    }

    static async searchCustomers(query) {
        return this.request(`/api/customers/search?q=${encodeURIComponent(query)}`);
    }

    static async createCustomer(customerData) {
        return this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }

    static async updateCustomer(id, customerData) {
        return this.request(`/api/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    static async deleteCustomer(id) {
        return this.request(`/api/customers/${id}`, {
            method: 'DELETE'
        });
    }

    // Orders
    static async createOrder(orderData) {
        return this.request('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    static async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/orders?${queryString}`);
    }

    static async getOrder(orderNumber) {
        return this.request(`/api/orders/${orderNumber}`);
    }

    static async updateOrderStatus(orderNumber, status) {
        return this.request(`/api/orders/${orderNumber}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Stock
    static async getStockHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/stock/history?${queryString}`);
    }

    static async adjustStock(adjustmentData) {
        return this.request('/api/stock/adjust', {
            method: 'POST',
            body: JSON.stringify(adjustmentData)
        });
    }

    static async getLowStock() {
        return this.request('/api/stock/low-stock');
    }

    static async getDailySales(date) {
        return this.request(`/api/stock/daily-sales?date=${date}`);
    }

    static async deleteDailySale(productId, date) {
        return this.request('/api/stock/daily-sales/delete', {
            method: 'DELETE',
            body: JSON.stringify({ product_id: productId, date })
        });
    }

    // Billing
    static async printBill(orderNumber, style = '') {
        const body = style ? { style } : {};
        return this.request(`/api/billing/orders/${orderNumber}/print`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    static async validateCoupon(code) {
        return this.request('/api/billing/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }
}
