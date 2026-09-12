const SHEET_ID = '1Mj2hK66zL2Dj4JKk_zbgp48uVjm-osgu1rgDYsNQKao';
const ROOT_DRIVE = 'https://drive.google.com/drive/folders/1mhqpDrqgQ-FReQcDFVD_4TGjeErA79XM';

const subjects = {
  matematica: { code:'MAT', name:'Matematica', folder:'https://drive.google.com/drive/folders/1sUDxRShTUGMay9vLp-UDO_cr_jKb3rDF', files:{} },
  italiano: { code:'ITA', name:'Italiano', folder:'https://drive.google.com/drive/folders/1SZabByvezbjGWA9N4UUm5H_-jC5BBctX', files:{} },
  inglese: { code:'ENG', name:'Inglese', folder:'https://drive.google.com/drive/folders/1cVLFfDFx7Z1SXcU6Jk_C904iNcco1WWJ', files:{} },
  storia: { code:'STO', name:'Storia', folder:'https://drive.google.com/drive/folders/17HOnc_3AqfbL8w1RHvma3ZTLh9EiS0NE', files:{} },
  geografia: { code:'GEO', name:'Geografia / Geologia', folder:'https://drive.google.com/drive/folders/1rtDobO4c5H8RtLn0788qxD9T4OSys9c_', files:{} },
  biologia: { code:'BIO', name:'Biologia', folder:'https://drive.google.com/drive/folders/11icwYJpWNLfKn2r28VuhDqy9emg7HNQ1', files:{} },
  chimica: { code:'CHI', name:'Chimica', folder:'https://drive.google.com/drive/folders/1HkiQVtsREi89tJFp6aMCT-K1cd3E63dA', files:{} },
  fisica: { code:'FIS', name:'Fisica', folder:'https://drive.google.com/drive/folders/1Iy8rg2Z9dxQV1hSlq9hXJfM9-cE5UXD0', files:{} }
};

const categoryOrder = ['Manuali / Dossier','Mappe mentali','Esercizi','Simulazioni esame','Video e altri materiali'];
let materialsLoaded = false;
let materialsLoadError = null;
let materialsPromise = null;

function nav(){
  const current = location.hash.slice(2) || '';
  document.getElementById('nav').innerHTML = `<a href="#/" class="${!current?'active':''}">Home</a>` +
    Object.entries(subjects).map(([k,s]) => `<a href="#/${k}" class="${current===k?'active':''}">${s.name}</a>`).join('');
}

