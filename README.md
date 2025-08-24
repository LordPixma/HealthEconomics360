# HealthEconomics360

A comprehensive healthcare economics analysis platform built with Flask that provides insights into drug pricing, resource allocation, waste analysis, and healthcare outcomes.

## Features

- **Drug Pricing Analysis**: Track and analyze pharmaceutical costs across different regions and time periods
- **Resource Allocation Management**: Monitor and optimize distribution of healthcare resources
- **Waste Analysis**: Identify cost-saving opportunities and inefficiencies
- **Analytics Dashboard**: Real-time visualizations and insights
- **User Management**: Secure authentication and role-based access
- **RESTful API**: Programmatic access to data and analytics

## Tech Stack

- **Backend**: Python 3.12+, Flask, SQLAlchemy
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Visualization**: Plotly, Chart.js
- **Authentication**: Flask-Login, Flask-Bcrypt
- **Testing**: pytest
- **Deployment**: Gunicorn

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LordPixma/HealthEconomics360.git
   cd HealthEconomics360
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r app/requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb healtheconomics360_dev
   
   # Run migrations (if any)
   cd app
   flask db upgrade
   ```

6. **Run the application**
   ```bash
   cd app
   python run.py
   ```

   The application will be available at `http://localhost:5000`

## Development Setup

### Database Setup

1. **Install PostgreSQL** (if not already installed)
   
2. **Create databases**
   ```bash
   createdb healtheconomics360_dev
   createdb healtheconomics360_test
   ```

3. **Update .env file** with your database credentials

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_pricing.py
```

### Code Style

This project follows PEP 8 standards. Run the linter before committing:

```bash
# Install development dependencies
pip install flake8 black

# Check code style
flake8 app/

# Auto-format code
black app/
```

## Project Structure

```
HealthEconomics360/
├── app/                    # Main application package
│   ├── models/            # Database models
│   ├── routes/            # API routes and views
│   ├── static/            # CSS, JavaScript, images
│   ├── templates/         # HTML templates
│   ├── utils/             # Utility functions
│   ├── __init__.py        # App factory
│   ├── config.py          # Configuration settings
│   ├── requirements.txt   # Python dependencies
│   └── run.py             # Application entry point
├── tests/                 # Test suite
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `FLASK_ENV`: Set to `development` for development
- `SECRET_KEY`: Flask secret key for sessions
- `DATABASE_URL`: PostgreSQL connection string
- `MAIL_*`: Email configuration for notifications

### Database Configuration

The application supports multiple environments:

- **Development**: Uses `DEV_DATABASE_URL`
- **Testing**: Uses `TEST_DATABASE_URL` 
- **Production**: Uses `DATABASE_URL`

## API Documentation

The application provides a RESTful API for programmatic access:

### Authentication
```bash
POST /auth/login
POST /auth/logout
POST /auth/register
```

### Pricing Data
```bash
GET /api/pricing/drugs
GET /api/pricing/prices
POST /api/pricing/drugs
POST /api/pricing/prices
```

### Resources
```bash
GET /api/resources/organizations
GET /api/resources/departments
POST /api/resources/allocations
```

### Analytics
```bash
GET /api/analytics/waste-analysis
GET /api/analytics/recommendations
```

## Deployment

### Production Deployment

1. **Set environment variables**
   ```bash
   export FLASK_ENV=production
   export FLASK_CONFIG=production
   export SECRET_KEY=your-production-secret-key
   export DATABASE_URL=your-production-database-url
   ```

2. **Install dependencies**
   ```bash
   pip install -r app/requirements.txt
   ```

3. **Run with Gunicorn**
   ```bash
   cd app
   gunicorn -w 4 -b 0.0.0.0:8000 run:app
   ```

### Docker Deployment

```dockerfile
# Example Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY app/requirements.txt .
RUN pip install -r requirements.txt

COPY app/ .
EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "run:app"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pytest`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@healtheconomics360.com or create an issue in this repository.

## Changelog

### v1.0.0 (Current)
- Initial release
- Drug pricing analysis
- Resource allocation management
- Basic analytics dashboard
- User authentication system