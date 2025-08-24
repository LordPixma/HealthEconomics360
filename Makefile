# Makefile for HealthEconomics360
.PHONY: help install install-dev test test-coverage lint format clean run docker-up docker-down

help:  ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install:  ## Install production dependencies
	pip install -r app/requirements.txt

install-dev:  ## Install development dependencies
	pip install -r app/requirements.txt
	pip install -r requirements-dev.txt

test:  ## Run tests
	pytest

test-coverage:  ## Run tests with coverage report
	pytest --cov=app --cov-report=html --cov-report=term

lint:  ## Run linting checks
	flake8 app/
	black --check app/
	isort --check app/

format:  ## Format code
	black app/
	isort app/

security:  ## Run security checks
	bandit -r app/
	safety check

clean:  ## Clean up cache and temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .coverage htmlcov/ .pytest_cache/

run:  ## Run the application in development mode
	cd app && python run.py

docker-up:  ## Start services with Docker Compose
	docker-compose up -d

docker-down:  ## Stop Docker Compose services
	docker-compose down

docker-logs:  ## View Docker Compose logs
	docker-compose logs -f

migrations:  ## Create database migrations
	cd app && flask db migrate

upgrade:  ## Apply database migrations
	cd app && flask db upgrade

setup-dev:  ## Set up development environment
	cp .env.example .env
	make install-dev
	@echo "Don't forget to edit .env with your database credentials!"

check:  ## Run all checks (lint, security, test)
	make lint
	make security  
	make test