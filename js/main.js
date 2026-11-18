/* SmartBank shared helpers: theme, layout, storage, validation, modals */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
document.documentElement.dataset.theme=localStorage.getItem('sb_theme')||'light';
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v===null?d:v}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.round(n))+' ₸';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* JS-only validators (no HTML validation attributes) */
const V={email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
 phone:v=>/^\+?[78][\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(v),
 password:v=>v.length>=8&&/[A-Z]/.test(v)&&/\d/.test(v)&&/[^A-Za-z0-9]/.test(v),
 name:v=>/^[\p{L}\s.'-]{3,}$/u.test(v)};
/* Auth + transactions (client-side simulation only) */
const Auth={users:()=>store.get('sb_users',[]),save:u=>store.set('sb_users',u),
 current(){const e=store.get('sb_session',null);return this.users().find(u=>u.email===e)||null},
 update(u){this.save(this.users().map(x=>x.email===u.email?u:x))},
 logout(){localStorage.removeItem('sb_session');location.href='index.html'}};
const Tx={list:e=>store.get('sb_tx_'+e,[]),
 add(u,t){const l=Tx.list(u.email);l.unshift({id:Date.now()+Math.random(),date:new Date().toISOString(),...t});store.set('sb_tx_'+u.email,l)}};
function toast(msg,type='ok'){let b=$('#toasts');if(!b){b=document.createElement('div');b.id='toasts';document.body.append(b)}
 const t=document.createElement('div');t.className='toast '+(type==='ok'?'':'err');t.textContent=msg;b.append(t);setTimeout(()=>t.remove(),3500)}
function showModal(title,html){const bg=document.createElement('div');bg.className='modal-bg';
 bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><button class="x" aria-label="Close">&times;</button><h3>${title}</h3>${html}</div>`;
 const close=()=>bg.remove();bg.addEventListener('click',e=>{if(e.target===bg||e.target.classList.contains('x'))close()});
 document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}});
 document.body.append(bg);return bg}
function setErr(id,msg){const e=$(`[data-for="${id}"]`);if(e)e.textContent=msg||'';const i=$('#'+id);if(i)i.classList.toggle('bad',!!msg);return !msg}
function msgBox(id,text,type){const b=$('#'+id);if(!b)return;b.className='alert '+(type==='ok'?'ok':'bad');b.textContent=text;b.hidden=false}
function countUp(el,to,f=fmt){const t0=performance.now();(function s(t){const p=Math.min((t-t0)/600,1);el.textContent=f(to*p);if(p<1)requestAnimationFrame(s)})(t0)}
const PRODUCTS=[
 {id:'debit',name:'SmartBank Debit',cls:'v-blue',type:'Debit card',fee:'Issue: free · Service: 0 ₸/month',perks:['1% cashback on groceries (example)','Free ATM withdrawals up to 500 000 ₸/month','Apple Pay and Google Pay support'],d:'Your everyday card for shops, transport and online payments.'},
 {id:'virtual',name:'SmartBank Virtual',cls:'v-teal',type:'Virtual card',fee:'Issue: free · Service: 0 ₸/month',perks:['Created instantly in the app','Separate card number for online shopping','Freeze and unfreeze in one tap'],d:'A digital-only card that keeps your main card number private.'},
 {id:'premium',name:'SmartBank Premium',cls:'v-gold',type:'Premium card',fee:'Service: 2 500 ₸/month (waived above 500 000 ₸ balance)',perks:['3% cashback on travel (example)','Airport lounge access, 2 visits/month','Priority support'],d:'For frequent travellers who want more back from every purchase.'},
 {id:'savings',name:'SmartBank Savings',cls:'v-green',type:'Savings account',fee:'Opening and service: free',perks:['Example rate: 14% per year','Monthly interest capitalization','Top up and withdraw any time'],d:'Set money aside and watch it grow. Rates shown are examples only.'}];
function openApply(p){const m=showModal('Apply: '+p.name,`<p class="muted">Demo form. No real application is sent.</p><form id="apF" novalidate>
 <label>Full name<input id="ap_name" autocomplete="name"><small class="err" data-for="ap_name"></small></label>
 <label>Email<input id="ap_email" autocomplete="email"><small class="err" data-for="ap_email"></small></label>
 <label>Phone<input id="ap_phone" placeholder="+7 777 123 45 67"><small class="err" data-for="ap_phone"></small></label>
 <button class="btn btn-primary">Submit application</button></form>`);
 $('#apF',m).addEventListener('submit',e=>{e.preventDefault();
  const a=setErr('ap_name',V.name($('#ap_name').value.trim())?'':'Enter your full name (3+ letters)'),
   b=setErr('ap_email',V.email($('#ap_email').value.trim())?'':'Enter a valid email like name@example.com'),
   c=setErr('ap_phone',V.phone($('#ap_phone').value.trim())?'':'Enter a phone like +7 777 123 45 67');
  if(!(a&&b&&c))return;const l=store.get('sb_apps',[]);l.push({product:p.id,name:$('#ap_name').value.trim(),date:Date.now()});store.set('sb_apps',l);
  $('#apF',m).outerHTML='<div class="alert ok">Application received (demo). Thank you!</div>';toast('Application submitted');});}
function initProducts(){const box=$('#products');if(!box)return;
 box.innerHTML=PRODUCTS.map(p=>`<article class="card hov reveal"><div class="vcard ${p.cls}"><div><b>SmartBank</b><br><small>${p.type}</small></div><div class="num">•••• 4821</div></div>
  <h3>${p.name}</h3><p class="muted">${p.d}</p><p><small><b>Fees:</b> ${p.fee}</small></p><ul class="ticks">${p.perks.map(x=>`<li>${x}</li>`).join('')}</ul>
  <div class="row"><button class="btn btn-ghost btn-sm" data-more="${p.id}">Learn more</button><button class="btn btn-primary btn-sm" data-apply="${p.id}">Apply now</button></div></article>`).join('');
 box.addEventListener('click',e=>{const m=e.target.closest('[data-more]'),a=e.target.closest('[data-apply]');
  if(m){const p=PRODUCTS.find(x=>x.id===m.dataset.more);const md=showModal(p.name,`<p class="muted">${p.d}</p><p><b>Fees:</b> ${p.fee}</p><ul class="ticks">${p.perks.map(x=>`<li>${x}</li>`).join('')}</ul><p class="muted" style="font-size:.8rem;margin-bottom:12px">Fictional product, example terms only.</p><button class="btn btn-primary" id="goApply">Apply now</button>`);
   $('#goApply',md).onclick=()=>{md.remove();openApply(p)}}
  if(a)openApply(PRODUCTS.find(x=>x.id===a.dataset.apply))});
 const cb=$('#compareBtn');if(cb)cb.onclick=()=>showModal('Compare products',`<div class="tbl"><table><tr><th>Product</th><th>Type</th><th>Fees</th></tr>${PRODUCTS.map(p=>`<tr><td>${p.name}</td><td>${p.type}</td><td style="white-space:normal">${p.fee}</td></tr>`).join('')}</table></div>`)}
document.addEventListener('DOMContentLoaded',()=>{
 const here=location.pathname.split('/').pop()||'index.html',u=Auth.current();
 const pages=[['index.html','Home'],['deposits.html','Deposits'],['cards.html','Cards'],['payments.html','Payments'],u?['profile.html','Profile']:['auth.html','Log in']];
 document.body.insertAdjacentHTML('afterbegin',`<header class="site-header"><div class="wrap bar"><a class="logo" href="index.html"><i class="fa-solid fa-shield-halved"></i> Smart<b>Bank</b></a>
  <nav id="nav" aria-label="Main">${pages.map(([h,t])=>`<a href="${h}" class="${h===here?'act':''}">${t}</a>`).join('')}</nav>
  <div class="tools"><button id="themeBtn" class="icon-btn" aria-label="Toggle light/dark theme"></button><button id="burger" class="icon-btn" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button></div></div></header>`);
 document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap"><div class="fgrid"><div><div class="logo"><i class="fa-solid fa-shield-halved"></i> Smart<b>Bank</b></div><p>Your Digital Banking Experience.</p></div>
  <div><b>Navigate</b>${pages.map(([h,t])=>`<a href="${h}">${t}</a>`).join('')}</div>
  <div><b>Contact (fictional)</b><p><i class="fa-solid fa-location-dot"></i> Astana, Demo Street 1<br><i class="fa-solid fa-phone"></i> +7 700 000 00 00<br><i class="fa-solid fa-envelope"></i> hello@smartbank.example</p></div></div>
  <p class="fine">Demo university project. Not a real bank. No real transactions or credentials. Original design inspired by modern fintech usability.</p></div></footer>`);
 const tb=$('#themeBtn'),icon=()=>tb.innerHTML=`<i class="fa-solid fa-${document.documentElement.dataset.theme==='dark'?'sun':'moon'}"></i>`;icon();
 tb.onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('sb_theme',t);icon();window.dispatchEvent(new Event('themechange'))};
 $('#burger').onclick=()=>$('#nav').classList.toggle('open');
 initProducts();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
 $$('.reveal').forEach(el=>io.observe(el));
 $$('[data-count]').forEach(el=>{const to=+el.dataset.count,s=el.dataset.suffix||'';const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){countUp(el,to,n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n)+s);o.disconnect()}});o.observe(el)});
});
