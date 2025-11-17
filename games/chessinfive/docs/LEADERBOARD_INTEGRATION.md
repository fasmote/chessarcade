# 🏆 ChessInFive Leaderboard Integration

## 📋 Overview

ChessInFive integrates with the global ChessArcade leaderboard system, allowing players to submit their scores and compete globally. This document details the implementation, scoring system, and technical architecture.

---

## ✨ Features Implemented

### Core Features
- ✅ **Global Leaderboard** - Players from all games can view and compare scores
- ✅ **Custom Rendering** - ChessInFive-specific table display with game metadata
- ✅ **Dynamic Scoring** - Rewards fast wins with fewer moves
- ✅ **Player Type Detection** - Shows if player is Human, AI, or AI vs AI
- ✅ **Country Flags** - Displays flags next to player names
- ✅ **Auto-Close/Auto-Open Flow** - Seamless UX after score submission
- ✅ **Triple Safety Reset** - Submit button properly resets between games
- ✅ **Cross-Game Viewing** - View ChessInFive leaderboard from any other game

### UX Enhancements
- ✅ **Trophy Icon (🏆)** - Visual leaderboard button in header
- ✅ **Increased Font Sizes** - Better readability (16px base, 18px scores)
- ✅ **Responsive Modal** - Buttons wrap properly, no overflow
- ✅ **Extensive Logging** - Debugging with BEFORE/AFTER state tracking

---

## 🎯 Scoring System

### Formula
```javascript
score = 10000 - (moves × 50) - (time × 1) + phaseBonus
```

### Components

| Component | Value | Description |
|-----------|-------|-------------|
| **Base Score** | 10,000 | Starting score for a win |
| **Move Penalty** | -50 pts/move | Encourages efficient play |
| **Time Penalty** | -1 pt/second | Rewards fast victories |
| **Phase 1 Bonus** | +2,000 pts | Extra reward for Phase 1 wins |
| **Phase 2 Bonus** | +500 pts | Bonus for Phase 2 wins |

### Examples

**Example 1: Fast Phase 1 Win**
- Moves: 8
- Time: 45 seconds
- Phase: 1 (Gravity)
- Score: `10000 - (8 × 50) - 45 + 2000 = 11,555 pts` ⭐

**Example 2: Longer Phase 2 Win**
- Moves: 25
- Time: 180 seconds (3 min)
- Phase: 2 (Chess)
- Score: `10000 - (25 × 50) - 180 + 500 = 9,070 pts`

**Example 3: Very Fast AI Win**
- Moves: 12
- Time: 15 seconds
- Phase: 1 (Gravity)
- Score: `10000 - (12 × 50) - 15 + 2000 = 11,385 pts`

### Score Limits
- **Minimum Score**: `1` (enforced by backend)
- **Maximum Score**: `100,000` (enforced by backend)
- **Typical Range**: 8,000 - 12,000 for most games

---

## 📊 Metadata Structure

Each score submission includes rich metadata:

```javascript
{
  metadata: {
    winner: 'Cyan' | 'Magenta',           // Winning player color
    phase: 1 | 2,                          // Phase where game ended
    moves: number,                         // Total move count
    time: number,                          // Game duration in seconds
    player_type: '👤 Human' | '🤖 AI' | '🤖🤖 AI vs AI'
  }
}
```

### Player Type Detection

The system automatically detects player types:

| Scenario | Player Type | Display |
|----------|-------------|---------|
| Neither AI enabled | `👤 Human` | Human player icon |
| One AI enabled | `🤖 AI` | Single AI icon |
| Both AIs enabled | `🤖🤖 AI vs AI` | Double AI icon |

**Implementation:**
```javascript
function detectPlayerType() {
    if (!window.AIController) return '👤 Human';

    const isCyanAI = window.AIController.isAIPlayer('cyan');
    const isMagentaAI = window.AIController.isAIPlayer('magenta');

    if (isCyanAI && isMagentaAI) return '🤖🤖 AI vs AI';
    if (isCyanAI || isMagentaAI) return '🤖 AI';
    return '👤 Human';
}
```

---

## 🏗️ Technical Architecture

### File Structure

