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
    const email = field.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errorSpan = group.querySelector('.form-error');

    if (!emailRegex.test(email)) {
      valid = false;
      if (errorSpan) {
        if (!email.includes('@')) {
          errorSpan.textContent = 'Email must contain an @ symbol';
        } else if (email.indexOf('@') === 0) {
          errorSpan.textContent = 'Email must have a name before the @';
        } else if (email.split('@').length > 2) {
          errorSpan.textContent = 'Email must contain only one @ symbol';
        } else if (!/\.[a-zA-Z]{2,}$/.test(email)) {
          errorSpan.textContent = 'Email must end with a valid domain (e.g. .com, .ca)';
        } else {
          errorSpan.textContent = 'Please enter a valid email address';
        }
      }
    } else if (errorSpan) {
      errorSpan.textContent = 'Please enter a valid email address';
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
