# Contributing to HealthEconomics360

Thank you for your interest in contributing to HealthEconomics360! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (see CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Git
- Basic knowledge of Flask, SQLAlchemy, and web development

### Setting up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/HealthEconomics360.git
   cd HealthEconomics360
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r app/requirements.txt
   pip install -r requirements-dev.txt  # If available
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Set up the database**
   ```bash
   createdb healtheconomics360_dev
   createdb healtheconomics360_test
   ```

6. **Run tests to ensure everything works**
   ```bash
   pytest
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When creating a bug report, include:**

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (OS, Python version, etc.)
- Any error messages or logs

**Use this template:**

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10, macOS 12.0, Ubuntu 20.04]
- Python version: [e.g., 3.9.7]
- Browser: [e.g., Chrome 95.0.4638.69]
```

### Suggesting Features

Feature requests are welcome! Please provide:

- A clear, descriptive title
- Detailed description of the proposed feature
- Use cases and benefits
- Any implementation ideas (optional)

### Making Changes

#### For Small Changes
- Fix typos, improve documentation
- Small bug fixes
- Minor UI improvements

#### For Larger Changes
- New features
- Significant refactoring
- Breaking changes

**Always create an issue first to discuss larger changes.**

### Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Run all tests
   pytest
   
   # Run linting
   flake8 app/
   
   # Check code formatting
   black --check app/
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "descriptive commit message"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Provide detailed description of changes
   - Include screenshots for UI changes

### Pull Request Requirements

- [ ] Tests pass (`pytest`)
- [ ] Code follows style guidelines (`flake8`, `black`)
- [ ] Documentation updated (if applicable)
- [ ] No merge conflicts
- [ ] Descriptive commit messages
- [ ] PR template filled out

## Code Style Guidelines

### Python Code Style

- Follow PEP 8
- Use `black` for code formatting
- Use `flake8` for linting
- Maximum line length: 88 characters (black default)

### Naming Conventions

- **Variables**: `snake_case`
- **Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `snake_case.py`

### Documentation

- Use docstrings for all functions and classes
- Follow Google docstring format
- Update README.md for new features
- Comment complex logic

### Example Docstring

```python
def calculate_price_trend(drug_id: int, start_date: str, end_date: str) -> dict:
    """Calculate price trend for a specific drug over time.
    
    Args:
        drug_id: The ID of the drug to analyze
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        
    Returns:
        Dictionary containing trend data with dates and prices
        
    Raises:
        ValueError: If dates are invalid or drug_id not found
    """
    # Implementation here
```

## Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Use pytest framework
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Mock external dependencies

### Test Structure

```python
def test_calculate_price_trend_returns_correct_data():
    # Arrange
    drug_id = 1
    start_date = "2023-01-01"
    end_date = "2023-12-31"
    
    # Act
    result = calculate_price_trend(drug_id, start_date, end_date)
    
    # Assert
    assert isinstance(result, dict)
    assert "dates" in result
    assert "prices" in result
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_pricing.py

# Run with coverage
pytest --cov=app

# Run tests matching pattern
pytest -k "test_price"
```

## Database Migrations

When modifying database models:

1. Create migration
   ```bash
   cd app
   flask db migrate -m "Description of changes"
   ```

2. Review the generated migration file

3. Test the migration
   ```bash
   flask db upgrade
   ```

4. Include migration files in your PR

## Debugging

### Common Issues

1. **Import errors**: Check PYTHONPATH and virtual environment
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Missing dependencies**: Run `pip install -r app/requirements.txt`

### Debugging Tools

- Use Flask's debug mode: `FLASK_ENV=development`
- Add breakpoints with `pdb` or IDE debugger
- Check logs in console and application logs

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create tag and release

## Getting Help

- Create an issue for bugs or questions
- Join our community discussions
- Email: contributors@healtheconomics360.com

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to HealthEconomics360!