// ============================================
// Chef Mohammed Isefan — Scripts
// ============================================

// --- Nav scroll ---
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
});

// --- Mobile menu ---
const burger = document.getElementById('navBurger');
const links = document.getElementById('navLinks');
burger.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

// --- Scroll reveal ---
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('vis');
            revealObs.unobserve(e.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObs.observe(el));

// --- Easter egg: 7 clicks on footer quote ---
let eggN = 0;
const fq = document.getElementById('footerQuote');
const egg = document.getElementById('egg');
if (fq && egg) {
    fq.addEventListener('click', () => {
        eggN++;
        if (eggN >= 7) { egg.classList.add('show'); eggN = 0; }
    });
    egg.addEventListener('click', (e) => {
        if (e.target === egg) egg.classList.remove('show');
    });
}

// --- Booking form → WhatsApp ---
const bookForm = document.getElementById('bookingForm');
if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('bookName').value.trim();
        const phone = document.getElementById('bookPhone').value.trim();
        const type = document.getElementById('bookType').value;
        const date = document.getElementById('bookDate').value;
        const guests = document.getElementById('bookGuests').value;
        const msg = document.getElementById('bookMsg').value.trim();

        const lines = [
            'Hi Chef Mohammed! I\'d like to make a booking.',
            '',
            'Name: ' + name,
            'Phone: ' + phone,
            'Event: ' + type,
            'Date: ' + date,
            'Guests: ' + guests,
        ];
        if (msg) lines.push('Details: ' + msg);

        const text = encodeURIComponent(lines.join('\n'));
        window.open('https://api.whatsapp.com/send?phone=972527726892&text=' + text, '_blank');
    });
}

// --- Background music ---
const musicBtn = document.getElementById('musicToggle');
if (musicBtn) {
    const musicLabel = musicBtn.querySelector('.music-label');
    // Royalty-free kitchen/lofi ambient
    const audio = new Audio('https://cdn.pixabay.com/audio/2024/11/01/audio_1a2b3c4d5e.mp3');
    audio.loop = true;
    audio.volume = 0.3;

    // Try multiple free sources as fallback
    const sources = [
        'https://cdn.pixabay.com/audio/2022/10/25/audio_56c1e5b001.mp3',
        'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
        'https://cdn.pixabay.com/audio/2021/11/25/audio_cb4b9e438b.mp3'
    ];
    let srcIndex = 0;

    audio.addEventListener('error', () => {
        if (srcIndex < sources.length) {
            audio.src = sources[srcIndex++];
            if (musicBtn.classList.contains('playing')) audio.play().catch(() => {});
        }
    });

    let playing = false;
    musicBtn.addEventListener('click', () => {
        if (playing) {
            audio.pause();
            musicBtn.classList.remove('playing');
            musicLabel.textContent = 'Play Music';
        } else {
            audio.play().catch(() => {
                // Try next source on failure
                if (srcIndex < sources.length) {
                    audio.src = sources[srcIndex++];
                    audio.play().catch(() => {});
                }
            });
            musicBtn.classList.add('playing');
            musicLabel.textContent = 'Playing';
        }
        playing = !playing;
    });
}

// --- Console ---
console.log('%c OKYANKI ', 'background:#C67B5C;color:#fff;font-size:24px;font-weight:bold;padding:10px 20px;border-radius:8px;');

