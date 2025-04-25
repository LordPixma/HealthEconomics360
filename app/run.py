# run.py - Entry point for running the HealthEconomics360 application

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app import create_app

# Create the app with the specified configuration
app = create_app(os.getenv('FLASK_CONFIG', 'default'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))