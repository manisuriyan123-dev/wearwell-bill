import os
from datetime import timedelta

class Config:
    """Configuration class for Flask application"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'wearwell-billing-secret-key-2024'
    # Use absolute path for database in instance folder
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'instance', 'wearwell.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Pagination defaults
    ITEMS_PER_PAGE = 50
    
    # Bill settings
    BILL_WIDTH_MM = 80  # 3-inch thermal printer width
    SHOP_NAME = "Wear Well"
    SHOP_ADDRESS = "Kammavarpalayam,kanchipuram-631502"
    SHOP_PHONE = "7010282192,8668184181"
    SHOP_GSTIN = ""
    
    # Stock settings
    LOW_STOCK_THRESHOLD = 10
    
    # File upload settings
    UPLOAD_FOLDER = 'static/images'
    MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
