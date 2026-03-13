# How to Start WearWell Billing Software

## Quick Start Guide

### Step 1: Install Python (if not already installed)
1. Check if Python is installed by opening Command Prompt or PowerShell
2. Type: `python --version`
3. If Python is not installed, download from https://www.python.org/downloads/
4. During installation, make sure to check "Add Python to PATH"

### Step 2: Install Required Packages
1. Open Command Prompt or PowerShell in the project folder
2. Navigate to the project folder:
   ```
   cd "C:\Users\acer\wearwell bill"
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Step 3: Run the Application
1. In the same folder, run:
   ```
   python app.py
   ```
2. You should see:
   ```
   ==================================================
   WearWell Billing Software
   ==================================================
   Server running on http://localhost:5000
   ==================================================
   ```

### Step 4: Open in Browser
1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: `http://localhost:5000`
3. The billing interface should appear!

## Troubleshooting

### If you get "python is not recognized":
- Make sure Python is installed and added to PATH
- Try using `py` instead of `python`:
  ```
  py app.py
  ```

### If you get "pip is not recognized":
- Try using `python -m pip`:
  ```
  python -m pip install -r requirements.txt
  ```

### If port 5000 is already in use:
- The app will show an error
- You can change the port in `app.py` (last line) from `port=5000` to another port like `port=5001`
- Then access at `http://localhost:5001`

### If you see import errors:
- Make sure all packages are installed:
  ```
  pip install Flask Flask-SQLAlchemy Flask-CORS Werkzeug python-dateutil Pillow
  ```

## First Time Setup

1. The database (`wearwell.db`) will be created automatically when you first run the app
2. You'll need to add products before you can create bills
3. To add products, you can use the API or create a simple script (see below)

## Adding Sample Products (Optional)

You can add products through the API or create a simple Python script. The easiest way is to use the web interface once it's running, or use a tool like Postman to call the API endpoints.

## Stopping the Server

- Press `Ctrl + C` in the terminal/command prompt to stop the server

## Next Steps

1. Once the app is running, you can:
   - Search for products (you'll need to add some first)
   - Add customers
   - Create orders and print bills

2. To add products, you can use the API endpoint:
   - POST to `http://localhost:5000/api/products`
   - Or create a simple script to add sample data
