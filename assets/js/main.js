/**
 * Madhavbaug Energy & Focus™ - High Conversion COD Landing Page Logic (English)
 * Features:
 * 1. Product Showcase & 4-Flavor Interactive Highlights
 * 2. Pricing & Bundle Selector (30 Sachets for 30 Days Format)
 * 3. Unified COD Lead Modal (Name, Phone, Address, City, State, Pincode)
 * 4. 24-Hour Duplicate Prevention by Contact Number
 * 5. Google Sheets Webhook Integration
 * 6. Sticky Floating COD Bar (Mobile & Desktop)
 * 7. FAQ Accordion & Toast Notifications
 */

// ==============================================================================
// GOOGLE SHEETS WEBHOOK CONFIGURATION
// ==============================================================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpU2wx7E1NssG7WnDiJlBBAFcKJ6TWqiUwL7WMosCOPxbWcGjJf3-a8Ya-xP0nHjud/exec';

// Local Storage Key & 24 Hours Cooldown (24 * 60 * 60 * 1000 ms)
const SUBMITTED_CONTACTS_KEY = 'madhavbaug_energy_focus_contacts_24h';
const DUPLICATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Pricing & Bundle Selector State (30 Sachets for 30 Days)
  // ==========================================================================
  const bundleCards = document.querySelectorAll('.bundle-card');
  const formPackCards = document.querySelectorAll('.form-pack-card');
  const currentPriceEl = document.getElementById('currentPrice');
  const originalPriceEl = document.getElementById('originalPrice');
  const discountTagEl = document.getElementById('discountTag');
  const stickyPriceEl = document.getElementById('stickyPrice');
  const stickyPackNameEl = document.getElementById('stickyPackName');

        const bundleData = [
    {
      index: 0,
      title: '1 Pack (Pack of 30 Sachets for 30 Days)',
      sachets: 30,
      price: 649,
      original: 999,
      discount: '35% OFF',
      desc: '30-Day Starter: Pack of 30 Sachets (15 Berry Blast + 15 Tropical Fruit Mango)'
    },
    {
      index: 1,
      title: '2 Packs (60 Days Course - 2x Pack of 30 Sachets)',
      sachets: 60,
      price: 1199,
      original: 1998,
      discount: '40% OFF (Most Popular)',
      desc: 'Most Popular: 60 Days Sustained Vitality & Laser-Sharp Daily Focus'
    },
    {
      index: 2,
      title: '4 Packs (120 Days Course - 4x Pack of 30 Sachets)',
      sachets: 120,
      price: 2199,
      original: 3996,
      discount: '45% OFF (Best Value)',
      desc: 'Best Value: 120 Days Cellular Energy Rejuvenation & Peak Stamina'
    }
  ];

  let selectedBundleIndex = 1; // Default: 2 Packs (Most Popular)

  function updateBundleState(index) {
    selectedBundleIndex = index;
    const data = bundleData[index];

    // Update Hero UI
    if (currentPriceEl) currentPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (originalPriceEl) originalPriceEl.textContent = `₹${data.original.toLocaleString('en-IN')}`;
    if (discountTagEl) discountTagEl.textContent = data.discount;

    // Update Hero Bundle Cards
    bundleCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Form Pack Cards if present
    formPackCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Sticky Bar
    if (stickyPriceEl) stickyPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (stickyPackNameEl) stickyPackNameEl.textContent = data.title;

    // Update hidden inputs and summary in modal form
    const modalSelectedPack = document.getElementById('modalSelectedPack');
    const modalPrice = document.getElementById('modalPrice');
    const modalSummaryPack = document.getElementById('modalSummaryPack');
    const modalSummaryPrice = document.getElementById('modalSummaryPrice');
    if (modalSelectedPack) modalSelectedPack.value = data.title;
    if (modalPrice) modalPrice.value = `₹${data.price.toLocaleString('en-IN')}`;
    if (modalSummaryPack) modalSummaryPack.textContent = data.title;
    if (modalSummaryPrice) modalSummaryPrice.textContent = `₹${data.price.toLocaleString('en-IN')}`;
  }

  bundleCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  formPackCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  // Initialize with index 1 (Most popular)
  updateBundleState(1);

  // ==========================================================================
  // 2. Duplicate Contact Validation (24-Hour Prevention)
  // ==========================================================================
  function cleanPhoneNumber(phone) {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  function checkDuplicateContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return false;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      const timestamp = stored[clean];
      if (timestamp && (Date.now() - timestamp < DUPLICATE_COOLDOWN_MS)) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function saveSubmittedContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      stored[clean] = Date.now();
      localStorage.setItem(SUBMITTED_CONTACTS_KEY, JSON.stringify(stored));
    } catch (e) {}
  }

  const phoneInput = document.getElementById('modalCodPhone');
  const duplicateAlert = document.getElementById('modalDuplicateAlert');

  function validateDuplicateUI() {
    if (!phoneInput) return false;
    const phone = phoneInput.value.trim();
    const isDup = checkDuplicateContact(phone);
    if (duplicateAlert) {
      duplicateAlert.style.display = isDup ? 'block' : 'none';
    }
    return isDup;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', validateDuplicateUI);
    phoneInput.addEventListener('blur', validateDuplicateUI);
  }

  // ==========================================================================
  // 3. Modals Management (Common COD Lead Modal, Thank You Modal)
  // ==========================================================================
  const codModal = document.getElementById('codModal');
  const codModalClose = document.getElementById('codModalClose');
  const thankYouModal = document.getElementById('thankYouModal');
  const thankYouModalClose = document.getElementById('thankYouModalClose');
  const thankYouModalDoneBtn = document.getElementById('thankYouModalDoneBtn');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    if (modal === codModal && duplicateAlert) {
      duplicateAlert.style.display = 'none';
    }

    const firstInput = modal.querySelector('input:not([type="hidden"])');
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ALL CTA BUTTONS ACROSS THE ENTIRE PAGE TRIGGER THIS COMMON COD MODAL
  const allCtaButtons = document.querySelectorAll(
    '.btn-buy-now, #heroBuyNow, #stickyBuyNow, #navCtaBtn, #sectionCodBuyBtn, .btn-hero-order'
  );

  allCtaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(codModal);
    });
  });

  if (codModalClose) codModalClose.addEventListener('click', () => closeModal(codModal));
  if (thankYouModalClose) thankYouModalClose.addEventListener('click', () => closeModal(thankYouModal));
  if (thankYouModalDoneBtn) thankYouModalDoneBtn.addEventListener('click', () => closeModal(thankYouModal));

  // Close modal on overlay background click
  [codModal, thankYouModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [codModal, thankYouModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  // ==========================================================================
  // 4. COD Order Submission (Lead Webhook + 24hr Prevention + Thank You)
  // ==========================================================================
  const modalCodForm = document.getElementById('modalCodForm');

  function generateOrderId() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `MDB-NRG-${randomNum}`;
  }

  function handleOrderSuccess(name, phone, address, city, state, pincode, packTitle, amount, orderId) {
    // Populate Thank You Modal
    const tyOrderId = document.getElementById('thankYouOrderId');
    const tyCustomerName = document.getElementById('thankYouCustomerName');
    const tyPhone = document.getElementById('thankYouPhone');
    const tyPack = document.getElementById('thankYouPack');
    const tyAmount = document.getElementById('thankYouAmount');
    const waShareBtn = document.getElementById('whatsappConfirmBtn');

    const addressParts = [address, city, state, pincode].filter(Boolean);
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Doorstep Cash On Delivery';
    const cityStateText = [city, state].filter(Boolean).join(', ') || 'Gut Health Verification Call';

    if (tyOrderId) tyOrderId.textContent = orderId;
    if (tyCustomerName) tyCustomerName.textContent = name || 'Valued Customer';
    if (tyPhone) tyPhone.textContent = `+91 ${phone}`;
    if (tyPack) tyPack.textContent = packTitle;
    if (tyAmount) tyAmount.textContent = `₹${amount.toLocaleString('en-IN')}`;

    if (waShareBtn) {
      const waText = encodeURIComponent(
        `Hello Madhavbaug! I have placed a Cash On Delivery order for Energy & Focus™ Essential Hydration Sachet Drink.\n` +
        `Order ID: ${orderId}\n` +
        `Pack: ${packTitle}\n` +
        `Amount: ₹${amount}\n` +
        `Name: ${name}\n` +
        `Address: ${formattedAddress}\n` +
        `City/State: ${cityStateText}`
      );
      waShareBtn.href = `https://wa.me/919321456789?text=${waText}`;
    }

    closeModal(codModal);
    openModal(thankYouModal);
    showToast('🎉 Cash on Delivery Order Placed Successfully!');
  }

  if (modalCodForm) {
    modalCodForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('modalCodName')?.value.trim() || '';
      const phone = document.getElementById('modalCodPhone')?.value.trim() || '';
      const address = document.getElementById('modalCodAddress')?.value.trim() || '';
      const city = document.getElementById('modalCodCity')?.value.trim() || '';
      const state = document.getElementById('modalCodState')?.value.trim() || '';
      const pincode = document.getElementById('modalCodPincode')?.value.trim() || '';
      const bundle = bundleData[selectedBundleIndex] || bundleData[1];

      // 1. Check if contact number was already submitted within 24 hours
      if (checkDuplicateContact(phone)) {
        if (duplicateAlert) duplicateAlert.style.display = 'block';
        showToast('⚠️ Already submitted! Wait for 24hr, our gut health expert will call you.');
        return;
      }

      const submitBtn = document.getElementById('modalSubmitBtn');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '⏳ Placing COD Order...';
        submitBtn.disabled = true;
      }

      const orderId = generateOrderId();
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Lead data payload
      const leadData = {
        timestamp: now,
        orderId: orderId,
        name: name,
        contact: phone,
        address: address || '-',
        city: city || '-',
        state: state || '-',
        pincode: pincode || '-',
        package: bundle.title,
        price: `₹${bundle.price}`,
        paymentMode: 'Cash On Delivery (COD)',
        pageUrl: window.location.href
      };

      // 2. Post to Google Sheets Webhook
      if (GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL.trim() !== '') {
        try {
          await fetch(GOOGLE_SHEETS_WEBHOOK_URL.trim(), {
            method: 'POST',
            mode: 'no-cors', // standard for Google Apps Script Web App
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
          });
          console.log('Lead successfully sent to Google Sheets Webhook:', leadData);
        } catch (err) {
          console.error('Error posting lead to Google Sheets:', err);
        }
      }

      // 3. Mark contact as submitted for 24-hr prevention
      saveSubmittedContact(phone);

      // 4. Restore button and show Thank You confirmation modal
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }

      handleOrderSuccess(name, phone, address, city, state, pincode, bundle.title, bundle.price, orderId);
    });
  }

  // ==========================================================================
  // 5. Sticky Bottom Bar Visibility on Scroll (Mobile & Desktop)
  // ==========================================================================
  const stickyBar = document.getElementById('stickyMobileBar');
  const heroSection = document.getElementById('product-hero');

  function handleStickyBar() {
    if (!stickyBar || !heroSection) return;
    const heroRect = heroSection.getBoundingClientRect();
    if (heroRect.bottom < 100) {
      stickyBar.classList.add('visible');
    } else {
      stickyBar.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleStickyBar, { passive: true });
  handleStickyBar();

  // ==========================================================================
  // 6. FAQ Accordion Functionality
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close other FAQs
        faqItems.forEach(otherItem => otherItem.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // ==========================================================================
  // 7. Toast Helper
  // ==========================================================================
  function showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
});
