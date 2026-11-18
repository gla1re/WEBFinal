/* Simulated transfers, payments and history (localStorage) */
const PROV={Mobile:['Beeline','Activ','Tele2','Altel'],Internet:['Kazakhtelecom','Beeline Home','Megaline'],Utilities:['Electricity','Water','Gas','Heating'],Shopping:['Marketplace order','Online store','Food delivery']};
let cat='Mobile';
/* Validate an amount field: number between 100 and 1e9 KZT */
function parseAmt(id){const raw=$('#'+id).value.replace(/\s/g,'').replace(',','.');
 if(!raw)return setErr(id,'Enter an amount'),null;if(!/^\d+(\.\d+)?$/.test(raw))return setErr(id,'Enter a valid number'),null;
 const n=parseFloat(raw);if(n<100)return setErr(id,'Minimum amount is 100 ₸'),null;if(n>1e9)return setErr(id,'Amount is too large'),null;return setErr(id,''),n}
function refresh(){const u=Auth.current();if(u){$('#balMain').textContent=fmt(u.balance);$('#balSav').textContent=fmt(u.savings)}drawHistory()}
function drawHistory(){const u=Auth.current(),b=$('#hist');if(!u){b.innerHTML='<tr><td colspan="4" class="muted">Log in to see your payment history.</td></tr>';return}
 const q=$('#q').value.trim().toLowerCase(),c=$('#fcat').value,t=$('#ftype').value;
 const l=Tx.list(u.email).filter(x=>(!q||x.desc.toLowerCase().includes(q))&&(!c||x.cat===c)&&(!t||x.type===t));
 b.innerHTML=l.length?l.map(x=>`<tr><td>${new Date(x.date).toLocaleDateString('en-GB')}</td><td>${esc(x.desc)}</td><td>${x.cat}</td><td class="${x.type==='in'?'pos':x.type==='out'?'neg':''}">${x.type==='in'?'+':x.type==='out'?'-':''}${fmt(x.amount)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted">No matching payments. Clear the filters or make a payment.</td></tr>'}
/* Returns the logged-in user or shows an error message */
function guard(msgId){const u=Auth.current();if(!u){msgBox(msgId,'Log in first to use this feature.','bad');toast('Please log in first','err')}return u}
function init(){
 if(!Auth.current())$('#needLogin').hidden=false;refresh();
 $('#tForm').addEventListener('submit',e=>{e.preventDefault();
  const name=$('#t_name').value.trim(),acc=$('#t_acc').value.replace(/\s/g,'').toUpperCase(),from=$('#t_from').value;
  const a=setErr('t_name',V.name(name)?'':'Enter the recipient full name (letters, 3+ characters)'),b=setErr('t_acc',/^(KZ\d{2}[A-Z0-9]{16}|\d{16})$/.test(acc)?'':'Use a 16-digit card number or KZ followed by 18 characters'),amt=parseAmt('t_amt');
  if(!(a&&b&&amt!==null))return;const u=guard('t_msg');if(!u)return;
  if(amt>u[from]){msgBox('t_msg','Insufficient funds. Lower the amount or choose another account.','bad');return}
  u[from]-=amt;Auth.update(u);Tx.add(u,{desc:'Transfer to '+name,type:'out',cat:'Transfer',amount:amt});
  e.target.reset();refresh();msgBox('t_msg',`Sent ${fmt(amt)} to ${name} (demo).`,'ok');toast('Transfer sent')});
 $('#oForm').addEventListener('submit',e=>{e.preventDefault();const amt=parseAmt('o_amt');if(amt===null)return;const u=guard('o_msg');if(!u)return;
  const [f,t,lbl]=$('#o_dir').value==='ms'?['balance','savings','Main to Savings']:['savings','balance','Savings to Main'];
  if(amt>u[f]){msgBox('o_msg','Insufficient funds in the source account.','bad');return}
  u[f]-=amt;u[t]+=amt;Auth.update(u);Tx.add(u,{desc:lbl,type:'own',cat:'Own transfer',amount:amt});
  e.target.reset();refresh();msgBox('o_msg','Moved '+fmt(amt)+' ('+lbl+').','ok');toast('Money moved')});
 const fillProv=()=>$('#p_prov').innerHTML=PROV[cat].map(p=>`<option>${p}</option>`).join('');fillProv();
 $('#cats').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;cat=b.dataset.cat;$$('#cats .chip').forEach(x=>x.classList.toggle('on',x===b));fillProv()});
 $('#pForm').addEventListener('submit',e=>{e.preventDefault();const ref=$('#p_ref').value.trim();
  const a=setErr('p_ref',/^[\w\s+-]{4,}$/.test(ref)?'':'Enter at least 4 characters (digits, letters, + or -)'),amt=parseAmt('p_amt');if(!(a&&amt!==null))return;
  const u=guard('p_msg');if(!u)return;if(amt>u.balance){msgBox('p_msg','Insufficient funds in the main account.','bad');return}
  const prov=$('#p_prov').value;u.balance-=amt;Auth.update(u);Tx.add(u,{desc:`${cat}: ${prov} (${ref})`,type:'out',cat,amount:amt});
  e.target.reset();fillProv();refresh();msgBox('p_msg',`Paid ${fmt(amt)} to ${prov} (demo).`,'ok');toast('Payment completed')});
 ['q','fcat','ftype'].forEach(id=>$('#'+id).addEventListener('input',drawHistory));
 if(location.hash){const t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}}
document.addEventListener('DOMContentLoaded',init);
