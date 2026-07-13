/**
 * PenBar Snakes & Ladders - Board Renderer
 * 
 * Grid: 13 columns × 6 rows
 * Some cells are double-width (span 2 cols): CHAMPION, BIG MAMBA(62), JAKE(52), MONTY(42), STAIRWAY(13), START
 * Rows 3 & 4 have a "PENBAR" branded cell spanning 3 columns in the middle
 * Total: 64 numbered squares
 */

const GRID_COLS = 13;
const GRID_ROWS = 6;

// Board layout from TOP to BOTTOM (visual order on screen)
// Each cell: { num, span, type }
// type: 'normal' (default), 'champion', 'named', 'start', 'brand'
const BOARD_LAYOUT = [
    // ROW 6 (TOP) - Right to Left numbering
    // dw CHAMPION, 64, 63, dw 62, 61, 60, 59, 58, 57, 56, 55
    // Cols: 2+1+1+2+1+1+1+1+1+1+1 = 13 ✓
    [
        { num: 65, span: 2, type: 'champion' },
        { num: 64, span: 1 },
        { num: 63, span: 1 },
        { num: 62, span: 2, type: 'named', name: 'BIG MAMBA' },
        { num: 61, span: 1 },
        { num: 60, span: 1 },
        { num: 59, span: 1 },
        { num: 58, span: 1 },
        { num: 57, span: 1 },
        { num: 56, span: 1 },
        { num: 55, span: 1 },
    ],
    // ROW 5 - Left to Right numbering
    // 43, 44, 45, 46, 47, 48, 49, 50, 51, dw 52, 53, 54
    // Cols: 1+1+1+1+1+1+1+1+1+2+1+1 = 13 ✓
    [
        { num: 43, span: 1 },
        { num: 44, span: 1 },
        { num: 45, span: 1 },
        { num: 46, span: 1 },
        { num: 47, span: 1 },
        { num: 48, span: 1 },
        { num: 49, span: 1 },
        { num: 50, span: 1 },
        { num: 51, span: 1 },
        { num: 52, span: 2, type: 'named', name: 'JAKE\nTHE SNAKE' },
        { num: 53, span: 1 },
        { num: 54, span: 1 },
    ],
    // ROW 4 - Right to Left numbering
    // dw 42, 41, 40, 39, PENBAR(span3), 38, 37, 36, 35, 34
    // Cols: 2+1+1+1+3+1+1+1+1+1 = 13 ✓
    [
        { num: 42, span: 2, type: 'named', name: 'MONTY\nTHE PYTHON' },
        { num: 41, span: 1 },
        { num: 40, span: 1 },
        { num: 39, span: 1 },
        { num: 0, span: 3, type: 'brand' },
        { num: 38, span: 1 },
        { num: 37, span: 1 },
        { num: 36, span: 1 },
        { num: 35, span: 1 },
        { num: 34, span: 1 },
    ],
    // ROW 3 - Left to Right numbering
    // 24, 25, 26, 27, 28, PENBAR(span3), 29, 30, 31, 32, 33
    // Cols: 1+1+1+1+1+3+1+1+1+1+1 = 13 ✓
    [
        { num: 24, span: 1 },
        { num: 25, span: 1 },
        { num: 26, span: 1 },
        { num: 27, span: 1 },
        { num: 28, span: 1 },
        { num: 0, span: 3, type: 'brand' },
        { num: 29, span: 1 },
        { num: 30, span: 1 },
        { num: 31, span: 1 },
        { num: 32, span: 1 },
        { num: 33, span: 1 },
    ],
    // ROW 2 - Right to Left numbering
    // 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, dw 13, 12
    // Cols: 1+1+1+1+1+1+1+1+1+1+2+1 = 13 ✓
    [
        { num: 23, span: 1 },
        { num: 22, span: 1 },
        { num: 21, span: 1 },
        { num: 20, span: 1 },
        { num: 19, span: 1 },
        { num: 18, span: 1 },
        { num: 17, span: 1 },
        { num: 16, span: 1 },
        { num: 15, span: 1 },
        { num: 14, span: 1 },
        { num: 13, span: 2, type: 'named', name: 'STAIRWAY\nTO HEAVEN' },
        { num: 12, span: 1 },
    ],
    // ROW 1 (BOTTOM) - Left to Right numbering
    // dw START, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    // Cols: 2+1+1+1+1+1+1+1+1+1+1+1 = 13 ✓
    [
        { num: 0, span: 2, type: 'start' },
        { num: 1, span: 1 },
        { num: 2, span: 1 },
        { num: 3, span: 1 },
        { num: 4, span: 1 },
        { num: 5, span: 1 },
        { num: 6, span: 1 },
        { num: 7, span: 1 },
        { num: 8, span: 1 },
        { num: 9, span: 1 },
        { num: 10, span: 1 },
        { num: 11, span: 1 },
    ],
];

