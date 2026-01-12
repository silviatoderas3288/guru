# Navigation Testing Checklist

Use this checklist to verify that the navigation is working correctly.

## Pre-Testing Setup

- [ ] Expo dev server is running (`npm start` in mobile directory)
- [ ] App is open on device/simulator
- [ ] You've logged in with Google OAuth

## Tab Navigation Tests

### Calendar Tab
- [ ] Calendar icon appears at bottom (📅)
- [ ] Tap calendar icon - screen switches to Calendar
- [ ] Header shows "My Schedule" in blue
- [ ] Calendar icon is filled (not outline) when active
- [ ] Calendar tab label is blue when active
- [ ] Screen shows "Smart Calendar & Tasks" title
- [ ] Features list is visible

### Media Tab
- [ ] Headset icon appears at bottom (🎧)
- [ ] Tap headset icon - screen switches to Media
- [ ] Header shows "Recommendations" in blue
- [ ] Headset icon is filled when active
- [ ] Media tab label is blue when active
- [ ] Screen shows "Media Recommendations" title
- [ ] Features list is visible

### Resolutions Tab
- [ ] Trophy icon appears at bottom (🏆)
- [ ] Tap trophy icon - screen switches to Resolutions
- [ ] Header shows "My Resolutions" in blue
- [ ] Trophy icon is filled when active
- [ ] Goals tab label is blue when active
- [ ] Screen shows "Resolutions & Bingo" title
- [ ] Features list is visible

### Settings Tab
- [ ] Settings icon appears at bottom (⚙️)
- [ ] Tap settings icon - screen switches to Settings
- [ ] Header shows "Settings" in blue
- [ ] Settings icon is filled when active
- [ ] Settings tab label is blue when active
- [ ] Screen shows settings sections
- [ ] "Sign Out" button is visible at bottom

## Visual Design Tests

### Tab Bar
- [ ] Tab bar is visible at bottom of screen
- [ ] Tab bar has 4 tabs: Calendar, Media, Goals, Settings
- [ ] Active tab icon is filled
- [ ] Inactive tab icons are outline style
- [ ] Active tab color is blue (#4285F4)
- [ ] Inactive tab color is gray (#8E8E93)
- [ ] Tab labels are visible under icons

### Headers
- [ ] Header background is blue (#4285F4)
- [ ] Header text is white
- [ ] Header text is bold
- [ ] No back button shown (tabs are root)
- [ ] Header title changes for each tab

### Navigation Behavior
- [ ] Tapping tabs switches screens smoothly (no lag)
- [ ] Previous tab content is preserved when switching back
- [ ] Scrolling state is maintained when switching tabs
- [ ] No flickering or layout shifts during navigation
- [ ] Safe area insets are respected (notch/home indicator)

## Interaction Tests

### Tab Switching
- [ ] Can switch from Calendar to Media
- [ ] Can switch from Media to Resolutions
- [ ] Can switch from Resolutions to Settings
- [ ] Can switch from Settings back to Calendar
- [ ] Can randomly switch between any tabs

### Screen Content
- [ ] All screens are scrollable (try scrolling on each)
- [ ] Content doesn't overlap with headers
- [ ] Content doesn't overlap with tab bar
- [ ] Safe areas are respected on all screens

### Settings Screen Specific
- [ ] All setting sections are visible
- [ ] "Sign Out" button is red
- [ ] Tapping "Sign Out" shows confirmation alert
- [ ] Alert has "Cancel" and "Sign Out" options
- [ ] Tapping "Cancel" dismisses alert
- [ ] Settings sections show "Coming Soon" text

## Cross-Platform Tests (if applicable)

### iOS
- [ ] Tab bar respects home indicator area
- [ ] Headers respect status bar/notch
- [ ] Navigation feels native (iOS style)

### Android
- [ ] Tab bar respects navigation buttons
- [ ] Headers respect status bar
- [ ] Material Design ripple effects on tabs

## Performance Tests

- [ ] App starts in less than 3 seconds
- [ ] Tab switches are instant (< 100ms)
- [ ] No memory warnings in console
- [ ] No yellow/red warnings in Expo
- [ ] Smooth 60fps animation when switching tabs

## Edge Cases

- [ ] Rotating device doesn't break navigation
- [ ] Tab bar adjusts to landscape mode
- [ ] Headers adjust to landscape mode
- [ ] Switching tabs rapidly doesn't cause errors
- [ ] App recovers gracefully from background/foreground

## Expected Console Output

When navigating, you should see clean logs like:
```
=== AppNavigator: Rendering, user: your@email.com ===
=== AppNavigator: About to render NavigationContainer ===
=== AppNavigator: Will show Main screen ===
=== CalendarScreen: Rendering ===
```

No errors or warnings should appear.

## If Something Doesn't Work

### Tab icons not showing
1. Check `@expo/vector-icons` is installed
2. Restart Expo dev server
3. Clear cache: `npm start -- --clear`

### Navigation crashes
1. Check all imports are correct
2. Verify all screens export correctly
3. Check console for error stack trace

### Styling looks wrong
1. Verify `react-native-safe-area-context` is installed
2. Check SafeAreaView wraps screen content
3. Restart app to reload styles

## Success Criteria

✅ All 4 tabs are accessible and functional
✅ Icons change based on active state
✅ Headers display correctly for each screen
✅ Tab navigation is smooth and fast
✅ Visual design matches mockup (blue theme)
✅ No console errors or warnings
✅ App feels responsive and native

## Next Steps After Testing

Once all tests pass:
1. Start implementing Calendar screen features
2. Add Google Calendar API integration
3. Build task management UI
4. Implement media recommendations
5. Create bingo board interface
6. Build out settings functionality

---

**Date Tested:** _____________

**Tested By:** _____________

**Platform:** iOS / Android / Web

**Result:** Pass / Fail

**Notes:**
