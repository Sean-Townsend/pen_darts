/**
 * PenBar Killer Darts - Game Logic
 *
 * Rules:
 * - Each player claims a unique number (1-20) by tapping it on a dartboard
 * - Turn order is set manually (from a real "closest to bull" throw)
 * - Players throw 3 darts per turn
 * - Hitting your OWN number (while not a killer) adds lives:
 *     Single = +1, Double = +2, Treble = +3
 * - Reaching 3+ lives makes you a KILLER
 * - As a killer, hitting an OPPONENT's number removes their lives
 *     (Single = -1, Double = -2, Treble = -3)
 * - ANY hit on your own number while you ARE a killer removes your killer
 *   status immediately (no lives lost, just demoted) — the app can't tell
 *   intent, so any self-hit as a killer costs your killer status.
 * - A player at 0 lives is still "in" the game but vulnerable — the next
 *   hit on their number (by a killer) eliminates them completely.
 * - Last player remaining wins.
 */

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const MAX_PLAYERS = 4;
const KILLER_THRESHOLD = 3;

const gameState = {
    phase: 'setup-players',   // setup-players -> claim-numbers -> set-order -> playing -> finished
    numPlayers: 0,
    players: [],              // { name, color, number, lives, isKiller, eliminated }
    currentPlayerIdx: 0,
    dartsThisTurn: 0,
    selectedSegment: null,    // number being claimed/thrown at (1-20)
    selectedMultiplier: 1,    // 1, 2, or 3 (single/double/treble) while building a throw
    turnOrderDraft: [],       // used during set-order phase
    animating: false,
};

const container = () => document.getElementById('gameContainer');

// === INIT ===

document.addEventListener('DOMContentLoaded', () => {
    document.fonts.ready.then(() => {
        showPlayerCountScreen();
    });
});

// === SCREEN: PLAYER COUNT ===

function showPlayerCountScreen() {
    gameState.phase = 'setup-players';
    container().innerHTML = `
        <div class="screen-center">
            <div class="overlay-panel">
                <h1 class="overlay-title">PenBar</h1>
                <h2 class="overlay-subtitle skull">KILLER DARTS</h2>
                <p class="overlay-prompt">How many players?</p>
                <div class="player-select-buttons" id="playerCountButtons"></div>
            </div>
        </div>
    `;

    const btnContainer = document.getElementById('playerCountButtons');
    for (let i = 2; i <= MAX_PLAYERS; i++) {
        const btn = document.createElement('button');
        btn.classList.add('btn-player-count');
        btn.textContent = i;
        btn.addEventListener('mouseenter', () => safePlaySound(playHoverSound));
        btn.addEventListener('click', () => {
            safePlaySound(playSelectSound);
            initPlayers(i);
            showClaimNumberScreen();
        });
        btnContainer.appendChild(btn);
    }

    function keyHandler(e) {
        const key = parseInt(e.key);
        if (key >= 2 && key <= MAX_PLAYERS) {
            safePlaySound(playSelectSound);
            document.removeEventListener('keydown', keyHandler);
            initPlayers(key);
            showClaimNumberScreen();
        }
    }
    document.addEventListener('keydown', keyHandler);
}

function initPlayers(numPlayers) {
    gameState.numPlayers = numPlayers;
    gameState.players = [];
    for (let i = 0; i < numPlayers; i++) {
        gameState.players.push({
            name: `Player ${i + 1}`,
            color: PLAYER_COLORS[i],
            number: null,
            lives: 0,
            isKiller: false,
            eliminated: false,
        });
    }
    gameState.currentPlayerIdx = 0;
}

// === SCREEN: CLAIM NUMBERS ===
// Each player, in turn, throws a real dart (weak hand) and taps that
// segment on the on-screen dartboard to claim it as their number.

function showClaimNumberScreen() {
    gameState.phase = 'claim-numbers';
    const player = gameState.players[gameState.currentPlayerIdx];

    container().innerHTML = `
        <div class="screen-setup">
            <div class="setup-banner">
                <span class="setup-player-dot" style="background:${player.color}"></span>
                <span>${player.name} — throw with your weak hand and tap your number</span>
            </div>
            <div class="dartboard-wrap" id="dartboardWrap"></div>
        </div>
    `;

    renderDartboard(document.getElementById('dartboardWrap'), {
        mode: 'claim',
        onSegmentTap: handleClaimTap,
    });
}