// Square count: 11+10+12+10+12+10 = 65? Let me count:
// Row 6: 64,63,62,61,60,59,58,57,56,55 = 10 (champion is not numbered)
// Row 5: 43,44,45,46,47,48,49,50,51,52,53,54 = 12
// Row 4: 42,41,40,39,38,37,36,35,34 = 9 (brand not numbered)
// Row 3: 24,25,26,27,28,29,30,31,32,33 = 10 (brand not numbered)
// Row 2: 23,22,21,20,19,18,17,16,15,14,13,12 = 12
// Row 1: 1,2,3,4,5,6,7,8,9,10,11 = 11 (start not numbered)
// Total: 10+12+9+10+12+11 = 64 ✓

// Snakes: head → tail (you go DOWN)
// headAlign: horizontal position ('left', 'right', 'center')
// headVAlign: vertical position ('top', 'bottom', 'center')
const SNAKES = {
    62: { to: 1, name: "BIG MAMBA", headAlign: 'left', headVAlign: 'bottom' },
    52: { to: 33, name: "JAKE THE SNAKE", headAlign: 'right', headVAlign: 'bottom', flipWave: true, tailAlign: 'left', tailVAlign: 'bottom' },
    42: { to: 1, name: "MONTY THE PYTHON", headAlign: 'left', headVAlign: 'bottom' },
    16: { to: 5, name: "" },
    30: { to: 9, name: "" },
    60: { to: 49, name: "" },
};

// Ladders: bottom → top (you go UP)
// bottomAlign/bottomVAlign: position offset for the ladder base
// topAlign/topVAlign: position offset for the ladder top
const LADDERS = {
    13: { to: 58, name: "STAIRWAY TO HEAVEN", bottomAlign: 'far-left', bottomVAlign: 'top', topAlign: 'left', topVAlign: 'bottom' },
    3:  { to: 18, name: "" },
    45: { to: 64, name: "" },
    7:  { to: 14, name: "" },
    35: { to: 56, name: "" },
    25: { to: 46, name: "" },
};

// === RENDER BOARD ===

function renderBoard() {
    const grid = document.getElementById('boardGrid');
    grid.innerHTML = '';
    
    grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;
    
    BOARD_LAYOUT.forEach((row, rowIndex) => {
        let colPos = 0;
        row.forEach(cell => {
            const square = document.createElement('div');
            square.classList.add('board-square');
            
            const span = cell.span || 1;
            if (span > 1) {
                square.style.gridColumn = `span ${span}`;
            }
            
            // Determine color
            // Double-width and special cells get white background
            const isSpecial = cell.type && cell.type !== 'normal';
            if (isSpecial) {
                square.classList.add('color-white');
            } else {
                // Alternate based on column position + row
                const isYellow = (colPos + rowIndex) % 2 === 0;
                square.classList.add(isYellow ? 'color-yellow' : 'color-cream');
            }
            
            colPos += span;
            
            // Render content based on type
            switch (cell.type) {
                case 'champion':
                    square.classList.add('square-champion');
                    square.dataset.square = '65';
                    square.innerHTML = `
                        <span class="square-number">65</span>
                        <div class="champion-content">
                            <div class="trophy">🏆</div>
                            <div class="champion-text">PENBAR CHAMPION</div>
                        </div>
                    `;
                    break;
                    
                case 'start':
                    square.classList.add('square-start');
                    square.innerHTML = `
                        <span class="start-text">START<br>HERE</span>
                        <span class="start-arrow">➜</span>
                    `;
                    break;
                    
                case 'named':
                    square.classList.add('named-square');
                    square.dataset.square = cell.num;
                    const nameHtml = (cell.name || '').replace(/\n/g, '<br>');
                    square.innerHTML = `
                        <span class="square-number">${cell.num}</span>
                        <span class="named-label">${nameHtml}</span>
                    `;
                    break;
                    
                case 'brand':
                    square.classList.add('square-brand');
                    break;
                    
                default:
                    square.dataset.square = cell.num;
                    square.innerHTML = `<span class="square-number">${cell.num}</span>`;
                    break;
            }
            
            grid.appendChild(square);
        });
    });
}

