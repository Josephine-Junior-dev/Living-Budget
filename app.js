/* Living Budget — mobile-first family budgeting app.
   Local preview is enabled until config.js contains Supabase URL and publishable/anon key.
   Never place a Supabase service_role/secret key in browser code. */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE="living_budget_v1";
const today=()=>new Date().toISOString().slice(0,10);
const initial={transactions:[],budgets:[],goals:[],bills:[],debts:[],family:[],currency:"KSh",savingsTarget:0};
let data=load(),currency=data.currency||"KSh",supabaseClient=null,user=null,modalKind="transaction",editId=null,landingDismissed=false;
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE)||"{}");const state={...structuredClone(initial),...saved};/* Remove only the original built-in demo budgets and goals; keep all user-created records. */state.budgets=(state.budgets||[]).filter(x=>!([{id:"b1",name:"Food & groceries",limit:10000,category:"Food"},{id:"b2",name:"Housing & rent",limit:15000,category:"Housing"},{id:"b3",name:"Transport",limit:6000,category:"Transport"},{id:"b4",name:"Bills & utilities",limit:7000,category:"Bills"}].some(d=>String(x.id)===d.id&&x.name===d.name&&Number(x.limit)===d.limit&&x.category===d.category)));state.goals=(state.goals||[]).filter(x=>!([{id:"g1",name:"Emergency fund",target:50000,saved:5000},{id:"g2",name:"Education",target:40000,saved:8000}].some(d=>String(x.id)===d.id&&x.name===d.name&&Number(x.target)===d.target&&Number(x.saved)===d.saved)));return state}catch{return structuredClone(initial)}}
function save(){data.currency=currency;localStorage.setItem(STORAGE,JSON.stringify(data))}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(v){return currency+" "+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2})}
function dateText(d){return d?new Date(d+"T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):"No date"}
function toast(m){let t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function totals(){let month=today().slice(0,7),tx=data.transactions.filter(x=>(x.date||"").startsWith(month));let income=tx.filter(x=>x.type==="income").reduce((s,x)=>s+Number(x.amount),0),expense=tx.filter(x=>x.type==="expense").reduce((s,x)=>s+Number(x.amount),0);return {income,expense,balance:income-expense}}
function categorySpent(cat){let month=today().slice(0,7);return data.transactions.filter(x=>x.type==="expense"&&x.category===cat&&(x.date||"").startsWith(month)).reduce((s,x)=>s+Number(x.amount),0)}
function row(icon,title,subtitle,value,kind="",extra=""){return '<div class="record-row"><div class="record-main"><span class="record-icon">'+icon+'</span><div class="record-text"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></div></div><div class="record-value '+kind+'">'+value+(extra?'<small>'+extra+'</small>':"")+'</div></div>'}
function empty(msg){return '<div class="empty">'+esc(msg)+'</div>'}
function render(){let t=totals(),pct=data.savingsTarget?Math.min(100,Math.round(data.goals.reduce((s,g)=>s+Number(g.saved),0)/data.savingsTarget*100)):0;
$("#balanceValue").textContent=money(t.balance);$("#incomeValue").textContent=money(t.income);$("#expenseValue").textContent=money(t.expense);$("#savingsValue").textContent=pct+"%";$("#savingsProgress").style.width=pct+"%";
let recent=[...data.transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
$("#recentList").innerHTML=recent.map(x=>row(x.type==="income"?"🟢":"🧾",x.description,x.category+" · "+dateText(x.date),(x.type==="income"?"+":"−")+money(x.amount),x.type==="income"?"positive":"negative")).join("")||empty("No transactions yet. Tap Add transaction to start.");
let budgetRows=data.budgets.map(b=>{let spent=categorySpent(b.category),p=b.limit?Math.min(100,Math.round(spent/b.limit*100)):0;return '<div class="record-row"><div class="record-main"><span class="record-icon">📅</span><div class="record-text"><strong>'+esc(b.name)+'</strong><small>'+money(spent)+' of '+money(b.limit)+'</small><div class="budget-progress"><span style="width:'+p+'%;background:'+(spent>b.limit?'#b96e42':'#4b9e70')+'"></span></div></div></div><div class="record-value">'+p+'%<small>'+(spent>b.limit?'Over limit':money(Math.max(0,b.limit-spent))+' left')+'</small><button class="link-btn" data-edit="budgets" data-id="'+esc(b.id)+'">Edit</button> <button class="link-btn" data-delete="budgets" data-id="'+esc(b.id)+'">Delete</button></div></div>'}).join("")||empty("Add your first budget.");
$("#homeBudgetList").innerHTML=budgetRows;$("#budgetsList").innerHTML=budgetRows;
renderTransactions();renderGoals();renderBills();renderDebts();renderReports();renderFamily();
}
function renderTransactions(){let search=($("#transactionSearch")?.value||"").toLowerCase(),type=$("#typeFilter")?.value||"all",cat=$("#categoryFilter")?.value||"all";let tx=[...data.transactions].filter(x=>(x.description+" "+x.category).toLowerCase().includes(search)&&(type==="all"||x.type===type)&&(cat==="all"||x.category===cat)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
let cats=[...new Set(data.transactions.map(x=>x.category).filter(Boolean))];let select=$("#categoryFilter"),old=select.value;select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>'<option>'+esc(c)+'</option>').join("");select.value=cats.includes(old)?old:"all";
$("#transactionsList").innerHTML=tx.map(x=>row(x.type==="income"?"🟢":"🧾",x.description,x.category+" · "+dateText(x.date),(x.type==="income"?"+":"−")+money(x.amount),x.type==="income"?"positive":"negative",'<button class="link-btn" data-edit="transactions" data-id="'+esc(x.id)+'">Edit</button> <button class="link-btn" data-delete="transactions" data-id="'+esc(x.id)+'">Delete</button>')).join("")||empty("No matching transactions. Add one to get started.");
}
function renderGoals(){$("#goalsList").innerHTML=data.goals.map(g=>{let p=g.target?Math.min(100,Math.round(g.saved/g.target*100)):0;return '<article class="tile"><span class="record-icon">'+(g.icon||"🎯")+'</span><h3>'+esc(g.name)+'</h3><div class="record-value">'+money(g.saved)+' <small>of '+money(g.target)+'</small></div><div class="budget-progress"><span style="width:'+p+'%"></span></div><p>'+p+'% reached</p><div class="button-row"><button class="btn outline" data-contribute="'+esc(g.id)+'">＋ Add savings</button><button class="btn outline" data-edit="goals" data-id="'+esc(g.id)+'">Edit</button><button class="btn outline" data-delete="goals" data-id="'+esc(g.id)+'">Delete</button></div></article>'}).join("")||empty("Create a savings goal to give your money a purpose.")}
function renderBills(){$("#billsList").innerHTML=[...data.bills].sort((a,b)=>(a.due||"").localeCompare(b.due||"")).map(b=>row(b.paid?"✅":"🧾",b.name,(b.paid?"Paid":(b.due<today()?"Overdue":"Due"))+" · "+dateText(b.due),money(b.amount),"",'<button class="link-btn" data-edit="bills" data-id="'+esc(b.id)+'">Edit</button> <button class="link-btn" data-paid="'+esc(b.id)+'">'+(b.paid?"Mark unpaid":"Mark paid")+'</button> <button class="link-btn" data-delete="bills" data-id="'+esc(b.id)+'">Delete</button>')).join("")||empty("No bills added yet.")}
function renderDebts(){$("#debtsList").innerHTML=data.debts.map(d=>row(d.direction==="owed"?"↙":"↗",d.name,(d.direction==="owed"?"Money owed to you":"You owe")+(d.due?" · "+dateText(d.due):""),money(d.amount),"",'<button class="link-btn" data-edit="debts" data-id="'+esc(d.id)+'">Edit</button> <button class="link-btn" data-delete="debts" data-id="'+esc(d.id)+'">Delete</button>')).join("")||empty("Track money borrowed or lent here.")}
function renderReports(){let t=totals();$("#reportIncome").textContent=money(t.income);$("#reportExpense").textContent=money(t.expense);$("#reportBalance").textContent=money(t.balance);let obj={};data.transactions.filter(x=>x.type==="expense"&&(x.date||"").startsWith(today().slice(0,7))).forEach(x=>obj[x.category]=(obj[x.category]||0)+Number(x.amount));let entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...entries.map(x=>x[1]));$("#reportBars").innerHTML=entries.map(([k,v])=>'<div class="report-bar-row"><strong>'+esc(k)+'</strong><div class="report-bar"><span style="width:'+v/max*100+'%"></span></div><span>'+money(v)+'</span></div>').join("")||empty("Add expenses to see your spending report.")}
function renderFamily(){$("#familyList").innerHTML=data.family.map(f=>row("👤",f.email,f.role==="editor"?"Can view and edit":"Can view","Invitation pending","","<button class='link-btn' data-delete='family' data-id='"+esc(f.id)+"'>Remove</button>")).join("")||""}
const pages={home:["Your money at a glance","A simple view of your family’s finances."],transactions:["Transactions","Track income and spending in one place."],budgets:["Family budget","Plan household spending without the stress."],goals:["Savings goals","Turn your plans into achievable milestones."],bills:["Bills & reminders","Know what is due and what has been paid."],debts:["Debts & loans","Keep a clear record of money borrowed or lent."],reports:["Reports","Understand where your money goes."],family:["Family members","Plan together with people you trust."],settings:["Settings","Personalize your budgeting experience."],premium:["Living Budget Premium","More insight. More control."]};
function showPage(p){if(!pages[p])p="home";Object.keys(pages).forEach(k=>$("#"+k+"Page")?.classList.toggle("hidden",k!==p));$$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===p));$("#pageTitle").textContent=pages[p][0];$("#pageSubtitle").textContent=pages[p][1];$("#eyebrow").textContent=p==="home"?"YOUR MONEY, WITH A PLAN":p.toUpperCase();$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});if(p==="transactions")renderTransactions()}
function field(name,label,type="text",value="",opts=null,required=true){let el=type==="select"?'<select name="'+name+'" '+(required?"required":"")+'>'+(opts||[]).map(o=>'<option value="'+esc(o.value??o)+'" '+((o.value??o)===value?"selected":"")+'>'+esc(o.label??o)+'</option>').join("")+'</select>':'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(required?"required":"")+(type==="number"?' min="0" step="0.01"':'')+'>';return '<label class="field">'+label+el+'</label>'}
function openModal(kind,defaultType=null){
 modalKind=kind;editId=null;
 const editing=defaultType&&typeof defaultType==="object"?defaultType:null;
 if(editing)editId=editing.id;
 const v=editing||{};
 let title="",fields="";
 if(kind==="transaction"){title=editing?"Edit transaction":"Add transaction";const typ=v.type||defaultType||"expense";fields='<div class="field"><span>Type</span><select name="type"><option value="expense" '+(typ==="expense"?"selected":"")+'>Expense</option><option value="income" '+(typ==="income"?"selected":"")+'>Income</option></select></div>'+field("description","What was it for?","text",v.description||"")+field("amount","Amount","number",v.amount??"")+field("category","Category","select",v.category||"Food",["Food","Housing","Transport","Bills","School","Health","Personal","Salary","Business","Side hustle","Savings","Other"])+field("date","Date","date",v.date||today())}
 if(kind==="budget"){title=editing?"Edit budget":"Create a budget";fields=field("name","Budget name","text",v.name||"")+field("category","Category","select",v.category||"Food",["Food","Housing","Transport","Bills","School","Health","Personal","Other"])+field("limit","Monthly spending limit","number",v.limit??"")}
 if(kind==="goal"){title=editing?"Edit savings goal":"Create savings goal";fields=field("name","What are you saving for?","text",v.name||"")+field("target","Goal amount","number",v.target??"")+field("saved","Already saved","number",v.saved??"0")}
 if(kind==="contribute"){title="Add to savings";let g=data.goals.find(x=>x.id===defaultType);editId=g?.id;fields='<p class="muted">Add money to '+esc(g?.name||"your goal")+'.</p>'+field("amount","Amount to add","number","")}
 if(kind==="bill"){title=editing?"Edit bill":"Add a bill";fields=field("name","Bill name","text",v.name||"")+field("amount","Amount due","number",v.amount??"")+field("due","Due date","date",v.due||today())}
 if(kind==="debt"){title=editing?"Edit debt or loan":"Add a debt or loan";fields=field("name","Person or reason","text",v.name||"")+field("direction","Type","select",v.direction||"owed",[{value:"owed",label:"Someone owes me"},{value:"owe",label:"I owe someone"}])+field("amount","Outstanding amount","number",v.amount??"")+field("due","Due date (optional)","date",v.due||"",null,false)}
 $("#modalTitle").textContent=title;$("#modalFields").innerHTML=fields;$("#modal").classList.remove("hidden");document.body.style.overflow="hidden";
}function closeModal(){$("#modal").classList.add("hidden");document.body.style.overflow=""}
function exportCSV(filename,rows){let csv=rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));a.download=filename;a.click();URL.revokeObjectURL(a.href)}
function initSupabase(){
 let c=window.APP_CONFIG;
 if(!c?.SUPABASE_URL||!c?.SUPABASE_KEY||!window.supabase){
  $("#connectionStatus").textContent="● Preview mode";
  authUI();
  return;
 }
 try{
  supabaseClient=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_KEY);
  window.livingBudgetSupabase=supabaseClient;
  $("#connectionStatus").textContent="● Cloud ready";
  supabaseClient.auth.getSession().then(({data:d})=>{
   user=d.session?.user||null;
   authUI();
   // Restoring an existing session must not skip the welcome page.
   if(user&&landingDismissed)cloudLoad().catch(e=>console.error("Cloud sync failed:",e));
  }).catch(e=>{console.error("Session check failed:",e);authUI();});
  supabaseClient.auth.onAuthStateChange((event,s)=>{
   user=s?.user||null;
   // Only the landing form explicitly dismisses the welcome page.
   authUI();
   if(user&&landingDismissed)cloudLoad().catch(e=>console.error("Cloud sync failed:",e));
  });
 }catch(e){
  console.error(e);
  $("#connectionStatus").textContent="● Preview mode";
  authUI();
 }
}
function authUI(){
 $("#authMessage").textContent=user?"Signed in as "+user.email:"Not signed in.";
 $("#signOut").classList.toggle("hidden",!user);
 $("#connectionStatus").textContent=user?"● Signed in":"● Cloud ready";
 document.body.classList.toggle("landing-mode",!landingDismissed);
 $("#landingPage")?.classList.toggle("hidden",landingDismissed);
}
const cloudMap={
 transactions:{table:"lb_transactions",sort:"transaction_date",from:r=>({id:r.id,description:r.description,category:r.category,date:r.transaction_date,amount:Number(r.amount),type:r.type}),to:x=>({id:x.id,user_id:user.id,description:x.description,category:x.category,transaction_date:x.date,amount:x.amount,type:x.type})},
 budgets:{table:"lb_budgets",sort:"created_at",from:r=>({id:r.id,name:r.name,category:r.category,limit:Number(r.monthly_limit)}),to:x=>({id:x.id,user_id:user.id,name:x.name,category:x.category,monthly_limit:x.limit})},
 goals:{table:"lb_savings_goals",sort:"created_at",from:r=>({id:r.id,name:r.name,target:Number(r.target_amount),saved:Number(r.saved_amount),icon:"🎯"}),to:x=>({id:x.id,user_id:user.id,name:x.name,target_amount:x.target,saved_amount:x.saved})},
 bills:{table:"lb_bills",sort:"due_date",from:r=>({id:r.id,name:r.name,amount:Number(r.amount),due:r.due_date,paid:!!r.is_paid}),to:x=>({id:x.id,user_id:user.id,name:x.name,amount:x.amount,due_date:x.due,is_paid:!!x.paid})},
 debts:{table:"lb_debts",sort:"created_at",from:r=>({id:r.id,name:r.name,direction:r.direction,amount:Number(r.balance),due:r.due_date}),to:x=>({id:x.id,user_id:user.id,name:x.name,direction:x.direction,original_amount:x.amount,balance:x.amount,due_date:x.due||null})}
};
async function cloudLoad(){
 if(!supabaseClient||!user)return;
 if(window.__livingBudgetCloudLoading)return window.__livingBudgetCloudLoading;
 window.__livingBudgetCloudLoading=(async()=>{
  const localSnapshot={};
  for(const key of Object.keys(cloudMap))localSnapshot[key]=Array.isArray(data[key])?data[key].map(x=>({...x})):[];
  const pendingUploads=[];
  let anyLoaded=false,hadError=false;
  for(const [key,m] of Object.entries(cloudMap)){
   try{
    const {data:rows,error}=await supabaseClient.from(m.table).select("*").order(m.sort,{ascending:false});
    if(error)throw error;
    const remote=(rows||[]).map(m.from);
    const remoteIds=new Set(remote.map(x=>String(x.id)));
    const local=localSnapshot[key];
    for(const item of local){
     if(remoteIds.has(String(item.id)))continue;
     if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(item.id))){
      item.id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+"-"+Math.random().toString(16).slice(2);
     }
     pendingUploads.push({key,item});
    }
    const merged=new Map();
    for(const item of local)merged.set(String(item.id),item);
    for(const item of remote)merged.set(String(item.id),item);
    data[key]=[...merged.values()];
    anyLoaded=true;
   }catch(err){
    hadError=true;
    console.error("Cloud load failed for "+m.table+":",err);
    // Keep local records for this table; a failure in one table must not hide other data.
   }
  }
  save();render();
  for(const pending of pendingUploads)await cloudUpsert(pending.key,pending.item);
  if(hadError)toast(anyLoaded?"Some cloud records could not load. Other records are displayed.":"Cloud data could not load; showing records saved on this phone.");
  else toast("Your records are loaded and saved.");
 })().finally(()=>{window.__livingBudgetCloudLoading=null;});
 return window.__livingBudgetCloudLoading;
}
async function cloudUpsert(kind,item){if(!supabaseClient||!user||!cloudMap[kind])return;try{const m=cloudMap[kind],{error}=await supabaseClient.from(m.table).upsert(m.to(item),{onConflict:"id"});if(error)throw error;}catch(e){console.error("Cloud save failed:",kind,e);toast("Saved on this phone, but cloud sync failed.");}}
async function cloudDelete(kind,id){if(!supabaseClient||!user||!cloudMap[kind])return;try{const m=cloudMap[kind],{error}=await supabaseClient.from(m.table).delete().eq("id",id);if(error)throw error;}catch(e){console.error("Cloud delete failed:",kind,e);toast("Deleted on this phone, but cloud deletion failed.");}}
/* Navigation and quick actions use delegation so every desktop/mobile button responds. */
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-page]");
 if(nav){e.preventDefault();showPage(nav.dataset.page);return;}
 /* Make the whole Premium upgrade card tappable on phones, not only its button. */
 const premiumCard=e.target.closest(".upgrade-card");
 if(premiumCard){showPage("premium");return;}
 const action=e.target.closest("[data-action]");
 if(action){openModal("transaction",action.dataset.action);return;}
 if(e.target.closest("#quickAdd"))openModal("transaction");
});
$("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));$("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
$("#addBudget").addEventListener("click",()=>openModal("budget"));$("#addGoal").addEventListener("click",()=>openModal("goal"));$("#addBill").addEventListener("click",()=>openModal("bill"));$("#addDebt").addEventListener("click",()=>openModal("debt"));
document.addEventListener("click",async e=>{
 let contribute=e.target.closest("[data-contribute]");
 if(contribute){openModal("contribute",contribute.dataset.contribute);return;}
 let edit=e.target.closest("[data-edit]");
 if(edit){let key=edit.dataset.edit,item=(data[key]||[]).find(x=>String(x.id)===String(edit.dataset.id));if(item){let kind={transactions:"transaction",budgets:"budget",goals:"goal",bills:"bill",debts:"debt"}[key];openModal(kind,item);}return;}
 let paid=e.target.closest("[data-paid]");
 if(paid){let b=data.bills.find(x=>String(x.id)===String(paid.dataset.paid));if(b){b.paid=!b.paid;save();render();await cloudUpsert("bills",b);}return;}
 let del=e.target.closest("[data-delete]");
 if(del&&confirm("Delete this record?")){let key=del.dataset.delete;const item=(data[key]||[]).find(x=>String(x.id)===String(del.dataset.id));data[key]=(data[key]||[]).filter(x=>String(x.id)!==String(del.dataset.id));save();render();if(item)await cloudDelete(key,item.id);toast("Record deleted.");}
});
$("#recordForm").addEventListener("submit",async e=>{e.preventDefault();let f=Object.fromEntries(new FormData(e.currentTarget));let id=editId||((window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString());
if(modalKind==="transaction"){let x={id,description:f.description.trim(),amount:Number(f.amount),category:f.category,date:f.date,type:f.type};if(editId)data.transactions=data.transactions.map(y=>String(y.id)===String(editId)?x:y);else data.transactions.push(x);save();render();await cloudUpsert("transactions",x);toast(editId?"Transaction updated.":"Transaction saved.");if(!editId&&x.type==="expense"){const t=totals();if(t.income>0&&t.balance<=0&&confirm("Your available balance is "+money(t.balance)+". Have you borrowed money to cover expenses? Tap OK to record the debt, or Cancel if you have not borrowed.")){openModal("debt");const fields=$("#modalFields");fields.querySelector('input[name="name"]').value="Borrowed to cover expenses";fields.querySelector('select[name="direction"]').value="owe";fields.querySelector('input[name="amount"]').value=t.balance<0?String(Math.abs(t.balance)):"";}}}
if(modalKind==="budget"){let x={id,name:f.name.trim(),category:f.category,limit:Number(f.limit)};if(editId)data.budgets=data.budgets.map(y=>String(y.id)===String(editId)?x:y);else data.budgets.push(x);save();render();await cloudUpsert("budgets",x);toast(editId?"Budget updated.":"Budget created.")}
if(modalKind==="goal"){let x={id,name:f.name.trim(),target:Number(f.target),saved:Number(f.saved||0),icon:"🎯"};if(editId)data.goals=data.goals.map(y=>String(y.id)===String(editId)?x:y);else data.goals.push(x);save();render();await cloudUpsert("goals",x);toast(editId?"Savings goal updated.":"Savings goal created.")}
if(modalKind==="contribute"){let g=data.goals.find(x=>String(x.id)===String(editId));if(g){g.saved=Number(g.saved)+Number(f.amount);save();render();await cloudUpsert("goals",g);toast("Savings updated.")}}
if(modalKind==="bill"){let old=data.bills.find(y=>String(y.id)===String(editId));let x={id,name:f.name.trim(),amount:Number(f.amount),due:f.due,paid:old?.paid||false};if(editId)data.bills=data.bills.map(y=>String(y.id)===String(editId)?x:y);else data.bills.push(x);save();render();await cloudUpsert("bills",x);toast(editId?"Bill updated.":"Bill added.")}
if(modalKind==="debt"){let x={id,name:f.name.trim(),direction:f.direction,amount:Number(f.amount),due:f.due};if(editId)data.debts=data.debts.map(y=>String(y.id)===String(editId)?x:y);else data.debts.push(x);save();render();await cloudUpsert("debts",x);toast(editId?"Debt updated.":"Debt record added.")}
closeModal();$("#recordForm")?.reset();editId=null;
});
$("#transactionSearch").addEventListener("input",renderTransactions);$("#typeFilter").addEventListener("change",renderTransactions);$("#categoryFilter").addEventListener("change",renderTransactions);
function buildTransactionShareText(){
 const rows=[["Date","Description","Type","Category","Amount"],...data.transactions.slice().sort((x,y)=>(y.date||"").localeCompare(x.date||"")).map(x=>[x.date,x.description,x.type,x.category,x.amount])];
 return "Living Budget — Transactions\n"+rows.map(r=>r.join(" | ")).join("\n");
}
function buildReportShareText(){
 const t=totals(),month=today().slice(0,7),groups={};
 data.transactions.filter(x=>x.type==="expense"&&(x.date||"").startsWith(month)).forEach(x=>groups[x.category]=(groups[x.category]||0)+Number(x.amount));
 return "Living Budget — Monthly Report ("+month+")\nIncome: "+money(t.income)+"\nExpenses: "+money(t.expense)+"\nBalance: "+money(t.balance)+"\n\nSpending by category:\n"+(Object.entries(groups).map(([k,v])=>k+": "+money(v)).join("\n")||"No expenses recorded.");
}
async function shareContent(title,textContent){
 try{
  if(navigator.share){await navigator.share({title,text:textContent});return;}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(textContent);toast("Copied to clipboard. You can now paste and share it.");return;}
  const box=document.createElement("textarea");box.value=textContent;box.setAttribute("readonly","");box.style.position="fixed";box.style.opacity="0";document.body.appendChild(box);box.select();const ok=document.execCommand("copy");box.remove();toast(ok?"Copied to clipboard. You can now paste and share it.":"Sharing is not supported on this browser.");
 }catch(e){if(e?.name!=="AbortError")toast("Could not share. Try Export CSV instead.");}
}
function currentPageShareText(){
 const active=$$(".page").find(el=>!el.classList.contains("hidden"));
 const key=(active?.id||"homePage").replace(/Page$/,"");
 const lines=[];
 const add=(title,items)=>{lines.push(title);if(!items.length){lines.push("No records.");return;}for(const item of items)lines.push(item);};
 if(key==="transactions")return buildTransactionShareText();
 if(key==="reports"||key==="home")return buildReportShareText();
 if(key==="budgets")add("Living Budget — Budgets",data.budgets.map(x=>x.name+" | "+x.category+" | Limit "+money(x.limit)));
 else if(key==="goals")add("Living Budget — Savings Goals",data.goals.map(x=>x.name+" | Saved "+money(x.saved)+" of "+money(x.target)));
 else if(key==="bills")add("Living Budget — Bills",data.bills.map(x=>x.name+" | "+money(x.amount)+" | Due "+(x.due||"") +" | "+(x.paid?"Paid":"Unpaid")));
 else if(key==="debts")add("Living Budget — Debts & Loans",data.debts.map(x=>x.name+" | "+(x.direction==="owed"?"Owed to you":"You owe")+" | Balance "+money(x.amount)));
 else if(key==="family")add("Living Budget — Family",data.family.map(x=>x.email+" | "+x.role+" | Invitation pending"));
 else lines.push("Living Budget — "+(pages[key]?.[0]||"My Budget"));
 return lines.join("\n");
}
$("#shareCurrentPage")?.addEventListener("click",()=>shareContent("Living Budget",currentPageShareText()));
$("#printCurrentPage")?.addEventListener("click",()=>window.print());
$("#shareTransactions")?.addEventListener("click",()=>shareContent("Living Budget Transactions",buildTransactionShareText()));
$("#shareReport")?.addEventListener("click",()=>shareContent("Living Budget Monthly Report",buildReportShareText()));
$("#printTransactions")?.addEventListener("click",()=>{showPage("transactions");window.setTimeout(()=>window.print(),100)});
$("#printReport")?.addEventListener("click",()=>{showPage("reports");window.setTimeout(()=>window.print(),100)});
$("#exportTransactions").addEventListener("click",()=>exportCSV("living-budget-transactions.csv",[["Date","Description","Type","Category","Amount"],...data.transactions.map(x=>[x.date,x.description,x.type,x.category,x.amount])]));$("#exportReport").addEventListener("click",()=>{let t=totals();exportCSV("living-budget-monthly-report.csv",[["Living Budget monthly report"],["Income",t.income],["Expenses",t.expense],["Balance",t.balance],["Category","Spent"],...Object.entries(data.transactions.filter(x=>x.type==="expense").reduce((a,x)=>(a[x.category]=(a[x.category]||0)+Number(x.amount),a),{}))])});
$("#settingsForm").addEventListener("submit",e=>{e.preventDefault();currency=$("#currencySelect").value;data.savingsTarget=Number($("#savingsTarget").value||0);save();render();toast("Settings saved.")});
$("#inviteForm").addEventListener("submit",e=>{e.preventDefault();let f=new FormData(e.currentTarget);data.family.push({id:Date.now().toString(),email:f.get("email"),role:f.get("role")});save();renderFamily();e.currentTarget.reset();toast("Invitation noted in this preview. Cloud family sharing is not active yet.")});
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();if(!supabaseClient){$("#authMessage").textContent="Cloud login is not active yet. Add your Supabase URL and publishable/anon key to config.js, then run the SQL setup.";return}let f=new FormData(e.currentTarget),email=f.get("email"),password=f.get("password"),action=e.submitter?.value||"signin";let result=action==="signup"?await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:"https://josephine-junior-dev.github.io/Living-Budget/"}}):await supabaseClient.auth.signInWithPassword({email,password});$("#authMessage").textContent=result.error?result.error.message:(action==="signup"?"Check your email to confirm your account.":"Signed in successfully.");if(!result.error&&result.data.user){user=result.data.user;landingDismissed=true;authUI();if(user)cloudLoad()}});
$("#signOut").addEventListener("click",async()=>{if(supabaseClient)await supabaseClient.auth.signOut();user=null;landingDismissed=false;authUI();toast("Signed out.")});
$("#accountButton").addEventListener("click",()=>showPage("settings"));$("#currencySelect").value=currency;$("#savingsTarget").value=data.savingsTarget||0;

