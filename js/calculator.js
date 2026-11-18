const formatNumber = number => new Intl.NumberFormat('ru-RU').format(number);

function readNum(inputId, label, minimum, maximum, wholeNumber = false) {
    const input = $('#' + inputId).value.replace(/\s/g, '').replace(',', '.');
    if (input === '') {
        setErr(inputId, inputId.endsWith('topup') ? '' : label + ' is required');
        return inputId.endsWith('topup') ? 0 : null;
    }
    if (!/^\d+(\.\d+)?$/.test(input)) {
        setErr(inputId, 'Enter a valid number');
        return null;
    }

    const value = parseFloat(input);
    if (wholeNumber && !Number.isInteger(value)) {
        setErr(inputId, label + ' must be a whole number');
        return null;
    }
    if (value < minimum || value > maximum) {
        setErr(inputId, `${label} must be between ${formatNumber(minimum)} and ${formatNumber(maximum)}`);
        return null;
    }
    setErr(inputId, '');
    return value;
}

function readInputs(prefix = '') {
    const principal = readNum(prefix + 'amount', 'Deposit', 1000, 1e10);
    const annualRate = readNum(prefix + 'rate', 'Rate', 0.01, 100);
    const months = readNum(prefix + 'term', 'Term', 1, 120, true);
    const monthlyTopUp = readNum(prefix + 'topup', 'Top-up', 0, 1e9);
    return [principal, annualRate, months, monthlyTopUp].includes(null)
        ? null
        : { principal, annualRate, months, monthlyTopUp, compound: $('#' + prefix + 'cap').value === '1' };
}

function calc({ principal, annualRate, months, monthlyTopUp, compound }) {
    const monthlyRate = annualRate / 1200;
    let deposited = principal;
    let earnedInterest = 0;
    let balance = principal;
    const balances = [principal];
    const contributions = [principal];

    for (let month = 1; month <= months; month++) {
        const interest = (compound ? balance : deposited) * monthlyRate;
        earnedInterest += interest;
        if (compound) balance += interest;
        deposited += monthlyTopUp;
        if (compound) balance += monthlyTopUp;
        balances.push(compound ? balance : deposited + earnedInterest);
        contributions.push(principal + monthlyTopUp * month);
    }

    const final = balances[months];
    return {
        series: balances,
        contrib: contributions,
        initial: principal,
        added: monthlyTopUp * months,
        interest: final - principal - monthlyTopUp * months,
        final,
        eay: compound ? (Math.pow(1 + monthlyRate, 12) - 1) * 100 : annualRate
    };
}

let lastResult = null;

function render() {
    const inputs = readInputs();
    if (!inputs) return;
    const result = lastResult = calc(inputs);
    const items = [
        ['Initial deposit', result.initial, formatCurrency],
        ['Additional contributions', result.added, formatCurrency],
        ['Earned interest', result.interest, formatCurrency],
        ['Effective annual yield', result.eay, value => value.toFixed(2) + ' %'],
        ['Final amount', result.final, formatCurrency]
    ];
    $('#results').innerHTML = items.map(([label], index) => `<div class="${index === 4 ? 'big' : ''}"><span>${label}</span><b></b></div>`).join('');
    $$('#results b').forEach((element, index) => countUp(element, items[index][1], items[index][2]));
    drawChart(result);
}

function drawChart(result) {
    if (!result) return;
    const canvas = $('#chart');
    const pixelRatio = devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth - 48;
    const height = 260;
    canvas.style.width = width + 'px';
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);

    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue('--muted').trim();
    const lineColor = styles.getPropertyValue('--line').trim();
    const paddingLeft = 62, paddingRight = 10, paddingTop = 10, paddingBottom = 24;
    const maxValue = Math.max(...result.series) * 1.05;
    const months = result.series.length - 1;
    const chartX = month => paddingLeft + month / months * (width - paddingLeft - paddingRight);
    const chartY = value => height - paddingBottom - value / maxValue * (height - paddingTop - paddingBottom);
    context.font = '11px sans-serif';
    context.fillStyle = mutedColor;
    context.strokeStyle = lineColor;
    context.lineWidth = 1;

    for (let tick = 0; tick <= 4; tick++) {
        const value = maxValue * tick / 4;
        const yPosition = chartY(value);
        context.beginPath();
        context.moveTo(paddingLeft, yPosition);
        context.lineTo(width - paddingRight, yPosition);
        context.stroke();
        context.fillText(value >= 1e6 ? (value / 1e6).toFixed(1) + 'M' : Math.round(value / 1e3) + 'k', 6, yPosition + 4);
    }

    context.fillText('0', chartX(0), height - 6);
    context.fillText(months + ' mo', width - paddingRight - 34, height - 6);
    const drawPath = values => {
        context.beginPath();
        values.forEach((value, month) => month ? context.lineTo(chartX(month), chartY(value)) : context.moveTo(chartX(month), chartY(value)));
    };

    drawPath(result.series);
    context.lineTo(chartX(months), chartY(0));
    context.lineTo(chartX(0), chartY(0));
    context.fillStyle = 'rgba(36,123,235,.15)';
    context.fill();
    drawPath(result.series);
    context.strokeStyle = '#247BEB';
    context.lineWidth = 3;
    context.stroke();
    drawPath(result.contrib);
    context.strokeStyle = '#26C6B5';
    context.lineWidth = 2;
    context.stroke();
}

function compare() {
    const firstInputs = readInputs('a_');
    const secondInputs = readInputs('b_');
    if (!firstInputs || !secondInputs) return;
    const firstResult = calc(firstInputs);
    const secondResult = calc(secondInputs);
    const output = $('#cmpOut');
    output.hidden = false;
    const row = (label, format) => `<tr><td>${label}</td><td>${format(firstResult)}</td><td>${format(secondResult)}</td></tr>`;
    const difference = secondResult.final - firstResult.final;
    output.innerHTML = `<table><tr><th></th><th>Scenario A</th><th>Scenario B</th></tr>${row('Deposit + top-ups', result => formatCurrency(result.initial + result.added))}${row('Earned interest', result => formatCurrency(result.interest))}${row('Final amount', result => '<b>' + formatCurrency(result.final) + '</b>')}${row('Effective yield', result => result.eay.toFixed(2) + ' %')}</table>
 <p class="${difference >= 0 ? 'pos' : 'neg'}" style="margin-top:12px">${difference === 0 ? 'Both scenarios give the same final amount.' : `Scenario ${difference > 0 ? 'B' : 'A'} ends with ${formatCurrency(Math.abs(difference))} more.`}</p><p class="muted" style="font-size:.8rem">Example calculation only.</p>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = $('#calcForm');
    calculatorForm.addEventListener('submit', event => {
        event.preventDefault();
        render();
    });
    calculatorForm.addEventListener('input', render);
    $('#resetBtn').onclick = () => {
        [['amount', 1000000], ['rate', 3], ['term', 12], ['topup', 50000]].forEach(([inputId, defaultValue]) => {
            $('#' + inputId).value = defaultValue;
            setErr(inputId, '');
        });
        $('#cap').value = '1';
        render();
    };
    $('#cmpBtn').onclick = compare;
    render();
    compare();
    window.addEventListener('resize', () => drawChart(lastResult));
    window.addEventListener('themechange', () => drawChart(lastResult));
});