function handleClaimTap(number) {
    const taken = gameState.players.some(p => p.number === number);
    if (taken) {
        safePlaySound(playRejectSound);
        flashRejectMessage(`Number ${number} is already taken — throw again`);
        return;
    }

    safePlaySound(playSelectSound);
    const player = gameState.players[gameState.currentPlayerIdx];
    player.number = number;

    gameState.currentPlayerIdx++;
    if (gameState.currentPlayerIdx >= gameState.numPlayers) {
        gameState.currentPlayerIdx = 0;
        showSetOrderScreen();
    } else {
        showClaimNumberScreen();
    }
}

function flashRejectMessage(msg) {
    let el = document.getElementById('rejectMsg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'rejectMsg';
        el.classList.add('reject-message');
        document.querySelector('.screen-setup').appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1500);
}

// === SCREEN: SET TURN ORDER ===
// Players throw at the bull in real life; operator sets the resulting order.

function showSetOrderScreen() {
    gameState.phase = 'set-order';
    gameState.turnOrderDraft = gameState.players.map((p, idx) => idx);

    renderOrderScreen();
}

function renderOrderScreen() {
    const listHtml = gameState.turnOrderDraft.map((playerIdx, pos) => {
        const p = gameState.players[playerIdx];
        return `
            <div class="order-row" data-idx="${pos}">
                <span class="order-position">${pos + 1}</span>
                <span class="order-dot" style="background:${p.color}"></span>
                <span class="order-name">${p.name} (No. ${p.number})</span>
                <div class="order-controls">
                    <button class="btn-order-move" data-dir="up" data-idx="${pos}" ${pos === 0 ? 'disabled' : ''}>&uarr;</button>
                    <button class="btn-order-move" data-dir="down" data-idx="${pos}" ${pos === gameState.turnOrderDraft.length - 1 ? 'disabled' : ''}>&darr;</button>
                </div>
            </div>
        `;
    }).join('');

    container().innerHTML = `
        <div class="screen-setup">
            <div class="setup-banner">
                <span>Set throw order (closest to bull goes first)</span>
            </div>
            <div class="order-list">${listHtml}</div>
            <button class="btn-confirm-order" id="btnConfirmOrder">Start Game</button>
        </div>
    `;

    document.querySelectorAll('.btn-order-move').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            const dir = btn.dataset.dir;
            const swapWith = dir === 'up' ? idx - 1 : idx + 1;
            [gameState.turnOrderDraft[idx], gameState.turnOrderDraft[swapWith]] =
                [gameState.turnOrderDraft[swapWith], gameState.turnOrderDraft[idx]];
            safePlaySound(playHoverSound);
            renderOrderScreen();
        });
    });

    document.getElementById('btnConfirmOrder').addEventListener('click', () => {
        safePlaySound(playSelectSound);
        // Reorder players array to match the confirmed order
        gameState.players = gameState.turnOrderDraft.map(idx => gameState.players[idx]);
        gameState.currentPlayerIdx = 0;
        gameState.dartsThisTurn = 0;
        showGameScreen();
    });
}

// === SCREEN: MAIN GAME ===

function showGameScreen() {
    gameState.phase = 'playing';
    container().innerHTML = `
        <div class="screen-game">
            <button class="btn-quit" id="btnQuit">Quit</button>
            <div class="turn-indicator" id="turnIndicator"></div>
            <div class="killer-layout">
                <div class="dartboard-wrap" id="dartboardWrap"></div>
                <div class="lives-panel" id="livesPanel"></div>
            </div>
            <div class="throw-controls" id="throwControls"></div>
        </div>
    `;

    document.getElementById('btnQuit').addEventListener('click', () => {
        safePlaySound(playSelectSound);
        showPlayerCountScreen();
    });

    renderDartboard(document.getElementById('dartboardWrap'), {
        mode: 'play',
        onSegmentTap: handlePlayTap,
    });
    renderLivesPanel();
    renderTurnIndicator();
    renderThrowControls();
}

function renderTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    if (!indicator) return;
    const player = gameState.players[gameState.currentPlayerIdx];
    const dartsLeft = 3 - gameState.dartsThisTurn;
    const dartsDisplay = '\u25CF'.repeat(dartsLeft) + '\u25CB'.repeat(gameState.dartsThisTurn);
    indicator.innerHTML = `
        <span class="turn-dot" style="background:${player.color}"></span>
        <span class="turn-text">${player.name}'s turn (No. ${player.number}) — ${dartsDisplay}</span>
    `;
}

