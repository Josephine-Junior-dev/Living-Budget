const initialTransactions = [
  {id:1,description:"Monthly salary",category:"Salary",date:todayISO(),amount:75000,type:"income",icon:"↙"},
  {id:2,description:"Groceries",category:"Food",date:daysAgo(1),amount:6800,type:"expense",icon:"⌂"},
  {id:3,description:"Transport",category:"Transport",date:daysAgo(2),amount:3200,type:"expense",icon:"↗"},
  {id:4,description:"Electricity bill",category:"Bills",date:daysAgo(3),amount:2450,type:"expense",icon:"ϟ"},
  {id:5,description:"Personal care",category:"Personal",date:daysAgo(4),amount:1800,type:"expense",icon:"♡"},
  {id:6,description:"Home supplies",category:"Housing",date:daysAgo(5),amount:4500,type:"expense",icon:"⌂"},
  {id:7,description:"Medical",category:"Health",date:daysAgo(6),amount:2000,type:"expense",icon:"＋"}
];
const budgets = [
  {name:"Food & groceries",category:"Food",icon:"⌂",spent:6800,limit:10000,color:"#2f8c63"},
  {name:"Transport",category:"Transport",icon:"↗",spent:3200,limit:6000,color:"#78bc91"},
  {name:"Bills & utilities",category:"Bills",icon:"ϟ",spent:2450,limit:7000,color:"#e0b85d"},
  {name:"Personal & health",category:"Personal",icon:"♡",spent:6300,limit:9000,color:"#dce7df"}
];
let transactions = loadTransactions();
let currency = localStorage.getItem("lb_currency") || "KSh";
const fmt = n => currency + " " + Number(n).toLocaleString("en-KE",{maximumFractionDigits:2});
function todayISO(){return new Date().toISOString().slice(0,10)}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function loadTransactions(){try{const saved=localStorage.getItem("lb_preview_transactions");return saved?JSON.parse(saved):[...initialTransactions]}catch{return [...initialTransactions]}}
function saveTransactions(){localStorage.setItem("lb_preview_transactions",JSON.stringify(transactions))}
function formatDate(value){if(!value)return "—";return new Date(value+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
function totals(){return transactions.reduce((a,t)=>{a[t.type]+=Number(t.amount);return a},{income:0,expense:0})}
function render(){
 const t=totals(), balance=t.income-t.expense;
 document.getElementById("balanceValue").textContent=fmt(balance);
 document.getElementById("incomeValue").textContent=fmt(t.income);
 document.getElementById("expenseValue").textContent=fmt(t.expense);
 document.getElementById("chartTotal").textContent=fmt(t.expense);
 const pct=t.income?Math.max(0,Math.min(100,Math.round(balance/t.income*100))):0;
 document.getElementById("savingsValue").textContent=pct+"%";
 document.getElementById("savingsProgress").style.width=pct+"%";
 const expenseByCategory={};transactions.filter(x=>x.type==="expense").forEach(x=>expenseByCategory[x.category]=(expenseByCategory[x.category]||0)+Number(x.amount));
 const colors=["#2f8c63","#78bc91","#e0b85d","#dce7df","#8aa7b2","#c6a4cb","#e49d78"];
 const entries=Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1]);
 const total=t.expense||1;let stop=0;const stops=entries.map((e,i)=>{const start=stop;stop+=e[1]/total*100;return colors[i%colors.length]+" "+start+"% "+stop+"%"}).join(",");
 document.getElementById("donutChart").style.background=entries.length?"conic-gradient("+stops+")":"conic-gradient(#e7eee8 0 100%)";
 document.getElementById("spendingLegend").innerHTML=entries.slice(0,5).map(([name,value],i)=>'<div class="legend-row"><span class="legend-dot" style="background:'+colors[i%colors.length]+'"></span><span>'+escapeHTML(name)+'</span><strong>'+Math.round(value/total*100)+'%</strong></div>').join("")||'<span class="muted">No spending yet</span>';
 renderBudgets();renderTransactions();
}
function renderBudgets(){
 const spentBy={};transactions.filter(x=>x.type==="expense").forEach(x=>spentBy[x.category]=(spentBy[x.category]||0)+Number(x.amount));
 const list=budgets.map(b=>({...b,spent:spentBy[b.category]||0}));
 document.getElementById("budgetList").innerHTML=list.map(b=>budgetHTML(b)).join("");
 document.getElementById("allBudgets").innerHTML=list.map(b=>budgetHTML(b)).join("");
 document.getElementById("budgetTotal").textContent=fmt(budgets.reduce((s,b)=>s+b.limit,0));
}
function budgetHTML(b){const pct=Math.min(100,Math.round(b.spent/b.limit*100));const over=b.spent>b.limit;return '<div class="budget-item"><div class="budget-item-top"><span class="budget-name"><span class="category-icon">'+b.icon+'</span>'+escapeHTML(b.name)+'</span><span class="budget-amount"><strong>'+fmt(b.spent)+'</strong> / '+fmt(b.limit)+'</span></div><div class="progress-track"><span style="width:'+pct+'%;background:'+(over?'#d87555':b.color)+'"></span></div><div class="budget-meta"><span>'+pct+'% used</span><span class="'+(over?'over':'')+'">'+(over?'Over budget by '+fmt(b.spent-b.limit):fmt(b.limit-b.spent)+' left')+'</span></div></div>'}
function renderTransactions(){
 const sorted=[...transactions].sort((a,b)=>b.date.localeCompare(a.date));
 const rows=sorted.map(t=>'<tr><td><div class="transaction-name"><span class="transaction-icon '+(t.category==="Bills"||t.category==="Transport"?"orange":t.category==="Food"?"gold":"")+'">'+(t.icon||"•")+'</span>'+escapeHTML(t.description)+'</div></td><td><span class="category-tag">'+escapeHTML(t.category)+'</span></td><td>'+formatDate(t.date)+'</td><td class="'+(t.type==="income"?"amount-positive":"amount-negative")+'">'+(t.type==="income"?"+":"−")+fmt(t.amount)+'</td></tr>').join("");
 document.getElementById("recentTransactions").innerHTML=sorted.slice(0,5).map(t=>'<tr><td><div class="transaction-name"><span class="transaction-icon '+(t.category==="Bills"||t.category==="Transport"?"orange":t.category==="Food"?"gold":"")+'">'+(t.icon||"•")+'</span>'+escapeHTML(t.description)+'</div></td><td><span class="category-tag">'+escapeHTML(t.category)+'</span></td><td>'+formatDate(t.date)+'</td><td class="'+(t.type==="income"?"amount-positive":"amount-negative")+'">'+(t.type==="income"?"+":"−")+fmt(t.amount)+'</td></tr>').join("");
 document.getElementById("allTransactions").innerHTML=rows;
 document.getElementById("emptyTransactions").classList.toggle("hidden",sorted.length>0);
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showPage(page){
 ["overview","transactions","budgets","goals","settings"].forEach(p=>document.getElementById(p+"Page").classList.toggle("hidden",p!==page));
 document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 document.getElementById("pageName").textContent=page==="goals"?"Savings goals":page.charAt(0).toUpperCase()+page.slice(1);
 document.getElementById("sidebar").classList.remove("open");
 window.scrollTo({top:0,behavior:"smooth"});
}
function openModal(){document.getElementById("transactionModal").classList.remove("hidden");document.getElementById("transactionDate").value=todayISO();document.body.style.overflow="hidden"}
function closeModal(){document.getElementById("transactionModal").classList.add("hidden");document.body.style.overflow=""}
function toast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.getElementById("addTransactionBtn").addEventListener("click",openModal);
document.getElementById("addTransactionBtn2").addEventListener("click",openModal);
document.getElementById("closeModal").addEventListener("click",closeModal);
document.getElementById("cancelModal").addEventListener("click",closeModal);
document.getElementById("transactionModal").addEventListener("click",e=>{if(e.target.id==="transactionModal")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
document.querySelectorAll('input[name="type"]').forEach(input=>input.addEventListener("change",()=>{const select=document.getElementById("categorySelect");if(input.checked&&input.value==="income")select.value="Salary"}));
document.getElementById("transactionForm").addEventListener("submit",e=>{
 e.preventDefault();const form=new FormData(e.currentTarget);const amount=Number(form.get("amount"));if(!Number.isFinite(amount)||amount<=0){toast("Enter an amount greater than zero.");return}
 const type=form.get("type"),category=form.get("category");
 transactions.unshift({id:Date.now(),description:String(form.get("description")).trim(),category,date:form.get("date"),amount,type,icon:type==="income"?"↙":category==="Bills"?"ϟ":category==="Food"?"⌂":category==="Transport"?"↗":"•"});
 saveTransactions();render();closeModal();e.currentTarget.reset();toast("Transaction added to this preview.");
});
document.getElementById("resetDemo").addEventListener("click",()=>{transactions=[...initialTransactions];saveTransactions();render();toast("Sample preview data restored.")});
document.getElementById("currencySelect").value=currency;
document.getElementById("currencySelect").addEventListener("change",e=>{currency=e.target.value;localStorage.setItem("lb_currency",currency);render();toast("Currency display updated.")});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("monthLabel").textContent=new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"});
document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
render();