const API_URL='https://n8n-pi.taild8d05f.ts.net/webhook/lista-zakupow-v2';
const $=id=>document.getElementById(id);
const state={items:[],archive:[],recognized:[],busy:false,timer:null,started:0,installPrompt:null};
const els={
  appShell:$('appShell'),offline:$('offline'),processing:$('processing'),processingTitle:$('processingTitle'),processingMsg:$('processingMsg'),processingTime:$('processingTime'),
  installBtn:$('installBtn'),tabs:[...document.querySelectorAll('.tab')],views:[...document.querySelectorAll('.view')],listItems:$('listItems'),listCount:$('listCount'),
  textInput:$('textInput'),charCount:$('charCount'),recognizeTextBtn:$('recognizeTextBtn'),photoInput:$('photoInput'),recognitionPanel:$('recognitionPanel'),recognizedItems:$('recognizedItems'),recognizedCount:$('recognizedCount'),cancelRecognitionBtn:$('cancelRecognitionBtn'),saveRecognitionBtn:$('saveRecognitionBtn'),
  shopSummary:$('shopSummary'),shopItems:$('shopItems'),finishBtn:$('finishBtn'),archiveItems:$('archiveItems'),archiveDetail:$('archiveDetail'),toast:$('toast'),dockCount:$('dockCount'),dockStatus:$('dockStatus')
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function svgIcon(kind){
  const icons={
    milk:'<svg viewBox="0 0 24 24" fill="none"><path d="M9 3h6v3l2 3v12H7V9l2-3V3Zm0 6h8"/></svg>',
    bread:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 18c-2-1-3-3-2-5 1-3 5-6 9-6s8 3 9 6c1 2 0 4-2 5H5Z"/><path d="M8 10c2 1 3 2 4 4M12 9c2 1 3 2 4 4"/></svg>',
    banana:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 17c5 2 12 0 16-7-2 8-8 12-14 11-2 0-3-2-2-4Z"/><path d="M18 8l2-2"/></svg>',
    yogurt:'<svg viewBox="0 0 24 24" fill="none"><path d="M6 6h12l-1 15H7L6 6Zm-1-3h14v3H5V3Z"/><path d="M10 11h4v5h-4z"/></svg>',
    paper:'<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h7a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V8a4 4 0 0 1 3-4Z"/><circle cx="9" cy="8" r="4"/><path d="M13 8v12"/></svg>',
    meat:'<svg viewBox="0 0 24 24" fill="none"><path d="M6 18c-4-2-3-8 1-11 4-3 10-2 12 2 2 4-1 9-5 11-3 1-6 0-8-2Z"/><circle cx="16" cy="10" r="2"/></svg>',
    drink:'<svg viewBox="0 0 24 24" fill="none"><path d="M8 3h8l-1 4 2 3v11H7V10l2-3-1-4Z"/></svg>',
    produce:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 7c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7Z"/><path d="M12 7c0-3 2-4 5-4-1 3-2 4-5 4Z"/></svg>',
    generic:'<svg viewBox="0 0 24 24" fill="none"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 10h9l2-7H7"/><circle cx="10" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></svg>'
  };
  return icons[kind]||icons.generic;
}
function productKind(name){
  const s=String(name||'').toLowerCase();
  if(/mleko|kefir|maśl|masl|napój|napoj/.test(s))return 'milk';
  if(/chleb|bułk|bul|pieczy|bagiet/.test(s))return 'bread';
  if(/banan/.test(s))return 'banana';
  if(/jogurt|skyr|serek|śmietan|smietan/.test(s))return 'yogurt';
  if(/papier|ręcznik|recznik/.test(s))return 'paper';
  if(/mięso|mieso|kurcz|kiełbas|kielbas|szynk|mielon/.test(s))return 'meat';
  if(/woda|sok|cola|napój|napoj/.test(s))return 'drink';
  if(/pomidor|sałat|salat|ogórek|ogorek|jabł|jabl|cytr|warzy|owoc/.test(s))return 'produce';
  return 'generic';
}
function productIcon(name){return svgIcon(productKind(name));}
function plural(n){return n===1?'produkt':(n>=2&&n<=4?'produkty':'produktów');}
function formatDate(s){if(!s)return '';const d=new Date(s);return Number.isNaN(d.getTime())?String(s):new Intl.DateTimeFormat('pl-PL',{dateStyle:'short',timeStyle:'short'}).format(d)}
function updateDock(){const n=state.items.length;els.dockCount.textContent=`${n} ${plural(n)}`;els.dockStatus.textContent=navigator.onLine?'Online':'Offline';}

function startProcessing(title,msg){state.busy=true;els.processingTitle.textContent=title;els.processingMsg.textContent=msg;els.processingTime.textContent='0 s';els.processing.classList.remove('hidden');state.started=Date.now();clearInterval(state.timer);state.timer=setInterval(()=>{els.processingTime.textContent=Math.floor((Date.now()-state.started)/1000)+' s';},1000)}
function stopProcessing(){state.busy=false;clearInterval(state.timer);state.timer=null;els.processing.classList.add('hidden')}
let toastTimer=null;function toast(msg){clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.remove('hidden');toastTimer=setTimeout(()=>els.toast.classList.add('hidden'),2600)}
async function api(action,fields={},file=null){const fd=new FormData();fd.append('action',action);Object.entries(fields).forEach(([k,v])=>fd.append(k,String(v??'')));if(file)fd.append('data',file,file.name||'photo.jpg');let res;try{res=await fetch(API_URL,{method:'POST',body:fd,cache:'no-store'})}catch(e){throw new Error('Brak połączenia z serwerem.')}let data;try{data=await res.json()}catch(e){throw new Error('Serwer zwrócił nieprawidłową odpowiedź.')}if(!res.ok)throw new Error(data?.message||data?.error||('HTTP '+res.status));return data}

function switchView(name){
  els.tabs.forEach(t=>t.classList.toggle('active',t.dataset.view===name));
  els.views.forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
  els.appShell.dataset.activeView=name;
  window.scrollTo(0,0);
  if(name==='list')loadList();if(name==='shop')loadList();if(name==='archive')loadArchive();
}

async function loadList(){try{const d=await api('list');if(!d.success)throw new Error(d.message||d.error||'Nie udało się pobrać listy.');state.items=Array.isArray(d.items)?d.items:[];renderList();renderShop();updateDock()}catch(e){toast(e.message)}}
function renderList(){
  const n=state.items.length;els.listCount.textContent=n?`${n} ${plural(n)} do kupienia`:'Lista jest pusta';
  els.listItems.innerHTML=n?state.items.map(x=>`<div class="item"><div class="item-check">${x.checked?'✓':''}</div><div class="item-icon">${productIcon(x.product)}</div><div class="item-main"><strong>${esc(x.product)}</strong><small>${x.checked?'w koszyku':'dodano '+esc(formatDate(x.addedAt))}</small></div><button class="delete-btn" type="button" data-delete="${esc(x.itemId)}" aria-label="Usuń ${esc(x.product)}">${svgIcon('trash')}</button></div>`).join(''):'<div class="empty"><span class="empty-icon">🛒</span>Lista zakupów jest pusta.</div>';
}
async function deleteItem(id){const row=state.items.find(x=>x.itemId===id);if(!row)return;if(!confirm(`Usunąć „${row.product}” z listy?`))return;startProcessing('Usuwam produkt','Aktualizuję listę zakupów…');try{const d=await api('delete_item',{itemId:id});if(!d.success)throw new Error(d.message||d.error||'Nie udało się usunąć produktu.');await loadList();stopProcessing();toast('Produkt usunięty.')}catch(e){stopProcessing();toast(e.message)}}

function setRecognized(products){state.recognized=(products||[]).map(x=>String(x).trim()).filter(Boolean);renderRecognized();els.recognitionPanel.classList.toggle('hidden',!state.recognized.length)}
function renderRecognized(){
  els.recognizedCount.textContent=state.recognized.length;
  els.recognizedItems.innerHTML=state.recognized.map((x,i)=>`<div class="recognized-row"><div class="item-icon">${productIcon(x)}</div><span class="product-name">${esc(x)}</span><button class="delete-btn" type="button" data-remove-recognized="${i}" aria-label="Usuń ${esc(x)}">×</button></div>`).join('');
  els.saveRecognitionBtn.disabled=!state.recognized.length;
}
async function recognizeText(){const text=els.textInput.value.trim();if(!text){toast('Wpisz produkty.');return}startProcessing('Rozpoznaję produkty','Porządkuję wpis i dzielę go na pozycje…');try{const d=await api('recognize_text',{text});if(!d.success)throw new Error(d.message||d.error||'Nie rozpoznano produktów.');setRecognized(d.products);stopProcessing()}catch(e){stopProcessing();toast(e.message)}}
async function recognizePhoto(file){if(!file)return;startProcessing('Analizuję zdjęcie','Rozpoznaję widoczne produkty…');try{const d=await api('recognize_photo',{},file);if(!d.success)throw new Error(d.message||d.error||'Nie rozpoznano produktów.');setRecognized(d.products);stopProcessing()}catch(e){stopProcessing();toast(e.message)}finally{els.photoInput.value=''}}
async function saveRecognized(){if(!state.recognized.length)return;startProcessing('Dodaję produkty','Zapisuję pozycje na wspólnej liście…');try{const d=await api('add_products',{productsJson:JSON.stringify(state.recognized)});if(!d.success)throw new Error(d.message||d.error||'Nie udało się zapisać produktów.');state.recognized=[];els.textInput.value='';els.charCount.textContent='0/500';renderRecognized();els.recognitionPanel.classList.add('hidden');await loadList();stopProcessing();toast(`Dodano ${d.added||0} pozycji.`);switchView('list')}catch(e){stopProcessing();toast(e.message)}}

function renderShop(){
  const total=state.items.length,checked=state.items.filter(x=>x.checked).length,pct=total?Math.round(checked/total*100):0;
  els.shopSummary.innerHTML=`<div class="progress-ring" style="--p:${pct}">${svgIcon('cart')}</div><div class="shop-progress-copy"><strong>${checked} z ${total} kupione</strong><span>${total?checked===total?'Wszystko gotowe.':`Zostało ${total-checked} ${plural(total-checked)}.`:'Lista zakupów jest pusta.'}</span></div>`;
  els.shopItems.innerHTML=total?state.items.map(x=>`<button class="shop-row ${x.checked?'checked':''}" type="button" data-toggle="${esc(x.itemId)}"><span class="check">${x.checked?'✓':''}</span><span class="item-icon">${productIcon(x.product)}</span><span><strong>${esc(x.product)}</strong></span><span class="chev">›</span></button>`).join(''):'<div class="empty"><span class="empty-icon">🛍️</span>Lista zakupów jest pusta.</div>';
  els.finishBtn.disabled=checked===0;els.finishBtn.textContent=checked?`✓ Zakupy zrobione (${checked})`:'✓ Zakupy zrobione';
}
async function toggleItem(id){const row=state.items.find(x=>x.itemId===id);if(!row||state.busy)return;startProcessing(row.checked?'Cofam zaznaczenie':'Dodaję do koszyka','Aktualizuję listę…');try{const d=await api('toggle_item',{itemId:id,checked:!row.checked});if(!d.success)throw new Error(d.message||d.error||'Nie udało się zaktualizować produktu.');state.items=Array.isArray(d.items)?d.items:state.items;renderList();renderShop();updateDock();stopProcessing();if(d.allChecked){await wait(150);await finishShopping('automatic',false)}}catch(e){stopProcessing();toast(e.message)}}
async function finishShopping(mode='manual',ask=true){const checked=state.items.filter(x=>x.checked).length;if(!checked)return;if(ask&&!confirm(`Zakończyć zakupy? Do archiwum trafi ${checked} zaznaczonych pozycji, a bieżąca lista zostanie wyczyszczona.`))return;startProcessing('Kończę zakupy','Zapisuję zakupione produkty w archiwum…');try{const d=await api('finish',{finishMode:mode});if(!d.success)throw new Error(d.message||d.error||'Nie udało się zakończyć zakupów.');state.items=[];renderList();renderShop();updateDock();stopProcessing();toast('Zakupy zapisane w archiwum.');switchView('archive')}catch(e){stopProcessing();toast(e.message)}}

async function loadArchive(){try{const d=await api('archive');if(!d.success)throw new Error(d.message||d.error||'Nie udało się pobrać archiwum.');state.archive=Array.isArray(d.entries)?d.entries:[];renderArchive()}catch(e){toast(e.message)}}
function renderArchive(){
  els.archiveDetail.classList.add('hidden');
  els.archiveItems.innerHTML=state.archive.length?state.archive.map(x=>`<div class="archive-row" data-archive="${esc(x.shoppingId)}"><div class="archive-row-icon">${svgIcon('calendar')}</div><div><strong>${esc(formatDate(x.completedAt))}</strong><small>${Number(x.itemsCount||0)} ${plural(Number(x.itemsCount||0))}</small></div><span class="badge">${x.finishMode==='automatic'?'auto':'ręcznie'}</span><span class="chev">›</span></div>`).join(''):'<div class="empty"><span class="empty-icon">🗂️</span>Archiwum jest puste.</div>';
}
async function showArchiveDetail(id){startProcessing('Wczytuję zakupy','Pobieram szczegóły archiwum…');try{const d=await api('archive_detail',{shoppingId:id});if(!d.success)throw new Error(d.message||d.error||'Nie znaleziono zakupów.');const e=d.entry||{};const items=Array.isArray(e.items)?e.items:[];els.archiveDetail.innerHTML=`<div class="section-head"><div><h3>Szczegóły zakupów</h3><p class="muted">${esc(formatDate(e.completedAt))} • ${Number(e.itemsCount||items.length)} ${plural(Number(e.itemsCount||items.length))}</p></div><button class="soft-action" type="button" id="closeArchiveDetail">Zamknij</button></div><div class="list-panel" style="margin-top:14px">${items.map(x=>`<div class="item"><div class="item-icon">${productIcon(x.product)}</div><div class="item-main"><strong>${esc(x.product)}</strong></div></div>`).join('')}</div>`;els.archiveDetail.classList.remove('hidden');stopProcessing();$('closeArchiveDetail')?.addEventListener('click',()=>els.archiveDetail.classList.add('hidden'));els.archiveDetail.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){stopProcessing();toast(e.message)}}

function updateOnline(){const online=navigator.onLine;els.offline.classList.toggle('show',!online);els.dockStatus.textContent=online?'Online':'Offline'}
els.tabs.forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
els.listItems.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b)deleteItem(b.dataset.delete)});
els.recognizeTextBtn.addEventListener('click',recognizeText);
els.textInput.addEventListener('input',()=>{els.charCount.textContent=`${els.textInput.value.length}/500`});
els.textInput.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')recognizeText()});
els.photoInput.addEventListener('change',()=>recognizePhoto(els.photoInput.files?.[0]));
els.recognizedItems.addEventListener('click',e=>{const b=e.target.closest('[data-remove-recognized]');if(!b)return;state.recognized.splice(Number(b.dataset.removeRecognized),1);renderRecognized();if(!state.recognized.length)els.recognitionPanel.classList.add('hidden')});
els.cancelRecognitionBtn.addEventListener('click',()=>{state.recognized=[];renderRecognized();els.recognitionPanel.classList.add('hidden')});
els.saveRecognitionBtn.addEventListener('click',saveRecognized);
els.shopItems.addEventListener('click',e=>{const b=e.target.closest('[data-toggle]');if(b)toggleItem(b.dataset.toggle)});
els.finishBtn.addEventListener('click',()=>finishShopping('manual',true));
els.archiveItems.addEventListener('click',e=>{const r=e.target.closest('[data-archive]');if(r)showArchiveDetail(r.dataset.archive)});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;els.installBtn.classList.remove('hidden')});
els.installBtn.addEventListener('click',async()=>{if(!state.installPrompt){toast('W menu przeglądarki wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.');return}state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;els.installBtn.classList.add('hidden')});
window.addEventListener('appinstalled',()=>{state.installPrompt=null;els.installBtn.classList.add('hidden');toast('Aplikacja została zainstalowana.')});
window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.addEventListener('load',()=>{updateOnline();updateDock();loadList()});
