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
 * - ANY loss of a life while you ARE a killer — whether from hitting your
 *   own number or being attacked by another killer — strips your killer
 *   status immediately. You must fight back up to 3 lives to regain it.
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
                <div class="side-controls" id="throwControls"></div>
            </div>
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
    updatePlayerOverlays();
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

// === PLAYER OVERLAYS ON THE DARTBOARD ITSELF ===
// Each claimed number's wedge is split into 3 angular life-segments.
// A filled segment (player color) = a life still held. A lost life turns
// that segment dark. This keeps lives visible right on the board instead
// of in a separate panel.

function updatePlayerOverlays() {
    const svg = document.querySelector('#dartboardWrap .dartboard-svg');
    if (!svg) return;

    let overlayGroup = svg.querySelector('#playerOverlays');
    if (overlayGroup) overlayGroup.remove();

    overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlayGroup.setAttribute('id', 'playerOverlays');
    svg.appendChild(overlayGroup);

    const size = BOARD_SIZE;
    const cx = size / 2;
    const cy = size / 2;
    const segAngle = 360 / 20;
    const LIFE_SEGMENTS = 3;

    gameState.players.forEach(player => {
        if (player.number == null) return;

        const i = DARTBOARD_ORDER.indexOf(player.number);
        if (i === -1) return;

        const wedgeStart = (i * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const wedgeEnd = ((i + 1) * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const midAngle = (i * segAngle - 90) * Math.PI / 180;
        const subAngle = (wedgeEnd - wedgeStart) / LIFE_SEGMENTS;

        const livesFilled = player.eliminated ? 0 : Math.min(player.lives, LIFE_SEGMENTS);
        const hasBonusLives = !player.eliminated && player.lives > LIFE_SEGMENTS;

        // Radial bands from inner (center) to outer edge of the wedge.
        // Band 0 = innermost (first life), band 2 = outermost (third life,
        // reaching this band = killer / full wedge lit up).
        const innerR = 24;
        const outerR = WEDGE_OUTER_R;
        const bandDepth = (outerR - innerR) / LIFE_SEGMENTS;

        for (let s = 0; s < LIFE_SEGMENTS; s++) {
            const r1 = innerR + bandDepth * s;
            const r2 = innerR + bandDepth * (s + 1);
            const d = segmentPathD(cx, cy, r1, r2, wedgeStart, wedgeEnd);

            const seg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            seg.setAttribute('d', d);
            seg.style.pointerEvents = 'none';

            if (player.eliminated) {
                seg.setAttribute('fill', '#2a2a2a');
                seg.setAttribute('opacity', '0.75');
            } else if (s < livesFilled) {
                seg.setAttribute('fill', player.color);
                seg.setAttribute('opacity', hasBonusLives ? '1' : '0.85');
            } else {
                seg.setAttribute('fill', '#1a1a1a');
                seg.setAttribute('opacity', '0.7');
            }
            overlayGroup.appendChild(seg);

            // Thin arc divider between radial bands
            if (s > 0) {
                const arcD = arcPathD(cx, cy, r1, wedgeStart, wedgeEnd);
                const divider = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                divider.setAttribute('d', arcD);
                divider.setAttribute('fill', 'none');
                divider.setAttribute('stroke', '#000');
                divider.setAttribute('stroke-width', 1);
                divider.setAttribute('opacity', '0.5');
                divider.style.pointerEvents = 'none';
                overlayGroup.appendChild(divider);
            }
        }

        // Outer border around the whole wedge, colored by ownership
        const outerBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        outerBorder.setAttribute('d', segmentPathD(cx, cy, 24, WEDGE_OUTER_R, wedgeStart, wedgeEnd));
        outerBorder.setAttribute('fill', 'none');
        outerBorder.setAttribute('stroke', player.eliminated ? '#555' : player.color);
        outerBorder.setAttribute('stroke-width', 3);
        outerBorder.style.pointerEvents = 'none';
        overlayGroup.appendChild(outerBorder);

        // Killer status: skull & crossbones badge next to the number label.
        if (player.isKiller && !player.eliminated) {
            const kx = cx + BADGE_R * Math.cos(midAngle);
            const ky = cy + BADGE_R * Math.sin(midAngle);

            const killerBadgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            killerBadgeBg.setAttribute('cx', kx);
            killerBadgeBg.setAttribute('cy', ky);
            killerBadgeBg.setAttribute('r', 22);
            killerBadgeBg.setAttribute('fill', '#000');
            killerBadgeBg.setAttribute('stroke', player.color);
            killerBadgeBg.setAttribute('stroke-width', 3);
            killerBadgeBg.classList.add('killer-pulse');
            killerBadgeBg.style.pointerEvents = 'none';
            overlayGroup.appendChild(killerBadgeBg);

            const skull = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            skull.setAttribute('x', kx);
            skull.setAttribute('y', ky);
            skull.setAttribute('text-anchor', 'middle');
            skull.setAttribute('dominant-baseline', 'central');
            skull.setAttribute('class', 'killer-skull');
            skull.setAttribute('fill', player.color);
            skull.textContent = '\u2620';
            skull.style.pointerEvents = 'none';
            overlayGroup.appendChild(skull);
        }

        // Eliminated: skull over the wedge label position
        if (player.eliminated) {
            const sx = cx + 245 * Math.cos(midAngle);
            const sy = cy + 245 * Math.sin(midAngle);
            const skull = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            skull.setAttribute('x', sx);
            skull.setAttribute('y', sy);
            skull.setAttribute('text-anchor', 'middle');
            skull.setAttribute('dominant-baseline', 'central');
            skull.setAttribute('class', 'eliminated-skull');
            skull.textContent = '\u2620';
            skull.style.pointerEvents = 'none';
            overlayGroup.appendChild(skull);
        }

        // Active player indicator: small spinning marker at the outer tip.
        // If this player is also a killer, wrap the ring around the skull
        // badge instead of overlapping it.
        const isActivePlayer = gameState.players[gameState.currentPlayerIdx] === player && !player.eliminated;
        if (isActivePlayer) {
            const bx = cx + BADGE_R * Math.cos(midAngle);
            const by = cy + BADGE_R * Math.sin(midAngle);
            const ringRadius = (player.isKiller && !player.eliminated) ? 30 : 14;
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('cx', bx);
            ring.setAttribute('cy', by);
            ring.setAttribute('r', ringRadius);
            ring.setAttribute('fill', 'none');
            ring.setAttribute('stroke', '#fff');
            ring.setAttribute('stroke-width', 2);
            ring.setAttribute('stroke-dasharray', '3 2');
            ring.classList.add('active-ring-spin');
            ring.style.pointerEvents = 'none';
            overlayGroup.appendChild(ring);
        }
    });

    // Keep the number labels visible on top of all life-segment overlays
    svg.querySelectorAll('.dartboard-label').forEach(label => svg.appendChild(label));
}



function renderThrowControls() {
    const controls = document.getElementById('throwControls');
    if (!controls) return;

    // Reset any in-progress throw selection when controls are (re)rendered
    gameState.selectedSegment = null;
    gameState.selectedMultiplier = null;

    controls.innerHTML = `
        <div class="multiplier-col">
            <button class="btn-mult" data-mult="1">SINGLE</button>
            <button class="btn-mult" data-mult="2">DOUBLE</button>
            <button class="btn-mult" data-mult="3">TREBLE</button>
        </div>
        <div class="throw-status" id="throwStatus">Select number + multiplier</div>
        <button class="btn-confirm-throw" id="btnConfirmThrow" disabled>ENTER</button>
        <button class="btn-miss-throw" id="btnMissThrow">MISS</button>
    `;

    document.querySelectorAll('.btn-mult').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameState.animating) return;
            gameState.selectedMultiplier = parseInt(btn.dataset.mult);
            document.querySelectorAll('.btn-mult').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            safePlaySound(playHoverSound);
            updateThrowStatus();
        });
    });

    document.getElementById('btnMissThrow').addEventListener('click', () => {
        if (gameState.animating) return;
        gameState.animating = true;
        safePlaySound(playMissSound);
        clearThrowSelection();
        advanceDart();
    });

    document.getElementById('btnConfirmThrow').addEventListener('click', () => {
        if (gameState.animating) return;
        if (gameState.selectedSegment == null || gameState.selectedMultiplier == null) return;
        commitThrow(gameState.selectedSegment, gameState.selectedMultiplier);
    });
}

