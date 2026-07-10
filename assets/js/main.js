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
  'active-claims': { title: 'Claims Tracker', sub: 'Track cashless pre-auths, final settlements, and payment ledgers' },
  'rejections': { title: 'Rejections & Queries', sub: '3 urgent actions require your reply' },
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

// ── Patient Verification & Pre-Auth Logic ─────────────────────────────────

const MOCK_PATIENTS = {
  '99421-A': {
    id: '99421-A',
    name: 'Rajiv Verma',
    insurer: 'Star Health',
    policy: 'MED-2394-A',
    meta: 'Age 52 · Male · Active since 2021',
    limit: '₹2,50,000'
  },
  '9876543210': {
    id: '99421-A',
    name: 'Rajiv Verma',
    insurer: 'Star Health',
    policy: 'MED-2394-A',
    meta: 'Age 52 · Male · Active since 2021',
    limit: '₹2,50,000'
  },
  '88210-B': {
    id: '88210-B',
    name: 'Sneha Patil',
    insurer: 'HDFC ERGO',
    policy: 'HDFC-2947-1234',
    meta: 'Age 34 · Female · Active since 2019',
    limit: '₹3,50,000'
  }
};

let currentVerifiedPatient = null;

function verifyPatient() {
  const searchInput = document.getElementById('patient-search-input');
  if (!searchInput) return;
  const val = searchInput.value.trim();
  if (!val) {
    showToastHP('Please enter a Patient ID or Mobile Number', 'warning');
    return;
  }

  const patient = MOCK_PATIENTS[val];
  const resultCard = document.getElementById('patient-verify-result');

  if (patient) {
    currentVerifiedPatient = patient;
    document.getElementById('verify-res-name').textContent = patient.name;
    document.getElementById('verify-res-meta').textContent = patient.meta;
    document.getElementById('verify-res-insurer').textContent = patient.insurer + ' · ' + patient.policy;
    document.getElementById('verify-res-policy').textContent = 'Policy Verified Online';
    document.getElementById('verify-res-limit').textContent = patient.limit;

    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToastHP('Patient found & policy verified successfully!', 'success');
  } else {
    showToastHP('No active policy found. Check details or try again.', 'error');
    if (resultCard) resultCard.style.display = 'none';
    currentVerifiedPatient = null;
  }
}

function verifyPatientQuick() {
  const insurer = document.getElementById('quick-eligibility-insurer').value;
  const policy = document.getElementById('quick-eligibility-policy').value.trim();

  if (insurer === 'Select Insurer' || !policy) {
    showToastHP('Please select insurer and enter policy number', 'warning');
    return;
  }

  currentVerifiedPatient = {
    id: 'TR-' + Math.floor(1000 + Math.random() * 9000),
    name: 'Patient (Quick Check)',
    insurer: insurer,
    policy: policy,
    meta: 'Eligibility checked on the fly',
    limit: '₹1,80,000'
  };

  document.getElementById('verify-res-name').textContent = currentVerifiedPatient.name;
  document.getElementById('verify-res-meta').textContent = currentVerifiedPatient.meta;
  document.getElementById('verify-res-insurer').textContent = currentVerifiedPatient.insurer + ' · ' + currentVerifiedPatient.policy;
  document.getElementById('verify-res-policy').textContent = 'Real-time TPA check complete';
  document.getElementById('verify-res-limit').textContent = currentVerifiedPatient.limit;

  const resultCard = document.getElementById('patient-verify-result');
  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  showToastHP('Quick eligibility check passed!', 'success');
}

function hideVerificationResult() {
  const resultCard = document.getElementById('patient-verify-result');
  if (resultCard) resultCard.style.display = 'none';
  currentVerifiedPatient = null;
}

function initiatePreAuthFromVerification() {
  if (!currentVerifiedPatient) {
    showToastHP('No active patient verified', 'warning');
    return;
  }

  const formName = document.getElementById('pre-auth-form-name');
  const formId = document.getElementById('pre-auth-form-id');
  const formInsurer = document.getElementById('pre-auth-form-insurer');
  const formPolicy = document.getElementById('pre-auth-form-policy');

  if (formName) formName.value = currentVerifiedPatient.name;
  if (formId) formId.value = currentVerifiedPatient.id;
  if (formInsurer) formInsurer.value = currentVerifiedPatient.insurer.split(' · ')[0];
  if (formPolicy) formPolicy.value = currentVerifiedPatient.policy;

  const icuCheck = document.getElementById('pre-auth-form-icu');
  if (icuCheck) {
    icuCheck.checked = false;
    toggleIcuStatus(false);
  }

  showScreen('pre-auth');
  togglePreAuthForm(true);
  showToastHP('Pre-authorization form pre-filled with patient details', 'info');
}

