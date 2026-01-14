
import os

files_to_update = [
    'mobile/src/screens/EntryDetail.tsx',
    'mobile/src/screens/PageFive.tsx',
    'mobile/src/screens/Entries.tsx',
    'mobile/src/screens/WorkoutScreen.tsx.backup'
]

# The broken SVG path starts with this
broken_path_start = 'd="M8.54259 1.90589'

# We want to replace the SettingsIcon definition and its usage.
# Usage pattern:
# <TouchableOpacity style={styles.settingsButtonWrapper}>
#   <LinearGradient ...>
#     <SettingsIcon />
#   </LinearGradient>
# </TouchableOpacity>

# Replacement usage:
# <SettingsButton />

# Import to add:
# import { SettingsButton } from '../components/SettingsButton';

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        continue

    print(f"Processing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Check if we need to update
    if 'const SettingsIcon =' not in content:
        print(f"  No SettingsIcon found in {file_path}. Skipping refactor.")
        # But we might still need to fix the path if it's there?
        # If SettingsIcon is not there, maybe the path is inline?
        if broken_path_start in content:
             print("  Found broken path but no SettingsIcon component. Inspect manually.")
        continue

    # 2. Add import
    if "import { SettingsButton } from '../components/SettingsButton';" not in content:
        # Insert after the last import
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            lines.insert(last_import_idx + 1, "import { SettingsButton } from '../components/SettingsButton';")
            content = '\n'.join(lines)
            print("  Added import.")

    # 3. Remove SettingsIcon definition
    # We'll assume standard formatting: const SettingsIcon ... );
    start_marker = 'const SettingsIcon = () => ('
    end_marker = ');'
    
    start_idx = content.find(start_marker)
    if start_idx != -1:
        # Find the closing ); after the start
        end_idx = content.find(end_marker, start_idx)
        if end_idx != -1:
            # Check if the broken path is inside
            definition = content[start_idx:end_idx+2]
            if broken_path_start in definition or 'Svg' in definition:
                # Remove it
                content = content[:start_idx] + content[end_idx+2:]
                print("  Removed SettingsIcon definition.")

    # 4. Replace usage
    # We need to be careful with regex, but let's try string replacement for the block
    # The block usually looks like:
    # <TouchableOpacity style={styles.settingsButtonWrapper}>
    #   <LinearGradient
    #     colors={['#FF9D00', '#4D5AEE']}
    #     start={{ x: 0, y: 0 }}
    #     end={{ x: 0, y: 1 }}
    #     style={styles.settingsButton}
    #   >
    #     <SettingsIcon />
    #   </LinearGradient>
    # </TouchableOpacity>
    
    # We will look for <TouchableOpacity style={styles.settingsButtonWrapper}> ... </TouchableOpacity>
    # and check if it contains <SettingsIcon />
    
    # A simpler approach: iterate and find the block. 
    
    usage_start_marker = '<TouchableOpacity style={styles.settingsButtonWrapper}'
    usage_end_marker = '</TouchableOpacity>'
    
    while True:
        u_start = content.find(usage_start_marker)
        if u_start == -1:
            break
            
        u_end = content.find(usage_end_marker, u_start)
        if u_end == -1:
            break
            
        block = content[u_start:u_end + len(usage_end_marker)]
        
        if '<SettingsIcon />' in block:
            # Determine if we should preserve the onPress if it exists?
            # In EntryDetail, there was no onPress.
            # In others, there might be.
            
            new_block = '<SettingsButton />'
            if 'onPress={' in block:
                # Extract onPress
                # This is tricky with regex/parsing. 
                # Let's assume for now we want to attach the onPress if visible.
                import re
                match = re.search(r'onPress={([^}]+)}', block)
                if match:
                    on_press_val = match.group(1)
                    new_block = f'<SettingsButton onPress={{{on_press_val}}} />'
            
            content = content.replace(block, new_block)
            print("  Replaced usage.")
        else:
            # Move past this block to avoid infinite loop if we didn't replace it
            # (though finding the next one should work if we start searching after u_start + 1)
            # Actually find needs to continue. 
            # But since we modify content, indices shift. 
            # We should probably restart search or handle it carefully.
            # Simplest: if we didn't replace, we are done with this specific instance, 
            # but we need to ensure we don't find it again if we loop.
            # But wait, find searches from beginning by default. 
            # If we don't replace, we will find it again.
            
            # Let's use a specialized replacement loop
             pass
             break # Assuming only one settings button per page for now

    with open(file_path, 'w') as f:
        f.write(content)

print("Done.")