// === GET SQUARE CENTER FOR SVG DRAWING ===

function getSquareCenter(squareNum, align, vAlign) {
    const el = document.querySelector(`[data-square="${squareNum}"]`);
    if (!el) return null;
    
    const grid = document.getElementById('boardGrid');
    const gridRect = grid.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    
    let x;
    if (align === 'far-left') {
        x = elRect.left - gridRect.left + elRect.width * 0.15;
    } else if (align === 'left') {
        x = elRect.left - gridRect.left + elRect.width * 0.25;
    } else if (align === 'right') {
        x = elRect.left - gridRect.left + elRect.width * 0.75;
    } else {
        x = elRect.left - gridRect.left + elRect.width / 2;
    }
    
    let y;
    if (vAlign === 'top') {
        y = elRect.top - gridRect.top + elRect.height * 0.25;
    } else if (vAlign === 'bottom') {
        y = elRect.top - gridRect.top + elRect.height * 0.75;
    } else {
        y = elRect.top - gridRect.top + elRect.height / 2;
    }
    
    return { x, y };
}

// === STORED PATHS FOR ANIMATION ===
// These get populated when snakes/ladders are drawn
const drawnPaths = {
    snakes: {},  // key = head square, value = SVG path string
    ladders: {}, // key = bottom square, value = { x1,y1,x2,y2 }
};

// === RENDER SNAKES ===

function renderSnakes() {
    const svg = document.getElementById('overlaySvg');
    const grid = document.getElementById('boardGrid');
    const gridRect = grid.getBoundingClientRect();
    
    svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
    
    Object.entries(SNAKES).forEach(([head, { to, headAlign, headVAlign, flipWave, tailAlign, tailVAlign }]) => {
        const headCenter = getSquareCenter(parseInt(head), headAlign, headVAlign);
        const tailCenter = getSquareCenter(to, tailAlign, tailVAlign);
        
        if (!headCenter || !tailCenter) return;
        
        const x1 = headCenter.x;
        const y1 = headCenter.y;
        const x2 = tailCenter.x;
        const y2 = tailCenter.y;
        
        const path = createSnakePath(x1, y1, x2, y2, flipWave);
        
        // Store path for animation
        drawnPaths.snakes[parseInt(head)] = path;
        
        // Shadow
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        shadow.setAttribute('d', path);
        shadow.setAttribute('class', 'snake-body-detail');
        svg.appendChild(shadow);
        
        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        body.setAttribute('d', path);
        body.setAttribute('class', 'snake-body');
        svg.appendChild(body);
        
        // Pattern
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pattern.setAttribute('d', path);
        pattern.setAttribute('class', 'snake-pattern');
        svg.appendChild(pattern);
        
        // Head
        const headCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        headCircle.setAttribute('cx', x1);
        headCircle.setAttribute('cy', y1);
        headCircle.setAttribute('r', 9);
        headCircle.setAttribute('class', 'snake-head');
        svg.appendChild(headCircle);
        
        // Eyes
        const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eye1.setAttribute('cx', x1 - 3);
        eye1.setAttribute('cy', y1 - 3);
        eye1.setAttribute('r', 2);
        eye1.setAttribute('class', 'snake-eye');
        svg.appendChild(eye1);
        
        const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eye2.setAttribute('cx', x1 + 3);
        eye2.setAttribute('cy', y1 - 3);
        eye2.setAttribute('r', 2);
        eye2.setAttribute('class', 'snake-eye');
        svg.appendChild(eye2);
    });
}

