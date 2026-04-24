// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => observer.observe(el));

// ── NAVBAR ADAPTIVE COLOR ──
const header = document.querySelector('header');

// Color themes: [background, border-color]
const navThemes = {
  'black':  ['rgba(0,0,0,0.82)',    'rgba(255,255,255,0.08)'],
  'dark':   ['rgba(10,22,40,0.95)', 'rgba(79,158,255,0.18)'],
  'blue':   ['rgba(8,24,52,0.95)',  'rgba(79,158,255,0.3)'],
  'green':  ['rgba(5,28,20,0.95)',  'rgba(52,211,153,0.28)'],
  'purple': ['rgba(16,8,38,0.95)', 'rgba(167,139,250,0.28)'],
  'orange': ['rgba(28,18,4,0.95)', 'rgba(251,191,36,0.22)'],
};

// Determine default theme for this page based on body background
// Homepage has black hero → starts black. All other pages start dark navy.
const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
let currentTheme = isHomePage ? 'black' : 'dark';

const applyNavTheme = (theme, force) => {
  if (!header) return;
  if (theme === currentTheme && !force) return;
  currentTheme = theme;
  const [bg, border] = navThemes[theme] || navThemes['dark'];
  header.style.background = bg;
  header.style.borderColor = border;
};

// Apply correct default immediately on load — no flash
applyNavTheme(currentTheme, true);

// Scroll handler: always run — adds scrolled class and handles non-themed pages
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
    // On homepage, snap back to black when at top (over hero)
    if (isHomePage) applyNavTheme('black');
  }
}, { passive: true });

// Section observer: only runs on pages with data-nav-theme sections
const themedSections = document.querySelectorAll('[data-nav-theme]');
if (themedSections.length > 0) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        applyNavTheme(entry.target.dataset.navTheme);
      }
    });
  }, {
    // Watch a band at top 15% of viewport — where navbar sits
    rootMargin: '0px 0px -85% 0px',
    threshold: 0.01
  });
  themedSections.forEach(s => sectionObserver.observe(s));
}

// ── MOBILE MENU ──
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

// ── ACTIVE NAV LINK ──
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a, .mobile-menu a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    if (!a.classList.contains('cta-nav')) a.classList.add('active');
  }
});

// ── OPEN/CLOSED BADGE ──
const updateOpenBadge = () => {
  // Supports both old (.hero-badge) and new Apple-style hero (.hero-apple-eyebrow)
  const dot = document.querySelector('.hero-apple-eyebrow .dot, .hero-badge-dot');
  const label = document.getElementById('hero-badge-text') || document.querySelector('.hero-badge span');
  if (!dot && !label) return;

  let estHour = new Date().getHours();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit'
    }).formatToParts(new Date());
    const hourPart = parts.find(part => part.type === 'hour');
    if (hourPart) estHour = Number(hourPart.value);
  } catch (e) {}

  const isOpen = estHour >= 10 && estHour < 20;

  // Update dot color
  if (dot) {
    dot.style.background = isOpen ? 'var(--green, #34d399)' : '#f87171';
    dot.style.animation = isOpen ? '' : 'none';
    dot.style.boxShadow = isOpen ? '' : 'none';
  }

  // Update text
  if (label) {
    label.textContent = isOpen
      ? 'QUEENS, NY · Open Now'
      : 'QUEENS, NY · Closed · We reply as soon as we\'re back';
  }

  // Also handle old-style badge if present
  const oldBadge = document.querySelector('.hero-badge');
  if (oldBadge) {
    oldBadge.classList.toggle('open', isOpen);
    oldBadge.classList.toggle('closed', !isOpen);
  }
};
updateOpenBadge();

// ── IMAGE UPLOAD PREVIEW ──
const uploadArea    = document.getElementById('upload-area');
const uploadInput   = document.getElementById('photos-input');
const uploadBody    = document.getElementById('upload-body');
const uploadPreview = document.getElementById('upload-preview');
const uploadCountEl = document.getElementById('upload-count');
let selectedFiles = [];

