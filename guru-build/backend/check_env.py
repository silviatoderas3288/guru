import os
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv('GOOGLE_CLIENT_ID')
client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

expected_client_id = "956681324356-rpo28qn1f7h5jrplurncgtg0tm4a5bc0.apps.googleusercontent.com"
# We won't put the secret in the code to avoid leaking it in logs if possible, 
# but we can check if it exists and has length.

print(f"Checking environment variables...")
if client_id == expected_client_id:
    print("GOOGLE_CLIENT_ID: MATCH")
else:
    print(f"GOOGLE_CLIENT_ID: MISMATCH (Found: {client_id})")

if client_secret and len(client_secret) > 10:
    print("GOOGLE_CLIENT_SECRET: PRESENT")
else:
    print("GOOGLE_CLIENT_SECRET: MISSING or INVALID")
