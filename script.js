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

// ── NAVBAR SCROLL GLASS ──
const header = document.querySelector('header');
const onScroll = () => {
  if (window.scrollY > 30) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

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

const updateOpenBadge = () => {
  const badge = document.querySelector('.hero-badge');
  if (!badge) return;
  const label = badge.querySelector('span');
  let estHour = new Date().getHours();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit'
    }).formatToParts(new Date());
    const hourPart = parts.find(part => part.type === 'hour');
    if (hourPart) estHour = Number(hourPart.value);
  } catch (error) {
    // fall back to local time if timezone conversion is unavailable
  }

  const isOpen = estHour >= 10 && estHour < 20;
  badge.classList.toggle('open', isOpen);
  badge.classList.toggle('closed', !isOpen);
  label.textContent = isOpen
    ? 'QUEENS, NY · Open Now'
    : 'QUEENS, NY · Closed — contact us, we\'ll respond as soon as we can';
};

updateOpenBadge();

// ── CONTACT FORM — INLINE THANK YOU ──
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
if (contactForm && formSuccess) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        btn.textContent = 'Send Message';
        btn.disabled = false;
        alert('Something went wrong. Please try WhatsApp instead.');
      }
    } catch {
      btn.textContent = 'Send Message';
      btn.disabled = false;
      alert('Something went wrong. Please try WhatsApp instead.');
    }
  });
}

// ── FAQ ACCORDION ──
document.querySelectorAll('.faq-item').forEach((item, i) => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;

  // Set initial state for open items
  if (item.classList.contains('open')) {
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item').forEach(el => {
      el.classList.remove('open');
      const a = el.querySelector('.faq-answer');
      if (a) a.style.maxHeight = '0';
    });
    // Open clicked if it was closed
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

// ── IMAGE UPLOAD PREVIEW ──
const uploadArea = document.getElementById('upload-area');
const uploadInput = document.getElementById('photos');
const uploadBody = document.getElementById('upload-body');
const uploadPreview = document.getElementById('upload-preview');

if (uploadArea && uploadInput) {
  const MAX_FILES = 5;
  let selectedFiles = [];

  const renderPreviews = () => {
    uploadPreview.innerHTML = '';
    selectedFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        const thumb = document.createElement('div');
        thumb.className = 'preview-thumb';
        thumb.innerHTML = `
          <img src="${e.target.result}" alt="photo ${i+1}"/>
          <button type="button" class="preview-remove" data-index="${i}" aria-label="Remove">✕</button>
        `;
        uploadPreview.appendChild(thumb);
        thumb.querySelector('.preview-remove').addEventListener('click', ev => {
          ev.stopPropagation();
          selectedFiles.splice(Number(ev.currentTarget.dataset.index), 1);
          syncInput();
          renderPreviews();
          updateUI();
        });
      };
      reader.readAsDataURL(file);
    });
    updateUI();
  };

  const syncInput = () => {
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    uploadInput.files = dt.files;
  };

  const updateUI = () => {
    const count = selectedFiles.length;
    uploadBody.style.display = count === 0 ? 'flex' : 'none';
    let countEl = uploadArea.querySelector('.upload-count');
    if (!countEl) {
      countEl = document.createElement('div');
      countEl.className = 'upload-count';
      uploadArea.appendChild(countEl);
    }
    countEl.textContent = `${count} photo${count !== 1 ? 's' : ''} selected (max ${MAX_FILES})`;
    countEl.classList.toggle('visible', count > 0);
  };

  uploadInput.addEventListener('change', () => {
    const incoming = Array.from(uploadInput.files);
    const combined = [...selectedFiles, ...incoming].slice(0, MAX_FILES);
    selectedFiles = combined;
    syncInput();
    renderPreviews();
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const combined = [...selectedFiles, ...dropped].slice(0, MAX_FILES);
    selectedFiles = combined;
    syncInput();
    renderPreviews();
  });
}