function createSnakePath(x1, y1, x2, y2, flipWave) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const waveAmplitude = Math.min(28, dist * 0.09);
    const numCurves = Math.max(4, Math.floor(dist / 40));
    const flipDir = flipWave ? -1 : 1;
    
    let path = `M ${x1} ${y1}`;
    
    for (let i = 0; i < numCurves; i++) {
        const t1 = (i + 0.5) / numCurves;
        const t2 = (i + 1) / numCurves;
        
        const midX = x1 + dx * t1;
        const midY = y1 + dy * t1;
        const endX = x1 + dx * t2;
        const endY = y1 + dy * t2;
        
        const perpX = -dy / dist * waveAmplitude * (i % 2 === 0 ? 1 : -1) * flipDir;
        const perpY = dx / dist * waveAmplitude * (i % 2 === 0 ? 1 : -1) * flipDir;
        
        const cpX = midX + perpX;
        const cpY = midY + perpY;
        
        path += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
    }
    
    return path;
}

// === RENDER LADDERS ===

function renderLadders() {
    const svg = document.getElementById('overlaySvg');
    
    Object.entries(LADDERS).forEach(([bottom, { to, bottomAlign, bottomVAlign, topAlign, topVAlign }]) => {
        const bottomCenter = getSquareCenter(parseInt(bottom), bottomAlign, bottomVAlign);
        const topCenter = getSquareCenter(to, topAlign, topVAlign);
        
        if (!bottomCenter || !topCenter) return;
        
        // Store for animation
        drawnPaths.ladders[parseInt(bottom)] = { x1: bottomCenter.x, y1: bottomCenter.y, x2: topCenter.x, y2: topCenter.y };
        
        const x1 = bottomCenter.x;
        const y1 = bottomCenter.y;
        const x2 = topCenter.x;
        const y2 = topCenter.y;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const perpX = (-dy / dist) * 7;
        const perpY = (dx / dist) * 7;
        
        // Left rail
        const rail1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rail1.setAttribute('x1', x1 + perpX);
        rail1.setAttribute('y1', y1 + perpY);
        rail1.setAttribute('x2', x2 + perpX);
        rail1.setAttribute('y2', y2 + perpY);
        rail1.setAttribute('class', 'ladder-rail');
        svg.appendChild(rail1);
        
        // Right rail
        const rail2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rail2.setAttribute('x1', x1 - perpX);
        rail2.setAttribute('y1', y1 - perpY);
        rail2.setAttribute('x2', x2 - perpX);
        rail2.setAttribute('y2', y2 - perpY);
        rail2.setAttribute('class', 'ladder-rail');
        svg.appendChild(rail2);
        
        // Rungs
        const numRungs = Math.max(3, Math.floor(dist / 22));
        for (let i = 1; i <= numRungs; i++) {
            const t = i / (numRungs + 1);
            const rx = x1 + dx * t;
            const ry = y1 + dy * t;
            
            const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            rung.setAttribute('x1', rx + perpX);
            rung.setAttribute('y1', ry + perpY);
            rung.setAttribute('x2', rx - perpX);
            rung.setAttribute('y2', ry - perpY);
            rung.setAttribute('class', 'ladder-rung');
            svg.appendChild(rung);
        }
    });
}

// === RENDER DARTBOARD OVERLAY ===

