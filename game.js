/**
 * PenBar Snakes & Ladders - Game Logic
 * 
 * Rules:
 * - 1-4 players
 * - Each dart scores 1-6 (input via keyboard)
 * - Player moves that many squares after each dart
 * - Must land exactly on 64 to win (bounce back if over)
 * - Landing on a snake head sends you down to the tail
 * - Landing on a ladder base sends you up to the top
 * - Tokens animate along the board
 */

// === GAME STATE ===
const gameState = {
    numPlayers: 0,
    currentPlayer: 0, // 0-indexed
    players: [],      // { name, position, color }
    dartsRemaining: 3, // each player gets 3 darts per turn
    started: false,
    finished: false,
    winner: null,
    animating: false,
};

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const WINNING_SQUARE = 65;
const TOKEN_RADIUS = 32;

// === PLAYER SELECT SCREEN ===

function showPlayerSelect() {
    const overlay = document.createElement('div');
    overlay.id = 'playerSelectOverlay';
    overlay.classList.add('game-overlay');
    overlay.innerHTML = `
        <div class="overlay-panel">
            <h1 class="overlay-title">PenBar</h1>
            <h2 class="overlay-subtitle">SNAKES & LADDERS</h2>
            <p class="overlay-prompt">How many players?</p>
            <div class="player-select-buttons">
                <button class="btn-player-count" data-count="1">1</button>
                <button class="btn-player-count" data-count="2">2</button>
                <button class="btn-player-count" data-count="3">3</button>
                <button class="btn-player-count" data-count="4">4</button>
            </div>
        </div>
    `;
    document.querySelector('.game-frame').appendChild(overlay);
    
    overlay.querySelectorAll('.btn-player-count').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            playHoverSound();
        });
        btn.addEventListener('click', () => {
            playSelectSound();
            const count = parseInt(btn.dataset.count);
            startGame(count);
            overlay.remove();
            document.removeEventListener('keydown', playerSelectKeyHandler);
        });
    });
    
    // Keyboard support for player select
    function playerSelectKeyHandler(e) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= 4) {
            playSelectSound();
            startGame(key);
            overlay.remove();
            document.removeEventListener('keydown', playerSelectKeyHandler);
        }
    }
    document.addEventListener('keydown', playerSelectKeyHandler);
}

// === START GAME ===

function startGame(numPlayers) {
    gameState.numPlayers = numPlayers;
    gameState.currentPlayer = 0;
    gameState.dartsRemaining = 3;
    gameState.started = true;
    gameState.finished = false;
    gameState.winner = null;
    gameState.players = [];
    
    for (let i = 0; i < numPlayers; i++) {
        gameState.players.push({
            name: PLAYER_NAMES[i],
            position: 0, // 0 = on START
            color: PLAYER_COLORS[i],
        });
    }
    
    // Update player area visibility
    updatePlayerArea();
    
    // Place tokens at start
    createTokens();
    
    // Show turn indicator
    showTurnIndicator();
    
    // Show dart input buttons
    showDartButtons();
    
    // Show quit button
    showQuitButton();
    
    // Show initial player banner
    showPlayerBanner(0);
    
    // Enable keyboard input
    enableInput();
}

// === UPDATE PLAYER AREA ===

function updatePlayerArea() {
    const playerEls = document.querySelectorAll('.player-area .player');
    playerEls.forEach((el, i) => {
        if (i < gameState.numPlayers) {
            el.style.display = 'flex';
            el.querySelector('.player-name').textContent = gameState.players[i].name;
            // Highlight active player
            if (i === gameState.currentPlayer) {
                el.classList.add('active-player');
            } else {
                el.classList.remove('active-player');
            }
        } else {
            el.style.display = 'none';
        }
    });
}

// === TOKEN MANAGEMENT ===

function createTokens() {
    // Remove any existing tokens
    document.querySelectorAll('.player-token').forEach(t => t.remove());
    
    gameState.players.forEach((player, i) => {
        const token = document.createElement('div');
        token.classList.add('player-token');
        token.dataset.player = i;
        token.style.background = player.color;
        token.style.width = '64px';
        token.style.height = '64px';
        token.style.borderRadius = '50%';
        token.style.border = '3px solid #fff';
        token.style.position = 'absolute';
        token.style.zIndex = '20';
        token.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
        token.style.transition = 'none';
        token.style.display = 'flex';
        token.style.alignItems = 'center';
        token.style.justifyContent = 'center';
        token.style.fontFamily = "'Bebas Neue', sans-serif";
        token.style.fontSize = '30px';
        token.style.color = '#fff';
        token.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
        token.textContent = (i + 1);
        document.querySelector('.game-container').appendChild(token);
    });
    
    positionAllTokens();
}