```
games/chessinfive/
├── js/
│   ├── leaderboard-integration.js    # Main integration file
│   ├── ui-controller.js              # Modal and button management
│   └── ai-controller.js              # AI detection (exposed to window)
├── css/
│   └── chessinfive.css               # Modal styling with flex-wrap
└── docs/
    └── LEADERBOARD_INTEGRATION.md    # This file
```

### Global Dependencies

```javascript
// Shared leaderboard system (loaded in index.html)
- /css/leaderboard.css        // Global leaderboard styles
- /js/leaderboard-api.js      // API communication
- /js/leaderboard-ui.js       // Modal and table rendering
```

### Window Scope Exposure

For cross-module communication, these functions are exposed:

```javascript
// In leaderboard-integration.js
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;

// In ai-controller.js
window.AIController = AIController;
```

**Why expose to window?**
- `renderChessInFiveLeaderboardTable`: Allows other games to display ChessInFive leaderboard
- `AIController`: Allows leaderboard integration to detect AI players

See [Window Scope Explanation](#window-scope-explanation) below for details.

---

## 🔄 Submit Button: Triple Safety Pattern

### Problem Solved
After submitting the first game, the button stayed `disabled: true` with text "✅ SUBMITTED!" on subsequent games.

### Solution: Triple Safety Reset

Reset the button at **THREE critical entry points**:

#### 1. Modal Open (`showGameOver()`)
```javascript
showGameOver(winner) {
    const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT SCORE';
    }
    // ... show modal
}
```
**When**: Every time the game over modal opens
**Why**: MOST CRITICAL - ensures button is ready when user sees it

#### 2. Modal Close (`hideGameOver()`)
```javascript
hideGameOver() {
    const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT SCORE';
    }
    document.getElementById('gameOverModal').style.display = 'none';
}
```
**When**: User closes modal with X button
**Why**: Prepares button for next game if user closes without submitting

#### 3. New Game (`newGame()`)
```javascript
newGame() {
    const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT SCORE';
    }
    GameState.init();
    // ... start new game
}
```
**When**: "Play Again" button clicked
**Why**: Final safety net when starting fresh game

### Evidence of Fix

Before fix (Log 157-158):
```
BEFORE reset: {disabled: true, textContent: '✅ SUBMITTED!'}  ❌ Stuck!
```

After fix (Log 160):
```
BEFORE reset: {disabled: true, textContent: '✅ SUBMITTED!'}
AFTER reset: {disabled: false, textContent: '🏆 SUBMIT SCORE'}  ✅ Works!
```

---

## 🎨 UI/UX Improvements

### Trophy Icon (🏆)

All games now use a consistent trophy icon for the leaderboard button:

**Before:**
```html
<button class="btn-icon btn-leaderboard" id="btnLeaderboard">
    <svg>...</svg>  <!-- User list icon -->
</button>
```

**After:**
```html
<button id="btnLeaderboard" class="btn-icon">
    <span class="icon-leaderboard">🏆</span>
</button>
```

### Increased Font Sizes

Enhanced readability across ALL games:

| Element | Old Size | New Size | Change |
|---------|----------|----------|--------|
| Table base | 14px | 16px | +14% |
| Headers | 12px | 14px | +17% |
| Scores | - | 18px | +29% |
| Top 3 ranks | 16px | 18px | +13% |

**CSS Changes (`/css/leaderboard.css`):**
```css
.leaderboard-table {
    font-size: 16px;  /* ⬆️ From 14px */
}

.leaderboard-table th {
    font-size: 14px;  /* ⬆️ From 12px */
}

.score-row .score {
    font-size: 18px;  /* 🆕 Larger scores */
    color: var(--success-color, #00ff40);
    text-shadow: 0 0 5px rgba(0, 255, 64, 0.3);
}
```

### Modal Fixes

**Problem:** Four buttons caused overflow on mobile

**Solution:** Flex-wrap in `chessinfive.css`:
```css
.modal-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;      /* 🆕 Buttons wrap to multiple rows */
    max-width: 100%;      /* 🆕 Prevent overflow */
}
```

---

## 🔍 Custom Leaderboard Rendering

ChessInFive has a custom table renderer that displays game-specific metadata:

### Custom Columns

| Column | Data | Description |
|--------|------|-------------|
| **Rank** | #1, #2, ... | Position in leaderboard |
| **Player** | Name + 🇦🇷 | Player name with country flag |
| **Score** | 11,555 pts | Final calculated score |
| **Winner** | Cyan / Magenta | Winning player color |
| **Phase** | 1 / 2 | Game phase when won |
| **Moves** | 8 | Total moves made |
| **Time** | 45s | Game duration |
| **Type** | 👤/🤖/🤖🤖 | Player type |
| **Date** | 5 min ago | Submission timestamp |

### Implementation

```javascript
function renderChessInFiveLeaderboardTable(scores) {
    // Build custom HTML table with ChessInFive-specific columns
    // Shows: Rank, Player+Flag, Score, Winner, Phase, Moves, Time, Type, Date

    // Example row:
    // #1 | Claudio 🇦🇷 | 11,555 pts | Cyan | Phase 1 | 8 moves | 45s | 👤 | 5 min ago
}

// Expose to window for cross-game viewing
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;
```

### Fallback Rendering

If custom renderer isn't available, the system falls back to generic rendering:

```javascript
// In leaderboard-ui.js
if (typeof window.renderChessInFiveLeaderboardTable === 'function') {
    table = window.renderChessInFiveLeaderboardTable(data.scores);
} else {
    console.warn('[DEBUG] ChessInFive custom renderer not available, using generic');
    table = renderLeaderboardTable(data.scores, true);
}
```

---

## 🌍 Cross-Game Leaderboard Viewing

Players can view ANY game's leaderboard from ANY other game.

### How It Works

1. **Expose Custom Renderers:**
```javascript
// In each game's leaderboard-integration.js
window.renderSquareRushLeaderboardTable = renderSquareRushLeaderboardTable;
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;
```

2. **Leaderboard UI Checks:**
```javascript
// In /js/leaderboard-ui.js
if (state.currentGame === 'chessinfive') {
    if (typeof window.renderChessInFiveLeaderboardTable === 'function') {
        table = window.renderChessInFiveLeaderboardTable(data.scores);
    } else {
        table = renderLeaderboardTable(data.scores, true);  // Fallback
    }
}
```

3. **Cross-Game Access:**
```javascript
// From Knight Quest, user clicks "View ChessInFive Leaderboard"
window.showLeaderboardModal('chessinfive');
// ✅ Uses ChessInFive's custom renderer even from Knight Quest
```

---

## 📝 Auto-Close/Auto-Open Flow

After score submission, the system provides a seamless UX:

```javascript
async function submitGameOverScore() {
    // 1. Submit score
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMITTING...';

    await submitScore('chessinfive', finalScore, playerName, metadata);

    // 2. Show success
    submitBtn.textContent = '✅ SUBMITTED!';

    // 3. Auto-close modal after 2s
    setTimeout(() => {
        gameOverModal.style.display = 'none';

        // 4. Auto-open leaderboard after 300ms
        setTimeout(() => {
            window.showLeaderboardModal('chessinfive');
        }, 300);
    }, 2000);
}
```

**Timeline:**
- `t=0s`: User clicks "🏆 SUBMIT SCORE"
- `t=0s`: Button shows "SUBMITTING..."
- `t=0.5s`: API responds, button shows "✅ SUBMITTED!"
- `t=2.5s`: Modal closes automatically
- `t=2.8s`: Leaderboard opens showing updated rankings

---

## 🐛 Debugging & Logging

Extensive logging helps track state changes:

### Logging Strategy

```javascript
// BEFORE/AFTER pattern for every state change
console.log('🔄 [CONTEXT] BEFORE action - Button state:', {
    disabled: submitBtn.disabled,
    textContent: submitBtn.textContent
});

submitBtn.disabled = false;
submitBtn.textContent = '🏆 SUBMIT SCORE';

console.log('🔄 [CONTEXT] AFTER action - Button state:', {
    disabled: submitBtn.disabled,
    textContent: submitBtn.textContent
});
```

### Log Prefixes

| Prefix | Context | Example |
|--------|---------|---------|
| 🏁 | Game Over | `🏁 [GAME OVER] showGameOver() called` |
| 🆕 | New Game | `🆕 [NEW GAME] newGame() called` |
| ❌ | Hide Modal | `❌ [HIDE MODAL] User closed with X` |
| 🔄 | Submit Flow | `🔄 [SUBMIT] BEFORE disabling button` |
| ⏰ | Auto-Close | `⏰ [AUTO-CLOSE] 2 seconds passed` |
| 📊 | Auto-Open | `📊 [AUTO-OPEN] Opening leaderboard` |

### Example Log Output

```
🏁 [GAME OVER] ========================================
🏁 [GAME OVER] showGameOver() called for winner: Cyan
🔄 [GAME OVER] BEFORE reset - Button state: {disabled: true, textContent: '✅ SUBMITTED!'}
🔄 [GAME OVER] AFTER reset - Button state: {disabled: false, textContent: '🏆 SUBMIT SCORE'}
✅ [GAME OVER] Submit Score button RESET when showing modal
📖 [GAME OVER] Opening modal after 2s delay...
✅ [GAME OVER] Modal is now visible
```

---

## 🔐 Window Scope Explanation

### What Does "Expose to Window" Mean?

In JavaScript, each file has its own **local scope**. Functions defined in one file cannot be accessed by another file unless explicitly shared.

**Without `window`:**
```javascript
// ai-controller.js
function AIController() { /* ... */ }

// leaderboard-integration.js
AIController.isAIPlayer('cyan');  // ❌ ERROR: AIController is not defined
```

**With `window`:**
```javascript
// ai-controller.js
function AIController() { /* ... */ }
window.AIController = AIController;  // ✅ Expose to global scope

// leaderboard-integration.js
window.AIController.isAIPlayer('cyan');  // ✅ Works!
```

### Why Is It Necessary?

ChessArcade uses separate JavaScript files for modularity:
- `ai-controller.js` - Handles AI logic
- `leaderboard-integration.js` - Handles score submission
- `leaderboard-ui.js` - Renders leaderboard tables

These files need to communicate:
1. **Leaderboard needs AI detection** - To show player type (Human/AI)
2. **Other games need custom renderers** - To display ChessInFive leaderboard from Square Rush

### ChessInFive Exposures

```javascript
// ai-controller.js (Line 271-279)
window.AIController = AIController;
// Purpose: Allow leaderboard to detect AI players

// leaderboard-integration.js (Line 628-637)
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;
// Purpose: Allow other games to display ChessInFive leaderboard
```

### Best Practices

✅ **DO:**
- Expose only necessary functions
- Document why each exposure is needed
- Use descriptive names

❌ **DON'T:**
- Expose internal implementation details
- Pollute global scope unnecessarily
- Forget to document exposures

---

## 📚 Lessons Learned

### Key Takeaways from ChessInFive Integration

1. **Triple Safety Pattern for UI State**
   - Don't assume state clears automatically
   - Reset at multiple entry points prevents edge cases
   - Always log BEFORE/AFTER for debugging

2. **Window Scope for Cross-Module Communication**
   - Required when functions are used across separate JS files
   - Enables cross-game leaderboard viewing
   - Document why each exposure is necessary

3. **Metadata Wrapper Pattern**
   - API expects `{ metadata: { ... } }` structure
   - Allows rich data without polluting top-level fields
   - Future-proof for adding more game-specific data

4. **Custom Rendering with Fallback**
   - Game-specific renderers enhance UX
   - Generic fallback ensures robustness
   - Existence checks prevent errors

5. **Browser Cache Considerations**
   - JS files are cached aggressively
   - Hard refresh (Ctrl+Shift+R) needed after deployment
   - Vercel creates new URLs for each deployment

6. **Extensive Logging is Worth It**
   - BEFORE/AFTER logs make debugging trivial
   - Emoji prefixes enable quick scanning
   - Saved hours in troubleshooting

---

## 🚀 Future Improvements (ELO System)

### Current System: Static Scoring
- Formula-based: `10000 - (moves × 50) - (time × 1) + phaseBonus`
- No consideration of opponent strength
- All wins worth similar points

### Planned: ELO Rating System

See full specification in [`MEJORAS_FUTURAS.md`](./MEJORAS_FUTURAS.md)

**Key Features:**
- Dynamic rating adjustments based on opponent strength
- Categories: Beginner (0-1200), Intermediate (1200-1600), Advanced (1600-2000), Expert (2000+)
- K-factor adjustments for new vs. established players
- Separate ratings for Human vs AI games

**Formula:**
```
New Rating = Old Rating + K × (Actual - Expected)

Where:
- K = 32 (new players) or 16 (established)
- Expected = 1 / (1 + 10^((OpponentRating - PlayerRating) / 400))
- Actual = 1 (win), 0.5 (draw), 0 (loss)
```

### Planned: Individual Player Clocks

**Current:** Total game time only
**Future:** Chess clock system with per-player time tracking

See [`MEJORAS_FUTURAS.md`](./MEJORAS_FUTURAS.md) for complete specifications.

---

## 📊 API Endpoints

### GET /api/scores
Fetch leaderboard scores for a game.

**Request:**
```javascript
GET /api/scores?game=chessinfive&limit=100
```

**Response:**
```json
{
  "scores": [
    {
      "id": 123,
      "game": "chessinfive",
      "player_name": "Claudio",
      "score": 11555,
      "country": "AR",
      "metadata": {
        "winner": "Cyan",
        "phase": 1,
        "moves": 8,
        "time": 45,
        "player_type": "👤 Human"
      },
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/scores
Submit a new score.

**Request:**
```javascript
POST /api/scores
Content-Type: application/json

{
  "game": "chessinfive",
  "player_name": "Claudio",
  "score": 11555,
  "country": "AR",
  "metadata": {
    "winner": "Cyan",
    "phase": 1,
    "moves": 8,
    "time": 45,
    "player_type": "👤 Human"
  }
}
```

**Response:**
```json
{
  "id": 123,
  "message": "Score submitted successfully",
  "rank": 5
}
```

---

## ✅ Integration Checklist

Use this checklist when integrating leaderboard into new games:

- [x] Add leaderboard CSS/JS includes to `index.html`
- [x] Create `leaderboard-integration.js` with:
  - [x] Score calculation function
  - [x] Submit handler with metadata
  - [x] Custom table renderer
  - [x] Window exposure of renderer
- [x] Add leaderboard button to header (🏆 icon)
- [x] Update game over modal with:
  - [x] Player name input field
  - [x] "🏆 SUBMIT SCORE" button
  - [x] "👁️ VIEW LEADERBOARD" button
- [x] Implement Triple Safety Reset:
  - [x] Reset in `showGameOver()`
  - [x] Reset in `hideGameOver()`
  - [x] Reset in `newGame()`
- [x] Add auto-close/auto-open flow after submission
- [x] Test cross-game leaderboard viewing
- [x] Add extensive logging for debugging
- [x] Update documentation

---

## 🎯 Games with Leaderboard Integration

| Game | Status | Custom Renderer | Trophy Icon | Notes |
|------|--------|----------------|-------------|-------|
| **ChessInFive** | ✅ Complete | ✅ Yes | ✅ Yes | Full integration with metadata |
| **Square Rush** | ✅ Complete | ✅ Yes | ✅ Yes | Custom columns + cross-game viewing |
| **Memory Matrix** | ✅ Complete | ✅ Yes | ✅ Yes | Custom scoring display |
| **Knight Quest** | ✅ Complete | ❌ Generic | ✅ Yes | Uses generic renderer |
| **Master Sequence** | ✅ Complete | ❌ Generic | ✅ Yes | Uses generic renderer |
| **Vision Blitz** | ❌ Not Started | - | - | Future integration |

---

## 📞 Support & Contact

For questions or issues with the leaderboard system:

- **GitHub Issues**: [ChessArcade Issues](https://github.com/fasmote/ChessArcade/issues)
- **Email**: contact@chessarcade.com.ar
- **Documentation**: `/docs/leaderboard/`

---

**Last Updated:** January 2025
**Version:** 1.0
**Author:** ChessArcade Team