function updateThrowStatus() {
    const status = document.getElementById('throwStatus');
    const confirmBtn = document.getElementById('btnConfirmThrow');
    if (!status) return;

    const multNames = { 1: 'SINGLE', 2: 'DOUBLE', 3: 'TREBLE' };
    const numPart = gameState.selectedSegment != null ? gameState.selectedSegment : '—';
    const multPart = gameState.selectedMultiplier != null ? multNames[gameState.selectedMultiplier] : '—';
    status.textContent = `${multPart} ${numPart}`;

    const ready = gameState.selectedSegment != null && gameState.selectedMultiplier != null;
    if (confirmBtn) confirmBtn.disabled = !ready;
}

function clearThrowSelection() {
    gameState.selectedSegment = null;
    gameState.selectedMultiplier = null;
    document.querySelectorAll('.btn-mult').forEach(b => b.classList.remove('selected'));
    highlightSelectedSegment(null);
    updateThrowStatus();
}

// Highlight the currently-selected number's wedge on the dartboard so the
// player can see what they've picked before confirming.
function highlightSelectedSegment(number) {
    document.querySelectorAll('.dartboard-segment').forEach(el => {
        el.classList.toggle('segment-selected', number != null && parseInt(el.dataset.num) === number);
    });
}

// === GAMEPLAY: HANDLE A THROW ===
// Tapping the board only SELECTS a number — it doesn't commit the throw.
// The player can tap a different number or a different multiplier as many
// times as they like. Pressing ENTER (once both are chosen) commits it.

