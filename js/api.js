/* Exchange rates from open.er-api.com (informational; never invented) */
let RATES=null;
async function loadRates(){const box=$('#ratesBox');box.innerHTML='<span class="spin"></span> Loading rates…';
 try{const r=await fetch('https://open.er-api.com/v6/latest/USD');if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();if(d.result!=='success'||!d.rates||!d.rates.KZT)throw new Error('Bad data');RATES=d.rates;
  const k=RATES.KZT,row=(l,v)=>v?`<tr><td>${l}</td><td><b>${v.toFixed(2)} ₸</b></td></tr>`:'';
  box.innerHTML=`<h3>Rates to tenge</h3><table>${row('1 USD',k)}${row('1 EUR',RATES.EUR&&k/RATES.EUR)}${row('1 RUB',RATES.RUB&&k/RATES.RUB)}</table><p class="muted" style="font-size:.8rem;margin-top:12px">Last updated: ${esc(d.time_last_update_utc||'unknown')}. Informational only.</p>`;
  const cur=['KZT','USD','EUR','RUB','GBP','CNY'].filter(c=>RATES[c]);
  ['c_from','c_to'].forEach((id,i)=>{$('#'+id).innerHTML=cur.map(c=>`<option>${c}</option>`).join('');$('#'+id).value=i?'KZT':'USD'});convert()}
 catch(err){RATES=null;box.innerHTML='<div class="alert bad">Exchange rates are unavailable right now. Check your connection and try again.</div><button class="btn btn-ghost btn-sm" id="retry" type="button">Retry</button>';$('#retry').onclick=loadRates;$('#c_out').textContent='–'}}
/* Convert via USD base: amount * rate[to] / rate[from] */
function convert(){const out=$('#c_out');if(!RATES){out.textContent='–';return}
 const raw=$('#c_amt').value.replace(/\s/g,'').replace(',','.');
 if(!raw){setErr('c_amt','Enter an amount');out.textContent='–';return}
 if(!/^\d+(\.\d+)?$/.test(raw)){setErr('c_amt','Enter a valid number');out.textContent='–';return}
 setErr('c_amt','');const f=$('#c_from').value,t=$('#c_to').value,v=parseFloat(raw)*RATES[t]/RATES[f];
 out.textContent=`${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v)} ${t}`}
document.addEventListener('DOMContentLoaded',()=>{if(!$('#ratesBox'))return;$('#convForm').addEventListener('submit',e=>{e.preventDefault();convert()});
 $('#convForm').addEventListener('input',convert);loadRates()});
