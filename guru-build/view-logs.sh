#!/bin/bash

# View Guru app logs in real-time
echo "=== Guru Mobile App Logs ==="
echo "Press Ctrl+C to exit"
echo ""

cd /Users/toderassilvia/Desktop/guru-build/mobile

# Start expo if not running
if ! lsof -ti:8081 > /dev/null 2>&1; then
    echo "Starting Metro bundler..."
    npx expo start
else
    echo "Metro bundler already running on port 8081"
    echo "Showing logs..."
    echo ""
    # Just show logs from the background process
    tail -f /var/folders/c6/83pyhchj4dgf0v82gdybwtr00000gn/T/claude/-Users-toderassilvia-Desktop-guru-build/tasks/bc4aa42.output 2>&1 | grep -v "libapp_launch"
fi