function renderDartboard() {
    const brandCells = document.querySelectorAll('.square-brand');
    if (brandCells.length < 2) return;
    
    const grid = document.getElementById('boardGrid');
    const gridRect = grid.getBoundingClientRect();
    const firstRect = brandCells[0].getBoundingClientRect();
    const lastRect = brandCells[1].getBoundingClientRect();
    
    const top = Math.min(firstRect.top, lastRect.top) - gridRect.top;
    const left = Math.min(firstRect.left, lastRect.left) - gridRect.left;
    const bottom = Math.max(firstRect.bottom, lastRect.bottom) - gridRect.top;
    const right = Math.max(firstRect.right, lastRect.right) - gridRect.left;
    
    const width = right - left;
    const height = bottom - top;
    
    // Remove existing overlay
    const existing = document.querySelector('.dartboard-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.classList.add('dartboard-overlay');
    overlay.style.top = top + 'px';
    overlay.style.left = left + 'px';
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
    
    const svgSize = Math.min(width - 10, height - 30);
    overlay.innerHTML = `
        <svg viewBox="0 0 200 200" width="${svgSize}" height="${svgSize}">
            <defs>
                <path id="penbarArc" d="M 25,115 A 75,75 0 0,1 175,115" fill="none"/>
                <path id="snakesArc" d="M 15,100 A 85,85 0 0,0 185,100" fill="none"/>
            </defs>
            ${createDartboardSVG()}
            <text font-family="'Permanent Marker', cursive" font-size="36" fill="#ffffff" letter-spacing="4" stroke="#000000" stroke-width="3" paint-order="stroke fill">
                <textPath href="#penbarArc" startOffset="50%" text-anchor="middle">PenBar</textPath>
            </text>
            <text font-family="'Permanent Marker', 'Arial', cursive" font-size="26" fill="#ffffff" letter-spacing="2" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">
                <textPath href="#snakesArc" startOffset="50%" text-anchor="middle">Snakes &amp; Ladders</textPath>
            </text>
        </svg>
    `;
    
    document.querySelector('.game-container').appendChild(overlay);
}

function createDartboardSVG() {
    const cx = 100, cy = 100;
    // Standard dartboard number order
    const numbers = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
    const segAngle = 360 / 20;
    
    let svg = '';
    
    // Outer black ring
    svg += `<circle cx="${cx}" cy="${cy}" r="98" fill="#1a1a1a" stroke="#888" stroke-width="1"/>`;
    
    // Draw segments
    numbers.forEach((num, i) => {
        const startAngle = (i * segAngle - 90 - segAngle/2) * Math.PI / 180;
        const endAngle = ((i + 1) * segAngle - 90 - segAngle/2) * Math.PI / 180;
        
        const isBlack = i % 2 === 0;
        const baseColor = isBlack ? '#1a1a1a' : '#f5e6a3';
        const doubleColor = isBlack ? '#c0392b' : '#1a8c3a';
        const tripleColor = isBlack ? '#c0392b' : '#1a8c3a';
        
        // Double ring (outer)
        svg += createSegment(cx, cy, 88, 95, startAngle, endAngle, doubleColor);
        // Outer single
        svg += createSegment(cx, cy, 55, 88, startAngle, endAngle, baseColor);
        // Triple ring
        svg += createSegment(cx, cy, 50, 55, startAngle, endAngle, tripleColor);
        // Inner single
        svg += createSegment(cx, cy, 20, 50, startAngle, endAngle, baseColor);
        
        // Number labels
        const labelAngle = (i * segAngle - 90) * Math.PI / 180;
        const lx = cx + 93 * Math.cos(labelAngle);
        const ly = cy + 93 * Math.sin(labelAngle);
    });
    
    // Outer bull (green)
    svg += `<circle cx="${cx}" cy="${cy}" r="20" fill="#1a8c3a" stroke="#888" stroke-width="0.5"/>`;
    // Inner bull (red)
    svg += `<circle cx="${cx}" cy="${cy}" r="8" fill="#c0392b" stroke="#888" stroke-width="0.5"/>`;
    
    // Wire rings
    svg += `<circle cx="${cx}" cy="${cy}" r="95" fill="none" stroke="#aaa" stroke-width="0.5"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke="#aaa" stroke-width="0.5"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#aaa" stroke-width="0.5"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="#aaa" stroke-width="0.5"/>`;
    
    // Wire spokes
    for (let i = 0; i < 20; i++) {
        const angle = (i * segAngle - 90 - segAngle/2) * Math.PI / 180;
        const x1 = cx + 20 * Math.cos(angle);
        const y1 = cy + 20 * Math.sin(angle);
        const x2 = cx + 95 * Math.cos(angle);
        const y2 = cy + 95 * Math.sin(angle);
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#aaa" stroke-width="0.3"/>`;
    }
    
    return svg;
}

function createSegment(cx, cy, r1, r2, startAngle, endAngle, fill) {
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);
    
    return `<path d="M${x1},${y1} L${x2},${y2} A${r2},${r2} 0 0,1 ${x3},${y3} L${x4},${y4} A${r1},${r1} 0 0,0 ${x1},${y1} Z" fill="${fill}"/>`;
}

// === INITIALIZE ===

function init() {
    renderBoard();
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            renderDartboard();
            renderLadders();
            renderSnakes();
        });
    });
}

window.addEventListener('resize', () => {
    const svg = document.getElementById('overlaySvg');
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);
    renderLadders();
    renderSnakes();
    renderDartboard();
});

document.addEventListener('DOMContentLoaded', () => {
    // Wait for fonts to load before rendering
    document.fonts.ready.then(() => {
        init();
    });
});
