# 🐛 Known Issues - Leaderboard System

## 📱 Mobile Leaderboard Display Issues

### Status: Partially Resolved

**Last Updated:** January 17, 2025

---

## ✅ FIXED: ChessInFive Mobile Cross-Game Viewing

### Problem (RESOLVED)
- **Issue:** Empty columns when viewing ChessInFive leaderboard from other games on mobile portrait mode
- **Status:** ✅ **FIXED**
- **Solution:** Moved custom renderer to global `leaderboard-ui.js` file
- **Commit:** `66532f4` - "fix: Move custom renderers to global file"

### Working Now:
- ✅ ChessInFive from ChessInFive (mobile & desktop)
- ✅ ChessInFive from Knight Quest (mobile & desktop)
- ✅ ChessInFive from Memory Matrix (mobile & desktop)
- ✅ ChessInFive from Master Sequence (mobile & desktop)
- ✅ ChessInFive from Square Rush (mobile & desktop)

### Technical Details:
```javascript
// Custom renderer now in: js/leaderboard-ui.js (line 1217-1332)
function renderChessInFiveLeaderboardTable(scores) {
  // Always available, loaded with global leaderboard system
  // Shows: RANK | PLAYER | SCORE | MOVES | TIME | PHASE | TYPE
}
```

---

## ⚠️ PENDING: Square Rush Mobile Portrait Mode

### Problem (ONGOING)
- **Issue:** Empty columns when viewing Square Rush leaderboard on mobile in portrait (vertical) mode
- **Status:** ❌ **NOT FULLY RESOLVED**
- **Affected:** Mobile portrait mode only
- **Works:** Desktop, mobile landscape mode

### Current Behavior:

**Mobile Portrait (Vertical):**
```
RANK | PLAYER | SCORE | LEVEL | TARGETS | COMBO
🥇#1 | CLA 🇦🇷  | 12,345|   ?   |    ?    |   ?
                         ↑ Empty columns (can scroll horizontally to see headers)
```

**Desktop / Mobile Landscape:**
```
RANK | PLAYER 🇦🇷 | SCORE  | LEVEL | TARGETS | COMBO
🥇#1 | CLA        | 12,345 | 5     | 48      | x3
                                    ✅ All data visible
```

### What Works:
- ✅ Flags display inline with player name
- ✅ No separate "Country" column (fixed in `cbfac29`)
- ✅ Headers visible (can scroll horizontally)
- ✅ Desktop mode - fully functional
- ✅ Mobile landscape - fully functional
- ✅ Score column always populated

### What Doesn't Work:
- ❌ Mobile portrait: LEVEL, TARGETS, COMBO columns empty
- ❌ Data not displaying despite being in database

### Attempted Fixes:

#### Fix 1: Remove Country Column (`cbfac29`)
**Result:** Partial success - flags now inline, but columns still empty in mobile portrait

#### Fix 2: Move Custom Renderer to Global (`66532f4`)
**Result:** ChessInFive fixed, Square Rush still affected

#### Fix 3: Improve Generic Renderer Metadata Fallback
**Code:**
```javascript
// js/leaderboard-ui.js (line 285-296)
let levelDisplay = '-';
if (score.level !== undefined && score.level !== null) {
  levelDisplay = score.level;
} else if (score.metadata) {
  levelDisplay = score.metadata.level_reached  // Square Rush
                || score.metadata.moves         // ChessInFive
                || score.metadata.phase         // ChessInFive fallback
                || '-';
}
```
**Result:** Should work but Square Rush columns still empty in mobile portrait

---

## 🔍 Diagnostic Information

