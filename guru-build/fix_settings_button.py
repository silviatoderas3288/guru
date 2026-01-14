import os

file_path = 'mobile/src/components/SettingsButton.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'd="M8.54259 1.90589' in line and not line.strip().endswith('"'):
        print(f"Found broken line at {i+1}")
        lines[i] = line.rstrip() + '"\n'
        print("Fixed.")

with open(file_path, 'w') as f:
    f.writelines(lines)
