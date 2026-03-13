from app import create_app

# create_app is defined in the project root (app.py)
# Vercel's python runtime will look for a WSGI-compatible
# callable named ``app`` in this file.

app = create_app()
