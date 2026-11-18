const providersByCategory = {
    Mobile: ['Beeline', 'Activ', 'Tele2', 'Altel'],
    Internet: ['Kazakhtelecom', 'Beeline Home', 'Megaline'],
    Utilities: ['Electricity', 'Water', 'Gas', 'Heating'],
    Shopping: ['Marketplace order', 'Online store', 'Food delivery']
};
let selectedCategory = 'Mobile';

function parseAmt(inputId) {
    const input = $('#' + inputId).value.replace(/\s/g, '').replace(',', '.');
    if (!input) {
        setErr(inputId, 'Enter an amount');
        return null;
    }
    if (!/^\d+(\.\d+)?$/.test(input)) {
        setErr(inputId, 'Enter a valid number');
        return null;
    }

    const amount = parseFloat(input);
    if (amount < 100) {
        setErr(inputId, 'Minimum amount is 100 ₸');
        return null;
    }
    if (amount > 1e9) {
        setErr(inputId, 'Amount is too large');
        return null;
    }
    setErr(inputId, '');
    return amount;
}

function refresh() {
    const user = Auth.current();
    if (user) {
        $('#balMain').textContent = formatCurrency(user.balance);
        $('#balSav').textContent = formatCurrency(user.savings);
    }
    drawHistory();
}

function drawHistory() {
    const user = Auth.current();
    const historyTable = $('#hist');
    if (!user) {
        historyTable.innerHTML = '<tr><td colspan="4" class="muted">Log in to see your payment history.</td></tr>';
        return;
    }

    const search = $('#q').value.trim().toLowerCase();
    const categoryFilter = $('#fcat').value;
    const typeFilter = $('#ftype').value;
    const history = transactions.list(user.email).filter(transaction =>
        (!search || transaction.desc.toLowerCase().includes(search)) &&
        (!categoryFilter || transaction.cat === categoryFilter) &&
        (!typeFilter || transaction.type === typeFilter)
    );

    historyTable.innerHTML = history.length
        ? history.map(transaction => `<tr><td>${new Date(transaction.date).toLocaleDateString('en-GB')}</td><td>${escapeHtml(transaction.desc)}</td><td>${transaction.cat}</td><td class="${transaction.type === 'in' ? 'pos' : transaction.type === 'out' ? 'neg' : ''}">${transaction.type === 'in' ? '+' : transaction.type === 'out' ? '-' : ''}${formatCurrency(transaction.amount)}</td></tr>`).join('')
        : '<tr><td colspan="4" class="muted">No matching payments. Clear the filters or make a payment.</td></tr>';
}

function guard(messageId) {
    const user = Auth.current();
    if (!user) {
        msgBox(messageId, 'Log in first to use this feature.', 'bad');
        toast('Please log in first', 'err');
    }
    return user;
}

function init() {
    if (!Auth.current()) $('#needLogin').hidden = false;
    refresh();

    $('#tForm').addEventListener('submit', event => {
        event.preventDefault();
        const recipientName = $('#t_name').value.trim();
        const accountNumber = $('#t_acc').value.replace(/\s/g, '').toUpperCase();
        const sourceAccount = $('#t_from').value;
        const validName = setErr('t_name', validators.name(recipientName) ? '' : 'Enter the recipient full name (letters, 3+ characters)');
        const validAccount = setErr('t_acc', /^(KZ\d{2}[A-Z0-9]{16}|\d{16})$/.test(accountNumber) ? '' : 'Use a 16-digit card number or KZ followed by 18 characters');
        const amount = parseAmt('t_amt');
        if (!(validName && validAccount && amount !== null)) return;

        const user = guard('t_msg');
        if (!user) return;
        if (amount > user[sourceAccount]) {
            msgBox('t_msg', 'Insufficient funds. Lower the amount or choose another account.', 'bad');
            return;
        }

        user[sourceAccount] -= amount;
        Auth.update(user);
        transactions.add(user, { desc: 'Transfer to ' + recipientName, type: 'out', cat: 'Transfer', amount });
        event.target.reset();
        refresh();
        msgBox('t_msg', `Sent ${formatCurrency(amount)} to ${recipientName} (demo).`, 'ok');
        toast('Transfer sent');
    });

    $('#oForm').addEventListener('submit', event => {
        event.preventDefault();
        const amount = parseAmt('o_amt');
        if (amount === null) return;
        const user = guard('o_msg');
        if (!user) return;

        const [sourceAccount, targetAccount, description] = $('#o_dir').value === 'ms' ? ['balance', 'savings', 'Main to Savings'] : ['savings', 'balance', 'Savings to Main'];
        if (amount > user[sourceAccount]) {
            msgBox('o_msg', 'Insufficient funds in the source account.', 'bad');
            return;
        }

        user[sourceAccount] -= amount;
        user[targetAccount] += amount;
        Auth.update(user);
        transactions.add(user, { desc: description, type: 'own', cat: 'Own transfer', amount });
        event.target.reset();
        refresh();
        msgBox('o_msg', 'Moved ' + formatCurrency(amount) + ' (' + description + ').', 'ok');
        toast('Money moved');
    });

    const fillProviders = () => {
        $('#p_prov').innerHTML = providersByCategory[selectedCategory].map(provider => `<option>${provider}</option>`).join('');
    };
    fillProviders();

    $('#cats').addEventListener('click', event => {
        const button = event.target.closest('[data-cat]');
        if (!button) return;
        selectedCategory = button.dataset.cat;
        $$('#cats .chip').forEach(chip => chip.classList.toggle('on', chip === button));
        fillProviders();
    });

    $('#pForm').addEventListener('submit', event => {
        event.preventDefault();
        const reference = $('#p_ref').value.trim();
        const validReference = setErr('p_ref', /^[\w\s+-]{4,}$/.test(reference) ? '' : 'Enter at least 4 characters (digits, letters, + or -)');
        const amount = parseAmt('p_amt');
        if (!(validReference && amount !== null)) return;

        const user = guard('p_msg');
        if (!user) return;
        if (amount > user.balance) {
            msgBox('p_msg', 'Insufficient funds in the main account.', 'bad');
            return;
        }

        const provider = $('#p_prov').value;
        user.balance -= amount;
        Auth.update(user);
        transactions.add(user, { desc: `${selectedCategory}: ${provider} (${reference})`, type: 'out', cat: selectedCategory, amount });
        event.target.reset();
        fillProviders();
        refresh();
        msgBox('p_msg', `Paid ${formatCurrency(amount)} to ${provider} (demo).`, 'ok');
        toast('Payment completed');
    });

    ['q', 'fcat', 'ftype'].forEach(inputId => $('#' + inputId).addEventListener('input', drawHistory));
    if (location.hash) {
        const section = document.getElementById(location.hash.slice(1));
        if (section) section.scrollIntoView();
    }
}
document.addEventListener('DOMContentLoaded', init);
