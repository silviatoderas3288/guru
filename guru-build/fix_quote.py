
lines = []
with open('mobile/src/components/SettingsButton.tsx', 'r') as f:
    lines = f.readlines()

line_idx = 10
if line_idx < len(lines):
    line = lines[line_idx].rstrip('\n')
    if not line.strip().endswith('"'):
        print(f"Fixing line {line_idx+1}")
        lines[line_idx] = line + '"\n'
    else:
        print(f"Line {line_idx+1} already ends with quote")

with open('mobile/src/components/SettingsButton.tsx', 'w') as f:
    f.writelines(lines)

