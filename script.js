// ============================================
// Chef Mohammed Isefan - Website Scripts
// ============================================

// --- Nav ---
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
});

const navBurger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

navBurger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// --- Scroll reveal ---
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.about-layout, .video-card, .jimmy-card, .ig-card, .contact-card, .booking-inner, .game-wrapper').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// --- Easter egg: click footer quote 7 times ---
let eggClicks = 0;
const footerQuote = document.getElementById('footerQuote');
const egg = document.getElementById('egg');

if (footerQuote && egg) {
    footerQuote.addEventListener('click', () => {
        eggClicks++;
        if (eggClicks >= 7) {
            egg.classList.add('show');
            eggClicks = 0;
        }
    });
    egg.addEventListener('click', (e) => {
        if (e.target === egg) egg.classList.remove('show');
    });
}

// --- Booking form -> WhatsApp ---
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('bookName').value;
        const phone = document.getElementById('bookPhone').value;
        const type = document.getElementById('bookType').value;
        const date = document.getElementById('bookDate').value;
        const guests = document.getElementById('bookGuests').value;
        const msg = document.getElementById('bookMsg').value;

        const text = encodeURIComponent(
            `Hi Chef Mohammed! I'd like to make a booking.\n\n` +
            `Name: ${name}\n` +
            `Phone: ${phone}\n` +
            `Event: ${type}\n` +
            `Date: ${date}\n` +
            `Guests: ${guests}\n` +
            `Details: ${msg || 'N/A'}`
        );

        window.open(`https://wa.me/972527726892?text=${text}`, '_blank');
        bookingForm.reset();
    });
}

// --- Console easter egg ---
console.log('%c OKYANKI ', 'background: #b45309; color: #fff; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');


// ============================================
// JIMMY'S STRAWBERRY RUSH - Mini Game
// ============================================

