// ============================================
// Chef Mohammed Isefan - Website Scripts
// ============================================

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile nav when clicking a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in class to sections
document.querySelectorAll('.about-content, .about-image, .gallery-item, .family-item, .video-item, .instagram-card, .contact-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Easter egg: click footer quote 7 times (one for each letter in OKYANKI)
let clickCount = 0;
const footerQuote = document.querySelector('.footer-quote');
const easterEgg = document.getElementById('easterEgg');

if (footerQuote && easterEgg) {
    footerQuote.addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 7) {
            easterEgg.classList.add('active');
            clickCount = 0;
        }
    });

    // Close easter egg on overlay click
    easterEgg.addEventListener('click', (e) => {
        if (e.target === easterEgg) {
            easterEgg.classList.remove('active');
        }
    });
}

// Console easter egg for devs
console.log('%c OKYANKI ', 'background: #c9a84c; color: #0a0a0a; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px;');
console.log('%c The legend behind the chef ', 'color: #8a8278; font-size: 12px;');