function renderLivesPanel() {
    const panel = document.getElementById('livesPanel');
    if (!panel) return;

    panel.innerHTML = gameState.players.map((p, idx) => {
        const statusClass = p.eliminated ? 'eliminated' : (p.isKiller ? 'killer' : '');
        const activeClass = (idx === gameState.currentPlayerIdx && !p.eliminated) ? 'active-player' : '';
        const livesDisplay = p.eliminated
            ? '\u2620'
            : '\u2764'.repeat(Math.max(0, p.lives)) + (p.lives === 0 ? ' (0)' : '');

        return `
            <div class="player-card ${statusClass} ${activeClass}" style="--player-color:${p.color}">
                <div class="player-card-header">
                    <span class="player-card-dot" style="background:${p.color}"></span>
                    <span class="player-card-name">${p.name}</span>
                    ${p.isKiller && !p.eliminated ? '<span class="killer-badge">KILLER</span>' : ''}
                </div>
                <div class="player-card-number">No. ${p.number}</div>
                <div class="player-card-lives">${livesDisplay}</div>
            </div>
        `;
    }).join('');
}

function renderThrowControls() {
    const controls = document.getElementById('throwControls');
    if (!controls) return;

    controls.innerHTML = `
        <div class="multiplier-row">
            <button class="btn-mult" data-mult="1">SINGLE</button>
            <button class="btn-mult" data-mult="2">DOUBLE</button>
            <button class="btn-mult" data-mult="3">TREBLE</button>
        </div>
        <div class="throw-status" id="throwStatus">Select multiplier, then tap a number</div>
        <button class="btn-miss-throw" id="btnMissThrow">MISS</button>
    `;

    document.querySelectorAll('.btn-mult').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.selectedMultiplier = parseInt(btn.dataset.mult);
            document.querySelectorAll('.btn-mult').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            safePlaySound(playHoverSound);
            updateThrowStatus();
        });
    });

    document.getElementById('btnMissThrow').addEventListener('click', () => {
        if (gameState.animating) return;
        safePlaySound(playMissSound);
        advanceDart();
    });

    // Default to single selected
    gameState.selectedMultiplier = 1;
    document.querySelector('.btn-mult[data-mult="1"]').classList.add('selected');
}

function updateThrowStatus() {
    const status = document.getElementById('throwStatus');
    if (!status) return;
    const multNames = { 1: 'SINGLE', 2: 'DOUBLE', 3: 'TREBLE' };
    status.textContent = `${multNames[gameState.selectedMultiplier]} selected — tap a number`;
}

// === GAMEPLAY: HANDLE A THROW ===

function handlePlayTap(number) {
    if (gameState.animating) return;
    gameState.animating = true;

    const shooter = gameState.players[gameState.currentPlayerIdx];
    const multiplier = gameState.selectedMultiplier;
    const targetPlayer = gameState.players.find(p => p.number === number && !p.eliminated);

    try {
        if (!targetPlayer) {
            // Hit a number nobody owns (or an eliminated player's old number) — treated as a miss
            safePlaySound(playMissSound);
        } else if (targetPlayer === shooter) {
            handleSelfHit(shooter, multiplier);
        } else {
            handleOpponentHit(shooter, targetPlayer, multiplier);
        }
    } finally {
        renderLivesPanel();
        advanceDart();
    }
}

function handleSelfHit(shooter, multiplier) {
    if (shooter.isKiller) {
        // Any self-hit while a killer strips killer status immediately.
        shooter.isKiller = false;
        safePlaySound(playLoseKillerSound);
        flashCenterMessage(`${shooter.name} hit their own number — KILLER STATUS LOST`, shooter.color);
    } else {
        shooter.lives += multiplier;
        if (shooter.lives >= KILLER_THRESHOLD) {
            shooter.isKiller = true;
            safePlaySound(playBecomeKillerSound);
            flashCenterMessage(`${shooter.name} is now a KILLER!`, shooter.color);
        } else {
            safePlaySound(playHitSound);
        }
    }
}

function handleOpponentHit(shooter, target, multiplier) {
    if (!shooter.isKiller) {
        // Non-killers hitting someone else's number does nothing special.
        safePlaySound(playMissSound);
        return;
    }

    if (target.lives > 0) {
        target.lives = Math.max(0, target.lives - multiplier);
        safePlaySound(playHitSound);
        if (target.lives === 0) {
            flashCenterMessage(`${target.name} is down to 0 lives — one more hit eliminates them!`, target.color);
        }
    } else {
        // Already at 0 lives — this hit eliminates them.
        target.eliminated = true;
        safePlaySound(playEliminatedSound);
        flashCenterMessage(`${target.name} has been ELIMINATED!`, target.color);
    }

    // If the target loses their killer status implicitly by being hit — no,
    // per rules only self-hits remove killer status. Being attacked does
    // not remove killer status, only lives.
    checkForWinner();
}

function checkForWinner() {
    const alive = gameState.players.filter(p => !p.eliminated);
    if (alive.length === 1) {
        gameState.phase = 'finished';
        setTimeout(() => showWinScreen(alive[0]), 900);
    }
}

