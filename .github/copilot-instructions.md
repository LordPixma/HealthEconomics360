# HealthEconomics360

HealthEconomics360 is a Flask-based web application for healthcare economics analysis, featuring price optimization, resource allocation, outcome tracking, and analytics. The application uses PostgreSQL for data storage and includes sophisticated data science capabilities with pandas, scikit-learn, and plotly for visualization.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the information here.

## Working Effectively

### Initial Setup and Dependencies
Bootstrap, build, and test the repository:
- Install Python dependencies: `pip install -r app/requirements.txt` -- takes 35 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- Start PostgreSQL service: `sudo service postgresql start`
- Create/verify database: `sudo -u postgres createdb healtheconomics360_dev` (may already exist)
- Set PostgreSQL password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"`

### Database Setup
Initialize and migrate the database:
- Initialize migrations: `FLASK_APP=app/run.py flask db init` (if migrations directory doesn't exist)
- Create migration: `FLASK_APP=app/run.py flask db migrate -m "Migration message"` -- takes 1-2 seconds
- Apply migrations: `FLASK_APP=app/run.py flask db upgrade` -- takes 1-2 seconds

### Running the Application
Run the Flask development server:
- Start application: `cd [repo-root] && PYTHONPATH=. python3 app/run.py`
- Application runs on http://127.0.0.1:5000
- Debug mode is enabled by default
- Application startup is immediate

### Testing and Validation
- No automated test suite exists: `pytest` returns "no tests ran"
- Linting tools (flake8, pylint) are not installed by default
- Manual testing required for validation

## Critical Issues and Workarounds

### Password Hash Length Issue
**CRITICAL**: User registration fails due to password hash field length limitation:
- Database field `users.password_hash` is limited to 128 characters
- Default scrypt hashing produces hashes longer than 128 characters
- **Workaround**: Use pbkdf2 method instead: `generate_password_hash('password', method='pbkdf2')`
- Example working hash length: 77 characters (pbkdf2)

### Template Issues (FIXED)
- Fixed duplicate content block error in `app/templates/base.html`
- Auth templates use `{% block auth_content %}` instead of `{% block content %}`
- Dashboard templates use `{% block content %}`

### Missing Error Handler (FIXED)
- Created `app/routes/errors.py` with error handler registration function
- Updated `app/__init__.py` to properly import and register error handlers

## Validation Scenarios

### Basic Application Health
After making changes, always validate:
1. Application starts without errors: `PYTHONPATH=. python3 app/run.py`
2. Login page renders: `curl -I http://127.0.0.1:5000/auth/login` (should return 200)
3. Root redirects to login: `curl -I http://127.0.0.1:5000/` (should return 302 to /auth/login)

### User Authentication Workflow
Test complete user creation and login:
1. Create test user via Flask shell:
   ```python
   from app import db
   from app.models.users import User, Role
   from werkzeug.security import generate_password_hash
   
   user_role = Role.query.filter_by(name='user').first()
   test_user = User(
       email='test@example.com',
       username='testuser', 
       password_hash=generate_password_hash('password123', method='pbkdf2'),
       first_name='Test',
       last_name='User',
       role_id=user_role.id,
       is_active=True
   )
   db.session.add(test_user)
   db.session.commit()
   ```
2. Test login endpoint: `curl -X POST http://127.0.0.1:5000/auth/login -d "email=test@example.com&password=password123"`
3. Verify API endpoints require authentication: `curl -I http://127.0.0.1:5000/api/recommendations` (should return 302 redirect)

## Project Structure and Key Files

### Core Application Structure
```
/home/runner/work/HealthEconomics360/HealthEconomics360/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── config.py             # Environment configurations
│   ├── run.py                # Application entry point
│   ├── models/               # Database models
│   │   ├── users.py         # User authentication model
│   │   ├── pricing.py       # Drug pricing models
│   │   ├── resources.py     # Resource allocation models
│   │   ├── outcomes.py      # Health outcome models
│   │   └── recommendations.py # Optimization recommendations
│   ├── routes/               # Flask blueprints
│   │   ├── auth.py          # Authentication routes
│   │   ├── dashboard.py     # Main dashboard
│   │   ├── pricing.py       # Pricing analysis
│   │   ├── analytics.py     # Analytics and reporting
│   │   ├── resources.py     # Resource management
│   │   ├── api.py           # API endpoints
│   │   └── errors.py        # Error handlers
│   ├── templates/            # Jinja2 HTML templates
│   ├── static/              # CSS, JavaScript, images
│   ├── utils/               # Helper modules
│   └── requirements.txt     # Python dependencies
├── migrations/              # Database migration files
└── README.md               # Project documentation
```

### Configuration Files
- `app/.env` - Environment variables (development settings)
- `app/config.py` - Flask configuration classes
- `.gitignore` - Git ignore patterns (includes Python cache files)

## Common Development Tasks

### Adding New Models
1. Create model class in appropriate file under `app/models/`
2. Import model in `app/__init__.py` if needed for migrations
3. Generate migration: `FLASK_APP=app/run.py flask db migrate -m "Add new model"`
4. Apply migration: `FLASK_APP=app/run.py flask db upgrade`

### Adding New Routes
1. Create route function in appropriate blueprint under `app/routes/`
2. Register blueprint in `app/__init__.py` if new blueprint
3. Create corresponding template in `app/templates/`
4. Test route accessibility

### Frontend Development
- Templates use Bootstrap 5.1.3 and Font Awesome 6.0
- Custom CSS in `app/static/css/main.css`
- JavaScript modules in `app/static/js/`
- Chart.js 3.7.0 available for data visualization

## API Structure
The application provides RESTful API endpoints:
- `/api/recommendations` - Optimization recommendations (requires authentication)
- `/api/dashboard-summary` - Dashboard statistics
- All API endpoints require user authentication

## Database Schema
Key database tables:
- `users` - User authentication and profiles
- `roles` - User permission roles
- `organizations` - Healthcare organizations
- `drugs` - Drug catalog and information
- `drug_prices` - Pricing data across regions
- `resources` - Resource allocation tracking
- `outcomes` - Health outcome measurements
- `recommendations` - System-generated optimization recommendations

## Known Working Commands Reference

### Repository Root Directory Listing
```
.git/
README.md
app/
.gitignore
migrations/
```

### Key Configuration Values
- Default Flask config: 'development'
- Database URL: postgresql://postgres:password@localhost/healtheconomics360_dev
- Default port: 5000
- Secret key: configurable via environment

### Essential Dependencies
```
Flask==3.1.2
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.1.0
Flask-Login==0.6.3
psycopg2-binary==2.9.10
pandas==2.3.2
scikit-learn==1.7.1
plotly==6.3.0
```

## Troubleshooting Common Issues

### "ModuleNotFoundError: No module named 'app'"
- Run from repository root with: `PYTHONPATH=. python3 app/run.py`

### "Database does not exist" 
- Create database: `sudo -u postgres createdb healtheconomics360_dev`
- Check PostgreSQL service: `sudo service postgresql start`

### Template rendering errors
- Verify template block names (auth templates use `auth_content`, others use `content`)
- Check template inheritance structure

### Long password hash errors
- Use pbkdf2 method instead of default scrypt for user password hashing
- Ensure password hash field in database can accommodate hash length

## Performance Expectations
- Dependency installation: ~35 seconds
- Database operations: 1-2 seconds each
- Application startup: immediate
- Template rendering: immediate
- Large dataset processing may take longer depending on data volume