### Custom Renderer Location:
```javascript
// File: js/leaderboard-ui.js (lines 1122-1208)
function renderSquareRushLeaderboardTable(scores) {
  console.log('🎯 [CUSTOM] Rendering Square Rush leaderboard with', scores.length, 'scores');

  // Reads from:
  const metadata = entry.metadata || {};
  const levelReached = metadata.level_reached || '-';
  const maxCombo = metadata.max_combo ? `x${metadata.max_combo}` : '-';
  const targetsFound = metadata.targets_found || '-';
}

// Exposed to window (line 1335)
window.renderSquareRushLeaderboardTable = renderSquareRushLeaderboardTable;
```

### Expected Console Logs:
```
✅ [CUSTOM RENDERERS] Square Rush and ChessInFive renderers loaded globally
🎯 [CUSTOM] Rendering Square Rush leaderboard with X scores
```

### Database Schema (for reference):
```json
{
  "game": "square-rush",
  "player_name": "CLAUDIO",
  "score": 12345,
  "metadata": {
    "level_reached": 5,
    "max_combo": 3,
    "targets_found": 48
  }
}
```

---

## 🧪 Debugging Steps for Future Investigation

### Step 1: Check Browser Console (Mobile)
Open Chrome DevTools on mobile:
1. Connect phone to PC via USB
2. Chrome Desktop → `chrome://inspect`
3. Inspect phone's browser
4. Open Square Rush leaderboard
5. Check console for:
   - ✅ `[CUSTOM RENDERERS] loaded globally`
   - ✅ `Rendering Square Rush leaderboard with X scores`
   - ❌ Any JavaScript errors

### Step 2: Verify Data in Console
```javascript
// In mobile console, after opening leaderboard:
console.log(window.renderSquareRushLeaderboardTable);
// Should show: function renderSquareRushLeaderboardTable(scores) {...}

// Check if it's being called:
// Look for log: "🎯 [CUSTOM] Rendering Square Rush leaderboard"
```

### Step 3: Check Network Response
1. Open Network tab (mobile DevTools)
2. Filter: `scores?game=square-rush`
3. Check response:
   - Status: 200 OK?
   - Body contains metadata?
   - `metadata.level_reached` present?

### Step 4: Test Renderer Directly
```javascript
// In mobile console:
fetch('/api/scores?game=square-rush&limit=10')
  .then(r => r.json())
  .then(data => {
    console.log('Data:', data.scores[0]);
    const table = window.renderSquareRushLeaderboardTable(data.scores);
    console.log('Table:', table);
  });
```

---

## 💡 Possible Root Causes

### Theory 1: Mobile Browser Cache
**Likelihood:** High ⭐⭐⭐
**Evidence:**
- ChessInFive fixed immediately after deploy
- Square Rush might have older cached version
- Mobile browsers cache aggressively

**How to Test:**
- Hard refresh won't work (mobile limitation)
- Clear all browser data for domain
- Use incognito/private mode
- Wait 24 hours for cache expiry

**Fix:**
```bash
# On mobile browser:
Settings → Privacy → Clear Browsing Data → Cached Images and Files
```

### Theory 2: CSS Overflow/Display Issue
**Likelihood:** Medium ⭐⭐
**Evidence:**
- Headers visible (can scroll)
- Cells might have `display: none` or `visibility: hidden` in mobile CSS
- Content might be there but not visible

**How to Test:**
```javascript
// In mobile console:
document.querySelectorAll('.leaderboard-table td').forEach(td => {
  console.log('Cell:', td.textContent, 'Display:', getComputedStyle(td).display);
});
```

**Potential CSS Culprits:**
```css
/* Check in css/leaderboard.css for mobile-specific rules */
@media (max-width: 768px) {
  .leaderboard-table td.level {
    display: none; /* ← Could be hiding columns */
  }
}
```

### Theory 3: JavaScript Error Breaking Render
**Likelihood:** Low ⭐
**Evidence:**
- Score column works (partial render)
- Would expect complete failure if JS error

**How to Test:**
- Check console for red error messages
- Look for "Uncaught TypeError" or similar

