import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

if __name__ == "__main__":
    try:
        install("openai")
        print("Successfully installed openai")
    except Exception as e:
        print(f"Failed to install openai: {e}")
