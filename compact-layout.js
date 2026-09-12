function compactDisplayName(item, subject){
  let name=String(item.name||'');
  name=name.replace(/\.(pdf|mp4|docx?|pptx?|xlsx?)$/i,'');
  name=name.replace(new RegExp(`^${subject.code}_(?:MAN|MAP|ES|SIM|MEDIA)_`,'i'),'');
  return name.replace(/_/g,' ');
}

subjectPage = async function(key){
  const s=subjects[key];
  if(!s) return home();
  const app=document.getElementById('app');
  app.innerHTML=`
    <div class="page-head compact-page-head">
      <div><span class="badge">${s.code}</span><h1>${s.name}</h1><p>Materiali di studio disponibili su Google Drive</p></div>
      <a class="btn primary compact-drive-btn" href="${s.folder}" target="_blank" rel="noreferrer">Apri cartella Drive</a>
    </div>
    <div id="subject-load"><div class="empty">Caricamento materiali…</div></div>`;

  try{
    await loadMaterials();
  }catch(e){
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
      const items=needle ? all.filter(item=>item.name.toLowerCase().includes(needle) || (item.desc||'').toLowerCase().includes(needle)) : all;
      return {cat,all,items};
    });
    const maxRows=Math.max(1,...columns.map(c=>c.items.length));

    const head=columns.map(c=>`<th><span>${esc(c.cat)}</span><span class="table-count">${c.items.length}${needle ? `/${c.all.length}` : ''}</span></th>`).join('');
    let body='';
    for(let r=0;r<maxRows;r++){
      body += '<tr>' + columns.map(c=>{
        const item=c.items[r];
        if(!item) return '<td class="empty-cell">—</td>';
        const label=compactDisplayName(item,s);
        return `<td><a class="compact-file-link" href="${esc(item.url)}" target="_blank" rel="noreferrer" title="${esc(item.name)}"><span class="compact-file-name">${esc(label)}</span><span class="compact-format">${esc(item.format||'')}</span></a></td>`;
      }).join('') + '</tr>';
    }

    document.getElementById('categories').innerHTML=`<div class="materials-table-wrap"><table class="materials-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };

  draw();
  document.getElementById('search').addEventListener('input',e=>draw(e.target.value));
};

if(location.hash.slice(2)) route();