### Theory 4: Data Not in Metadata
**Likelihood:** Very Low
**Evidence:**
- Same data works on desktop
- Works in landscape mode
- Database schema confirmed correct

### Theory 5: Screen Width Triggering Different Code Path
**Likelihood:** Medium ⭐⭐
**Evidence:**
- Only affects portrait mode
- Landscape works fine
- Might be media query or viewport check

**How to Test:**
```javascript
// Check if there's screen size detection:
console.log('Width:', window.innerWidth);
console.log('Height:', window.innerHeight);
console.log('Portrait:', window.innerHeight > window.innerWidth);
```

---

## 📋 Workaround for Users (Until Fixed)

**For now, users can:**
1. ✅ Rotate phone to landscape mode → Works perfectly
2. ✅ Use desktop/tablet → Works perfectly
3. ✅ Scroll horizontally in portrait to see headers
4. ✅ View ChessInFive leaderboard → Fully functional in all modes

---

## 🔧 Next Steps for Future Debugging

1. **Immediate:**
   - [ ] Check mobile browser console for errors
   - [ ] Verify custom renderer is loaded (`window.renderSquareRushLeaderboardTable`)
   - [ ] Check Network tab for API response data

2. **Short-term:**
   - [ ] Test in mobile incognito mode (bypass cache)
   - [ ] Inspect actual rendered table cells in mobile DevTools
   - [ ] Check for mobile-specific CSS hiding columns

3. **Long-term:**
   - [ ] Add more extensive mobile logging
   - [ ] Create mobile-specific test page
   - [ ] Consider mobile-optimized leaderboard layout (fewer columns)

---

## 📊 Impact Assessment

### Severity: Low-Medium
- **Affected Users:** Mobile users in portrait mode viewing Square Rush only
- **Workaround Available:** Yes (rotate to landscape)
- **Data Loss:** No (data intact, just display issue)
- **Other Games:** Working correctly

### Priority: Medium
- Not a critical bug (workaround exists)
- Affects user experience on mobile
- Desktop and landscape unaffected
- ChessInFive fully functional

---

## 📚 Related Files

### Modified Files (Recent Fixes):
```
js/leaderboard-ui.js
  - Line 285-296: Generic renderer metadata fallback
  - Line 301-315: Time metadata fallback
  - Line 1122-1208: renderSquareRushLeaderboardTable (moved from game file)
  - Line 1217-1332: renderChessInFiveLeaderboardTable (moved from game file)
  - Line 1335-1336: Window exposure
```

### Original Game Files (Deprecated Renderers):
```
games/square-rush/leaderboard-integration.js
  - Line 556-616: Original custom renderer (now in global file)
  - Still has window exposure (line 634) - redundant but harmless

games/chessinfive/js/leaderboard-integration.js
  - Line 378-500: Original custom renderer (now in global file)
  - Still has window exposure (line 528) - redundant but harmless
```

### Related Commits:
```
cbfac29 - fix: Remove Country column from generic leaderboard
66532f4 - fix: Move custom renderers to global file + improve metadata fallback
```

---

## 🎯 Summary

**What's Working:**
- ✅ ChessInFive: All modes, all games, all devices
- ✅ Square Rush: Desktop and mobile landscape
- ✅ Flags inline with player names (no Country column)
- ✅ Cross-game viewing (ChessInFive)
- ✅ Data integrity maintained

**What's Not Working:**
- ❌ Square Rush: Mobile portrait mode only
- ❌ Empty LEVEL, TARGETS, COMBO columns
- ❌ Score column populated, others empty

**Most Likely Cause:**
Mobile browser cache not refreshed after latest deploy. Hard refresh not working due to mobile browser limitations.

**Recommended Action:**
Wait 24-48 hours for browser cache to expire naturally, or instruct users to clear all browser data for the domain.

---

**Document Created:** January 17, 2025
**Last Updated:** January 17, 2025
**Status:** Open Issue - Square Rush mobile portrait pending resolution
