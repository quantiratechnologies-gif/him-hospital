// ─── Hospital Portal Main JS ───────────────────────────────────────────────

// Initialize Lucide icons after DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ── Screen Management ─────────────────────────────────────────────────────
const SCREEN_META = {
  'dashboard': { title: 'Dashboard', sub: 'Good morning — Here\'s your claims workstation overview' },
  'patient-verification': { title: 'Patient Verification', sub: 'Real-time insurance eligibility via API' },
  'admission': { title: 'Admissions', sub: 'Insurance patients currently admitted' },
  'pre-auth': { title: 'Pre-Authorization', sub: 'AI-assisted pre-auth submission wizard' },
  'document-upload': { title: 'Document Upload', sub: 'AI auto-categorization for bills and reports' },
  'ai-optimizer': { title: 'AI Description Optimizer', sub: 'Improve clinical descriptions to match ICD-10 codes' },
  'active-claims': { title: 'Active Claims', sub: 'Real-time status of all submitted claims' },
  'claim-history': { title: 'Claim History', sub: 'All past claims submitted from this hospital' },
  'rejections': { title: 'Rejections & Queries', sub: '3 urgent actions require your reply' },
  'settlements': { title: 'Settlement Ledger', sub: 'Track payments received from insurers' },
  'notifications': { title: 'Notifications', sub: 'Insurance updates, TPA queries, and AI alerts' },
  'settings': { title: 'Settings', sub: 'Hospital profile, bank details, and staff access' },
};

function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Deactivate all nav links
  document.querySelectorAll('.app-nav-link').forEach(a => a.classList.remove('active'));

  // Show target screen
  const target = document.getElementById('screen-' + screenId);
  if (target) {
    target.classList.add('active');
  } else {
    console.warn('Screen not found:', 'screen-' + screenId);
    return;
  }

  // Activate corresponding nav link
  const navLink = document.getElementById('nav-' + screenId);
  if (navLink) navLink.classList.add('active');

  // Update topbar
  const meta = SCREEN_META[screenId];
  if (meta) {
    const titleEl = document.getElementById('topbar-title');
    const subEl = document.getElementById('topbar-sub');
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.sub;
  }

  // Re-render lucide icons for dynamically shown content
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Auth ──────────────────────────────────────────────────────────────────
function hpLogin(staffName, hospitalName) {
  document.getElementById('hp-login-screen').style.display = 'none';
  document.getElementById('hp-app').style.display = 'flex';

  // Personalize
  if (staffName) {
    const sbName = document.getElementById('sb-user-name');
    if (sbName) sbName.textContent = staffName;
    const av = document.getElementById('sb-user-avatar');
    if (av) av.textContent = staffName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  if (hospitalName) {
    const hname = document.getElementById('sb-hosp-name');
    if (hname) hname.textContent = hospitalName;
  }

  showScreen('dashboard');
  showToastHP('Welcome to the Hospital Claims Workstation', 'success');
}

function hpLogout() {
  document.getElementById('hp-app').style.display = 'none';
  document.getElementById('hp-login-screen').style.display = 'flex';
  showToastHP('Logged out successfully', 'info');
}

// ── Toast Notifications ───────────────────────────────────────────────────
function showToastHP(message, type = 'info') {
  let container = document.getElementById('hp-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hp-toast-container';
    container.className = 'hp-toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
    info: '<svg width="16" height="16" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `hp-toast hp-toast-${type}`;
  toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Legacy compat (used by older screens)
function showToast(msg, type) { showToastHP(msg, type); }

// ── Login page logic ──────────────────────────────────────────────────────
let loginMode = 'staff'; // 'staff' or 'onboard'

function selectLoginMode(mode) {
  loginMode = mode;
  const staffTab = document.getElementById('login-tab-staff');
  const onboardTab = document.getElementById('login-tab-onboard');
  const staffForm = document.getElementById('login-form-staff');
  const onboardForm = document.getElementById('login-form-onboard');
  if (!staffTab) return;

  if (mode === 'staff') {
    staffTab.style.borderBottomColor = 'var(--hp-primary)';
    staffTab.style.color = 'var(--hp-primary)';
    onboardTab.style.borderBottomColor = 'transparent';
    onboardTab.style.color = '#64748b';
    staffForm.style.display = 'block';
    onboardForm.style.display = 'none';
  } else {
    onboardTab.style.borderBottomColor = 'var(--hp-primary)';
    onboardTab.style.color = 'var(--hp-primary)';
    staffTab.style.borderBottomColor = 'transparent';
    staffTab.style.color = '#64748b';
    staffForm.style.display = 'none';
    onboardForm.style.display = 'block';
  }
}

function doStaffLogin() {
  const email = document.getElementById('login-email') ? document.getElementById('login-email').value : '';
  const password = document.getElementById('login-password') ? document.getElementById('login-password').value : '';

  if (!email || !password) {
    showToastHP('Please enter email and password', 'warning');
    return;
  }

  // Simulate login
  const btn = document.getElementById('login-submit-btn');
  if (btn) { btn.textContent = 'Verifying...'; btn.disabled = true; }

  setTimeout(() => {
    hpLogin('Dr. Sharma', 'Apollo Hospitals, Jubilee Hills');
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
  }, 1200);
}

function doOnboardRequest() {
  showToastHP('Onboarding request submitted! Our team will contact you within 24 hours.', 'success');
}
