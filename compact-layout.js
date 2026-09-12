const subjectThemes={
  matematica:{icon:'∑',color:'#7c3aed',soft:'#f3e8ff'},
  italiano:{icon:'✍️',color:'#d97706',soft:'#fff7ed'},
  inglese:{icon:'🇬🇧',color:'#2563eb',soft:'#eff6ff'},
  storia:{icon:'🏛️',color:'#b91c1c',soft:'#fef2f2'},
  geografia:{icon:'🌍',color:'#0891b2',soft:'#ecfeff'},
  biologia:{icon:'🧬',color:'#16a34a',soft:'#f0fdf4'},
  chimica:{icon:'⚗️',color:'#ea580c',soft:'#fff7ed'},
  fisica:{icon:'⚛️',color:'#0f766e',soft:'#f0fdfa'}
};

Object.entries(subjectThemes).forEach(([key,t])=>Object.assign(subjects[key],t));

function compactDisplayName(item, subject){
  let name=String(item.name||'');
  name=name.replace(/\.(pdf|mp4|docx?|pptx?|xlsx?)$/i,'');
  name=name.replace(new RegExp(`^${subject.code}_(?:MAN|MAP|ES|SIM|MEDIA)_`,'i'),'');
  name=name.replace(/^Umanita_/,'Storia dell’umanità · ');
  name=name.replace(/^Svizzera_/,'Svizzera · ');
  return name.replace(/_/g,' ');
}

nav=function(){
  const current=location.hash.slice(2)||'';
  document.getElementById('nav').innerHTML=`<a href="#/" class="${!current?'active':''}">Home</a>`+
    Object.entries(subjects).map(([k,s])=>`<a href="#/${k}" class="${current===k?'active':''}" style="--nav-color:${s.color};--nav-soft:${s.soft}">${s.icon} ${s.name}</a>`).join('');
};

function themedSubjectCard(key,s,countText='Caricamento…'){
  return `<a class="subject-card themed-card" href="#/${key}" style="--subject:${s.color};--subject-soft:${s.soft}">
    <div class="themed-card-top"><span class="subject-icon">${s.icon}</span><span class="code">${s.code}</span></div>
    <h3>${s.name}</h3><p>${countText}</p>
  </a>`;
}

home=async function(){
  const app=document.getElementById('app');
  app.innerHTML=`
    <section class="hero">
      <div class="hero-main"><div class="kicker">Portale di studio</div><h1>PASSERELLA 2027</h1><p>Accesso rapido al programma giornaliero e a tutti i materiali di Jacqueline.</p></div>
      <div class="hero-side"><div class="date-big">${prettyDate()}</div><div class="date-sub">Programma previsto per oggi</div><div class="hero-actions"><a class="btn" href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit" target="_blank" rel="noreferrer">Apri piano completo</a><button class="btn" id="refresh-schedule" type="button">Aggiorna programma</button></div></div>
    </section>
    <div class="section-title"><h2>Programma di oggi</h2><span id="schedule-status">Caricamento…</span></div>
    <div id="schedule"><div class="empty">Caricamento dal piano di studio…</div></div>
    <div class="section-title"><h2>Materie</h2><span id="materials-status">Caricamento materiali…</span></div>
    <section class="subject-grid" id="subject-grid">${Object.entries(subjects).map(([k,s])=>themedSubjectCard(k,s)).join('')}</section>`;
  document.getElementById('refresh-schedule').addEventListener('click',refreshSchedule);
  refreshSchedule();
  try{
    await loadMaterials();
    const status=document.getElementById('materials-status'); if(status) status.textContent='Aggiornati da Google Drive';
    const grid=document.getElementById('subject-grid');
    if(grid) grid.innerHTML=Object.entries(subjects).map(([k,s])=>themedSubjectCard(k,s,`${materialCount(s)} materiali disponibili`)).join('');
  }catch(e){
    const status=document.getElementById('materials-status'); if(status) status.textContent='Materiali non raggiungibili';
  }
};

subjectPage=async function(key){
  const s=subjects[key];
  if(!s) return home();
  const app=document.getElementById('app');
  app.innerHTML=`
    <div class="page-head compact-page-head subject-theme" style="--subject:${s.color};--subject-soft:${s.soft}">
      <div class="subject-head-main"><div class="subject-page-icon">${s.icon}</div><div><span class="badge subject-badge">${s.code}</span><h1>${s.name}</h1><p>Materiali di studio disponibili su Google Drive</p></div></div>
      <a class="btn primary compact-drive-btn" href="${s.folder}" target="_blank" rel="noreferrer">Apri cartella Drive</a>
    </div>
    <div id="subject-load"><div class="empty">Caricamento materiali…</div></div>`;

  try{ await loadMaterials(); }
  catch(e){
    document.getElementById('subject-load').innerHTML=`<div class="empty error"><strong>Non riesco a leggere l'indice dei materiali.</strong><br><small>${esc(e.message)}</small></div>`;
    return;
  }

  const host=document.getElementById('subject-load');
  host.innerHTML=`
    <div class="compact-tools">
      <input class="searchbar compact-search" id="search" placeholder="Cerca un materiale…" />
      <span class="compact-total">${materialCount(s)} materiali</span>
    </div>
    <div id="categories"></div>`;

  const draw=(q='')=>{
    const needle=q.trim().toLowerCase();
    const columns=categoryOrder.map(cat=>{
      const all=s.files[cat]||[];
      const items=needle ? all.filter(item=>item.name.toLowerCase().includes(needle)||(item.desc||'').toLowerCase().includes(needle)) : all;
      return {cat,all,items};
    });
    const maxRows=Math.max(1,...columns.map(c=>c.items.length));
    const head=columns.map(c=>`<th><span>${esc(c.cat)}</span><span class="table-count" style="--subject:${s.color};--subject-soft:${s.soft}">${c.items.length}${needle?`/${c.all.length}`:''}</span></th>`).join('');
    let body='';
    for(let r=0;r<maxRows;r++){
      body+='<tr>'+columns.map(c=>{
        const item=c.items[r];
        if(!item) return '<td class="empty-cell">—</td>';
        const label=compactDisplayName(item,s);
        return `<td><a class="compact-file-link" style="--subject:${s.color};--subject-soft:${s.soft}" href="${esc(item.url)}" target="_blank" rel="noreferrer" title="${esc(item.name)}"><span class="compact-file-name">${esc(label)}</span><span class="compact-format">${esc(item.format||'')}</span></a></td>`;
      }).join('')+'</tr>';
    }
    document.getElementById('categories').innerHTML=`<div class="materials-table-wrap subject-table" style="--subject:${s.color};--subject-soft:${s.soft}"><table class="materials-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };

  draw();
  document.getElementById('search').addEventListener('input',e=>draw(e.target.value));
};

nav();
if(location.hash.slice(2)) route(); else home();
