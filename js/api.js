let exchangeRates = null;

async function loadRates() {
    const ratesBox = $('#ratesBox');
    ratesBox.innerHTML = '<span class="spin"></span> Loading rates…';
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        if (data.result !== 'success' || !data.rates || !data.rates.KZT) throw new Error('Bad data');
        exchangeRates = data.rates;

        const tengeRate = exchangeRates.KZT;
        const row = (label, value) => value
            ? `<tr><td>${label}</td><td><b>${value.toFixed(2)} ₸</b></td></tr>`
            : '';
        ratesBox.innerHTML = `<h3>Rates to tenge</h3><table>${row('1 USD', tengeRate)}${row('1 EUR', exchangeRates.EUR && tengeRate / exchangeRates.EUR)}${row('1 RUB', exchangeRates.RUB && tengeRate / exchangeRates.RUB)}</table><p class="muted" style="font-size:.8rem;margin-top:12px">Last updated: ${escapeHtml(data.time_last_update_utc || 'unknown')}. Informational only.</p>`;
        const currencies = ['KZT', 'USD', 'EUR', 'RUB', 'GBP', 'CNY'].filter(currency => exchangeRates[currency]);
        ['c_from', 'c_to'].forEach((inputId, index) => {
            $('#' + inputId).innerHTML = currencies.map(currency => `<option>${currency}</option>`).join('');
            $('#' + inputId).value = index ? 'KZT' : 'USD';
        });
        convert();
    } catch (error) {
        exchangeRates = null;
        ratesBox.innerHTML = '<div class="alert bad">Exchange rates are unavailable right now. Check your connection and try again.</div><button class="btn btn-ghost btn-sm" id="retry" type="button">Retry</button>';
        $('#retry').onclick = loadRates;
        $('#c_out').textContent = '–';
    }
}

function convert() {
    const output = $('#c_out');
    if (!exchangeRates) {
        output.textContent = '–';
        return;
    }
    const input = $('#c_amt').value.replace(/\s/g, '').replace(',', '.');
    if (!input) {
        setErr('c_amt', 'Enter an amount');
        output.textContent = '–';
        return;
    }
    if (!/^\d+(\.\d+)?$/.test(input)) {
        setErr('c_amt', 'Enter a valid number');
        output.textContent = '–';
        return;
    }

    setErr('c_amt', '');
    const sourceCurrency = $('#c_from').value;
    const targetCurrency = $('#c_to').value;
    const convertedAmount = parseFloat(input) * exchangeRates[targetCurrency] / exchangeRates[sourceCurrency];
    output.textContent = `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(convertedAmount)} ${targetCurrency}`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!$('#ratesBox')) return;
    $('#convForm').addEventListener('submit', event => {
        event.preventDefault();
        convert();
    });
    $('#convForm').addEventListener('input', convert);
    loadRates();
});
