# PostgreSQL Database Setup Guide

This guide will help you set up the PostgreSQL database for the Guru app.

## Prerequisites

Before setting up the database, you need to have PostgreSQL installed on your system.

### Installing PostgreSQL on macOS

Install PostgreSQL using Homebrew:

```bash
brew install postgresql@16
```

Start the PostgreSQL service:

```bash
brew services start postgresql@16
```

Add PostgreSQL to your PATH (add this to your `~/.zshrc` or `~/.bash_profile`):

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

Then reload your shell configuration:

```bash
source ~/.zshrc  # or source ~/.bash_profile
```

Verify PostgreSQL is running:

```bash
psql --version
```

## Database Setup Process

The database schema includes the following tables:
- **users** - User accounts with OAuth tokens and preferences
- **tasks** - To-do items with scheduling information
- **time_blocks** - Protected time slots (sleep, unwind, workout, journal)
- **resolutions** - New Year's resolutions with progress tracking
- **bingo_items** - Gamified goal tracking in bingo format
- **media_preferences** - User preferences for podcast/audiobook recommendations
- **media_feedback** - User feedback on media recommendations

### Option 1: Automated Setup (Recommended)

We've created a setup script that automates the entire process:

```bash
cd backend
python setup_db.py
```

This script will:
1. Create the `guru_db` database
2. Generate and run Alembic migrations
3. Verify all tables were created successfully

### Option 2: Manual Setup

If you prefer to set up manually, follow these steps:

#### Step 1: Create the Database

```bash
# Connect to PostgreSQL
psql postgres

# Create the database
CREATE DATABASE guru_db;

# Exit psql
\q
```

#### Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Step 3: Configure Environment Variables

The `.env` file has already been created. Update it with your database credentials if needed:

```bash
# Default configuration (works with local PostgreSQL)
DATABASE_URL=postgresql://localhost:5432/guru_db
```

If you set up PostgreSQL with a username and password:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/guru_db
```

#### Step 4: Generate Initial Migration

```bash
cd backend
alembic revision --autogenerate -m "Initial schema"
```

#### Step 5: Run Migrations

```bash
alembic upgrade head
```

#### Step 6: Verify Tables

Connect to the database and verify tables were created:

```bash
psql guru_db

# List all tables
\dt

# View table structure
\d users
\d tasks
\d time_blocks
\d resolutions
\d bingo_items
\d media_preferences
\d media_feedback

# Exit
\q
```

## Database Schema Details

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    google_tokens JSONB,
    preferences_json JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    status VARCHAR,  -- pending, scheduled, completed, rolled_over
    due_date DATE,
    calendar_event_id VARCHAR,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Time Blocks Table
```sql
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR,  -- sleep, unwind, workout, journal
    start_time TIME,
    end_time TIME,
    is_protected BOOLEAN DEFAULT TRUE,
    recurrence_rule VARCHAR,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Resolutions Table
```sql
CREATE TABLE resolutions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR NOT NULL,
    category VARCHAR,
    target_value INTEGER,
    current_value INTEGER DEFAULT 0,
    year INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Bingo Items Table
```sql
CREATE TABLE bingo_items (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    bingo_board_id UUID,
    title VARCHAR NOT NULL,
    position INTEGER CHECK (position BETWEEN 0 AND 24),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Media Preferences Table
```sql
CREATE TABLE media_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    podcast_genres TEXT[],
    book_genres TEXT[],
    topics TEXT[],
    preferred_duration VARCHAR,  -- short, medium, long
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Media Feedback Table
```sql
CREATE TABLE media_feedback (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    media_id VARCHAR,
    media_type VARCHAR,  -- podcast, audiobook
    liked BOOLEAN,
    listen_completion_rate FLOAT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## Troubleshooting

### PostgreSQL not found
If you get "psql: command not found", make sure PostgreSQL is installed and in your PATH.

### Connection refused
If you get a connection error, make sure PostgreSQL is running:
```bash
brew services list
brew services start postgresql@16
```

### Permission denied
If you get permission errors, you may need to create a PostgreSQL user:
```bash
createuser -s your_username
```

### Database already exists
If the database already exists and you want to start fresh:
```bash
dropdb guru_db
createdb guru_db
```

## Next Steps

After setting up the database:

1. Configure your Google OAuth credentials in `.env`
2. Set up other API keys (Spotify, OpenAI, Firebase)
3. Run the FastAPI backend: `uvicorn app.main:app --reload`
4. Test the API endpoints

## Useful Commands

```bash
# View database connection info
psql guru_db -c "\conninfo"

# List all tables
psql guru_db -c "\dt"

# View specific table
psql guru_db -c "\d users"

# Count records in a table
psql guru_db -c "SELECT COUNT(*) FROM users;"

# Drop and recreate database (WARNING: deletes all data)
dropdb guru_db && createdb guru_db && alembic upgrade head
```
