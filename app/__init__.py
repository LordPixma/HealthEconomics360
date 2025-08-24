# app/__init__.py - Initializes the Flask application and its components

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
bcrypt = Bcrypt()

def create_app(config_name='default'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load the appropriate configuration
    from app.config import config
    app.config.from_object(config[config_name])
    
    # Initialize extensions with the app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    
    # Configure LoginManager
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'
    
    # Register blueprints
    from app.routes.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from app.routes.dashboard import dashboard as dashboard_blueprint
    app.register_blueprint(dashboard_blueprint)
    
    from app.routes.pricing import pricing as pricing_blueprint
    app.register_blueprint(pricing_blueprint)
    
    from app.routes.resources import resources as resources_blueprint
    app.register_blueprint(resources_blueprint)
    
    from app.routes.analytics import analytics as analytics_blueprint
    app.register_blueprint(analytics_blueprint)
    
    from app.routes.api import api as api_blueprint
    app.register_blueprint(api_blueprint)
    
    # Register error handlers
    from app.routes.errors import register_error_handlers
    register_error_handlers(app)
    
    return app