if (uploadArea && uploadInput) {
  const MAX_FILES = 5;

  const renderPreviews = () => {
    if (!uploadPreview) return;
    uploadPreview.innerHTML = '';
    selectedFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        const thumb = document.createElement('div');
        thumb.className = 'preview-thumb';
        thumb.innerHTML =
          '<img src="' + e.target.result + '" alt="photo ' + (i + 1) + '"/>' +
          '<button type="button" class="preview-remove" data-index="' + i + '" aria-label="Remove">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
          '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
        uploadPreview.appendChild(thumb);
        thumb.querySelector('.preview-remove').addEventListener('click', ev => {
          ev.stopPropagation();
          selectedFiles.splice(Number(ev.currentTarget.dataset.index), 1);
          syncInput();
          renderPreviews();
          updateUploadUI();
        });
      };
      reader.readAsDataURL(file);
    });
    updateUploadUI();
  };

  const syncInput = () => {
    try {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => dt.items.add(f));
      uploadInput.files = dt.files;
    } catch(e) {}
  };

  const updateUploadUI = () => {
    const count = selectedFiles.length;
    if (uploadBody) uploadBody.style.display = count === 0 ? 'flex' : 'none';
    if (uploadCountEl) {
      uploadCountEl.textContent = count + ' photo' + (count !== 1 ? 's' : '') + ' selected (max ' + MAX_FILES + ')';
      uploadCountEl.classList.toggle('visible', count > 0);
    }
  };

  uploadInput.addEventListener('change', () => {
    const incoming = Array.from(uploadInput.files);
    selectedFiles = [...selectedFiles, ...incoming].slice(0, MAX_FILES);
    syncInput();
    renderPreviews();
  });

  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    selectedFiles = [...selectedFiles, ...dropped].slice(0, MAX_FILES);
    syncInput();
    renderPreviews();
  });
}

// ── CONTACT FORM — UPLOADCARE PHOTOS + FORMSPREE SUBMISSION ──
const contactForm = document.getElementById('contact-form');
const formSuccess  = document.getElementById('form-success');

const tryUploadToUploadcare = async (file, publicKey) => {
  try {
    const fd = new FormData();
    fd.append('UPLOADCARE_PUB_KEY', publicKey);
    fd.append('UPLOADCARE_STORE', '1');
    fd.append('file', file);
    const r = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd });
    const data = await r.json();
    return data.file ? 'https://ucarecdn.com/' + data.file + '/' : null;
  } catch {
    return null;
  }
};

if (contactForm && formSuccess) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;

    try {
      // ── 1. Upload photos to Uploadcare (best-effort, never blocks submission) ──
      const ucHidden = document.getElementById('uc-hidden');
      if (selectedFiles && selectedFiles.length > 0) {
        const PUBLIC_KEY = '2d82695a61c567d9a897';
        const urls = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          btn.textContent = 'Uploading photo ' + (i + 1) + ' of ' + selectedFiles.length + '…';
          const url = await tryUploadToUploadcare(selectedFiles[i], PUBLIC_KEY);
          if (url) urls.push(url);
        }
        if (ucHidden) ucHidden.value = urls.join(' | ');
      } else {
        if (ucHidden) ucHidden.value = '';
      }

      btn.textContent = 'Sending…';

      // ── 2. Submit via FormData exactly as Formspree's AJAX guide specifies ──
      // IMPORTANT: Do NOT set Content-Type manually — browser sets multipart boundary automatically
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      const json = await res.json();

      if (res.ok) {
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Show Formspree's actual error so we know exactly what's wrong
        let errMsg = 'Status ' + res.status + ': ';
        if (json.errors && json.errors.length) {
          errMsg += json.errors.map(function(err) { return err.field ? err.field + ' — ' + err.message : err.message; }).join('. ');
        } else if (json.error) {
          errMsg += json.error;
        } else {
          errMsg += JSON.stringify(json);
        }
        alert('Formspree error: ' + errMsg);
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Network error: ' + err.message);
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// ── FAQ ACCORDION ──
document.querySelectorAll('.faq-item').forEach(item => {
  const btn    = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;
  if (item.classList.contains('open')) {
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(el => {
      el.classList.remove('open');
      const a = el.querySelector('.faq-answer');
      if (a) a.style.maxHeight = '0';
    });
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ── SCROLL TO TOP ──
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
