// Navigation: preserve URLs, expose state and support keyboard dismissal.
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const setMenuOpen = open => {
  hamburger?.classList.toggle('open', open);
  mobileMenu?.classList.toggle('open', open);
  hamburger?.setAttribute('aria-expanded', String(open));
  hamburger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
hamburger?.addEventListener('click', () => setMenuOpen(hamburger.getAttribute('aria-expanded') !== 'true'));
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && hamburger?.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false); hamburger.focus();
  }
});
window.matchMedia('(min-width: 769px)').addEventListener('change', e => { if (e.matches) setMenuOpen(false); });
document.querySelectorAll('nav a, .mobile-menu a').forEach(a => {
  const url = new URL(a.href);
  if (url.pathname === location.pathname && !url.hash) {
    a.classList.add('active'); a.setAttribute('aria-current', 'page');
  }
});
// Carry category/model selection into the existing quote form without changing its endpoint.
const deviceInput = document.getElementById('device');
const requestedDevice = new URLSearchParams(location.search).get('device');
if (deviceInput && requestedDevice) deviceInput.value = requestedDevice.slice(0, 120);

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
    const errorBox = document.getElementById('form-error');
    errorBox.hidden = true;
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
          if (!url) throw new Error('A photo could not be uploaded. Please retry, remove the photo, or send it through WhatsApp.');
          urls.push(url);
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
        formSuccess.focus();
        formSuccess.scrollIntoView({ block: 'center' });
      } else {
        errorBox.textContent = 'Your message could not be sent. Please retry or contact us on WhatsApp.';
        errorBox.hidden = false;
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } catch (err) {
      console.error('Submission error:', err);
      errorBox.textContent = err.message.includes('photo') ? err.message : 'Your message could not be sent. Check your connection and retry, or contact us on WhatsApp.';
      errorBox.hidden = false;
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// FAQ answers are visible without JavaScript; enhanced buttons expose expanded state.
const faqItems = [...document.querySelectorAll('.faq-item')];
function setFAQ(item, open) {
  item.classList.toggle('open', open);
  item.querySelector('.faq-question').setAttribute('aria-expanded', String(open));
  item.querySelector('.faq-answer').hidden = !open;
}
faqItems.forEach((item, i) => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;
  btn.id = 'faq-question-' + i;
  answer.id = 'faq-answer-' + i;
  btn.setAttribute('aria-controls', answer.id);
  answer.setAttribute('aria-labelledby', btn.id);
  setFAQ(item, item.classList.contains('open'));
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    faqItems.forEach(other => setFAQ(other, false));
    setFAQ(item, open);
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
