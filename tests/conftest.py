# Test configuration and fixtures for HealthEconomics360

import os
import tempfile
import pytest
from app import create_app, db
from app.models.users import User

@pytest.fixture
def app():
    """Create application for testing."""
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp()
    
    # Configuration for testing
    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
        
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def auth(client):
    """Authentication helper."""
    class AuthActions:
        def __init__(self, client):
            self._client = client

        def login(self, email='test@example.com', password='password'):
            return self._client.post('/auth/login', data={
                'email': email,
                'password': password
            })

        def logout(self):
            return self._client.get('/auth/logout')

        def register(self, email='test@example.com', password='password', 
                    first_name='Test', last_name='User'):
            return self._client.post('/auth/register', data={
                'email': email,
                'password': password,
                'confirm_password': password,
                'first_name': first_name,
                'last_name': last_name
            })

    return AuthActions(client)

@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        return user