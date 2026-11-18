const encodePassword = password => btoa(unescape(encodeURIComponent(password)));

function showTab(tab) {
  $('#loginForm').hidden = tab !== 'login';
  $('#signupForm').hidden = tab !== 'signup';
  $$('[data-tab]').forEach(button => button.classList.toggle('on', button.dataset.tab === tab));
  $('#authMsg').hidden = true;
}

function initAuth() {
  $$('[data-tab]').forEach(button => button.onclick = () => showTab(button.dataset.tab));
  showTab(location.hash === '#signup' ? 'signup' : 'login');

  $('#signupForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#s_name').value.trim();
    const email = $('#s_email').value.trim().toLowerCase();
    const phone = $('#s_phone').value.trim();
    const password = $('#s_pass').value;
    const confirmPassword = $('#s_pass2').value;
    const isValid = [
      setErr('s_name', validators.name(name) ? '' : 'Enter your full name (letters, 3+ characters)'),
      setErr('s_email', validators.email(email) ? '' : 'Enter a valid email like name@example.com'),
      setErr('s_phone', validators.phone(phone) ? '' : 'Enter a phone like +7 777 123 45 67'),
      setErr('s_pass', validators.password(password) ? '' : 'Use 8+ characters with an uppercase letter, a number and a special character'),
      setErr('s_pass2', confirmPassword === '' ? 'Confirm your password' : confirmPassword === password ? '' : 'Passwords do not match')
    ].every(Boolean);
    if (!isValid) return;
    if (Auth.users().some(user => user.email === email)) {
      setErr('s_email', 'An account with this email already exists. Log in instead.');
      return;
    }

    const user = { name, email, phone, pass: encodePassword(password), balance: 1250000, savings: 3400000 };
    Auth.save([...Auth.users(), user]);
    const millisecondsPerDay = 864e5;
    const now = Date.now();
    const sampleTransactions = [
      ['Salary (demo)', 'in', 'Transfer', 650000, 6],
      ['Mobile: Beeline', 'out', 'Mobile', 5000, 4],
      ['Utilities: Electricity', 'out', 'Utilities', 18400, 3],
      ['Online store order', 'out', 'Shopping', 32900, 1]
    ];
    sampleTransactions.forEach(([description, type, category, amount, daysAgo]) => {
      transactions.add(user, { desc: description, type, cat: category, amount, date: new Date(now - daysAgo * millisecondsPerDay).toISOString() });
    });

    event.target.reset();
    showTab('login');
    $('#l_email').value = email;
    msgBox('authMsg', 'Account created. Log in to continue.', 'ok');
  });

  $('#loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#l_email').value.trim().toLowerCase();
    const password = $('#l_pass').value;
    const isValid = [
      setErr('l_email', validators.email(email) ? '' : 'Enter a valid email'),
      setErr('l_pass', password ? '' : 'Enter your password')
    ].every(Boolean);
    if (!isValid) return;

    const user = Auth.users().find(account => account.email === email);
    if (!user || user.pass !== encodePassword(password)) {
      msgBox('authMsg', 'Email or password is incorrect. Check them or sign up.', 'bad');
      return;
    }
    store.set('sb_session', email);
    location.href = 'profile.html';
  });
}

function initProfile() {
  if (!Auth.current()) {
    location.replace('auth.html#login');
    return;
  }
  $('#profile').hidden = false;

  const draw = () => {
    const user = Auth.current();
    const recentTransactions = transactions.list(user.email).slice(0, 5);
    $('#welcome').textContent = 'Welcome, ' + user.name.split(' ')[0] + '!';
    $('#pTotal').textContent = formatCurrency(user.balance + user.savings);
    $('#pMain').textContent = formatCurrency(user.balance);
    $('#pSav').textContent = formatCurrency(user.savings);
    $('#pInfo').innerHTML = `<span>Name</span><b>${escapeHtml(user.name)}</b><span>Email</span><b>${escapeHtml(user.email)}</b><span>Phone</span><b>${escapeHtml(user.phone)}</b>`;
    const estimatedInterest = user.savings * (Math.pow(1 + 0.03 / 12, 12) - 1);
    $('#pDep').textContent = `Savings of ${formatCurrency(user.savings)} could earn about ${formatCurrency(estimatedInterest)} in 12 months at an example rate of 3% with monthly compounding (before fees).`;
    $('#pTx').innerHTML = recentTransactions.length
      ? recentTransactions.map(transaction => `<tr><td>${new Date(transaction.date).toLocaleDateString('en-GB')}</td><td>${escapeHtml(transaction.desc)}</td><td class="${transaction.type === 'in' ? 'pos' : transaction.type === 'out' ? 'neg' : ''}">${transaction.type === 'in' ? '+' : transaction.type === 'out' ? '-' : ''}${formatCurrency(transaction.amount)}</td></tr>`).join('')
      : '<tr><td class="muted">No transactions yet. Make a transfer to see it here.</td></tr>';
  };

  draw();
  $('#logoutBtn').onclick = () => Auth.logout();
  $('#editBtn').onclick = () => {
    const user = Auth.current();
    const modal = showModal('Edit profile', `<form id="edF" novalidate><label>Full name<input id="e_name" value="${escapeHtml(user.name)}"><small class="err" data-for="e_name"></small></label><label>Phone<input id="e_phone" value="${escapeHtml(user.phone)}"><small class="err" data-for="e_phone"></small></label><button class="btn btn-primary">Save changes</button></form>`);
    $('#edF', modal).addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#e_name').value.trim();
      const phone = $('#e_phone').value.trim();
      const isValid = [
        setErr('e_name', validators.name(name) ? '' : 'Enter your full name (3+ letters)'),
        setErr('e_phone', validators.phone(phone) ? '' : 'Enter a phone like +7 777 123 45 67')
      ].every(Boolean);
      if (!isValid) return;

      Auth.update({ ...user, name, phone });
      modal.remove();
      draw();
      toast('Profile saved');
    });
  };
}

document.addEventListener('DOMContentLoaded', () => {
  if ($('#loginForm')) initAuth();
  if ($('#profile')) initProfile();
});