function positionAllTokens() {
    // Group players by position
    const positionGroups = {};
    gameState.players.forEach((player, i) => {
        const pos = player.position;
        if (!positionGroups[pos]) positionGroups[pos] = [];
        positionGroups[pos].push(i);
    });
    
    // Position each token with offset if multiple on same square
    Object.entries(positionGroups).forEach(([pos, playerIndices]) => {
        const center = getTokenPosition(parseInt(pos));
        if (!center) return;
        
        const offsets = getTokenOffsets(playerIndices.length);
        playerIndices.forEach((playerIdx, offsetIdx) => {
            const token = document.querySelector(`.player-token[data-player="${playerIdx}"]`);
            if (!token) return;
            
            const offset = offsets[offsetIdx];
            token.style.transition = 'left 0.25s ease, top 0.25s ease';
            token.style.left = (center.x + offset.x - TOKEN_RADIUS) + 'px';
            token.style.top = (center.y + offset.y - TOKEN_RADIUS) + 'px';
        });
    });
}

function getTokenPosition(squareNum) {
    if (squareNum === 0) {
        // START position — offset to the left so tokens don't cover text
        const startEl = document.querySelector('.square-start');
        if (!startEl) return null;
        const grid = document.getElementById('boardGrid');
        const gridRect = grid.getBoundingClientRect();
        const elRect = startEl.getBoundingClientRect();
        return {
            x: elRect.left - gridRect.left + elRect.width * 0.15,
            y: elRect.top - gridRect.top + elRect.height / 2
        };
    }
    if (squareNum === WINNING_SQUARE) {
        // Move to PENBAR CHAMPION cell
        const champEl = document.querySelector('[data-square="65"]');
        if (champEl) {
            const grid = document.getElementById('boardGrid');
            const gridRect = grid.getBoundingClientRect();
            const elRect = champEl.getBoundingClientRect();
            return {
                x: elRect.left - gridRect.left + elRect.width / 2,
                y: elRect.top - gridRect.top + elRect.height / 2
            };
        }
    }
    return getSquareCenter(squareNum);
}

function getTokenOffsets(count) {
    // Offset tokens so they don't overlap
    const spacing = 30;
    switch (count) {
        case 1: return [{ x: 0, y: 0 }];
        case 2: return [{ x: -spacing/2, y: 0 }, { x: spacing/2, y: 0 }];
        case 3: return [{ x: 0, y: -spacing/2 }, { x: -spacing/2, y: spacing/2 }, { x: spacing/2, y: spacing/2 }];
        case 4: return [{ x: -spacing/2, y: -spacing/2 }, { x: spacing/2, y: -spacing/2 }, { x: -spacing/2, y: spacing/2 }, { x: spacing/2, y: spacing/2 }];
        default: return [{ x: 0, y: 0 }];
    }
}

// === TURN INDICATOR ===

function showTurnIndicator() {
    let indicator = document.getElementById('turnIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'turnIndicator';
        indicator.classList.add('turn-indicator');
        document.querySelector('.game-frame').appendChild(indicator);
    }
    
    const player = gameState.players[gameState.currentPlayer];
    const dartsDisplay = '●'.repeat(gameState.dartsRemaining) + '○'.repeat(3 - gameState.dartsRemaining);
    indicator.innerHTML = `
        <span class="turn-dot" style="background: ${player.color};"></span>
        <span class="turn-text">${player.name}'s turn — ${dartsDisplay} — press 1-6</span>
    `;
    indicator.style.display = 'flex';
    
    // Update active player highlight
    updatePlayerArea();
}

let bannerResolve = null;
let bannerTimeoutId = null;

function showPlayerBanner(playerIdx) {
    const player = gameState.players[playerIdx];
    
    let banner = document.getElementById('playerBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'playerBanner';
        banner.classList.add('player-banner');
        document.querySelector('.game-container').appendChild(banner);
    }
    
    banner.innerHTML = `<span style="color: ${player.color};">${player.name}</span> to play!`;
    banner.classList.add('show');
    gameState.bannerActive = true;
    
    return new Promise(resolve => {
        bannerResolve = () => {
            banner.classList.remove('show');
            gameState.bannerActive = false;
            bannerResolve = null;
            clearTimeout(bannerTimeoutId);
            resolve();
        };
        bannerTimeoutId = setTimeout(() => {
            if (bannerResolve) bannerResolve();
        }, 2500);
    });
}

