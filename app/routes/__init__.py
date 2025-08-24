# app/routes/__init__.py - Registers error handlers and common route functionality

from flask import render_template, jsonify
from app import db
import datetime

def register_error_handlers(app):
    """Register error handlers for the application"""
    
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500

    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            # Basic database connectivity check
            db.session.execute('SELECT 1')
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'service': 'HealthEconomics360'
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy', 
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'error': str(e)
            }), 500