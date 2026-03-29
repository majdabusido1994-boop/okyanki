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
        window.open('https://wa.me/972527726892?text=' + text, '_blank');
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
// JIMMY'S STRAWBERRY RUSH
// ============================================
(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('gameStart');
    const restartBtn = document.getElementById('gameRestart');
    const overScreen = document.getElementById('gameOver');
    const scoreEl = document.getElementById('gameScore');
    const timerEl = document.getElementById('gameTimer');
    const bestEl = document.getElementById('gameBest');
    const finalEl = document.getElementById('finalScore');
    const ctrlL = document.getElementById('ctrlLeft');
    const ctrlR = document.getElementById('ctrlRight');

    const W = canvas.width, H = canvas.height;
    let running = false, score = 0, timeLeft = 30, spawnRate = 40, spawnTimer = 0;
    let bestScore = parseInt(localStorage.getItem('jimmyBest') || '0');
    let timerInterval = null, animFrame = null;
    let strawberries = [], leaves = [];
    bestEl.textContent = bestScore;

    const jimmy = { x: W/2 - 25, y: H - 70, w: 50, h: 60, speed: 6, dx: 0 };

    function spawnBerry() {
        const sz = 22 + Math.random() * 12;
        strawberries.push({ x: Math.random()*(W-sz*2)+sz, y: -sz, size: sz, speed: 2+Math.random()*2.5, wobble: Math.random()*Math.PI*2, ws: 0.03+Math.random()*0.03 });
    }

    function drawSky() {
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'#87CEEB'); g.addColorStop(0.55,'#b4e0f7');
        g.addColorStop(0.6,'#4a7c2e'); g.addColorStop(1,'#3d6b25');
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
        for (let i=0;i<6;i++) { ctx.beginPath(); ctx.moveTo(0,H*0.62+i*18); ctx.lineTo(W,H*0.62+i*18); ctx.stroke(); }
    }

    function drawJimmy() {
        const x=jimmy.x, y=jimmy.y, w=jimmy.w, h=jimmy.h;
        ctx.fillStyle='#f5d063'; ctx.beginPath(); ctx.roundRect(x+8,y+20,w-16,h-28,6); ctx.fill();
        ctx.fillStyle='#d4a76a'; ctx.beginPath(); ctx.arc(x+w/2,y+14,14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3d2b1f'; ctx.beginPath(); ctx.arc(x+w/2,y+10,14,Math.PI,Math.PI*2); ctx.fill();
        ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+w/2-5,y+14,2,0,Math.PI*2); ctx.arc(x+w/2+5,y+14,2,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x+w/2,y+17,5,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
        ctx.fillStyle='#4a6fa5'; ctx.fillRect(x+12,y+h-12,10,12); ctx.fillRect(x+w-22,y+h-12,10,12);
        ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+10,y+h-2,14,4); ctx.fillRect(x+w-24,y+h-2,14,4);
        ctx.fillStyle='#d4a76a'; ctx.beginPath(); ctx.arc(x+4,y+36,5,0,Math.PI*2); ctx.arc(x+w-4,y+36,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#8B6914'; ctx.beginPath(); ctx.moveTo(x-2,y+34); ctx.lineTo(x+w+2,y+34); ctx.lineTo(x+w-6,y+46); ctx.lineTo(x+6,y+46); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='#6d5210'; ctx.lineWidth=1; ctx.stroke();
        const bc = Math.min(score,5);
        for (let i=0;i<bc;i++) { ctx.fillStyle='#dc2626'; ctx.beginPath(); ctx.arc(x+10+i*8,y+39,4,0,Math.PI*2); ctx.fill(); }
    }

    function drawBerry(s) {
        ctx.fillStyle='#22c55e';
        ctx.beginPath(); ctx.ellipse(s.x-4,s.y-s.size*0.4,6,3,-0.4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s.x+4,s.y-s.size*0.4,6,3,0.4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#dc2626';
        ctx.beginPath(); ctx.moveTo(s.x,s.y-s.size*0.5);
        ctx.quadraticCurveTo(s.x+s.size,s.y,s.x+s.size*0.5,s.y+s.size*0.7);
        ctx.quadraticCurveTo(s.x,s.y+s.size,s.x-s.size*0.5,s.y+s.size*0.7);
        ctx.quadraticCurveTo(s.x-s.size,s.y,s.x,s.y-s.size*0.5); ctx.fill();
        ctx.fillStyle='#fbbf24';
        for (let i=0;i<4;i++) { ctx.beginPath(); ctx.ellipse(s.x+Math.cos(i*1.5+0.5)*s.size*0.3, s.y+Math.sin(i*1.2)*s.size*0.25+s.size*0.1, 1.5,2,0,0,Math.PI*2); ctx.fill(); }
    }

    function collides(s) {
        return s.x>jimmy.x-4 && s.x<jimmy.x+jimmy.w+4 && s.y+s.size*0.5>jimmy.y+30 && s.y-s.size*0.5<jimmy.y+50;
    }

    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key]=true; if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&running) e.preventDefault(); });
    document.addEventListener('keyup', e => { keys[e.key]=false; });

    let touchDir = 0;
    function bindTouch(el, dir) {
        if (!el) return;
        el.addEventListener('touchstart', e => { e.preventDefault(); touchDir=dir; });
        el.addEventListener('touchend', () => { touchDir=0; });
        el.addEventListener('mousedown', () => { touchDir=dir; });
        el.addEventListener('mouseup', () => { touchDir=0; });
    }
    bindTouch(ctrlL, -1);
    bindTouch(ctrlR, 1);

    function update() {
        jimmy.dx = 0;
        if (keys['ArrowLeft']||keys['a']) jimmy.dx=-jimmy.speed;
        if (keys['ArrowRight']||keys['d']) jimmy.dx=jimmy.speed;
        if (touchDir) jimmy.dx=touchDir*jimmy.speed;
        jimmy.x += jimmy.dx;
        if (jimmy.x<0) jimmy.x=0;
        if (jimmy.x+jimmy.w>W) jimmy.x=W-jimmy.w;

        spawnTimer++;
        if (spawnTimer>=spawnRate) { spawnBerry(); spawnTimer=0; if(spawnRate>18) spawnRate-=0.3; }
        if (Math.random()<0.02 && leaves.length<8) leaves.push({ x:Math.random()*W, y:-10, sz:6+Math.random()*8, sp:0.5+Math.random(), dr:Math.random()*2-1, a:0.3+Math.random()*0.3 });

        for (let i=strawberries.length-1;i>=0;i--) {
            const s=strawberries[i];
            s.y+=s.speed; s.wobble+=s.ws; s.x+=Math.sin(s.wobble)*0.5;
            if (collides(s)) { score++; scoreEl.textContent=score; strawberries.splice(i,1); continue; }
            if (s.y>H+20) strawberries.splice(i,1);
        }
        for (let i=leaves.length-1;i>=0;i--) { leaves[i].y+=leaves[i].sp; leaves[i].x+=leaves[i].dr; if(leaves[i].y>H+10) leaves.splice(i,1); }
    }

    function draw() {
        drawSky();
        leaves.forEach(l => { ctx.globalAlpha=l.a; ctx.fillStyle='#4ade80'; ctx.beginPath(); ctx.ellipse(l.x,l.y,l.sz,l.sz*0.5,0.5,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; });
        strawberries.forEach(drawBerry);
        drawJimmy();
    }

    function loop() { if(!running) return; update(); draw(); animFrame=requestAnimationFrame(loop); }

    function startGame() {
        score=0; timeLeft=30; spawnRate=40; spawnTimer=0;
        strawberries=[]; leaves=[]; jimmy.x=W/2-25;
        scoreEl.textContent='0'; timerEl.textContent='30';
        overScreen.classList.remove('show');
        startBtn.classList.add('hidden');
        running=true;
        timerInterval = setInterval(() => { timeLeft--; timerEl.textContent=timeLeft; if(timeLeft<=0) endGame(); }, 1000);
        loop();
    }

    function endGame() {
        running=false; clearInterval(timerInterval); cancelAnimationFrame(animFrame);
        if (score>bestScore) { bestScore=score; localStorage.setItem('jimmyBest',String(bestScore)); bestEl.textContent=bestScore; }
        finalEl.textContent=score; overScreen.classList.add('show');
    }

    drawSky(); drawJimmy();
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
})();
