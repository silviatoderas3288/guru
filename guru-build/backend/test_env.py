"""Quick script to test if environment variables are loaded."""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

print("Testing environment variables:")
print(f"GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
print(f"GOOGLE_CLIENT_SECRET: {os.getenv('GOOGLE_CLIENT_SECRET')}")

if os.getenv('GOOGLE_CLIENT_ID') == 'your_google_client_id':
    print("\n❌ WARNING: You need to update GOOGLE_CLIENT_ID in .env file")
    print("Please follow BACKEND_OAUTH_SETUP.md to get Web Application credentials")
else:
    print("\n✅ GOOGLE_CLIENT_ID is configured")

if os.getenv('GOOGLE_CLIENT_SECRET') == 'your_google_client_secret':
    print("❌ WARNING: You need to update GOOGLE_CLIENT_SECRET in .env file")
    print("Please follow BACKEND_OAUTH_SETUP.md to get Web Application credentials")
else:
    print("✅ GOOGLE_CLIENT_SECRET is configured")
