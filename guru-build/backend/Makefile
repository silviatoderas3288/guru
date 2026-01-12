.PHONY: help install setup-db migrate reset-db run test clean

help:
	@echo "Available commands:"
	@echo "  make install     - Install Python dependencies"
	@echo "  make setup-db    - Set up the database (automated)"
	@echo "  make migrate     - Generate and run new migration"
	@echo "  make reset-db    - Drop and recreate database (WARNING: deletes all data)"
	@echo "  make run         - Run the FastAPI development server"
	@echo "  make test        - Run tests"
	@echo "  make clean       - Remove Python cache files"

install:
	pip install -r requirements.txt

setup-db:
	python setup_db.py

migrate:
	alembic revision --autogenerate -m "$(msg)"
	alembic upgrade head

reset-db:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	dropdb guru_db || true
	createdb guru_db
	alembic upgrade head

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