function flashCenterMessage(msg, color) {
    let el = document.getElementById('centerMessage');
    if (!el) {
        el = document.createElement('div');
        el.id = 'centerMessage';
        el.classList.add('center-message');
        document.querySelector('.screen-game').appendChild(el);
    }
    el.textContent = msg;
    el.style.borderColor = color || '#f5e6a3';
    el.classList.add('show');
    clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(() => el.classList.remove('show'), 2200);
}

// === TURN PROGRESSION ===

function advanceDart() {
    gameState.dartsThisTurn++;

    if (gameState.phase === 'finished') {
        gameState.animating = false;
        return;
    }

    if (gameState.dartsThisTurn >= 3) {
        gameState.dartsThisTurn = 0;
        advanceToNextPlayer();
    }

    renderTurnIndicator();
    gameState.animating = false;
}

function advanceToNextPlayer() {
    const total = gameState.players.length;
    let next = gameState.currentPlayerIdx;
    for (let i = 0; i < total; i++) {
        next = (next + 1) % total;
        if (!gameState.players[next].eliminated) break;
    }
    gameState.currentPlayerIdx = next;
    safePlaySound(playTurnChangeSound);
    renderLivesPanel();
}

// === SCREEN: WIN ===

function showWinScreen(winner) {
    safePlaySound(playWinSound);
    container().innerHTML = `
        <div class="screen-center">
            <div class="confetti-container" id="confettiContainer"></div>
            <div class="overlay-panel win-panel">
                <div class="win-trophy">\uD83C\uDFC6</div>
                <h2 class="win-subtitle">LAST KILLER STANDING</h2>
                <h1 class="win-title" style="color:${winner.color}">${winner.name} WINS!</h1>
                <button class="btn-play-again" id="btnPlayAgain">Play Again</button>
            </div>
        </div>
    `;
    launchConfetti();
    document.getElementById('btnPlayAgain').addEventListener('click', () => {
        showPlayerCountScreen();
    });
}

function launchConfetti() {
    const c = document.getElementById('confettiContainer');
    if (!c) return;
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#f0d846', '#9b59b6', '#fff'];
    for (let i = 0; i < 150; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animDuration = 2.5 + Math.random() * 3;
        const spinDuration = 1 + Math.random() * 2;
        const animDelay = Math.random() * 3;
        const size = 12 + Math.random() * 14;
        piece.style.cssText = `
            left:${left}%;
            width:${size}px;
            height:${size * (0.4 + Math.random() * 0.6)}px;
            background:${color};
            border-radius:2px;
            animation-duration:${animDuration}s, ${spinDuration}s;
            animation-delay:${animDelay}s, ${animDelay}s;
        `;
        c.appendChild(piece);
    }
}

// === DARTBOARD RENDERING (shared by claim + play modes) ===

const DARTBOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function renderDartboard(target, { onSegmentTap }) {
    const size = 600;
    const cx = size / 2;
    const cy = size / 2;
    const segAngle = 360 / 20;

    let svg = `<svg viewBox="0 0 ${size} ${size}" class="dartboard-svg">`;

    DARTBOARD_ORDER.forEach((num, i) => {
        const startAngle = (i * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const endAngle = ((i + 1) * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const isBlack = i % 2 === 0;
        const baseColor = isBlack ? '#1a1a1a' : '#f5e6a3';

        svg += segmentPath(cx, cy, 20, 270, startAngle, endAngle, baseColor, num);

        const labelAngle = (i * segAngle - 90) * Math.PI / 180;
        const lx = cx + 250 * Math.cos(labelAngle);
        const ly = cy + 250 * Math.sin(labelAngle);
        svg += `<text x="${lx}" y="${ly}" class="dartboard-label" text-anchor="middle" dominant-baseline="middle">${num}</text>`;
    });

    svg += `<circle cx="${cx}" cy="${cy}" r="20" fill="#1a1a1a" stroke="#888" stroke-width="1"/>`;
    svg += `</svg>`;

    target.innerHTML = svg;

    // Attach click handlers to each segment group
    DARTBOARD_ORDER.forEach(num => {
        const el = target.querySelector(`[data-num="${num}"]`);
        if (el) {
            el.addEventListener('click', () => onSegmentTap(num));
        }
    });
}

function segmentPath(cx, cy, r1, r2, startAngle, endAngle, fill, num) {
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);

    return `<path data-num="${num}" class="dartboard-segment" d="M${x1},${y1} L${x2},${y2} A${r2},${r2} 0 0,1 ${x3},${y3} L${x4},${y4} A${r1},${r1} 0 0,0 ${x1},${y1} Z" fill="${fill}"/>`;
}
