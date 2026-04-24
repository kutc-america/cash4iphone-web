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
// Detects which section is currently behind the navbar and adapts its color.
// Each section can declare data-nav-theme="dark|black|blue|green|purple"
const header = document.querySelector('header');

const navThemes = {
  // theme name → [background, border-color]
  'black':  ['rgba(0,0,0,0.75)',        'rgba(255,255,255,0.06)'],
  'dark':   ['rgba(10,22,40,0.92)',     'rgba(79,158,255,0.15)'],
  'blue':   ['rgba(8,28,56,0.92)',      'rgba(79,158,255,0.3)'],
  'green':  ['rgba(5,30,22,0.92)',      'rgba(52,211,153,0.25)'],
  'purple': ['rgba(18,10,40,0.92)',     'rgba(167,139,250,0.25)'],
  'orange': ['rgba(30,20,5,0.92)',      'rgba(251,191,36,0.2)'],
};

let currentTheme = 'dark';

const applyNavTheme = (theme) => {
  if (!header || theme === currentTheme) return;
  currentTheme = theme;
  const [bg, border] = navThemes[theme] || navThemes['dark'];
  header.style.background = bg;
  header.style.borderColor = border;
};

// Use IntersectionObserver on each section — whichever is most visible sets the theme
const sections = document.querySelectorAll('[data-nav-theme]');

if (sections.length > 0) {
  const sectionObserver = new IntersectionObserver((entries) => {
    // Find the section with the highest intersection ratio that's currently crossing the nav area
    let best = null;
    let bestRatio = 0;
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        best = entry.target;
      }
    });
    if (best) {
      applyNavTheme(best.dataset.navTheme);
    }
  }, {
    // rootMargin: watch a thin band at the top of the viewport where the navbar lives
    rootMargin: '-0px 0px -85% 0px',
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
  });

  sections.forEach(s => sectionObserver.observe(s));
} else {
  // Fallback: simple scroll-based for pages without data-nav-theme sections
  const onScroll = () => {
    if (window.scrollY > 80) {
      applyNavTheme('dark');
      header.classList.add('scrolled');
    } else {
      applyNavTheme('black');
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