function dismissBannerEarly() {
    if (gameState.bannerActive && bannerResolve) {
        bannerResolve();
    }
}

// === QUIT BUTTON ===

function showQuitButton() {
    let btn = document.getElementById('quitButton');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'quitButton';
        btn.classList.add('btn-quit');
        btn.textContent = 'Quit';
        btn.addEventListener('mouseenter', () => playHoverSound());
        btn.addEventListener('click', () => {
            quitGame();
        });
        document.querySelector('.game-container').appendChild(btn);
    }
    btn.style.display = 'block';
}

function hideQuitButton() {
    const btn = document.getElementById('quitButton');
    if (btn) btn.style.display = 'none';
}

function quitGame() {
    playSelectSound();
    
    // Reset game state
    gameState.finished = true;
    gameState.animating = false;
    document.removeEventListener('keydown', handleKeyPress);
    
    // Clean up UI elements
    document.querySelectorAll('.player-token').forEach(t => t.remove());
    hideQuitButton();
    const dartButtons = document.getElementById('dartButtons');
    if (dartButtons) dartButtons.style.display = 'none';
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) turnIndicator.style.display = 'none';
    const banner = document.getElementById('playerBanner');
    if (banner) banner.classList.remove('show');
    
    // Reset player area
    document.querySelectorAll('.player-area .player').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active-player');
    });
    
    // Back to player select
    showPlayerSelect();
}

// === SAFE SOUND WRAPPER ===
// Sound is a nice-to-have, not critical gameplay logic. If audio playback
// throws for any reason (unsupported browser feature, audio context issue,
// etc.), it must never block the actual game action from continuing.
function safePlaySound(fn) {
    try {
        fn();
    } catch (err) {
        console.warn('Sound playback failed (non-fatal):', err);
    }
}

// === DART INPUT BUTTONS ===

function showDartButtons() {
    let container = document.getElementById('dartButtons');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dartButtons';
        container.classList.add('dart-buttons');
        
        // Dice icon
        const diceIcon = document.createElement('div');
        diceIcon.classList.add('dart-dice-icon');
        diceIcon.innerHTML = '🎲';
        container.appendChild(diceIcon);
        
        // Button grid — MISS is button #0, built identically to buttons 1-6
        const btnGrid = document.createElement('div');
        btnGrid.classList.add('dart-btn-grid');
        
        const values = [0, 1, 2, 3, 4, 5, 6];
        const labels = ['MISS', '1', '2', '3', '4', '5', '6'];
        
        values.forEach((value, idx) => {
            const btn = document.createElement('button');
            btn.classList.add('btn-dart');
            if (value === 0) {
                btn.classList.add('btn-miss');
            }
            btn.dataset.value = value;
            btn.textContent = labels[idx];
            btn.addEventListener('mouseenter', () => playHoverSound());
            btn.addEventListener('click', () => {
                if (gameState.finished || isStuckAnimating()) return;
                dismissBannerEarly();
                // Sound must never be able to block the game — wrap in try/catch
                safePlaySound(value === 0 ? playMissSound : playDartSound);
                // TEMP DIAGNOSTIC: MISS moves 1 square instead of 0 so we can
                // visually confirm the button/handler is actually firing.
                // Change this back to processMove(value) once confirmed.
                processMove(value === 0 ? 1 : value);
            });
            btnGrid.appendChild(btn);
        });
        
        container.appendChild(btnGrid);
        document.querySelector('.game-container').appendChild(container);
    }
    container.style.display = 'flex';
}

// === KEYBOARD INPUT ===

function enableInput() {
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (gameState.finished || isStuckAnimating()) return;
    
    const key = parseInt(e.key);
    if (key >= 1 && key <= 6) {
        dismissBannerEarly();
        safePlaySound(playDartSound);
        processMove(key);
    } else if (e.key === '0' || e.key.toLowerCase() === 'm') {
        dismissBannerEarly();
        safePlaySound(playMissSound);
        processMove(0);
    }
}

// === MOVE LOGIC ===

function isStuckAnimating() {
    // Safety net: if 'animating' has been true for more than 5 seconds,
    // something went wrong and it's stuck. Force-reset it so the game
    // never becomes permanently unresponsive.
    if (gameState.animating && gameState.animatingSince && (Date.now() - gameState.animatingSince > 5000)) {
        console.warn('Detected stuck animating flag — resetting.');
        gameState.animating = false;
    }
    return gameState.animating;
}

