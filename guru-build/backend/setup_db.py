#!/usr/bin/env python3
"""Database setup script for the Guru app.

This script helps set up the PostgreSQL database:
1. Creates the database if it doesn't exist
2. Runs Alembic migrations to create all tables
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables
load_dotenv()

def create_database():
    """Create the PostgreSQL database if it doesn't exist."""
    # Parse DATABASE_URL to get connection params
    database_url = os.getenv("DATABASE_URL", "postgresql://localhost:5432/guru_db")

    # Extract database name from URL
    # Format: postgresql://[user[:password]@][host][:port]/database
    parts = database_url.split("/")
    db_name = parts[-1]

    # Connect to PostgreSQL (postgres database)
    base_url = "/".join(parts[:-1]) + "/postgres"

    print(f"Attempting to create database '{db_name}'...")

    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(base_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()

        if exists:
            print(f"Database '{db_name}' already exists.")
        else:
            # Create database
            cursor.execute(f'CREATE DATABASE {db_name}')
            print(f"Database '{db_name}' created successfully!")

        cursor.close()
        conn.close()
        return True

    except psycopg2.Error as e:
        print(f"Error creating database: {e}")
        print("\nMake sure PostgreSQL is installed and running.")
        print("On macOS, install with: brew install postgresql@16")
        print("Then start it with: brew services start postgresql@16")
        return False

def create_initial_migration():
    """Create initial migration if none exists."""
    # Check if migrations directory has any migration files
    versions_dir = "alembic/versions"
    migration_files = [f for f in os.listdir(versions_dir) if f.endswith('.py') and f != '.gitkeep']

    if not migration_files:
        print("\nNo migrations found. Creating initial migration...")
        exit_code = os.system('alembic revision --autogenerate -m "Initial schema"')

        if exit_code == 0:
            print("Initial migration created successfully!")
            return True
        else:
            print("Error creating initial migration.")
            return False
    else:
        print(f"\nFound {len(migration_files)} existing migration(s).")
        return True

def run_migrations():
    """Run Alembic migrations to create tables."""
    print("\nRunning Alembic migrations...")
    exit_code = os.system("alembic upgrade head")

    if exit_code == 0:
        print("Migrations completed successfully!")
        return True
    else:
        print("Error running migrations.")
        return False

def verify_tables():
    """Verify that all tables were created."""
    print("\nVerifying database schema...")

    database_url = os.getenv("DATABASE_URL", "postgresql://localhost:5432/guru_db")

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        # Get list of tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)

        tables = cursor.fetchall()

        if tables:
            print("\nTables created:")
            for table in tables:
                print(f"  ✓ {table[0]}")
        else:
            print("No tables found in database.")

        cursor.close()
        conn.close()
        return True

    except psycopg2.Error as e:
        print(f"Error verifying tables: {e}")
        return False

def main():
    """Main setup function."""
    print("=" * 60)
    print("PostgreSQL Database Setup for Guru App")
    print("=" * 60)

    # Step 1: Create database
    if not create_database():
        sys.exit(1)

    # Step 2: Create initial migration if needed
    if not create_initial_migration():
        sys.exit(1)

    # Step 3: Run migrations
    if not run_migrations():
        sys.exit(1)

    # Step 4: Verify tables
    if not verify_tables():
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Database setup completed successfully! 🎉")
    print("=" * 60)

if __name__ == "__main__":
    main()