function openSubmissionWizard(mode = 'preauth') {
  showScreen('pre-auth');
  const formCard = document.getElementById('pre-auth-form-card');
  if (formCard) {
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const formName = document.getElementById('pre-auth-form-name');
    if (formName && !formName.value) {
      document.getElementById('pre-auth-form-name').value = 'Rajiv Verma';
      document.getElementById('pre-auth-form-id').value = '99421-A';
      document.getElementById('pre-auth-form-insurer').value = 'Star Health';
      document.getElementById('pre-auth-form-policy').value = 'MED-2394-A';
      document.getElementById('pre-auth-form-procedure').value = 'Laparoscopic Cholecystectomy';
      document.getElementById('pre-auth-form-amount').value = '145000';
    }
  }
  switchSubmissionMode(mode);
}

function togglePreAuthForm(show) {
  if (show) openSubmissionWizard('preauth');
  else {
    const formCard = document.getElementById('pre-auth-form-card');
    if (formCard) formCard.style.display = 'none';
  }
}

function switchSubmissionMode(mode) {
  const radioPreauth = document.getElementById('sub-type-preauth');
  const radioCashlessClaim = document.getElementById('sub-type-cashless-claim');
  const radioReimbursement = document.getElementById('sub-type-reimbursement');

  if (mode === 'preauth' && radioPreauth) radioPreauth.checked = true;
  else if (mode === 'cashless-claim' && radioCashlessClaim) radioCashlessClaim.checked = true;
  else if (mode === 'reimbursement' && radioReimbursement) radioReimbursement.checked = true;

  const currentMode = (radioReimbursement && radioReimbursement.checked) ? 'reimbursement'
                    : (radioCashlessClaim && radioCashlessClaim.checked) ? 'cashless-claim'
                    : 'preauth';

  const titleEl = document.getElementById('submission-wizard-title');
  const procLabel = document.getElementById('label-form-procedure');
  const amtLabel = document.getElementById('label-form-amount');
  const extraFields = document.getElementById('claim-extra-fields');
  const submitBtn = document.getElementById('wizard-submit-btn');

  if (currentMode === 'reimbursement') {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="wallet" class="icon-sm"></i> Submit With-Cash / Reimbursement Claim';
    if (procLabel) procLabel.textContent = 'Procedure / Treatment Summary';
    if (amtLabel) amtLabel.textContent = 'Total Out-of-Pocket Paid Bill (₹)';
    if (extraFields) extraFields.style.display = 'block';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="check-circle" class="icon-sm"></i> Submit Reimbursement Package to Insurer';
  } else if (currentMode === 'cashless-claim') {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="check-circle" class="icon-sm"></i> Submit Cashless Final Discharge Claim';
    if (procLabel) procLabel.textContent = 'Procedure / Treatment Summary';
    if (amtLabel) amtLabel.textContent = 'Final Hospital Claim Amount (₹)';
    if (extraFields) extraFields.style.display = 'block';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="check-circle" class="icon-sm"></i> Submit Cashless Final Claim for Settlement';
  } else {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="shield-check" class="icon-sm"></i> Submit Cashless Pre-Authorization';
    if (procLabel) procLabel.textContent = 'Proposed Procedure';
    if (amtLabel) amtLabel.textContent = 'Estimated Bill Amount (₹)';
    if (extraFields) extraFields.style.display = 'none';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="send" class="icon-sm"></i> Submit Cashless Pre-Authorization to TPA';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleIcuStatus(checked) {
  const helper = document.getElementById('icu-helper-text');
  if (helper) {
    if (checked) {
      helper.innerHTML = '<strong>🚨 ICU Emergency Mode:</strong> OTP verification bypassed. Hospital desk authorized this submission directly due to patient emergency.';
      helper.style.color = '#ef4444';
    } else {
      helper.textContent = 'Standard Patient Portal confirmation is not possible. Submit directly on behalf of patient.';
      helper.style.color = '#b45309';
    }
  }
}

function submitSubmissionWizard() {
  const radioCashlessClaim = document.getElementById('sub-type-cashless-claim');
  const radioReimbursement = document.getElementById('sub-type-reimbursement');
  const currentMode = (radioReimbursement && radioReimbursement.checked) ? 'reimbursement'
                    : (radioCashlessClaim && radioCashlessClaim.checked) ? 'cashless-claim'
                    : 'preauth';

  const name = document.getElementById('pre-auth-form-name').value.trim();
  const id = document.getElementById('pre-auth-form-id').value.trim();
  const insurer = document.getElementById('pre-auth-form-insurer').value;
  const policy = document.getElementById('pre-auth-form-policy').value.trim();
  const diagnosis = document.getElementById('pre-auth-form-diagnosis').value;
  const procedure = document.getElementById('pre-auth-form-procedure').value.trim();
  const amount = document.getElementById('pre-auth-form-amount').value.trim();
  const isIcu = document.getElementById('pre-auth-form-icu').checked;

  if (!name || !id || !policy || !procedure || !amount) {
    showToastHP('Please fill out all required fields', 'warning');
    return;
  }

  const formattedAmount = '₹' + parseInt(amount).toLocaleString('en-IN');

  if (currentMode === 'reimbursement' || currentMode === 'cashless-claim') {
    const claimId = 'CLM-2026-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = (document.getElementById('claim-form-invoice') && document.getElementById('claim-form-invoice').value.trim()) || 'INV-2026-NEW';
    const tagBg = currentMode === 'reimbursement' ? '#fef9c3' : '#dcfce7';
    const tagColor = currentMode === 'reimbursement' ? '#854d0e' : '#15803d';
    const tagText = currentMode === 'reimbursement' ? 'Reimbursement (Cash)' : 'Cashless Final Claim';

    // Add row to Claims Tracker Active Claims Table
    const claimsTbody = document.querySelector('#claims-content-active tbody');
    if (claimsTbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="antd-text-strong">${id}</span></td>
        <td>${name}</td>
        <td>${insurer}</td>
        <td><span class="antd-tag" style="background: ${tagBg}; color: ${tagColor}; font-weight: 600;">${tagText}</span></td>
        <td>${formattedAmount}</td>
        <td><span class="antd-tag antd-tag-success">Submitted (${claimId})</span></td>
        <td>Just now</td>
        <td><button class="antd-btn">View Docs</button></td>
      `;
      claimsTbody.insertBefore(tr, claimsTbody.firstChild);
    }

    // Also show in Pre-Auth table
    const paTbody = document.getElementById('active-pre-auth-tbody');
    if (paTbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="antd-text-strong">${claimId}</span></td>
        <td>${name}<br><span class="antd-text-tertiary">ID: ${id}</span></td>
        <td>${procedure}<br><span class="antd-text-tertiary">Inv: ${invoiceNo}</span></td>
        <td>${insurer}</td>
        <td style="font-weight:700;">${formattedAmount}</td>
        <td><span class="antd-tag" style="background: ${tagBg}; color: ${tagColor};">${tagText}</span></td>
        <td>Today</td>
        <td><button class="antd-btn">View</button></td>
      `;
      paTbody.insertBefore(tr, paTbody.firstChild);
    }

    if (currentMode === 'reimbursement') {
      showToastHP(`With-Cash Reimbursement claim ${claimId} submitted to ${insurer}!`, 'success');
    } else {
      showToastHP(`Cashless Final claim ${claimId} submitted to ${insurer} for settlement!`, 'success');
    }
  } else {
    const requestId = 'PA-2026-' + Math.floor(1000 + Math.random() * 9000);
    const statusTag = isIcu 
      ? '<span class="antd-tag antd-tag-warning">ICU Emergency</span>' 
      : '<span class="antd-tag antd-tag-info">AI Reviewing</span>';

    const paTbody = document.getElementById('active-pre-auth-tbody');
    if (paTbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="antd-text-strong">${requestId}</span></td>
        <td>${name}<br><span class="antd-text-tertiary">ID: ${id}</span></td>
        <td>${procedure}<br><span class="antd-text-tertiary">Diag: ${diagnosis}</span></td>
        <td>${insurer}</td>
        <td style="font-weight:700;">${formattedAmount}</td>
        <td>${statusTag}</td>
        <td>Today</td>
        <td><button class="antd-btn">View</button></td>
      `;
      paTbody.insertBefore(tr, paTbody.firstChild);
    }

    // Mirror to Claims Tracker table
    const claimsTbody = document.querySelector('#claims-content-active tbody');
    if (claimsTbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="antd-text-strong">${id}</span></td>
        <td>${name}</td>
        <td>${insurer}</td>
        <td><span class="antd-tag" style="background: var(--antd-bg); color: var(--antd-text-main); font-weight:600;">Cashless Pre-Auth</span></td>
        <td>${formattedAmount}</td>
        <td>${statusTag}</td>
        <td>Just now</td>
        <td><button class="antd-btn">View Docs</button></td>
      `;
      claimsTbody.insertBefore(tr, claimsTbody.firstChild);
    }

    const preAuthBadge = document.querySelector('#nav-pre-auth span');
    if (preAuthBadge) {
      const currentVal = parseInt(preAuthBadge.textContent);
      preAuthBadge.textContent = currentVal + 1;
    }

    if (isIcu) {
      showToastHP(`Emergency Pre-Auth ${requestId} submitted without patient OTP`, 'success');
    } else {
      showToastHP(`Cashless Pre-authorization ${requestId} submitted successfully to ${insurer}`, 'success');
    }
  }

  // Clear form
  document.getElementById('pre-auth-form-name').value = '';
  document.getElementById('pre-auth-form-id').value = '';
  document.getElementById('pre-auth-form-policy').value = '';
  document.getElementById('pre-auth-form-procedure').value = '';
  document.getElementById('pre-auth-form-amount').value = '';
  document.getElementById('pre-auth-form-icu').checked = false;
  toggleIcuStatus(false);
  togglePreAuthForm(false);
}

// Legacy compat wrapper
function submitPreAuthForm() { submitSubmissionWizard(); }

// ── Login page logic ──────────────────────────────────────────────────────
function doStaffLogin() {
  const email = document.getElementById('login-email') ? document.getElementById('login-email').value : '';
  const password = document.getElementById('login-password') ? document.getElementById('login-password').value : '';

  if (!email || !password) {
    showToastHP('Please enter email and password', 'warning');
    return;
  }

  const btn = document.getElementById('login-submit-btn');
  if (btn) { btn.textContent = 'Verifying...'; btn.disabled = true; }

  setTimeout(() => {
    hpLogin('Dr. Sharma', 'Medanta - The Medicity, Gurugram');
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
  }, 1200);
}

// ── Claims Tracker Tab Switching & Filtering ──────────────────────────────
function switchClaimsTrackerTab(tabId) {
  const tabs = ['active', 'history', 'settlements'];
  tabs.forEach(t => {
    const content = document.getElementById('claims-content-' + t);
    const btn = document.getElementById('claims-tab-btn-' + t);
    if (content) {
      content.style.display = (t === tabId) ? 'block' : 'none';
    }
    if (btn) {
      if (t === tabId) {
        btn.classList.add('antd-btn-primary');
      } else {
        btn.classList.remove('antd-btn-primary');
      }
    }
  });
  filterClaimsTable();
}

function filterClaimsTable() {
  const query = (document.getElementById('claims-filter-search')?.value || '').toLowerCase().trim();
  const insurer = document.getElementById('claims-filter-insurer')?.value || '';
  const status = document.getElementById('claims-filter-status')?.value || '';

  // Apply to active visible tab table
  const activeTab = document.getElementById('claims-content-history')?.style.display === 'block' ? '#table-claims-history'
                  : document.getElementById('claims-content-settlements')?.style.display === 'block' ? '#table-claims-settlements'
                  : '#table-claims-active';

  const table = document.querySelector(activeTab);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(tr => {
    const text = tr.textContent.toLowerCase();
    const matchQuery = !query || text.includes(query);
    const matchInsurer = !insurer || text.includes(insurer.toLowerCase());
    const matchStatus = !status || text.includes(status.toLowerCase());
    tr.style.display = (matchQuery && matchInsurer && matchStatus) ? '' : 'none';
  });
}

function resetClaimsFilters() {
  const searchEl = document.getElementById('claims-filter-search');
  const insurerEl = document.getElementById('claims-filter-insurer');
  const statusEl = document.getElementById('claims-filter-status');
  if (searchEl) searchEl.value = '';
  if (insurerEl) insurerEl.value = '';
  if (statusEl) statusEl.value = '';
  filterClaimsTable();
  showToastHP('Filters reset', 'info');
}

function openClaimProgressModal(claimId, patientName, insurer, amount, status, percent) {
  const modal = document.getElementById('claim-progress-modal');
  if (!modal) return;

  const idEl = document.getElementById('modal-claim-id');
  const subEl = document.getElementById('modal-patient-sub');
  const labelEl = document.getElementById('modal-progress-label');
  const tagEl = document.getElementById('modal-status-tag');
  const barEl = document.getElementById('modal-progress-bar');

  if (idEl) idEl.textContent = `Claim Progress • ${claimId}`;
  if (subEl) subEl.textContent = `${patientName} • ${insurer} • ${amount}`;
  if (labelEl) labelEl.textContent = `Lifecycle Progress: ${percent}% Complete`;
  if (tagEl) {
    tagEl.textContent = status;
    tagEl.className = percent === 100 ? 'antd-tag antd-tag-success'
                    : percent >= 60 ? 'antd-tag antd-tag-info'
                    : 'antd-tag antd-tag-warning';
  }
  if (barEl) {
    barEl.style.width = percent + '%';
    barEl.style.background = percent === 100 ? '#10b981'
                           : percent >= 60 ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                           : '#f59e0b';
  }

  modal.style.display = 'flex';
}

function closeClaimProgressModal() {
  const modal = document.getElementById('claim-progress-modal');
  if (modal) modal.style.display = 'none';
}
