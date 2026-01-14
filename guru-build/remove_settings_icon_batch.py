
import re

files = [
    'mobile/src/screens/EntryDetail.tsx',
    'mobile/src/screens/Entries.tsx'
]

# Pattern to find const SettingsIcon = ... );
# We use re.DOTALL to match across lines
pattern = r'const SettingsIcon = \(\) => \(\s*<Svg.*?\/Svg>\s*\);\s*'

for file_path in files:
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        new_content = re.sub(pattern, '', content, flags=re.DOTALL)

        if len(new_content) != len(content):
            print(f"SettingsIcon removed from {file_path}.")
            with open(file_path, 'w') as f:
                f.write(new_content)
        else:
            print(f"SettingsIcon not found in {file_path}.")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