function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function pad(n){ return String(n).padStart(2,'0'); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function prettyDate(){ return new Intl.DateTimeFormat('it-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()); }

function cellValue(cell){
  if(!cell) return '';
  return cell.f ?? cell.v ?? '';
}

function querySheet(sheet, query='select *'){
  return new Promise((resolve,reject)=>{
    const cb = `__gviz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let done = false;
    const timer = setTimeout(()=>finish(reject,new Error(`Tempo di attesa scaduto per ${sheet}`)),15000);
    function finish(fn,val){
      if(done) return; done=true;
      clearTimeout(timer);
      if(script.parentNode) script.remove();
      try{ delete window[cb]; }catch(_e){ window[cb]=undefined; }
      fn(val);
    }
    window[cb] = response => {
      if(!response || response.status !== 'ok') return finish(reject,new Error(`Risposta Google Sheets non valida (${sheet})`));
      finish(resolve,response.table || {cols:[],rows:[]});
    };
    script.async = true;
    script.onerror = () => finish(reject,new Error(`Impossibile collegarsi al foglio ${sheet}`));
    const tqx = `out:json;responseHandler:${cb}`;
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheet)}&tqx=${encodeURIComponent(tqx)}&tq=${encodeURIComponent(query)}&ts=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function normalizeSheetDate(cell){
  if(!cell) return '';
  const rawValues = [cell.f, cell.v].filter(v=>v!==undefined && v!==null).map(String);
  for(const raw0 of rawValues){
    const raw = raw0.trim();
    let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = raw.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
    if(m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    m = raw.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
    if(m) return `${m[1]}-${pad(Number(m[2])+1)}-${pad(m[3])}`;
  }
  return '';
}

async function getTodaySchedule(){
  const table = await querySheet('Piano','select A,C,D,E,F');
  const iso = todayISO();
  return (table.rows || [])
    .filter(r => normalizeSheetDate((r.c || [])[0]) === iso)
    .map(r => {
      const c = r.c || [];
      return [String(cellValue(c[1])||''), String(cellValue(c[2])||''), String(cellValue(c[3])||''), String(cellValue(c[4])||'')];
    });
}

function boolCell(cell){
  if(!cell) return false;
  if(typeof cell.v === 'boolean') return cell.v;
  const s=String(cellValue(cell)).trim().toLowerCase();
  return ['true','vero','1','sì','si','yes'].includes(s);
}

function loadMaterials(){
  if(materialsPromise) return materialsPromise;
  materialsPromise = (async()=>{
    try{
      const [filesTable, linksTable] = await Promise.all([
        querySheet('PORTALE_FILES','select A,B,C,D,E,F,G,H'),
        querySheet('PORTALE_LINKS','select A,B,C,D,E,F')
      ]);

      Object.values(subjects).forEach(s=>s.files={});

      (filesTable.rows || []).forEach(r=>{
        const c=r.c||[];
        const key=String(cellValue(c[0])||'').trim().toLowerCase();
        const cat=String(cellValue(c[2])||'').trim();
        const name=String(cellValue(c[3])||'').trim();
        const url=String(cellValue(c[4])||'').trim();
        const format=String(cellValue(c[5])||'PDF').trim();
        const active=boolCell(c[6]);
        const order=Number(cellValue(c[7])||9999);
        if(!subjects[key] || !cat || !name || !url || !active) return;
        subjects[key].files[cat] ||= [];
        subjects[key].files[cat].push({name,url,format,desc:`${format} su Google Drive`,order});
      });

      (linksTable.rows || []).forEach(r=>{
        const c=r.c||[];
        const materia=String(cellValue(c[0])||'').trim().toLowerCase();
        const key=Object.keys(subjects).find(k => k===materia || subjects[k].name.toLowerCase()===materia || subjects[k].code.toLowerCase()===materia);
        const title=String(cellValue(c[1])||'').trim();
        const type=String(cellValue(c[2])||'Link').trim();
        const url=String(cellValue(c[3])||'').trim();
        const desc=String(cellValue(c[4])||'').trim();
        const active=boolCell(c[5]);
        if(!key || !title || !url || !active) return;
        const cat='Video e altri materiali';
        subjects[key].files[cat] ||= [];
        subjects[key].files[cat].push({name:title,url,format:type,desc:desc || type,order:9999});
      });

      Object.values(subjects).forEach(s=>Object.values(s.files).forEach(arr=>arr.sort((a,b)=>a.order-b.order || a.name.localeCompare(b.name,'it'))));
      materialsLoaded=true;
      materialsLoadError=null;
    }catch(e){
      materialsLoadError=e;
      throw e;
    }
  })();
  return materialsPromise;
}

function materialCount(s){ return Object.values(s.files).reduce((sum,arr)=>sum+arr.length,0); }

function renderSchedule(items){
  if(!items.length) return `<div class="empty">Nessuna attività prevista oggi nel piano di studio.</div>`;
  return `<div class="schedule">${items.map(x=>`<div class="schedule-item"><div class="time">${esc(x[0])}–${esc(x[1])}</div><div class="subject">${esc(x[2])}</div><div class="activity">${esc(x[3])}</div></div>`).join('')}</div>`;
}

async function refreshSchedule(){
  const box=document.getElementById('schedule');
  const status=document.getElementById('schedule-status');
  if(!box || !status) return;
  box.innerHTML='<div class="empty">Caricamento dal piano di studio…</div>';
  status.textContent='Collegamento a Google Sheets…';
  try{
    const items=await getTodaySchedule();
    box.innerHTML=renderSchedule(items);
    status.textContent = items.length ? `${items.length} attività previste` : 'Nessuna attività prevista';
  }catch(e){
    status.textContent='Piano non raggiungibile';
    box.innerHTML=`<div class="empty error"><strong>Non riesco a leggere automaticamente il piano.</strong><br>Il portale usa il Google Sheet pubblico come fonte dati. Premi <em>Aggiorna programma</em> per riprovare.<br><small>${esc(e.message)}</small></div>`;
  }
}

async function home(){
  const app=document.getElementById('app');
  app.innerHTML=`
    <section class="hero">
      <div class="hero-main"><div class="kicker">Portale di studio</div><h1>PASSERELLA 2027</h1><p>Accesso rapido al programma giornaliero e a tutti i materiali di Jacqueline.</p></div>
      <div class="hero-side"><div class="date-big">${prettyDate()}</div><div class="date-sub">Programma previsto per oggi</div><div class="hero-actions"><a class="btn" href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit" target="_blank" rel="noreferrer">Apri piano completo</a><button class="btn" id="refresh-schedule" type="button">Aggiorna programma</button></div></div>
    </section>
    <div class="section-title"><h2>Programma di oggi</h2><span id="schedule-status">Caricamento…</span></div>
    <div id="schedule"><div class="empty">Caricamento dal piano di studio…</div></div>
    <div class="section-title"><h2>Materie</h2><span id="materials-status">Caricamento materiali…</span></div>
    <section class="subject-grid" id="subject-grid">${Object.entries(subjects).map(([k,s])=>`<a class="subject-card" href="#/${k}"><div class="code">${s.code}</div><h3>${s.name}</h3><p>Caricamento…</p></a>`).join('')}</section>`;
  document.getElementById('refresh-schedule').addEventListener('click',refreshSchedule);
  refreshSchedule();
  try{
    await loadMaterials();
    const status=document.getElementById('materials-status'); if(status) status.textContent='Aggiornati da Google Drive';
    const grid=document.getElementById('subject-grid');
    if(grid) grid.innerHTML=Object.entries(subjects).map(([k,s])=>`<a class="subject-card" href="#/${k}"><div class="code">${s.code}</div><h3>${s.name}</h3><p>${materialCount(s)} materiali disponibili</p></a>`).join('');
  }catch(e){
    const status=document.getElementById('materials-status'); if(status) status.textContent='Materiali non raggiungibili';
  }
}

async function subjectPage(key){
  const s=subjects[key]; if(!s) return home();
  const app=document.getElementById('app');
  app.innerHTML=`<div class="page-head"><div><span class="badge">${s.code}</span><h1>${s.name}</h1><p>Materiali di studio disponibili su Google Drive</p></div><a class="btn primary" href="${s.folder}" target="_blank" rel="noreferrer">Apri cartella Drive</a></div><div id="subject-load"><div class="empty">Caricamento materiali…</div></div>`;
  try{
    await loadMaterials();
  }catch(e){
    document.getElementById('subject-load').innerHTML=`<div class="empty error"><strong>Non riesco a leggere l'indice dei materiali.</strong><br><small>${esc(e.message)}</small></div>`;
    return;
  }
  const host=document.getElementById('subject-load');
  host.innerHTML=`<input class="searchbar" id="search" placeholder="Cerca un documento…" /> <div id="categories"></div>`;
  const draw=(q='')=>{
    document.getElementById('categories').innerHTML=categoryOrder.map(cat=>{
      const all=(s.files[cat]||[]);
      const items=all.filter(item=>item.name.toLowerCase().includes(q.toLowerCase()) || (item.desc||'').toLowerCase().includes(q.toLowerCase()));
      return `<section class="category"><h2>${cat} <span class="badge">${all.length}</span></h2>${items.length?`<div class="files">${items.map(item=>`<div class="file-row"><div><div class="file-name">${esc(item.name)}</div><div class="file-desc">${esc(item.desc||item.format||'Materiale')}</div></div><a class="btn" href="${esc(item.url)}" target="_blank" rel="noreferrer">Apri</a></div>`).join('')}</div>`:`<div class="empty">${q && all.length ? 'Nessun documento corrisponde alla ricerca.' : 'Nessun materiale caricato in questa sezione.'}</div>`}</section>`;
    }).join('');
  };
  draw();
  document.getElementById('search').addEventListener('input',e=>draw(e.target.value));
}

function route(){ nav(); const key=location.hash.slice(2); key?subjectPage(key):home(); window.scrollTo(0,0); }
window.addEventListener('hashchange',route); route();
