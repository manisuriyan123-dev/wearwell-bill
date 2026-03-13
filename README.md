# WearWell Billing Software

A comprehensive billing software for clothing shops built with Flask (backend) and vanilla JavaScript (frontend).

## Features

- **Product & Inventory Management**
  - Barcode validation and search
  - Category-based stock display (Shirts, Pants, Dhotis, Saree)
  - Real-time stock updates
  - Low stock alerts

- **Shopping Cart System**
  - Session-based cart storage (localStorage)
  - Item-level discounts (percentage)
  - Cart-level coupons
  - Real-time total calculations

- **Order Processing**
  - Unique bill number generation (BILL-YYYYMMDD-XXXX)
  - Multiple payment methods (Cash, Card, UPI)
  - Order status management (draft, held, completed, cancelled)
  - Order notes support

- **Customer Management**
  - Customer search and selection
  - Loyalty card support
  - Customer information storage

- **Stock Management**
  - Stock history tracking
  - Automatic stock deduction on order completion
  - Stock adjustment operations

- **Bill Printing**
  - ESC/POS commands for 3-inch thermal printer
  - Print preview and file generation

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python app.py
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`

## Deployment (Vercel)

This project can be hosted on [Vercel](https://vercel.com) using the Python runtime.

1. **Push your repository to a Git provider** (GitHub, GitLab, or Bitbucket).
2. **Sign in to Vercel** and create a new project, selecting your repository.
3. Vercel will detect the `@vercel/python` runtime via the `vercel.json` file and install dependencies from `requirements.txt`.
4. Environment variables (optional but recommended):
   - `SECRET_KEY` – override the default secret
   - `DATABASE_URL` – point to an external database or the ephemeral `/tmp` SQLite path
5. **Build & deploy** – Vercel will run `api/index.py` and expose your Flask app.

> ⚠️ Note: The default SQLite database is stored under `instance/wearwell.db`. Serverless functions on Vercel are ephemeral, so any data written locally will not persist between deployments or cold starts. For production use, provide a remote database via `DATABASE_URL`.


## Project Structure

```
wearwell-bill/
├── app.py                 # Flask application entry point
├── config.py              # Configuration settings
├── models.py              # Database models
├── requirements.txt       # Python dependencies
├── routes/                # API route handlers
│   ├── products.py
│   ├── customers.py
│   ├── orders.py
│   ├── stock.py
│   └── billing.py
├── utils/                 # Utility functions
│   ├── helpers.py
│   └── thermal_printer.py
├── templates/             # HTML templates
│   └── index.html
└── static/                # Static files
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── api.js
    │   ├── app.js
    │   ├── cart.js
    │   ├── products.js
    │   ├── orders.js
    │   └── print.js
    └── images/            # Product images
```

## Database

The application uses SQLite database (`wearwell.db`) which is automatically created on first run.

### Tables:
- `products` - Product catalog
- `customers` - Customer information
- `orders` - Order records
- `order_items` - Order line items
- `stock_history` - Stock movement tracking
- `coupons` - Discount coupons

## API Endpoints

### Products
- `GET /api/products` - List products
- `GET /api/products/<id>` - Get product details
- `GET /api/products/search?q=<query>` - Search products
- `POST /api/products` - Create product
- `PUT /api/products/<id>` - Update product
- `GET /api/products/stock-summary` - Get stock summary by category

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/search?q=<query>` - Search customers
- `POST /api/customers` - Create customer

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/<order_number>` - Get order details
- `PUT /api/orders/<order_number>/status` - Update order status

### Stock
- `GET /api/stock/history` - Stock history
- `POST /api/stock/adjust` - Adjust stock
- `GET /api/stock/low-stock` - Get low stock items

### Billing
- `POST /api/billing/orders/<order_number>/print` - Generate bill
- `POST /api/billing/coupons/validate` - Validate coupon

## Configuration

Edit `config.py` to customize:
- Shop name, address, phone, GSTIN
- Low stock threshold
- File upload settings
- Database configuration

## Usage

1. **Add Products:**
   - Use the product search to find products by name or barcode
   - Products can be added to cart from search results

2. **Select Customer:**
   - Enter customer details (name, phone, loyalty card)
   - Click "Select Customer" to search or create new customer

3. **Manage Cart:**
   - Add items to cart by searching products
   - Adjust quantities and discounts in the cart table
   - Select items to remove them

4. **Process Order:**
   - Select payment method (Cash, Card, UPI)
   - Click "Print Bill" to complete and print order
   - Use "Save Draft" or "Hold Order" for later processing

5. **Apply Coupons:**
   - Click "Apply Coupon" button
   - Enter coupon code
   - Discount will be applied to cart total

## Bill Printing

The application generates ESC/POS commands for 3-inch thermal printers. Bills are also saved as text files for backup.

## Development

To run in development mode:
```bash
python app.py
```

The application runs with debug mode enabled by default.

## License

This software is created for WearWell Clothing Shop.