async function processMove(dartScore) {
    if (isStuckAnimating()) return;
    gameState.animating = true;
    gameState.animatingSince = Date.now();
    
    try {
        const playerIdx = gameState.currentPlayer;
        const player = gameState.players[playerIdx];
        const oldPos = player.position;
        let newPos = oldPos + dartScore;
        
        // Must land exactly on the winning square — if overshooting, stay put
        if (newPos > WINNING_SQUARE) {
            newPos = oldPos;
        }
        
        // Animate movement square by square
        await animateMovement(playerIdx, oldPos, newPos);
        
        // Update position
        player.position = newPos;
        
        // Check for win
        if (newPos === WINNING_SQUARE) {
            gameState.finished = true;
            gameState.winner = playerIdx;
            positionAllTokens();
            playWinSound();
            showWinScreen(player);
            return;
        }
        
        // Check for snake or ladder
        if (SNAKES[newPos]) {
            const dest = SNAKES[newPos].to;
            await delay(200);
            await animateSlide(playerIdx, newPos, dest, 'snake');
            player.position = dest;
            await smoothReposition(playerIdx);
        } else if (LADDERS[newPos]) {
            const dest = LADDERS[newPos].to;
            await delay(200);
            await animateSlide(playerIdx, newPos, dest, 'ladder');
            player.position = dest;
            await smoothReposition(playerIdx);
        }
        
        // Reposition all tokens (handles overlaps)
        positionAllTokens();
        
        // Decrement darts remaining
        gameState.dartsRemaining--;
        
        // Next player after 3 darts
        let showingBanner = false;
        if (gameState.dartsRemaining <= 0) {
            gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.numPlayers;
            gameState.dartsRemaining = 3;
            playTurnChangeSound();
            showTurnIndicator();
            showingBanner = true;
        } else {
            showTurnIndicator();
        }
        
        // Release the lock BEFORE showing the banner so players can dismiss
        // it early or immediately start their next throw during it.
        gameState.animating = false;
        
        if (showingBanner) {
            await showPlayerBanner(gameState.currentPlayer);
        }
        return;
    } catch (err) {
        console.error('processMove error:', err);
    } finally {
        // Safety net: guarantees the lock is always released, even if
        // something above threw before reaching the explicit release.
        gameState.animating = false;
    }
}

// === ANIMATIONS ===

async function animateMovement(playerIdx, from, to) {
    const token = document.querySelector(`.player-token[data-player="${playerIdx}"]`);
    if (!token) return;
    
    const step = from < to ? 1 : -1;
    let current = from;
    
    while (current !== to) {
        current += step;
        const pos = getTokenPosition(current);
        if (pos) {
            playMoveSound();
            // Force a reflow before re-applying transition so the browser
            // registers the change as a new animation step, not a skipped one.
            token.style.transition = 'none';
            void token.offsetHeight;
            token.style.transition = 'left 0.15s ease, top 0.15s ease';
            token.style.left = (pos.x - TOKEN_RADIUS) + 'px';
            token.style.top = (pos.y - TOKEN_RADIUS) + 'px';
            await delay(180);
        }
    }
}

async function animateSlide(playerIdx, from, to, type) {
    const token = document.querySelector(`.player-token[data-player="${playerIdx}"]`);
    if (!token) return;
    
    // Check if we have a stored snake path to follow
    if (SNAKES[from] && drawnPaths.snakes[from]) {
        // Smooth move to snake head first
        const svg = document.getElementById('overlaySvg');
        const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('d', drawnPaths.snakes[from]);
        tempPath.setAttribute('fill', 'none');
        tempPath.setAttribute('stroke', 'none');
        tempPath.style.visibility = 'hidden';
        svg.appendChild(tempPath);
        const startPoint = tempPath.getPointAtLength(0);
        svg.removeChild(tempPath);
        
        token.style.transition = 'left 0.4s ease, top 0.4s ease';
        token.style.left = (startPoint.x - TOKEN_RADIUS) + 'px';
        token.style.top = (startPoint.y - TOKEN_RADIUS) + 'px';
        await delay(500);
        
        playSnakeSound();
        await animateAlongPath(token, drawnPaths.snakes[from]);
        return;
    }
    
    // For ladders, animate along the straight line between stored endpoints
    if (LADDERS[from] && drawnPaths.ladders[from]) {
        const { x1, y1, x2, y2 } = drawnPaths.ladders[from];
        // Smooth move to ladder base first
        token.style.transition = 'left 0.4s ease, top 0.4s ease';
        token.style.left = (x1 - TOKEN_RADIUS) + 'px';
        token.style.top = (y1 - TOKEN_RADIUS) + 'px';
        await delay(450);
        
        playLadderSound();
        // Then animate up
        await animateStraightLine(token, x1, y1, x2, y2);
        return;
    }
    
    // Fallback: straight slide
    const toPos = getTokenPosition(to);
    if (!toPos) return;
    
    token.style.transition = 'left 0.6s ease-in-out, top 0.6s ease-in-out';
    token.style.left = (toPos.x - TOKEN_RADIUS) + 'px';
    token.style.top = (toPos.y - TOKEN_RADIUS) + 'px';
    await delay(700);
}