/* Public welcome page authentication: email + password only. */
let landingMode="signup";
function setLandingMode(mode){
 landingMode=mode==="signin"?"signin":"signup";
 $("#landingAuthPanel")?.classList.remove("hidden");
 $("#landingAuthTitle").textContent=landingMode==="signup"?"Create your free account":"Welcome back";
 $("#landingAuthIntro").textContent=landingMode==="signup"?"Start planning your money today.":"Sign in to continue to your personal budget.";
 $("#landingAuthSubmit").textContent=landingMode==="signup"?"Create account":"Sign in";
 $("#landingSwitchMode").textContent=landingMode==="signup"?"Already have an account? Sign in":"New to Living Budget? Create a free account";
 $("#landingAuthMessage").textContent="";
 $("#landingAuthForm input[name=password]").autocomplete=landingMode==="signup"?"new-password":"current-password";
 $("#landingAuthPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
document.addEventListener("click",e=>{
 const mode=e.target.closest("[data-landing-mode]");
 if(mode){setLandingMode(mode.dataset.landingMode);return;}
 if(e.target.closest("#landingBack")){$("#landingAuthPanel").classList.add("hidden");return;}
 if(e.target.closest("#landingSwitchMode")){setLandingMode(landingMode==="signup"?"signin":"signup");}
});
async function finishLandingSignIn(result,message){
 if(result.error){message.textContent=result.error.message;return false;}
 if(result.data?.session&&result.data?.user){
  user=result.data.user;landingDismissed=true;authUI();showPage("home");message.textContent="Signed in successfully.";toast("Welcome to Living Budget!");
  cloudLoad().catch(err=>{console.error("Cloud load failed after sign-in:",err);toast("Signed in, but cloud data did not load. Check database tables and permissions.");});
  return true;
 }
 return false;
}
$("#landingAuthForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const message=$("#landingAuthMessage");
 if(!supabaseClient){message.textContent="Secure sign-in is not available yet. Please try again shortly.";return;}
 const f=new FormData(e.currentTarget),email=String(f.get("email")||"").trim(),password=String(f.get("password")||"");
 if(!email){message.textContent="Enter your email address.";return;}
 const submit=$("#landingAuthSubmit");submit.disabled=true;submit.textContent="Please wait…";
 try{
  const result=landingMode==="signup"
   ?await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:"https://josephine-junior-dev.github.io/Living-Budget/"}})
   :await supabaseClient.auth.signInWithPassword({email,password});
  if(result.error){message.textContent=result.error.message;return;}
  if(landingMode==="signup"&&!result.data.session){
   message.textContent="Account created. Please check your email to confirm, then sign in here.";
   return;
  }
  await finishLandingSignIn(result,message);
 }catch(err){message.textContent=err.message||"Unable to connect. Please try again.";}
 finally{submit.disabled=false;submit.textContent=landingMode==="signup"?"Create account":"Sign in";}
});
// Clean login links safely: never keep a password in the browser URL/history.
// If an email was supplied in the URL, open the sign-in form and prefill only the email.
(function prepareLoginLink(){
 try {
  const url=new URL(window.location.href);
  const email=url.searchParams.get("email");
  const hadLoginParams=url.searchParams.has("email")||url.searchParams.has("password")||url.searchParams.has("phone");
  if(email){
   const emailInput=$("#landingAuthForm input[name=email]");
   if(emailInput)emailInput.value=email;
   setLandingMode("signin");
  }
  if(hadLoginParams){
   url.searchParams.delete("email");
   url.searchParams.delete("password");
   url.searchParams.delete("phone");
   history.replaceState({},document.title,url.pathname+url.search+url.hash);
  }
 } catch(e){console.warn("Could not process sign-in link:",e);}
})();

// Authentication is handled by the landing form; Supabase session changes are watched in initSupabase().
initSupabase();render();