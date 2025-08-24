# Basic application tests

def test_app_creation(app):
    """Test that the application is created successfully."""
    assert app is not None
    assert app.config['TESTING'] is True

def test_app_context(app):
    """Test that application context works."""
    with app.app_context():
        assert app.config['TESTING'] is True

def test_database_connection(app):
    """Test that database connection works."""
    from app import db
    with app.app_context():
        # Test that we can create tables
        db.create_all()
        assert True  # If we get here, database connection works