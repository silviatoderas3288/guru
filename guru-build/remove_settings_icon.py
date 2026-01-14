
import re

file_path = 'mobile/src/screens/PageFive.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Pattern to find const SettingsIcon = ... );
# We use re.DOTALL to match across lines
pattern = r'const SettingsIcon = \(\) => \(\s*<Svg.*?\/Svg>\s*\);\s*'

new_content = re.sub(pattern, '', content, flags=re.DOTALL)

if len(new_content) != len(content):
    print("SettingsIcon removed.")
    with open(file_path, 'w') as f:
        f.write(new_content)
else:
    print("SettingsIcon not found.")