(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const startBtn = document.getElementById('gameStart');
    const restartBtn = document.getElementById('gameRestart');
    const gameOverScreen = document.getElementById('gameOver');
    const scoreEl = document.getElementById('gameScore');
    const timerEl = document.getElementById('gameTimer');
    const bestEl = document.getElementById('gameBest');
    const finalScoreEl = document.getElementById('finalScore');
    const ctrlLeft = document.getElementById('ctrlLeft');
    const ctrlRight = document.getElementById('ctrlRight');

    let W = canvas.width;
    let H = canvas.height;
    let scale = 1;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        scale = W / rect.width;
    }
    resize();
    window.addEventListener('resize', resize);

    // Game state
    let running = false;
    let score = 0;
    let timeLeft = 30;
    let bestScore = parseInt(localStorage.getItem('jimmyBest') || '0');
    let timerInterval = null;
    let animFrame = null;
    bestEl.textContent = bestScore;

    // Jimmy (player)
    const jimmy = {
        x: W / 2 - 25,
        y: H - 70,
        w: 50,
        h: 60,
        speed: 6,
        dx: 0
    };

    // Strawberries
    let strawberries = [];
    let spawnTimer = 0;
    let spawnRate = 40; // frames between spawns

    // Leaves (decorative falling particles)
    let leaves = [];

    function spawnStrawberry() {
        const size = 22 + Math.random() * 12;
        strawberries.push({
            x: Math.random() * (W - size * 2) + size,
            y: -size,
            size: size,
            speed: 2 + Math.random() * 2.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.03 + Math.random() * 0.03
        });
    }

    function spawnLeaf() {
        if (leaves.length > 8) return;
        leaves.push({
            x: Math.random() * W,
            y: -10,
            size: 6 + Math.random() * 8,
            speed: 0.5 + Math.random() * 1,
            drift: Math.random() * 2 - 1,
            alpha: 0.3 + Math.random() * 0.3
        });
    }

    // Drawing functions
    function drawSky() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.55, '#b4e0f7');
        grad.addColorStop(0.6, '#4a7c2e');
        grad.addColorStop(1, '#3d6b25');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Greenhouse rows (subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const rowY = H * 0.62 + i * 18;
            ctx.beginPath();
            ctx.moveTo(0, rowY);
            ctx.lineTo(W, rowY);
            ctx.stroke();
        }
    }

    function drawJimmy() {
        const x = jimmy.x;
        const y = jimmy.y;
        const w = jimmy.w;
        const h = jimmy.h;

        // Body (yellow shirt)
        ctx.fillStyle = '#f5d063';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 20, w - 16, h - 28, 6);
        ctx.fill();

        // Head
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 14, 14, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 10, 14, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 5, y + 14, 2, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + 5, y + 14, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 17, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Legs
        ctx.fillStyle = '#4a6fa5';
        ctx.fillRect(x + 12, y + h - 12, 10, 12);
        ctx.fillRect(x + w - 22, y + h - 12, 10, 12);

        // Shoes
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 10, y + h - 2, 14, 4);
        ctx.fillRect(x + w - 24, y + h - 2, 14, 4);

        // Hands holding basket
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath();
        ctx.arc(x + 4, y + 36, 5, 0, Math.PI * 2);
        ctx.arc(x + w - 4, y + 36, 5, 0, Math.PI * 2);
        ctx.fill();

        // Basket
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 34);
        ctx.lineTo(x + w + 2, y + 34);
        ctx.lineTo(x + w - 6, y + 46);
        ctx.lineTo(x + 6, y + 46);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6d5210';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Strawberries in basket based on score
        const berryCount = Math.min(score, 5);
        for (let i = 0; i < berryCount; i++) {
            drawMiniStrawberry(x + 8 + i * 8, y + 36, 6);
        }
    }

    function drawMiniStrawberry(x, y, s) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.3);
        ctx.quadraticCurveTo(x + s, y - s * 0.3, x + s * 0.7, y + s);
        ctx.quadraticCurveTo(x, y + s * 1.3, x - s * 0.7, y + s);
        ctx.quadraticCurveTo(x - s, y - s * 0.3, x, y - s * 0.3);
        ctx.fill();
    }

    function drawStrawberry(s) {
        const x = s.x;
        const y = s.y;
        const sz = s.size;

        // Leaf top
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(x - 4, y - sz * 0.4, 6, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 4, y - sz * 0.4, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Berry body
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(x, y - sz * 0.5);
        ctx.quadraticCurveTo(x + sz, y, x + sz * 0.5, y + sz * 0.7);
        ctx.quadraticCurveTo(x, y + sz, x - sz * 0.5, y + sz * 0.7);
        ctx.quadraticCurveTo(x - sz, y, x, y - sz * 0.5);
        ctx.fill();

        // Seeds
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 4; i++) {
            const sx = x + (Math.cos(i * 1.5 + 0.5) * sz * 0.3);
            const sy = y + (Math.sin(i * 1.2) * sz * 0.25) + sz * 0.1;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 1.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x - sz * 0.15, y - sz * 0.1, sz * 0.12, sz * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLeaf(l) {
        ctx.globalAlpha = l.alpha;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(l.x, l.y, l.size, l.size * 0.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Collision
    function collides(s) {
        const jx = jimmy.x;
        const jy = jimmy.y + 30; // basket area
        const jw = jimmy.w;
        const jh = 20;
        return s.x > jx - 4 && s.x < jx + jw + 4 && s.y + s.size * 0.5 > jy && s.y - s.size * 0.5 < jy + jh;
    }

    // Input
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && running) e.preventDefault();
    });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });

    // Mobile controls
    let touchDir = 0;
    if (ctrlLeft) {
        ctrlLeft.addEventListener('touchstart', (e) => { e.preventDefault(); touchDir = -1; });
        ctrlLeft.addEventListener('touchend', () => { touchDir = 0; });
        ctrlLeft.addEventListener('mousedown', () => { touchDir = -1; });
        ctrlLeft.addEventListener('mouseup', () => { touchDir = 0; });
    }
    if (ctrlRight) {
        ctrlRight.addEventListener('touchstart', (e) => { e.preventDefault(); touchDir = 1; });
        ctrlRight.addEventListener('touchend', () => { touchDir = 0; });
        ctrlRight.addEventListener('mousedown', () => { touchDir = 1; });
        ctrlRight.addEventListener('mouseup', () => { touchDir = 0; });
    }

    // Game loop
    function update() {
        // Input
        jimmy.dx = 0;
        if (keys['ArrowLeft'] || keys['a']) jimmy.dx = -jimmy.speed;
        if (keys['ArrowRight'] || keys['d']) jimmy.dx = jimmy.speed;
        if (touchDir !== 0) jimmy.dx = touchDir * jimmy.speed;

        jimmy.x += jimmy.dx;
        if (jimmy.x < 0) jimmy.x = 0;
        if (jimmy.x + jimmy.w > W) jimmy.x = W - jimmy.w;

        // Spawn
        spawnTimer++;
        if (spawnTimer >= spawnRate) {
            spawnStrawberry();
            spawnTimer = 0;
            // Speed up over time
            if (spawnRate > 18) spawnRate -= 0.3;
        }
        if (Math.random() < 0.02) spawnLeaf();

        // Move strawberries
        for (let i = strawberries.length - 1; i >= 0; i--) {
            const s = strawberries[i];
            s.y += s.speed;
            s.wobble += s.wobbleSpeed;
            s.x += Math.sin(s.wobble) * 0.5;

            if (collides(s)) {
                score++;
                scoreEl.textContent = score;
                strawberries.splice(i, 1);
                continue;
            }

            if (s.y > H + 20) {
                strawberries.splice(i, 1);
            }
        }

        // Move leaves
        for (let i = leaves.length - 1; i >= 0; i--) {
            const l = leaves[i];
            l.y += l.speed;
            l.x += l.drift;
            if (l.y > H + 10) leaves.splice(i, 1);
        }
    }

    function draw() {
        drawSky();

        // Leaves behind everything
        leaves.forEach(drawLeaf);

        // Strawberries
        strawberries.forEach(drawStrawberry);

        // Jimmy
        drawJimmy();
    }

    function loop() {
        if (!running) return;
        update();
        draw();
        animFrame = requestAnimationFrame(loop);
    }

    function startGame() {
        score = 0;
        timeLeft = 30;
        spawnRate = 40;
        spawnTimer = 0;
        strawberries = [];
        leaves = [];
        jimmy.x = W / 2 - 25;
        scoreEl.textContent = '0';
        timerEl.textContent = '30';
        gameOverScreen.classList.remove('show');
        startBtn.classList.add('hidden');
        running = true;

        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 0) endGame();
        }, 1000);

        loop();
    }

    function endGame() {
        running = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(animFrame);

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('jimmyBest', bestScore.toString());
            bestEl.textContent = bestScore;
        }

        finalScoreEl.textContent = score;
        gameOverScreen.classList.add('show');
    }

    // Draw initial state
    drawSky();
    drawJimmy();

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
})();