async function animateAlongPath(token, pathData) {
    const svg = document.getElementById('overlaySvg');
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('d', pathData);
    tempPath.setAttribute('fill', 'none');
    tempPath.setAttribute('stroke', 'none');
    tempPath.style.visibility = 'hidden';
    svg.appendChild(tempPath);
    
    const pathLength = tempPath.getTotalLength();
    const duration = Math.max(600, Math.min(2000, pathLength * 2));
    
    return new Promise(resolve => {
        const startTime = performance.now();
        
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease in-out
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            const point = tempPath.getPointAtLength(eased * pathLength);
            token.style.left = (point.x - TOKEN_RADIUS) + 'px';
            token.style.top = (point.y - TOKEN_RADIUS) + 'px';
            
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                svg.removeChild(tempPath);
                resolve();
            }
        }
        
        token.style.transition = 'none';
        requestAnimationFrame(step);
    });
}

async function smoothReposition(playerIdx) {
    const token = document.querySelector(`.player-token[data-player="${playerIdx}"]`);
    if (!token) return;
    const player = gameState.players[playerIdx];
    const pos = getTokenPosition(player.position);
    if (!pos) return;
    
    token.style.transition = 'left 0.3s ease, top 0.3s ease';
    token.style.left = (pos.x - TOKEN_RADIUS) + 'px';
    token.style.top = (pos.y - TOKEN_RADIUS) + 'px';
    await delay(350);
}

async function animateStraightLine(token, x1, y1, x2, y2) {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const duration = Math.max(400, Math.min(1500, dist * 2));
    
    return new Promise(resolve => {
        const startTime = performance.now();
        
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease in-out
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            const x = x1 + (x2 - x1) * eased;
            const y = y1 + (y2 - y1) * eased;
            token.style.left = (x - TOKEN_RADIUS) + 'px';
            token.style.top = (y - TOKEN_RADIUS) + 'px';
            
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        
        token.style.transition = 'none';
        requestAnimationFrame(step);
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// === WIN SCREEN ===

function showWinScreen(player) {
    const overlay = document.createElement('div');
    overlay.id = 'winOverlay';
    overlay.classList.add('game-overlay');
    overlay.innerHTML = `
        <div class="confetti-container" id="confettiContainer"></div>
        <div class="overlay-panel win-panel">
            <div class="win-trophy">🏆</div>
            <h2 class="win-subtitle">PENBAR CHAMPION</h2>
            <h1 class="win-title">${player.name} WINS!</h1>
            <button class="btn-play-again">Play Again</button>
        </div>
    `;
    document.querySelector('.game-frame').appendChild(overlay);
    
    // Start confetti
    launchConfetti();
    
    overlay.querySelector('.btn-play-again').addEventListener('click', () => {
        overlay.remove();
        document.removeEventListener('keydown', handleKeyPress);
        showPlayerSelect();
    });
}

function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#f0d846', '#9b59b6', '#fff'];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-piece');
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animDuration = 2.5 + Math.random() * 3;
        const spinDuration = 1 + Math.random() * 2;
        const animDelay = Math.random() * 3;
        const size = 12 + Math.random() * 14;
        
        confetti.style.cssText = `
            left: ${left}%;
            width: ${size}px;
            height: ${size * (0.4 + Math.random() * 0.6)}px;
            background: ${color};
            border-radius: 2px;
            animation-duration: ${animDuration}s, ${spinDuration}s;
            animation-delay: ${animDelay}s, ${animDelay}s;
        `;
        
        container.appendChild(confetti);
    }
}

// === INIT ===

document.addEventListener('DOMContentLoaded', () => {
    // Wait for board to render first
    setTimeout(() => {
        showPlayerSelect();
    }, 500);
});