function handlePlayTap(number) {
    if (gameState.animating) return;
    gameState.selectedSegment = number;
    safePlaySound(playHoverSound);
    highlightSelectedSegment(number);
    updateThrowStatus();
}

function commitThrow(number, multiplier) {
    gameState.animating = true;

    const shooter = gameState.players[gameState.currentPlayerIdx];
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
        updatePlayerOverlays();
        clearThrowSelection();
        advanceDart();
    }
}

function handleSelfHit(shooter, multiplier) {
    if (shooter.isKiller) {
        // Self-hit while a killer removes lives (by the multiplier hit)
        // AND strips killer status immediately.
        shooter.lives = Math.max(0, shooter.lives - multiplier);
        shooter.isKiller = false;
        safePlaySound(playLoseKillerSound);
        flashCenterMessage(`${shooter.name} hit their own number — KILLER STATUS LOST (${shooter.lives} lives left)`, shooter.color);
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
        const wasKiller = target.isKiller;
        target.isKiller = false;
        safePlaySound(playHitSound);
        if (target.lives === 0) {
            flashCenterMessage(`${target.name} is down to 0 lives — one more hit eliminates them!`, target.color);
        } else if (wasKiller) {
            flashCenterMessage(`${target.name} lost a life and their KILLER status!`, target.color);
        }
    } else {
        // Already at 0 lives — this hit eliminates them.
        target.eliminated = true;
        safePlaySound(playEliminatedSound);
        flashCenterMessage(`${target.name} has been ELIMINATED!`, target.color);
    }

    // Any life loss — whether from a self-hit or being attacked — strips
    // killer status immediately (handled above for the attacked-target case).
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
    updatePlayerOverlays();
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
// The viewBox is larger than the wedge radius so badges can sit fully
// outside the dartboard without being clipped by the SVG's edge.
const BOARD_SIZE = 700;
const WEDGE_OUTER_R = 270;
const BADGE_R = 310; // where player killer/active badges sit, just outside the wedge

function renderDartboard(target, { onSegmentTap }) {
    const size = BOARD_SIZE;
    const cx = size / 2;
    const cy = size / 2;
    const segAngle = 360 / 20;

    let svg = `<svg viewBox="0 0 ${size} ${size}" class="dartboard-svg">`;

    DARTBOARD_ORDER.forEach((num, i) => {
        const startAngle = (i * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const endAngle = ((i + 1) * segAngle - 90 - segAngle / 2) * Math.PI / 180;
        const isBlack = i % 2 === 0;
        const baseColor = isBlack ? '#1a1a1a' : '#f5e6a3';
        const labelColor = isBlack ? '#f5e6a3' : '#1a1a1a';

        const d = segmentPathD(cx, cy, 20, WEDGE_OUTER_R, startAngle, endAngle);
        svg += `<path data-num="${num}" class="dartboard-segment" d="${d}" fill="${baseColor}"/>`;

        const labelAngle = (i * segAngle - 90) * Math.PI / 180;
        const lx = cx + 245 * Math.cos(labelAngle);
        const ly = cy + 245 * Math.sin(labelAngle);
        svg += `<text x="${lx}" y="${ly}" class="dartboard-label" fill="${labelColor}" text-anchor="middle" dominant-baseline="middle">${num}</text>`;
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

function arcPathD(cx, cy, r, startAngle, endAngle) {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2}`;
}

function segmentPathD(cx, cy, r1, r2, startAngle, endAngle) {
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);

    return `M${x1},${y1} L${x2},${y2} A${r2},${r2} 0 0,1 ${x3},${y3} L${x4},${y4} A${r1},${r1} 0 0,0 ${x1},${y1} Z`;
}
