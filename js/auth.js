/* Sign up, log in, profile dashboard (client-side simulation only) */
const enc=p=>btoa(unescape(encodeURIComponent(p)));
function showTab(t){$('#loginForm').hidden=t!=='login';$('#signupForm').hidden=t!=='signup';$$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));$('#authMsg').hidden=true}
function initAuth(){
 $$('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));showTab(location.hash==='#signup'?'signup':'login');
 $('#signupForm').addEventListener('submit',e=>{e.preventDefault();
  const name=$('#s_name').value.trim(),email=$('#s_email').value.trim().toLowerCase(),phone=$('#s_phone').value.trim(),p=$('#s_pass').value,p2=$('#s_pass2').value;
  const ok=[setErr('s_name',V.name(name)?'':'Enter your full name (letters, 3+ characters)'),setErr('s_email',V.email(email)?'':'Enter a valid email like name@example.com'),
   setErr('s_phone',V.phone(phone)?'':'Enter a phone like +7 777 123 45 67'),
   setErr('s_pass',V.password(p)?'':'Use 8+ characters with an uppercase letter, a number and a special character'),
   setErr('s_pass2',p2===''?'Confirm your password':p2===p?'':'Passwords do not match')].every(Boolean);
  if(!ok)return;
  if(Auth.users().some(u=>u.email===email)){setErr('s_email','An account with this email already exists. Log in instead.');return}
  const u={name,email,phone,pass:enc(p),balance:1250000,savings:3400000};Auth.save([...Auth.users(),u]);
  const day=864e5,now=Date.now(),seed=[['Salary (demo)','in','Transfer',650000,6],['Mobile: Beeline','out','Mobile',5000,4],['Utilities: Electricity','out','Utilities',18400,3],['Online store order','out','Shopping',32900,1]];
  seed.forEach(([desc,type,cat,amount,d])=>Tx.add(u,{desc,type,cat,amount,date:new Date(now-d*day).toISOString()}));
  e.target.reset();showTab('login');$('#l_email').value=email;msgBox('authMsg','Account created. Log in to continue.','ok')});
 $('#loginForm').addEventListener('submit',e=>{e.preventDefault();
  const email=$('#l_email').value.trim().toLowerCase(),p=$('#l_pass').value;
  const ok=[setErr('l_email',V.email(email)?'':'Enter a valid email'),setErr('l_pass',p?'':'Enter your password')].every(Boolean);if(!ok)return;
  const u=Auth.users().find(x=>x.email===email);
  if(!u||u.pass!==enc(p)){msgBox('authMsg','Email or password is incorrect. Check them or sign up.','bad');return}
  store.set('sb_session',email);location.href='profile.html'})}
function initProfile(){if(!Auth.current()){location.replace('auth.html#login');return}
 $('#profile').hidden=false;
 const draw=()=>{const u=Auth.current(),tx=Tx.list(u.email).slice(0,5);
  $('#welcome').textContent='Welcome, '+u.name.split(' ')[0]+'!';$('#pTotal').textContent=fmt(u.balance+u.savings);$('#pMain').textContent=fmt(u.balance);$('#pSav').textContent=fmt(u.savings);
  $('#pInfo').innerHTML=`<span>Name</span><b>${esc(u.name)}</b><span>Email</span><b>${esc(u.email)}</b><span>Phone</span><b>${esc(u.phone)}</b>`;
  const g=u.savings*(Math.pow(1+0.14/12,12)-1);$('#pDep').textContent=`Savings of ${fmt(u.savings)} could earn about ${fmt(g)} in 12 months at an example rate of 14% with monthly compounding.`;
  $('#pTx').innerHTML=tx.length?tx.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString('en-GB')}</td><td>${esc(t.desc)}</td><td class="${t.type==='in'?'pos':t.type==='out'?'neg':''}">${t.type==='in'?'+':t.type==='out'?'-':''}${fmt(t.amount)}</td></tr>`).join(''):'<tr><td class="muted">No transactions yet. Make a transfer to see it here.</td></tr>'};
 draw();$('#logoutBtn').onclick=()=>Auth.logout();
 $('#editBtn').onclick=()=>{const c=Auth.current(),m=showModal('Edit profile',`<form id="edF" novalidate><label>Full name<input id="e_name" value="${esc(c.name)}"><small class="err" data-for="e_name"></small></label><label>Phone<input id="e_phone" value="${esc(c.phone)}"><small class="err" data-for="e_phone"></small></label><button class="btn btn-primary">Save changes</button></form>`);
  $('#edF',m).addEventListener('submit',e=>{e.preventDefault();const n=$('#e_name').value.trim(),p=$('#e_phone').value.trim();
   if(![setErr('e_name',V.name(n)?'':'Enter your full name (3+ letters)'),setErr('e_phone',V.phone(p)?'':'Enter a phone like +7 777 123 45 67')].every(Boolean))return;
   Auth.update({...c,name:n,phone:p});m.remove();draw();toast('Profile saved')})}}
document.addEventListener('DOMContentLoaded',()=>{if($('#loginForm'))initAuth();if($('#profile'))initProfile()});
