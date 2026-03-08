/* ============================================================
   CONTACT.JS — Form Validation & Submission
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (form) initContactForm(form);
});

function initContactForm(form) {
  const submitBtn = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');
  const contactCard = document.getElementById('contactCard');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check honeypot — if filled, it's a bot
    const honeypot = form.querySelector('#website');
    if (honeypot && honeypot.value) {
      // Silently "succeed" for bots
      showSuccess();
      return;
    }

    // Validate fields
    const isValid = validateForm(form);
    if (!isValid) return;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Sending...';

    try {
      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject') || '',
        message: formData.get('message')
      };
      delete payload.website; // remove honeypot

      const { error } = await db.from('contacts').insert([payload]);
      if (error) throw error;
      showSuccess();

    } catch (error) {
      console.error('Form submission error:', error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message →';

      // Show error feedback
      submitBtn.style.background = '#ef4444';
      submitBtn.innerHTML = 'Failed to send — try again';
      setTimeout(() => {
        submitBtn.style.background = '';
        submitBtn.innerHTML = 'Send Message →';
      }, 3000);
    }
  });

  // Real-time validation on blur
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('blur', () => {
      validateField(field);
    });

    // Clear error on input
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (group) group.classList.remove('error');
    });
  });

  function showSuccess() {
    form.style.display = 'none';
    if (formSuccess) formSuccess.classList.add('show');
  }
}

/* ---------- Form Validation ---------- */
function validateForm(form) {
  let isValid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!validateField(field)) isValid = false;
  });
  return isValid;
}

function validateField(field) {
  const group = field.closest('.form-group');
  if (!group) return true;

  let valid = true;

  if (field.hasAttribute('required') && !field.value.trim()) {
    valid = false;
  }

  if (field.type === 'email' && field.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value.trim())) {
      valid = false;
    }
  }

  if (valid) {
    group.classList.remove('error');
  } else {
    group.classList.add('error');
    // Subtle shake animation
    group.style.animation = 'none';
    group.offsetHeight; // Trigger reflow
    group.style.animation = 'shake 0.4s ease';
  }

  return valid;
}

// shake & spin keyframes are defined in style.css
