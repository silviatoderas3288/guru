import urllib.request
import urllib.error
import sys

try:
    with urllib.request.urlopen("http://localhost:8000/health", timeout=2) as response:
        print(f"Status: {response.getcode()}")
        print(response.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    sys.exit(1)
