# Quick Start: Database Setup

Follow these steps to get your PostgreSQL database up and running.

## Step 1: Install PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Add to PATH (add to ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Reload shell
source ~/.zshrc

# Verify installation
psql --version
```

## Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 3: Run Automated Setup

```bash
# Option 1: Use the setup script (recommended)
python setup_db.py

# Option 2: Use make command
make setup-db
```

That's it! The script will:
- Create the `guru_db` database
- Generate Alembic migrations from your models
- Create all tables (users, tasks, time_blocks, resolutions, bingo_items, media_preferences, media_feedback)
- Verify everything was set up correctly

## Step 4: Verify Setup

```bash
# Connect to database
psql guru_db

# List tables
\dt

# View users table structure
\d users

# Exit
\q
```

## Configuration

The database connection is configured in [.env](.env):

```bash
DATABASE_URL=postgresql://localhost:5432/guru_db
```

If you need authentication:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/guru_db
```

## Common Commands

```bash
# Run the backend server
make run
# or
uvicorn app.main:app --reload

# Create a new migration after model changes
make migrate msg="description of changes"

# Reset database (WARNING: deletes all data)
make reset-db

# View help
make help
```

## Troubleshooting

### PostgreSQL not running
```bash
brew services start postgresql@16
```

### Permission issues
```bash
createuser -s $(whoami)
```

### Start fresh
```bash
make reset-db
```

## Next Steps

1. Set up Google OAuth credentials in `.env`
2. Configure other API keys (Spotify, OpenAI, Firebase)
3. Start the backend: `make run`
4. Test API at http://localhost:8000/docs

For detailed information, see [DATABASE_SETUP.md](DATABASE_SETUP.md)
