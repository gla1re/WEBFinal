const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
document.documentElement.dataset.theme = localStorage.getItem('sb_theme') || 'light';

const store = {
  get(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const formatCurrency = amount => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(amount)) + ' ₸';
const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const validators = {
  email: email => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
  phone: phone => /^\+?[78][\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(phone),
  password: password => password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
  name: name => /^[\p{L}\s.'-]{3,}$/u.test(name)
};
const Auth = {
  users: () => store.get('sb_users', []),
  save: users => store.set('sb_users', users),
  current() {
    const email = store.get('sb_session', null);
    return this.users().find(user => user.email === email) || null;
  },
  update(updatedUser) {
    this.save(this.users().map(user => user.email === updatedUser.email ? updatedUser : user));
  },
  logout() {
    localStorage.removeItem('sb_session');
    location.href = 'index.html';
  }
};

const transactions = {
  list: email => store.get('sb_tx_' + email, []),
  add(user, transaction) {
    const history = transactions.list(user.email);
    history.unshift({ id: Date.now() + Math.random(), date: new Date().toISOString(), ...transaction });
    store.set('sb_tx_' + user.email, history);
  }
};

function toast(message, type = 'ok') {
  let container = $('#toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    document.body.append(container);
  }
  const notification = document.createElement('div');
  notification.className = 'toast ' + (type === 'ok' ? '' : 'err');
  notification.textContent = message;
  container.append(notification);
  setTimeout(() => notification.remove(), 3500);
}

function showModal(title, html) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-bg';
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="x" aria-label="Close">&times;</button><h3>${title}</h3>${html}</div>`;
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop || event.target.classList.contains('x')) close();
  });
  document.addEventListener('keydown', function onEscape(event) {
    if (event.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onEscape);
    }
  });
  document.body.append(backdrop);
  return backdrop;
}

function setErr(id, message) {
  const errorElement = $(`[data-for="${id}"]`);
  if (errorElement) errorElement.textContent = message || '';
  const input = $('#' + id);
  if (input) input.classList.toggle('bad', !!message);
  return !message;
}

function msgBox(id, text, type) {
  const box = $('#' + id);
  if (!box) return;
  box.className = 'alert ' + (type === 'ok' ? 'ok' : 'bad');
  box.textContent = text;
  box.hidden = false;
}

function countUp(element, target, format = formatCurrency) {
  const startTime = performance.now();
  function step(time) {
    const progress = Math.min((time - startTime) / 600, 1);
    element.textContent = format(target * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  step(startTime);
}
const PRODUCTS = [
  { id: 'debit', name: 'Jew Bronze', cls: 'v-blue', type: 'Debit card', fee: 'Issue: 2 000 ₸ · Service: 1 500 ₸/month', perks: ['0.1% cashback on purchases', 'ATM withdrawal fee: 2%', 'Apple Pay and Google Pay support'], d: 'A basic card with very basic rewards.' },
  { id: 'virtual', name: 'Jew Silver', cls: 'v-teal', type: 'Debit card', fee: 'Issue: 5 000 ₸ · Service: 3 000 ₸/month', perks: ['0.2% cashback on purchases', 'ATM withdrawal fee: 1.5%', 'Online payments and card controls'], d: 'A little more cashback, a little more in fees.' },
  { id: 'premium', name: 'Jew Gold', cls: 'v-gold', type: 'Premium card', fee: 'Issue: 15 000 ₸ · Service: 10 000 ₸/month', perks: ['0.5% cashback on purchases', 'ATM withdrawal fee: 1%', 'Priority support'], d: 'Premium service with a premium price tag.' },
  { id: 'savings', name: 'JewBank Savings', cls: 'v-green', type: 'Savings account', fee: 'Opening: free · Service: 500 ₸/month', perks: ['Example rate: 3% per year', 'Monthly interest capitalization', 'Top up and withdraw any time'], d: 'Your savings grow slowly. Our fees arrive on time.' },
  { id: 'loan', name: 'JewBank Loan', cls: 'v-blue', type: 'Personal loan', fee: 'Example interest rate: 50% per year', perks: ['Loan amounts from 100 000 ₸', 'Terms from 6 to 36 months', 'Approval is not guaranteed'], d: 'Borrow today, pay plenty of interest tomorrow.' }];
function openApply(product) {
  const modal = showModal('Apply: ' + product.name, `<p class="muted">Demo form. No real application is sent.</p><form id="apF" novalidate>
 <label>Full name<input id="ap_name" autocomplete="name"><small class="err" data-for="ap_name"></small></label>
 <label>Email<input id="ap_email" autocomplete="email"><small class="err" data-for="ap_email"></small></label>
 <label>Phone<input id="ap_phone" placeholder="+7 777 123 45 67"><small class="err" data-for="ap_phone"></small></label>
 <button class="btn btn-primary">Submit application</button></form>`);
  $('#apF', modal).addEventListener('submit', event => {
    event.preventDefault();
    const validName = setErr('ap_name', validators.name($('#ap_name').value.trim()) ? '' : 'Enter your full name (3+ letters)');
    const validEmail = setErr('ap_email', validators.email($('#ap_email').value.trim()) ? '' : 'Enter a valid email like name@example.com');
    const validPhone = setErr('ap_phone', validators.phone($('#ap_phone').value.trim()) ? '' : 'Enter a phone like +7 777 123 45 67');
    if (!(validName && validEmail && validPhone)) return;

    const applications = store.get('sb_apps', []);
    applications.push({ product: product.id, name: $('#ap_name').value.trim(), date: Date.now() });
    store.set('sb_apps', applications);
    $('#apF', modal).outerHTML = '<div class="alert ok">Application received (demo). Thank you!</div>';
    toast('Application submitted');
  });
}

function initProducts() {
  const container = $('#products');
  if (!container) return;
  container.innerHTML = PRODUCTS.map(product => `<article class="card hov reveal"><div class="vcard ${product.cls}"><div><b>JewBank</b><br><small>${product.type}</small></div><div class="num">•••• 4821</div></div>
  <h3>${product.name}</h3><p class="muted">${product.d}</p><p><small><b>Fees:</b> ${product.fee}</small></p><ul class="ticks">${product.perks.map(perk => `<li>${perk}</li>`).join('')}</ul>
  <div class="row"><button class="btn btn-ghost btn-sm" data-more="${product.id}">Learn more</button><button class="btn btn-primary btn-sm" data-apply="${product.id}">Apply now</button></div></article>`).join('');
  container.addEventListener('click', event => {
    const moreButton = event.target.closest('[data-more]');
    const applyButton = event.target.closest('[data-apply]');
    if (moreButton) {
      const product = PRODUCTS.find(item => item.id === moreButton.dataset.more);
      const modal = showModal(product.name, `<p class="muted">${product.d}</p><p><b>Fees:</b> ${product.fee}</p><ul class="ticks">${product.perks.map(perk => `<li>${perk}</li>`).join('')}</ul><p class="muted" style="font-size:.8rem;margin-bottom:12px">Fictional product, example terms only.</p><button class="btn btn-primary" id="goApply">Apply now</button>`);
      $('#goApply', modal).onclick = () => {
        modal.remove();
        openApply(product);
      };
    }
    if (applyButton) openApply(PRODUCTS.find(product => product.id === applyButton.dataset.apply));
  });
  const compareButton = $('#compareBtn');
  if (compareButton) {
    compareButton.onclick = () => showModal('Compare products', `<div class="tbl"><table><tr><th>Product</th><th>Type</th><th>Fees</th></tr>${PRODUCTS.map(product => `<tr><td>${product.name}</td><td>${product.type}</td><td style="white-space:normal">${product.fee}</td></tr>`).join('')}</table></div>`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const currentUser = Auth.current();
  const pages = [['index.html', 'Home'], ['deposits.html', 'Deposits'], ['cards.html', 'Cards'], ['payments.html', 'Payments'], currentUser ? ['profile.html', 'Profile'] : ['auth.html', 'Log in']];
  document.body.insertAdjacentHTML('afterbegin', `<header class="site-header"><div class="wrap bar"><a class="logo" href="index.html"><i class="fa-solid fa-shield-halved"></i> Jew<b>Bank</b></a>
  <nav id="nav" aria-label="Main">${pages.map(([href, title]) => `<a href="${href}" class="${href === currentPage ? 'act' : ''}">${title}</a>`).join('')}</nav>
  <div class="tools"><button id="themeBtn" class="icon-btn" aria-label="Toggle light/dark theme"></button><button id="burger" class="icon-btn" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button></div></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap"><div class="fgrid"><div><div class="logo"><i class="fa-solid fa-shield-halved"></i> Jew<b>Bank</b></div><p>Your Digital Banking Experience.</p></div>
  <div><b>Navigate</b>${pages.map(([href, title]) => `<a href="${href}">${title}</a>`).join('')}</div>
  <div><b>Contact (fictional)</b><p><i class="fa-solid fa-location-dot"></i> Astana, Demo Street 1<br><i class="fa-solid fa-phone"></i> +7 700 000 00 00<br><i class="fa-solid fa-envelope"></i> hello@jewbank.example</p></div></div>
  <p class="fine">Demo university project. Not a real bank. No real transactions or credentials. Original design inspired by modern fintech usability.</p></div></footer>`);
  const themeButton = $('#themeBtn');
  const updateThemeIcon = () => {
    themeButton.innerHTML = `<i class="fa-solid fa-${document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i>`;
  };
  updateThemeIcon();
  themeButton.onclick = () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sb_theme', theme);
    updateThemeIcon();
    window.dispatchEvent(new Event('themechange'));
  };
  $('#burger').onclick = () => $('#nav').classList.toggle('open');
  initProducts();

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  $$('.reveal').forEach(element => revealObserver.observe(element));
  $$('[data-count]').forEach(element => {
    const target = +element.dataset.count;
    const suffix = element.dataset.suffix || '';
    const counterObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        countUp(element, target, value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value) + suffix);
        counterObserver.disconnect();
      }
    });
    counterObserver.observe(element);
  });
});
