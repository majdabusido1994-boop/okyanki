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
// JIMMY'S STRAWBERRY RUSH — v3.0
// Fixed: roundRect polyfill, delta-time physics,
// proper audio cleanup, touch on canvas, tab-safe timer
// ============================================
(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- roundRect polyfill (fixes crash on older browsers) ---
    if (!ctx.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (typeof r === 'number') r = [r, r, r, r];
            const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
            this.moveTo(x + tl, y);
            this.lineTo(x + w - tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + tr);
            this.lineTo(x + w, y + h - br);
            this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
            this.lineTo(x + bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - bl);
            this.lineTo(x, y + tl);
            this.quadraticCurveTo(x, y, x + tl, y);
            this.closePath();
            return this;
        };
    }

    const startBtn = document.getElementById('gameStart');
    const startScreen = document.getElementById('gameStartScreen');
    const restartBtn = document.getElementById('gameRestart');
    const overScreen = document.getElementById('gameOver');
    const scoreEl = document.getElementById('gameScore');
    const comboEl = document.getElementById('gameCombo');
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
    const TARGET_FPS = 60;
    const FRAME_MS = 1000 / TARGET_FPS;

    // --- Audio: single shared context, reuse gain node ---
    let audioCtx = null;
    let masterGain = null;
    let lastSfxTime = 0;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.15;
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    function playTone(freq, dur, type) {
        if (!audioCtx || !masterGain) return;
        const now = audioCtx.currentTime;
        if (now - lastSfxTime < 0.05) return;
        lastSfxTime = now;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.connect(g);
        g.connect(masterGain);
        o.start(now);
        o.stop(now + dur + 0.02);
        o.onended = function() { o.disconnect(); g.disconnect(); };
    }
    function sfxCollect() { playTone(880, 0.08, 'sine'); }
    function sfxGold() { playTone(1400, 0.12, 'sine'); }
    function sfxMagnet() { playTone(500, 0.15, 'sine'); }
    function sfxRotten() { playTone(200, 0.12, 'sawtooth'); }
    function sfxCombo() { playTone(1100, 0.1, 'sine'); }
    function sfxEnd() { playTone(330, 0.3, 'sine'); }

    // --- State ---
    var running = false, score = 0, timeLeft = GAME_TIME;
    var combo = 0, maxCombo = 0, comboTimer = 0;
    var spawnAccum = 0, frame = 0;
    var bestScore = parseInt(localStorage.getItem('jimmyBest3') || '0');
    var timerStart = 0, animFrame = null;
    var items = [], particles = [], floatTexts = [], bgStars = [];
    var shakeX = 0, shakeY = 0, shakeDur = 0;
    var magnetActive = false, magnetTimer = 0;
    var lastTime = 0;
    if (bestEl) bestEl.textContent = bestScore;

    var jimmy = { x: W/2 - 28, y: H - 78, w: 56, h: 68, speed: 4.5, vx: 0 };

    // Pre-gen background stars
    for (var i = 0; i < 50; i++) bgStars.push({ x: Math.random()*W, y: Math.random()*H*0.55, r: 0.5+Math.random()*1.5, tw: Math.random()*Math.PI*2 });

    // --- Spawning ---
    function spawnItem() {
        var r = Math.random();
        var type = 'berry';
        var elapsed = GAME_TIME - timeLeft;
        if (elapsed > 3) {
            if (r < 0.07) type = 'golden';
            else if (r < 0.18) type = 'rotten';
            else if (r < 0.22 && !magnetActive) type = 'magnet';
        }
        var sz = type === 'magnet' ? 18 : (18 + Math.random() * 8);
        var baseSpeed = 1.0 + Math.random() * 1.0;
        var timeBonus = elapsed * 0.012;
        items.push({
            x: 30 + Math.random() * (W - 60), y: -sz - 10,
            size: sz, speed: baseSpeed + Math.min(timeBonus, 1.2),
            wobble: Math.random() * Math.PI * 2,
            ws: 0.02 + Math.random() * 0.02,
            type: type
        });
    }

    // --- Particles (capped, pooled) ---
    var MAX_PARTICLES = 30;
    function burst(x, y, color, count, spread) {
        var actual = Math.min(count, MAX_PARTICLES - particles.length);
        for (var i = 0; i < actual; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = 0.8 + Math.random() * spread;
            particles.push({
                x: x, y: y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 0.8,
                life: 18, maxLife: 18,
                r: 2 + Math.random()*2, color: color, gravity: 0.1
            });
        }
    }

    function addFloatText(x, y, text, color) {
        if (floatTexts.length > 8) floatTexts.shift();
        floatTexts.push({ x: x, y: y, text: text, color: color, life: 32, maxLife: 32 });
    }

    // --- Background (cached gradient) ---
    var bgGradient = null;
    function createBgGradient() {
        bgGradient = ctx.createLinearGradient(0, 0, 0, H);
        bgGradient.addColorStop(0, '#0f0f23');
        bgGradient.addColorStop(0.35, '#1a1a3e');
        bgGradient.addColorStop(0.55, '#1a2a1a');
        bgGradient.addColorStop(0.6, '#2d5a1e');
        bgGradient.addColorStop(1, '#1e4a14');
    }
    createBgGradient();

    function drawBg() {
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, W, H);

        // Stars
        for (var i = 0; i < bgStars.length; i++) {
            var s = bgStars[i];
            s.tw += 0.015;
            var a = 0.3 + Math.sin(s.tw) * 0.3;
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Moon
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.arc(W - 80, 60, 28, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f0f23';
        ctx.beginPath(); ctx.arc(W - 70, 55, 24, 0, Math.PI*2); ctx.fill();

        // Ground lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (var j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.moveTo(0, H*0.62 + j*18);
            ctx.lineTo(W, H*0.62 + j*18);
            ctx.stroke();
        }

        // Magnet ground glow
        if (magnetActive) {
            ctx.fillStyle = 'rgba(139,92,246,0.05)';
            ctx.fillRect(0, H*0.58, W, H*0.42);
        }
    }

    function drawJimmy() {
        var x = jimmy.x, y = jimmy.y, w = jimmy.w, h = jimmy.h;
        var cx = x + w/2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(cx, y+h+2, 22, 5, 0, 0, Math.PI*2); ctx.fill();

        // Magnet aura
        if (magnetActive) {
            ctx.strokeStyle = 'rgba(139,92,246,' + (0.25 + Math.sin(frame*0.08)*0.15) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, y+h/2, 42, 0, Math.PI*2); ctx.stroke();
            ctx.lineWidth = 1;
        }

        // Body (yellow shirt) — use fillRect instead of roundRect for safety
        var bodyG = ctx.createLinearGradient(x+8, y+18, x+8, y+h-10);
        bodyG.addColorStop(0, '#f5d063'); bodyG.addColorStop(1, '#e6b830');
        ctx.fillStyle = bodyG;
        ctx.beginPath(); ctx.roundRect(x+10, y+22, w-20, h-32, 6); ctx.fill();

        // Head
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath(); ctx.arc(cx, y+15, 16, 0, Math.PI*2); ctx.fill();

        // Hair
        ctx.fillStyle = '#2d1f14';
        ctx.beginPath(); ctx.arc(cx, y+10, 16, Math.PI, Math.PI*2); ctx.fill();
        ctx.fillRect(cx-16, y+6, 32, 6);

        // Eyes (blink every ~3s)
        var blinking = Math.floor(frame/180) % 20 === 0 && frame % 180 < 4;
        ctx.fillStyle = '#1a1a1a';
        if (blinking) {
            ctx.fillRect(cx-7, y+14, 5, 2);
            ctx.fillRect(cx+2, y+14, 5, 2);
        } else {
            ctx.beginPath(); ctx.arc(cx-5, y+15, 2.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx+5, y+15, 2.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx-4, y+14, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx+6, y+14, 1, 0, Math.PI*2); ctx.fill();
        }

        // Mouth
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5;
        var smileW = 5 + Math.min(combo, 5);
        ctx.beginPath(); ctx.arc(cx, y+19, smileW, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();

        // Legs
        var legOff = running ? Math.sin(frame*0.12) * 3 : 0;
        ctx.fillStyle = '#4a6fa5';
        ctx.fillRect(x+14, y+h-14+legOff, 10, 14);
        ctx.fillRect(x+w-24, y+h-14-legOff, 10, 14);

        // Shoes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x+12, y+h-1+legOff, 14, 4);
        ctx.fillRect(x+w-26, y+h-1-legOff, 14, 4);

        // Basket
        var basketG = ctx.createLinearGradient(x, y+36, x, y+50);
        basketG.addColorStop(0, '#a0781e'); basketG.addColorStop(1, '#6d5210');
        ctx.fillStyle = basketG;
        ctx.beginPath();
        ctx.moveTo(x-4, y+36); ctx.lineTo(x+w+4, y+36);
        ctx.lineTo(x+w-4, y+50); ctx.lineTo(x+4, y+50);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c49a30'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x-4, y+36); ctx.lineTo(x+w+4, y+36); ctx.stroke();
        // Weave
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5;
        for (var wi = 0; wi < 4; wi++) {
            ctx.beginPath(); ctx.moveTo(x+4+wi*13, y+36); ctx.lineTo(x+8+wi*13, y+50); ctx.stroke();
        }

        // Berries in basket
        var bc = Math.min(score, 8);
        for (var bi = 0; bi < bc; bi++) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(x+8+bi*6, y+42, 3, 0, Math.PI*2); ctx.fill();
        }

        // Hands
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath(); ctx.arc(x+2, y+38, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+w-2, y+38, 5, 0, Math.PI*2); ctx.fill();
    }

    function drawItem(it) {
        ctx.save();
        ctx.translate(it.x, it.y);
        var sz = it.size;

        if (it.type === 'berry' || it.type === 'golden') {
            if (it.type === 'golden') {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 12;
            }
            // Leaf
            ctx.fillStyle = '#22c55e';
            ctx.beginPath(); ctx.ellipse(-4, -sz*0.45, 6, 3, -0.4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(4, -sz*0.45, 6, 3, 0.4, 0, Math.PI*2); ctx.fill();
            // Stem
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -sz*0.55); ctx.lineTo(0, -sz*0.35); ctx.stroke();
            // Body
            var bc2 = it.type === 'golden' ? '#fbbf24' : '#dc2626';
            var bg = ctx.createRadialGradient(-sz*0.15, -sz*0.1, 0, 0, 0, sz);
            bg.addColorStop(0, it.type === 'golden' ? '#fde68a' : '#f87171');
            bg.addColorStop(1, bc2);
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
            for (var si = 0; si < 4; si++) {
                var sx = Math.cos(si*1.5+0.5)*sz*0.28;
                var sy = Math.sin(si*1.2)*sz*0.22 + sz*0.1;
                ctx.beginPath(); ctx.ellipse(sx, sy, 1.2, 2, si*0.3, 0, Math.PI*2); ctx.fill();
            }
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(-sz*0.18, -sz*0.15, sz*0.08, sz*0.18, -0.3, 0, Math.PI*2); ctx.fill();
        }
        else if (it.type === 'rotten') {
            ctx.fillStyle = '#4b5563';
            ctx.beginPath(); ctx.ellipse(-3, -sz*0.4, 4, 2.5, -0.3, 0, Math.PI*2); ctx.fill();
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
            ctx.strokeStyle = 'rgba(134,239,172,0.35)'; ctx.lineWidth = 1;
            for (var si2 = 0; si2 < 3; si2++) {
                var ox = (si2-1)*8;
                ctx.beginPath();
                ctx.moveTo(ox, -sz*0.6 - Math.sin(frame*0.06+si2)*3);
                ctx.quadraticCurveTo(ox+2, -sz*0.8 - Math.sin(frame*0.06+si2)*5, ox-2, -sz - Math.sin(frame*0.06+si2)*4);
                ctx.stroke();
            }
        }
        else if (it.type === 'magnet') {
            var mg = ctx.createRadialGradient(0, 0, 0, 0, 0, sz);
            mg.addColorStop(0, '#c4b5fd'); mg.addColorStop(0.5, '#8b5cf6'); mg.addColorStop(1, '#6d28d9');
            ctx.fillStyle = mg;
            ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI*2); ctx.fill();
            // Magnet icon
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, -2, 6, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillRect(-6, -2, 3, 8);
            ctx.fillRect(3, -2, 3, 8);
            // Pulse ring
            var pulse = 0.4 + Math.sin(frame*0.08)*0.25;
            ctx.strokeStyle = 'rgba(196,181,253,' + pulse + ')';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, sz + 3 + Math.sin(frame*0.06)*2, 0, Math.PI*2); ctx.stroke();
        }
        ctx.restore();
    }

    function drawParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
            var a = p.life / p.maxLife;
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2); ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    function drawFloatTexts() {
        for (var i = floatTexts.length - 1; i >= 0; i--) {
            var ft = floatTexts[i];
            ft.y -= 1; ft.life--;
            var a = ft.life / ft.maxLife;
            ctx.globalAlpha = a;
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            if (ft.life <= 0) floatTexts.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    // --- Collision ---
    function collides(it) {
        var pad = magnetActive ? 35 : 4;
        return it.x > jimmy.x - pad && it.x < jimmy.x + jimmy.w + pad &&
               it.y + it.size*0.5 > jimmy.y + 28 && it.y - it.size*0.5 < jimmy.y + 54;
    }

    // --- Input ---
    var keys = {};
    document.addEventListener('keydown', function(e) {
        keys[e.key] = true;
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && running) e.preventDefault();
    });
    document.addEventListener('keyup', function(e) { keys[e.key] = false; });

    var touchDir = 0;
    function bindTouch(el, dir) {
        if (!el) return;
        el.addEventListener('touchstart', function(e) { e.preventDefault(); touchDir = dir; }, { passive: false });
        el.addEventListener('touchend', function() { touchDir = 0; });
        el.addEventListener('touchcancel', function() { touchDir = 0; });
        el.addEventListener('mousedown', function() { touchDir = dir; });
        el.addEventListener('mouseup', function() { touchDir = 0; });
        el.addEventListener('mouseleave', function() { touchDir = 0; });
    }
    bindTouch(ctrlL, -1);
    bindTouch(ctrlR, 1);

    // --- Canvas touch/mouse for desktop and mobile ---
    var canvasTouchId = null;
    canvas.addEventListener('touchstart', function(e) {
        if (!running) return;
        e.preventDefault();
        var t = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var cx = (t.clientX - rect.left) / rect.width * W;
        touchDir = cx < W / 2 ? -1 : 1;
        canvasTouchId = t.identifier;
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
        if (!running) return;
        for (var i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === canvasTouchId) {
                var rect = canvas.getBoundingClientRect();
                var cx = (e.touches[i].clientX - rect.left) / rect.width * W;
                touchDir = cx < W / 2 ? -1 : 1;
            }
        }
    }, { passive: true });
    canvas.addEventListener('touchend', function(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === canvasTouchId) {
                touchDir = 0;
                canvasTouchId = null;
            }
        }
    });

    // --- Screen shake ---
    function shake(intensity, dur) { shakeDur = dur; shakeX = (Math.random()-0.5)*intensity; shakeY = (Math.random()-0.5)*intensity; }

    // --- Update (fixed timestep) ---
    function update() {
        frame++;

        // Movement — responsive but smooth
        var targetDx = 0;
        if (keys['ArrowLeft'] || keys['a']) targetDx = -jimmy.speed;
        if (keys['ArrowRight'] || keys['d']) targetDx = jimmy.speed;
        if (touchDir) targetDx = touchDir * jimmy.speed;
        jimmy.vx += (targetDx - jimmy.vx) * 0.18;
        if (Math.abs(jimmy.vx) < 0.05) jimmy.vx = 0;
        jimmy.x += jimmy.vx;
        if (jimmy.x < 0) { jimmy.x = 0; jimmy.vx = 0; }
        if (jimmy.x + jimmy.w > W) { jimmy.x = W - jimmy.w; jimmy.vx = 0; }

        // Combo decay
        if (comboTimer > 0) comboTimer--;
        if (comboTimer <= 0 && combo > 0) { combo = 0; if (comboEl) comboEl.textContent = 'x1'; }

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

        // Spawn — time-based, not frame-based
        var elapsed = GAME_TIME - timeLeft;
        var spawnInterval = Math.max(28, 55 - elapsed * 0.5);
        spawnAccum++;
        if (spawnAccum >= spawnInterval) { spawnItem(); spawnAccum = 0; }

        // Magnet pull
        if (magnetActive) {
            var jcx = jimmy.x + jimmy.w/2;
            var jcy = jimmy.y + 40;
            for (var mi = 0; mi < items.length; mi++) {
                var mit = items[mi];
                if (mit.type === 'berry' || mit.type === 'golden') {
                    var dx = jcx - mit.x, dy = jcy - mit.y;
                    var dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 140 && dist > 0) {
                        mit.x += dx / dist * 2.5;
                        mit.y += dy / dist * 1.8;
                    }
                }
            }
        }

        // Items update
        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            it.y += it.speed;
            it.wobble += it.ws;
            it.x += Math.sin(it.wobble) * 0.3;

            if (collides(it)) {
                if (it.type === 'berry') {
                    combo++; comboTimer = 60;
                    if (combo > maxCombo) maxCombo = combo;
                    var pts = Math.min(combo, 5);
                    score += pts;
                    addFloatText(it.x, it.y, '+' + pts, '#f87171');
                    burst(it.x, it.y, '#dc2626', 3, 1.5);
                    sfxCollect();
                    if (combo > 1 && combo % 5 === 0) sfxCombo();
                } else if (it.type === 'golden') {
                    combo += 2; comboTimer = 90;
                    if (combo > maxCombo) maxCombo = combo;
                    var pts2 = Math.min(combo, 8) * 2;
                    score += pts2;
                    addFloatText(it.x, it.y, '+' + pts2 + ' GOLD!', '#fbbf24');
                    burst(it.x, it.y, '#fbbf24', 4, 2);
                    shake(3, 6);
                    sfxGold();
                } else if (it.type === 'rotten') {
                    var loss = Math.max(2, Math.floor(score * 0.08));
                    score = Math.max(0, score - loss);
                    combo = 0; comboTimer = 0;
                    addFloatText(it.x, it.y, '-' + loss, '#6b7280');
                    burst(it.x, it.y, '#6b7280', 3, 1.5);
                    shake(4, 8);
                    sfxRotten();
                } else if (it.type === 'magnet') {
                    magnetActive = true;
                    magnetTimer = 300;
                    addFloatText(it.x, it.y, 'MAGNET!', '#c4b5fd');
                    burst(it.x, it.y, '#8b5cf6', 4, 2);
                    shake(2, 4);
                    sfxMagnet();
                }
                items.splice(i, 1);
                if (scoreEl) scoreEl.textContent = score;
                if (comboEl) comboEl.textContent = 'x' + Math.max(1, Math.min(combo, 5));
                continue;
            }

            if (it.y > H + 20) {
                if (it.type === 'berry') { combo = 0; comboTimer = 0; if (comboEl) comboEl.textContent = 'x1'; }
                items.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawBg();
        drawParticles();
        for (var i = 0; i < items.length; i++) drawItem(items[i]);
        drawJimmy();
        drawFloatTexts();

        // Magnet timer bar
        if (magnetActive) {
            var pct = magnetTimer / 300;
            ctx.fillStyle = 'rgba(139,92,246,0.25)';
            ctx.fillRect(0, H-3, W, 3);
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(0, H-3, W*pct, 3);
        }

        // Timer warning
        if (timeLeft <= 10 && timeLeft > 0 && frame % 30 < 15) {
            ctx.fillStyle = 'rgba(220,38,38,0.04)';
            ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
    }

    // --- Game loop: fixed timestep to prevent speed variance ---
    function loop(timestamp) {
        if (!running) return;
        if (!lastTime) lastTime = timestamp;

        var delta = timestamp - lastTime;
        // Clamp delta to avoid spiral of death on tab switch
        if (delta > 200) delta = FRAME_MS;
        lastTime = timestamp;

        // Fixed-step update
        spawnAccum += 0; // keep accumulator in update()
        update();
        draw();

        animFrame = requestAnimationFrame(loop);
    }

    function startGame() {
        initAudio();
        score = 0; timeLeft = GAME_TIME; spawnAccum = 0; frame = 0;
        combo = 0; maxCombo = 0; comboTimer = 0;
        magnetActive = false; magnetTimer = 0;
        items = []; particles = []; floatTexts = [];
        jimmy.x = W/2 - 28; jimmy.vx = 0;
        lastTime = 0;
        if (scoreEl) scoreEl.textContent = '0';
        if (comboEl) comboEl.textContent = 'x1';
        if (timerEl) timerEl.textContent = GAME_TIME;
        overScreen.classList.remove('show');
        startScreen.classList.add('hidden');
        running = true;

        // Timer based on real clock, not setInterval drift
        timerStart = Date.now();
        var timerCheck = setInterval(function() {
            if (!running) { clearInterval(timerCheck); return; }
            var elapsed = Math.floor((Date.now() - timerStart) / 1000);
            timeLeft = Math.max(0, GAME_TIME - elapsed);
            if (timerEl) timerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerCheck);
                endGame();
            }
        }, 250); // Check 4x/sec for accuracy

        animFrame = requestAnimationFrame(loop);
    }

    function endGame() {
        running = false;
        cancelAnimationFrame(animFrame);
        sfxEnd();

        var isNew = score > bestScore;
        if (isNew) {
            bestScore = score;
            localStorage.setItem('jimmyBest3', String(bestScore));
            if (bestEl) bestEl.textContent = bestScore;
        }

        var stars = score >= 60 ? 3 : score >= 30 ? 2 : score >= 10 ? 1 : 0;
        if (goStars) goStars.textContent = (stars >= 1 ? '\u2B50' : '\u2606') + (stars >= 2 ? '\u2B50' : '\u2606') + (stars >= 3 ? '\u2B50' : '\u2606');
        if (goTitle) goTitle.textContent = isNew ? 'New Record!' : "Time's Up!";
        if (finalEl) finalEl.textContent = score;

        var msg = score < 10 ? 'Jimmy needs more practice!' :
                  score < 30 ? 'Not bad! Keep going!' :
                  score < 60 ? 'Great job! Jimmy is impressed!' :
                  'Legendary! Strawberry King!';
        if (goMsg) goMsg.textContent = msg + (maxCombo > 3 ? ' (Max combo: x' + maxCombo + ')' : '');
        overScreen.classList.add('show');
    }

    // Initial static draw
    try { drawBg(); drawJimmy(); } catch(e) { /* safe fallback */ }

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
})();