// ============================================
// JIMMY'S STRAWBERRY RUSH — v2.0
// Particles, power-ups, combos, screen shake,
// Web Audio SFX, star rating, rotten berries
// ============================================
(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('gameStart');
    const startScreen = document.getElementById('gameStartScreen');
    const restartBtn = document.getElementById('gameRestart');
    const overScreen = document.getElementById('gameOver');
    const scoreEl = document.getElementById('gameScore');
    const comboEl = document.getElementById('gameCombo');
    const hudCombo = document.getElementById('hudCombo');
    const timerEl = document.getElementById('gameTimer');
    const bestEl = document.getElementById('gameBest');
    const finalEl = document.getElementById('finalScore');
    const goTitle = document.getElementById('goTitle');
    const goMsg = document.getElementById('goMsg');
    const goStars = document.getElementById('goStars');
    const ctrlL = document.getElementById('ctrlLeft');
    const ctrlR = document.getElementById('ctrlRight');

    const W = canvas.width, H = canvas.height;
    const GAME_TIME = 45;

    // --- Web Audio SFX (pooled) ---
    let audioCtx = null;
    function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    let lastSfxTime = 0;
    function playTone(freq, dur, type, vol) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        if (now - lastSfxTime < 0.03) return; // throttle rapid SFX
        lastSfxTime = now;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.value = vol || 0.12;
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now); o.stop(now + dur + 0.01);
        o.onended = () => { o.disconnect(); g.disconnect(); };
    }
    function sfxCollect() { playTone(880, 0.1, 'sine', 0.12); }
    function sfxGold() { playTone(1500, 0.12, 'sine', 0.1); }
    function sfxMagnet() { playTone(500, 0.2, 'sine', 0.08); }
    function sfxRotten() { playTone(200, 0.15, 'sawtooth', 0.08); }
    function sfxCombo() { playTone(1100, 0.1, 'sine', 0.1); }
    function sfxEnd() { playTone(330, 0.4, 'sine', 0.12); }

    // --- State ---
    let running = false, score = 0, timeLeft = GAME_TIME;
    let combo = 0, maxCombo = 0, comboTimer = 0;
    let spawnRate = 50, spawnTimer = 0, frame = 0;
    let bestScore = parseInt(localStorage.getItem('jimmyBest2') || '0');
    let timerInterval = null, animFrame = null;
    let items = [], particles = [], floatTexts = [], bgStars = [];
    let shakeX = 0, shakeY = 0, shakeDur = 0;
    let magnetActive = false, magnetTimer = 0;
    bestEl.textContent = bestScore;

    // Item types: 'berry', 'golden', 'rotten', 'magnet'
    const jimmy = { x: W/2 - 28, y: H - 78, w: 56, h: 68, speed: 4.5, dx: 0, vx: 0 };

    // Pre-gen background stars
    for (let i = 0; i < 60; i++) bgStars.push({ x: Math.random()*W, y: Math.random()*H*0.55, r: 0.5+Math.random()*1.5, tw: Math.random()*Math.PI*2 });

    // --- Spawning ---
    function spawnItem() {
        const r = Math.random();
        let type = 'berry';
        if (frame > 120) { // After 2 seconds
            if (r < 0.08) type = 'golden';
            else if (r < 0.2) type = 'rotten';
            else if (r < 0.24 && !magnetActive) type = 'magnet';
        }
        const sz = type === 'magnet' ? 20 : (20 + Math.random() * 10);
        items.push({
            x: 30 + Math.random() * (W - 60), y: -sz - 10,
            size: sz, speed: 1.2 + Math.random() * 1.2 + frame * 0.0004,
            wobble: Math.random() * Math.PI * 2,
            ws: 0.025 + Math.random() * 0.025,
            type: type, rot: 0
        });
    }

    // --- Particles (capped) ---
    const MAX_PARTICLES = 40;
    function burst(x, y, color, count, spread) {
        const actual = Math.min(count, MAX_PARTICLES - particles.length);
        for (let i = 0; i < actual; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * spread;
            particles.push({
                x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 1,
                life: 20 + Math.random()*10, maxLife: 30,
                r: 2 + Math.random()*2, color, gravity: 0.08
            });
        }
    }

    function addFloatText(x, y, text, color) {
        floatTexts.push({ x, y, text, color, life: 40, maxLife: 40 });
    }

    // --- Drawing ---
    function drawBg() {
        // Night sky gradient
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0f0f23');
        g.addColorStop(0.35, '#1a1a3e');
        g.addColorStop(0.55, '#1a2a1a');
        g.addColorStop(0.6, '#2d5a1e');
        g.addColorStop(1, '#1e4a14');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Stars
        bgStars.forEach(s => {
            s.tw += 0.02;
            const a = 0.3 + Math.sin(s.tw) * 0.3;
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Moon
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.arc(W - 80, 60, 28, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f0f23';
        ctx.beginPath(); ctx.arc(W - 70, 55, 24, 0, Math.PI*2); ctx.fill();

        // Greenhouse rows
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, H*0.6 + i*16);
            ctx.lineTo(W, H*0.6 + i*16);
            ctx.stroke();
        }

        // Ground glow
        if (magnetActive) {
            ctx.fillStyle = 'rgba(139,92,246,0.06)';
            ctx.fillRect(0, H*0.58, W, H*0.42);
        }
    }

    function drawJimmy() {
        const x = jimmy.x, y = jimmy.y, w = jimmy.w, h = jimmy.h;
        const cx = x + w/2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(cx, y+h+2, 24, 6, 0, 0, Math.PI*2); ctx.fill();

        // Magnet aura
        if (magnetActive) {
            ctx.strokeStyle = 'rgba(139,92,246,' + (0.3 + Math.sin(frame*0.1)*0.2) + ')';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(cx, y+h/2, 44, 0, Math.PI*2); ctx.stroke();
            ctx.lineWidth = 1;
        }

        // Body (yellow shirt)
        const bodyG = ctx.createLinearGradient(x+8, y+18, x+8, y+h-10);
        bodyG.addColorStop(0, '#f5d063'); bodyG.addColorStop(1, '#e6b830');
        ctx.fillStyle = bodyG;
        ctx.beginPath(); ctx.roundRect(x+10, y+22, w-20, h-32, 8); ctx.fill();

        // Head
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath(); ctx.arc(cx, y+15, 16, 0, Math.PI*2); ctx.fill();

        // Hair
        ctx.fillStyle = '#2d1f14';
        ctx.beginPath(); ctx.arc(cx, y+10, 16, Math.PI, Math.PI*2); ctx.fill();
        ctx.fillRect(cx-16, y+6, 32, 6);

        // Eyes (blink every ~3s)
        const blinking = Math.floor(frame/180) % 20 === 0 && frame % 180 < 4;
        ctx.fillStyle = '#1a1a1a';
        if (blinking) {
            ctx.fillRect(cx-7, y+14, 5, 2);
            ctx.fillRect(cx+2, y+14, 5, 2);
        } else {
            ctx.beginPath(); ctx.arc(cx-5, y+15, 2.5, 0, Math.PI*2); ctx.arc(cx+5, y+15, 2.5, 0, Math.PI*2); ctx.fill();
            // Eye shine
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx-4, y+14, 1, 0, Math.PI*2); ctx.arc(cx+6, y+14, 1, 0, Math.PI*2); ctx.fill();
        }

        // Mouth — smile bigger with combo
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5;
        const smileW = 5 + Math.min(combo, 5);
        ctx.beginPath(); ctx.arc(cx, y+19, smileW, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();

        // Legs (animated run)
        const legOff = running ? Math.sin(frame*0.15) * 3 : 0;
        ctx.fillStyle = '#4a6fa5';
        ctx.fillRect(x+14, y+h-14+legOff, 10, 14);
        ctx.fillRect(x+w-24, y+h-14-legOff, 10, 14);

        // Shoes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(x+11, y+h-1+legOff, 16, 5, 3);
        ctx.roundRect(x+w-27, y+h-1-legOff, 16, 5, 3);
        ctx.fill();

        // Basket
        const basketG = ctx.createLinearGradient(x, y+36, x, y+50);
        basketG.addColorStop(0, '#a0781e'); basketG.addColorStop(1, '#6d5210');
        ctx.fillStyle = basketG;
        ctx.beginPath();
        ctx.moveTo(x-4, y+36); ctx.lineTo(x+w+4, y+36);
        ctx.lineTo(x+w-4, y+50); ctx.lineTo(x+4, y+50);
        ctx.closePath(); ctx.fill();
        // Basket rim
        ctx.strokeStyle = '#c49a30'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x-4, y+36); ctx.lineTo(x+w+4, y+36); ctx.stroke();
        // Weave pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.moveTo(x+4+i*13, y+36); ctx.lineTo(x+8+i*13, y+50); ctx.stroke();
        }

        // Berries in basket
        const bc = Math.min(score, 8);
        for (let i = 0; i < bc; i++) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(x+8+i*6, y+42, 3.5, 0, Math.PI*2); ctx.fill();
        }

        // Hands
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath(); ctx.arc(x+2, y+38, 5, 0, Math.PI*2); ctx.arc(x+w-2, y+38, 5, 0, Math.PI*2); ctx.fill();
    }

    function drawItem(it) {
        ctx.save();
        ctx.translate(it.x, it.y);
        it.rot += 0.01;
        const sz = it.size;

        if (it.type === 'berry' || it.type === 'golden') {
            // Glow for golden
            if (it.type === 'golden') {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 16;
            }
            // Leaf
            ctx.fillStyle = '#22c55e';
            ctx.beginPath(); ctx.ellipse(-4, -sz*0.45, 7, 3.5, -0.4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(4, -sz*0.45, 7, 3.5, 0.4, 0, Math.PI*2); ctx.fill();
            // Stem
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -sz*0.55); ctx.lineTo(0, -sz*0.35); ctx.stroke();
            // Body
            const bc = it.type === 'golden' ? '#fbbf24' : '#dc2626';
            const bg = ctx.createRadialGradient(-sz*0.15, -sz*0.1, 0, 0, 0, sz);
            bg.addColorStop(0, it.type === 'golden' ? '#fde68a' : '#f87171');
            bg.addColorStop(1, bc);
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.moveTo(0, -sz*0.5);
            ctx.quadraticCurveTo(sz*1.1, 0, sz*0.5, sz*0.7);
            ctx.quadraticCurveTo(0, sz*1.05, -sz*0.5, sz*0.7);
            ctx.quadraticCurveTo(-sz*1.1, 0, 0, -sz*0.5);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Seeds
            ctx.fillStyle = it.type === 'golden' ? '#f59e0b' : '#fbbf24';
            for (let i = 0; i < 5; i++) {
                const sx = Math.cos(i*1.3+0.5)*sz*0.3;
                const sy = Math.sin(i*1.1)*sz*0.25 + sz*0.1;
                ctx.beginPath(); ctx.ellipse(sx, sy, 1.5, 2.5, i*0.3, 0, Math.PI*2); ctx.fill();
            }
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath(); ctx.ellipse(-sz*0.18, -sz*0.15, sz*0.1, sz*0.22, -0.3, 0, Math.PI*2); ctx.fill();
        }
        else if (it.type === 'rotten') {
            // Gray-green berry
            ctx.fillStyle = '#4b5563';
            ctx.beginPath(); ctx.ellipse(-3, -sz*0.4, 5, 3, -0.3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#6b7280';
            ctx.beginPath();
            ctx.moveTo(0, -sz*0.45);
            ctx.quadraticCurveTo(sz*0.9, 0, sz*0.45, sz*0.6);
            ctx.quadraticCurveTo(0, sz*0.9, -sz*0.45, sz*0.6);
            ctx.quadraticCurveTo(-sz*0.9, 0, 0, -sz*0.45);
            ctx.fill();
            // X eyes
            ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-4,-2); ctx.lineTo(-1,1); ctx.moveTo(-1,-2); ctx.lineTo(-4,1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(1,-2); ctx.lineTo(4,1); ctx.moveTo(4,-2); ctx.lineTo(1,1); ctx.stroke();
            // Stink lines
            ctx.strokeStyle = 'rgba(134,239,172,0.4)'; ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const ox = (i-1)*8;
                ctx.beginPath();
                ctx.moveTo(ox, -sz*0.6 - Math.sin(frame*0.08+i)*4);
                ctx.quadraticCurveTo(ox+3, -sz*0.8 - Math.sin(frame*0.08+i)*6, ox-2, -sz - Math.sin(frame*0.08+i)*5);
                ctx.stroke();
            }
        }
        else if (it.type === 'magnet') {
            // Purple orb
            const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, sz);
            mg.addColorStop(0, '#c4b5fd'); mg.addColorStop(0.5, '#8b5cf6'); mg.addColorStop(1, '#6d28d9');
            ctx.fillStyle = mg;
            ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI*2); ctx.fill();
            // Magnet icon
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, -2, 7, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillRect(-7, -2, 3, 10);
            ctx.fillRect(4, -2, 3, 10);
            // Pulsing ring
            const pulse = 0.5 + Math.sin(frame*0.1)*0.3;
            ctx.strokeStyle = 'rgba(196,181,253,' + pulse + ')';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, sz + 4 + Math.sin(frame*0.08)*3, 0, Math.PI*2); ctx.stroke();
        }
        ctx.restore();
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
            const a = p.life / p.maxLife;
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2); ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    function drawFloatTexts() {
        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const ft = floatTexts[i];
            ft.y -= 1.2; ft.life--;
            const a = ft.life / ft.maxLife;
            ctx.globalAlpha = a;
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            if (ft.life <= 0) floatTexts.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    // --- Collision ---
    function collides(it) {
        const pad = magnetActive ? 40 : 6;
        return it.x > jimmy.x - pad && it.x < jimmy.x + jimmy.w + pad &&
               it.y + it.size*0.5 > jimmy.y + 28 && it.y - it.size*0.5 < jimmy.y + 54;
    }

    // --- Input ---
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key]=true; if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&running) e.preventDefault(); });
    document.addEventListener('keyup', e => { keys[e.key]=false; });

    let touchDir = 0;
    function bindTouch(el, dir) {
        if (!el) return;
        el.addEventListener('touchstart', e => { e.preventDefault(); touchDir=dir; });
        el.addEventListener('touchend', () => touchDir=0);
        el.addEventListener('mousedown', () => touchDir=dir);
        el.addEventListener('mouseup', () => touchDir=0);
    }
    bindTouch(ctrlL, -1);
    bindTouch(ctrlR, 1);

    // --- Screen shake ---
    function shake(intensity, dur) { shakeDur = dur; shakeX = (Math.random()-0.5)*intensity; shakeY = (Math.random()-0.5)*intensity; }

    // --- Update ---
    function update() {
        frame++;

        // Movement with smooth acceleration
        let targetDx = 0;
        if (keys['ArrowLeft']||keys['a']) targetDx = -jimmy.speed;
        if (keys['ArrowRight']||keys['d']) targetDx = jimmy.speed;
        if (touchDir) targetDx = touchDir * jimmy.speed;
        jimmy.vx += (targetDx - jimmy.vx) * 0.15;
        jimmy.x += jimmy.vx;
        if (jimmy.x < 0) { jimmy.x = 0; jimmy.vx = 0; }
        if (jimmy.x + jimmy.w > W) { jimmy.x = W - jimmy.w; jimmy.vx = 0; }

        // Combo decay
        if (comboTimer > 0) comboTimer--;
        if (comboTimer <= 0 && combo > 0) { combo = 0; comboEl.textContent = 'x1'; }

        // Magnet timer
        if (magnetActive) {
            magnetTimer--;
            if (magnetTimer <= 0) magnetActive = false;
        }

        // Shake decay
        if (shakeDur > 0) {
            shakeDur--;
            shakeX *= 0.85; shakeY *= 0.85;
        } else { shakeX = 0; shakeY = 0; }

        // Spawn
        spawnTimer++;
        const rate = Math.max(24, spawnRate - frame * 0.005);
        if (spawnTimer >= rate) { spawnItem(); spawnTimer = 0; }

        // Magnet pull
        if (magnetActive) {
            const jcx = jimmy.x + jimmy.w/2;
            const jcy = jimmy.y + 40;
            items.forEach(it => {
                if (it.type === 'berry' || it.type === 'golden') {
                    const dx = jcx - it.x, dy = jcy - it.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 150) {
                        it.x += dx * 0.06;
                        it.y += dy * 0.04;
                    }
                }
            });
        }

        // Items
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            it.y += it.speed;
            it.wobble += it.ws;
            it.x += Math.sin(it.wobble) * 0.4;

            if (collides(it)) {
                if (it.type === 'berry') {
                    combo++; comboTimer = 60;
                    if (combo > maxCombo) maxCombo = combo;
                    const pts = Math.min(combo, 5);
                    score += pts;
                    addFloatText(it.x, it.y, '+' + pts, '#f87171');
                    burst(it.x, it.y, '#dc2626', 4, 2);
                    sfxCollect();
                    if (combo > 1 && combo % 5 === 0) sfxCombo();
                } else if (it.type === 'golden') {
                    combo += 2; comboTimer = 90;
                    if (combo > maxCombo) maxCombo = combo;
                    const pts = Math.min(combo, 8) * 2;
                    score += pts;
                    addFloatText(it.x, it.y, '+' + pts + ' GOLD!', '#fbbf24');
                    burst(it.x, it.y, '#fbbf24', 6, 3);
                    shake(4, 8);
                    sfxGold();
                } else if (it.type === 'rotten') {
                    const loss = Math.max(3, Math.floor(score * 0.1));
                    score = Math.max(0, score - loss);
                    combo = 0; comboTimer = 0;
                    addFloatText(it.x, it.y, '-' + loss, '#6b7280');
                    burst(it.x, it.y, '#6b7280', 4, 2);
                    shake(6, 12);
                    sfxRotten();
                } else if (it.type === 'magnet') {
                    magnetActive = true;
                    magnetTimer = 300;
                    addFloatText(it.x, it.y, 'MAGNET!', '#c4b5fd');
                    burst(it.x, it.y, '#8b5cf6', 6, 3);
                    shake(3, 6);
                    sfxMagnet();
                }
                items.splice(i, 1);
                scoreEl.textContent = score;
                comboEl.textContent = 'x' + Math.max(1, Math.min(combo, 5));
                continue;
            }

            // Missed good berry = break combo
            if (it.y > H + 20) {
                if (it.type === 'berry') { combo = 0; comboTimer = 0; comboEl.textContent = 'x1'; }
                items.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawBg();
        drawParticles();
        items.forEach(drawItem);
        drawJimmy();
        drawFloatTexts();

        // Magnet timer bar
        if (magnetActive) {
            const pct = magnetTimer / 300;
            ctx.fillStyle = 'rgba(139,92,246,0.3)';
            ctx.fillRect(0, H-4, W, 4);
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(0, H-4, W*pct, 4);
        }

        // Timer warning flash
        if (timeLeft <= 10 && timeLeft > 0 && frame % 30 < 15) {
            ctx.fillStyle = 'rgba(220,38,38,0.05)';
            ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
    }

    function loop() {
        if (!running) return;
        update(); draw();
        animFrame = requestAnimationFrame(loop);
    }

    function startGame() {
        initAudio();
        score = 0; timeLeft = GAME_TIME; spawnRate = 50; spawnTimer = 0; frame = 0;
        combo = 0; maxCombo = 0; comboTimer = 0;
        magnetActive = false; magnetTimer = 0;
        items = []; particles = []; floatTexts = [];
        jimmy.x = W/2 - 28; jimmy.vx = 0;
        scoreEl.textContent = '0';
        comboEl.textContent = 'x1';
        timerEl.textContent = GAME_TIME;
        overScreen.classList.remove('show');
        startScreen.classList.add('hidden');
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
        sfxEnd();

        const isNew = score > bestScore;
        if (isNew) {
            bestScore = score;
            localStorage.setItem('jimmyBest2', String(bestScore));
            bestEl.textContent = bestScore;
        }

        // Stars (1-3)
        const stars = score >= 60 ? 3 : score >= 30 ? 2 : score >= 10 ? 1 : 0;
        goStars.textContent = (stars >= 1 ? '\u2B50' : '\u2606') + (stars >= 2 ? '\u2B50' : '\u2606') + (stars >= 3 ? '\u2B50' : '\u2606');

        goTitle.textContent = isNew ? 'New Record!' : 'Time\'s Up!';
        finalEl.textContent = score;

        const msgs = [
            score < 10 ? 'Jimmy needs more practice!' : '',
            score >= 10 && score < 30 ? 'Not bad! Keep going!' : '',
            score >= 30 && score < 60 ? 'Great job! Jimmy is impressed!' : '',
            score >= 60 ? 'Legendary! Strawberry King!' : '',
        ].filter(Boolean);
        goMsg.textContent = msgs[0] + (maxCombo > 3 ? ' (Max combo: x' + maxCombo + ')' : '');

        overScreen.classList.add('show');
    }

    // Initial draw
    drawBg();
    drawJimmy();

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
})();
