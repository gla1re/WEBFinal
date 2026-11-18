/* Deposit calculator + comparison */
const fN=n=>new Intl.NumberFormat('ru-RU').format(n);
/* Read and validate a numeric field; returns number or null (error shown on page) */
function readNum(id,label,min,max,int=false){
 const raw=$('#'+id).value.replace(/\s/g,'').replace(',','.');
 if(raw==='')return id.endsWith('topup')?(setErr(id,''),0):(setErr(id,label+' is required'),null);
 if(!/^\d+(\.\d+)?$/.test(raw))return setErr(id,'Enter a valid number'),null;
 const n=parseFloat(raw);
 if(int&&!Number.isInteger(n))return setErr(id,label+' must be a whole number'),null;
 if(n<min||n>max)return setErr(id,`${label} must be between ${fN(min)} and ${fN(max)}`),null;
 return setErr(id,''),n}
function readInputs(p=''){const P=readNum(p+'amount','Deposit',1000,1e10),r=readNum(p+'rate','Rate',0.01,100),n=readNum(p+'term','Term',1,120,true),m=readNum(p+'topup','Top-up',0,1e9);
 return [P,r,n,m].includes(null)?null:{P,r,n,m,cap:$('#'+p+'cap').value==='1'}}
/* Month-by-month simulation. Compound: interest added to balance monthly. Simple: interest on principal+top-ups, never reinvested. */
function calc({P,r,n,m,cap}){const mr=r/1200;let base=P,acc=0,bal=P;const s=[P],c=[P];
 for(let i=1;i<=n;i++){const it=(cap?bal:base)*mr;acc+=it;if(cap)bal+=it;base+=m;if(cap)bal+=m;s.push(cap?bal:base+acc);c.push(P+m*i)}
 const final=s[n];return{series:s,contrib:c,initial:P,added:m*n,interest:final-P-m*n,final,eay:cap?(Math.pow(1+mr,12)-1)*100:r}}
let last=null;
function render(){const i=readInputs();if(!i)return;const r=last=calc(i);
 const items=[['Initial deposit',r.initial,fmt],['Additional contributions',r.added,fmt],['Earned interest',r.interest,fmt],['Effective annual yield',r.eay,n=>n.toFixed(2)+' %'],['Final amount',r.final,fmt]];
 $('#results').innerHTML=items.map(([l],k)=>`<div class="${k===4?'big':''}"><span>${l}</span><b></b></div>`).join('');
 $$('#results b').forEach((b,k)=>countUp(b,items[k][1],items[k][2]));drawChart(r)}
function drawChart(r){if(!r)return;const c=$('#chart'),d=devicePixelRatio||1,w=c.parentElement.clientWidth-48,h=260;c.style.width=w+'px';c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.scale(d,d);
 const cs=getComputedStyle(document.documentElement),muted=cs.getPropertyValue('--muted').trim(),line=cs.getPropertyValue('--line').trim();
 const pl=62,pr=10,pt=10,pb=24,max=Math.max(...r.series)*1.05,n=r.series.length-1;
 const X=i=>pl+i/n*(w-pl-pr),Y=v=>h-pb-v/max*(h-pt-pb);x.font='11px sans-serif';x.fillStyle=muted;x.strokeStyle=line;x.lineWidth=1;
 for(let k=0;k<=4;k++){const v=max*k/4,y=Y(v);x.beginPath();x.moveTo(pl,y);x.lineTo(w-pr,y);x.stroke();x.fillText(v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v/1e3)+'k',6,y+4)}
 x.fillText('0',X(0),h-6);x.fillText(n+' mo',w-pr-34,h-6);
 const path=a=>{x.beginPath();a.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)))};
 path(r.series);x.lineTo(X(n),Y(0));x.lineTo(X(0),Y(0));x.fillStyle='rgba(36,123,235,.15)';x.fill();
 path(r.series);x.strokeStyle='#247BEB';x.lineWidth=3;x.stroke();path(r.contrib);x.strokeStyle='#26C6B5';x.lineWidth=2;x.stroke()}
function compare(){const a=readInputs('a_'),b=readInputs('b_');if(!a||!b)return;const A=calc(a),B=calc(b),o=$('#cmpOut');o.hidden=false;
 const row=(l,f)=>`<tr><td>${l}</td><td>${f(A)}</td><td>${f(B)}</td></tr>`,diff=B.final-A.final;
 o.innerHTML=`<table><tr><th></th><th>Scenario A</th><th>Scenario B</th></tr>${row('Deposit + top-ups',x=>fmt(x.initial+x.added))}${row('Earned interest',x=>fmt(x.interest))}${row('Final amount',x=>'<b>'+fmt(x.final)+'</b>')}${row('Effective yield',x=>x.eay.toFixed(2)+' %')}</table>
 <p class="${diff>=0?'pos':'neg'}" style="margin-top:12px">${diff===0?'Both scenarios give the same final amount.':`Scenario ${diff>0?'B':'A'} ends with ${fmt(Math.abs(diff))} more.`}</p><p class="muted" style="font-size:.8rem">Example calculation only.</p>`}
document.addEventListener('DOMContentLoaded',()=>{
 const f=$('#calcForm');f.addEventListener('submit',e=>{e.preventDefault();render()});f.addEventListener('input',render);
 $('#resetBtn').onclick=()=>{[['amount',1000000],['rate',14],['term',12],['topup',50000]].forEach(([k,v])=>{$('#'+k).value=v;setErr(k,'')});$('#cap').value='1';render()};
 $('#cmpBtn').onclick=compare;render();compare();window.addEventListener('resize',()=>drawChart(last));window.addEventListener('themechange',()=>drawChart(last))});
