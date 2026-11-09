(function () {
  'use strict';
  const C = window.ConsoleCore, D = window.ChartData;
  const storageKey = 'stat-console-projects-v1';
  const views = ['Overview','Workbench','Analyze','Scenarios','Decisions','Create','Automate','Calculators'];
  let projects = [C.project('My workspace')], active = projects[0].id, view = 'Overview', working = null, steps = [], saved = false;
  const $ = id => document.getElementById(id);
  const p = () => projects.find(x => x.id === active);
  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== null) node.textContent = text;
    for (const [k,v] of Object.entries(attrs)) node.setAttribute(k,v);
    return node;
  }
  function button(text, action, cls = '') {
    const node = el('button',text,{type:'button',class:cls});
    node.addEventListener('click', () => safe(action)); return node;
  }
  function safe(action) {
    try { const result = action(); if (result && result.catch) result.catch(error => message(error.message,true)); }
    catch (error) { message(error.message,true); }
  }
  function message(text,error=false) { $('console-status').textContent=text; $('console-status').setAttribute('role',error?'alert':'status'); }
  function changed() { saved=false; $('save-state').textContent='Unsaved changes'; }
  function download(content,name,type='text/plain') {
    const url=URL.createObjectURL(new Blob([content],{type})), a=el('a',null,{href:url,download:name});
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function field(form,label,name,type='text',value='',required=true) {
    const wrap=el('label',label,{class:'console-field'});
    const input=el(type==='textarea'?'textarea':type==='select'?'select':'input',null,{name});
    if (!['textarea','select'].includes(type)) input.type=type;
    if (required) input.required=true;
    if (type==='number') { input.min='0'; input.step='any'; }
    if (type==='textarea') input.rows=4;
    input.value=value; wrap.append(input); form.append(wrap); return input;
  }
  function select(form,label,name,options,value) {
    const node=field(form,label,name,'select');
    for (const item of options) { const [v,t]=Array.isArray(item)?item:[item,item]; node.append(el('option',t,{value:v})); }
    if (value!==undefined) node.value=value;
    return node;
  }
  function form(parent,title,action) {
    const node=el('form',null,{class:'console-form'}); if(title) node.append(el('h3',title));
    node.addEventListener('submit',event=>{event.preventDefault();safe(()=>action(Object.fromEntries(new FormData(node)),node));}); parent.append(node); return node;
  }
  function submit(node,text) { node.append(el('button',text,{type:'submit',class:'primary'})); }
  function panel(parent,title,detail) {
    const node=el('section',null,{class:'panel console-panel'}); node.append(el('h2',title));
    if(detail) node.append(el('p',detail,{class:'note'})); parent.append(node); return node;
  }
  function empty(parent,text) { parent.append(el('p',text,{class:'console-empty'})); }
  function remove(list,id) { p()[list]=p()[list].filter(x=>x.id!==id); changed(); render(); }
  function row(parent,title,detail,actions=[]) {
    const node=el('article',null,{class:'console-record'}), text=el('div',null);
    text.append(el('h3',title)); if(detail) text.append(el('p',detail,{class:'note'})); node.append(text);
    const controls=el('div',null,{class:'console-actions'}); controls.append(...actions); node.append(controls); parent.append(node);
  }
  function navigate(name) {
    view=name;
    for(const v of views) { $('view-'+v.toLowerCase()).hidden=v!==name; $('nav-'+v.toLowerCase()).setAttribute('aria-current',v===name?'page':'false'); }
    $('console-heading').textContent=name;
    render();
  }
  const sidebar=el('aside',null,{class:'console-sidebar','aria-label':'Project navigation'});
  sidebar.append(el('div','SC / WORKSPACE',{class:'console-brand'}));
  const projectLabel=el('label','Project',{class:'console-field'}), projectSelect=el('select',null,{id:'project-select'}); projectLabel.append(projectSelect); sidebar.append(projectLabel);
  projectSelect.addEventListener('change',()=>{active=projectSelect.value;working=null;steps=[];render();message('Project switched.');});
  sidebar.append(button('+ New project',()=>{
    const name=prompt('Project name'); if(!name||!name.trim())return;
    const next=C.project(name);projects.push(next);active=next.id;working=null;steps=[];changed();render();
  }));
  const nav=el('nav',null,{'aria-label':'Tools'});
  views.forEach((name,i)=>nav.append(button(String(i+1).padStart(2,'0')+'  '+name,()=>navigate(name),'console-nav')));
  [...nav.children].forEach((node,i)=>node.id='nav-'+views[i].toLowerCase());sidebar.append(nav);
  sidebar.append(button('Save locally',()=>{
    if(projects.length>100)throw new Error('Keep at most 100 projects per browser workspace. Download backups before removing projects.');
    const text=JSON.stringify({version:1,projects,active});
    if(text.length>5*1024*1024)throw new Error('Workspace exceeds 5 MB. Download project backups instead.');
    projects.forEach(project => C.importProject(JSON.stringify({version:1,project})));
    localStorage.setItem(storageKey,text);saved=true;$('save-state').textContent='Saved on this browser';message('Projects saved on this browser. Download backups before clearing browser data.');
  },'primary'));
  sidebar.append(el('p','Nothing saved yet',{id:'save-state',class:'note'}));
  sidebar.append(button('Download project',()=>download(JSON.stringify({version:1,project:p()},null,2),'stat-console-project.json','application/json')));
  const importLabel=el('label','Import project',{class:'console-field'}), upload=el('input',null,{type:'file',accept:'.json,application/json'});importLabel.append(upload);sidebar.append(importLabel);
  upload.addEventListener('change',()=>safe(async()=>{
    const file=upload.files[0];if(!file)return;
    if(file.size>5*1024*1024)throw new Error('Use a project file under 5 MB.');
    const next=C.importProject(await file.text());projects.push(next);active=next.id;working=null;steps=[];changed();render();upload.value='';message('Project imported as a separate copy.');
  }));
  sidebar.append(button('Forget saved copy',()=>{
    if(!confirm('Remove all locally saved projects from this browser? Current open projects stay in memory.'))return;
    localStorage.removeItem(storageKey);changed();message('Local saved copy removed. Open projects remain until you close the page.');
  }));
  const main=document.querySelector('main.shell');main.classList.add('console-main');
  const shell=el('div',null,{class:'console-shell'});main.before(shell);shell.append(sidebar,main);
  const tabs=document.querySelector('.workspace-tabs'), analyze=el('section',null,{id:'view-analyze'});
  tabs.before(analyze);analyze.append(tabs,$('studio-panel'),$('analyzer-panel'));
  for(const name of views.filter(x=>x!=='Analyze'))analyze.before(el('section',null,{id:'view-'+name.toLowerCase()}));
  const toolbar=el('div',null,{class:'console-toolbar'});toolbar.append(el('h2','Overview',{id:'console-heading'}),button('⌘ / Ctrl K · Commands',()=>openCommands()));
  analyze.parentNode.insertBefore(toolbar,$('view-overview'));
  toolbar.after(el('p','',{id:'console-status','role':'status',class:'console-status'}));
  const footer=document.querySelector('footer');footer.textContent='STAT CONSOLE · Browser workspace · Explicit local saves · v0.2.0';
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  function render() {
    projectSelect.replaceChildren(...projects.map(x=>el('option',x.name,{value:x.id})));projectSelect.value=active;
    for(const name of views)if(name!=='Analyze'&&name!=='Calculators')$('view-'+name.toLowerCase()).replaceChildren();
    overview();workbench();scenarios();decisions();create();automate();
  }
  function overview() {
    const root=$('view-overview'), heading=panel(root,p().name,'Your work, evidence, and next moves in one place. Save locally when you want to keep this workspace.');
    const stats=el('div',null,{class:'console-stats'});
    const items=[['Open actions',p().tasks.filter(x=>x.status!=='Done').length],['Overdue',p().tasks.filter(x=>x.status!=='Done'&&x.due&&x.due<today()).length],['Datasets',p().datasets.length],['Decisions to review',p().decisions.filter(x=>x.status!=='Reviewed'&&x.review&&x.review<=today()).length]];
    for(const [label,value]of items){const tile=el('div',null);tile.append(el('span',label),el('strong',String(value)));stats.append(tile);}heading.append(stats);
    heading.append(button('Load example project',()=>{
      const next=C.project('Launch planning');next.notes='Goal: choose the launch budget and prepare a stakeholder update.\nACTION: Review the acquisition assumptions\nTODO: Prepare the launch recommendation';
      next.datasets.push({id:C.id(),name:'Channel plan',rows:[['Channel','Budget','Leads'],['Search','12000','480'],['Social','8000','260'],['Partners','5000','150']]});
      next.tasks.push({id:C.id(),title:'Validate channel costs',owner:'',due:today(),status:'Open'});projects.push(next);active=next.id;working=null;steps=[];changed();render();
    }));
    const notes=panel(root,'Project notes','Keep a brief, meeting notes, or assumptions here. Mark lines TODO: or ACTION: to turn them into tasks in Create.');
    const area=field(notes,'Notes','notes','textarea',p().notes,false);
    area.addEventListener('input',()=>{p().notes=area.value;changed();});
    const tasks=panel(root,'Next actions','Keep ownership and due dates attached to the project.');
    const f=form(tasks,'Add action',data=>{p().tasks.push({id:C.id(),...data,status:'Open'});changed();render();});
    field(f,'Action','title');field(f,'Owner','owner','text','',false);field(f,'Due date','due','date','',false);submit(f,'Add action');
    if(!p().tasks.length)empty(tasks,'No actions yet. Add your first next step.');
    for(const task of p().tasks)row(tasks,task.title,[task.status,task.owner,task.due].filter(Boolean).join(' · '),[
      button(task.status==='Done'?'Reopen':'Complete',()=>{task.status=task.status==='Done'?'Open':'Done';changed();render();}),
      button(task.status==='Waiting'?'Unblock':'Waiting',()=>{task.status=task.status==='Waiting'?'Open':'Waiting';changed();render();}),button('Remove',()=>remove('tasks',task.id))]);
    const manage=panel(root,'Project settings');
    const rename=form(manage,'',data=>{p().name=data.name.trim()||p().name;changed();render();});field(rename,'Project name','name','text',p().name);submit(rename,'Rename');
    manage.append(button('Delete project',()=>{if(!confirm('Delete this project from the open workspace? Save locally afterward to update the saved copy.'))return;projects=projects.filter(x=>x.id!==active);if(!projects.length)projects=[C.project('My workspace')];active=projects[0].id;working=null;steps=[];changed();render();}));
  }
  function showTable(parent,rows) {
    const wrap=el('div',null,{class:'console-table',tabindex:'0',role:'region','aria-label':'Data preview'}), table=el('table',null), head=el('thead',null), body=el('tbody',null);
    const tr=el('tr',null);rows[0].forEach(v=>tr.append(el('th',v,{scope:'col'})));head.append(tr);
    rows.slice(1,31).forEach(r=>{const row=el('tr',null);r.forEach(v=>row.append(el('td',v)));body.append(row);});table.append(head,body);wrap.append(table);parent.append(wrap);
    parent.append(el('p',`${rows.length-1} rows · ${rows[0].length} columns · Preview shows first 30 rows`,{class:'note'}));
  }
  function workbench() {
    const root=$('view-workbench'), input=panel(root,'Data workbench','Paste or upload CSV/TSV, clean it, compare versions, and send it to Chart Studio. Up to 10,000 rows, 100 columns, or 200,000 cells. Excel imports are available in Analyze; use “To workbench” afterward.');
    const f=form(input,'Load a table',(data)=>{working={name:data.name.trim()||'Untitled dataset',rows:C.table(D.splitDelimited(data.table))};steps=[];render();message('Table loaded. Original saved datasets remain unchanged.');});
    field(f,'Dataset name','name','text','My dataset');field(f,'Paste table with headers','table','textarea','');submit(f,'Load table');
    const file=field(input,'Upload CSV / TSV','file','file','',false);file.accept='.csv,.tsv';
    file.addEventListener('change',()=>safe(async()=>{const chosen=file.files[0];if(!chosen)return;if(chosen.size>5*1024*1024)throw new Error('Use a file under 5 MB.');const next=C.table(D.splitDelimited(await chosen.text()));working={name:chosen.name.replace(/\.[^.]+$/,''),rows:next};steps=[];render();message('File loaded in this browser.');}));
    const savedPanel=panel(root,'Project datasets');
    if(!p().datasets.length)empty(savedPanel,'Save a working table below to reuse it across this project.');
    p().datasets.forEach(data=>row(savedPanel,data.name,`${data.rows.length-1} rows`,[button('Open',()=>{working=structuredClone(data);steps=[];render();}),button('Download CSV',()=>download(C.csv(data.rows),'dataset.csv','text/csv')),button('Remove',()=>remove('datasets',data.id))]));
    if(!working)return;
    const result=panel(root,working.name,'Working copy. Save a snapshot to add this result to the project.');showTable(result,working.rows);
    const actions=el('div',null,{class:'console-actions'});result.append(actions);
    actions.append(button('Save dataset copy',()=>{p().datasets.push({id:C.id(),name:working.name,rows:structuredClone(working.rows)});changed();render();message('Dataset snapshot added to project.');},'primary'),button('Download CSV',()=>download(C.csv(working.rows),'workbench.csv','text/csv')),button(working.rows.length>201?'Analyze first 200 rows':'Analyze table',()=>{
      window.ChartStudio.loadRows(working.rows.slice(0,201),working.name);navigate('Analyze');window.AnalysisTabs.activate('studio-tab');message(working.rows.length>201?'First 200 rows loaded into Chart Studio. Full dataset stays in Workbench.':'Table loaded into Chart Studio.');
    }));
    const tools=panel(root,'Transform working copy','Cleanup trims whitespace and removes blank and identical rows. Derived change = (A − B) / |B|. Ratios and changes remain decimal fractions.');
    tools.append(button('Clean table',()=>{working.rows=C.clean(working.rows);steps.push({type:'clean'});render();message('Table cleaned.');}));
    const derive=form(tools,'Add calculated column',data=>{const spec={type:'derive',...data};working.rows=C.derive(working.rows,spec);steps.push(spec);render();});
    select(derive,'Column A','a',working.rows[0]);select(derive,'Calculation','op',[['difference','A − B'],['sum','A + B'],['product','A × B'],['ratio','A ÷ B'],['change','Relative change']]);select(derive,'Column B','b',working.rows[0]);field(derive,'Result column','name');submit(derive,'Calculate column');
    if(steps.length)tools.append(button('Save steps as workflow',()=>{const name=prompt('Workflow name');if(!name?.trim())return;p().workflows.push({id:C.id(),name:name.trim(),steps:structuredClone(steps)});changed();render();message('Workflow saved. Replay it on another table in Automate.');}));
    if(p().datasets.length){const cmp=form(tools,'Compare against saved dataset',data=>{
      const other=p().datasets.find(x=>x.id===data.dataset),rows=C.compare(working.rows,other.rows,data.key);
      if(rows.length===1){message('No changes found.');return;}
      working={name:'Changes: '+working.name+' → '+other.name,rows};steps=[];render();message('Comparison result shows changes from working table to selected dataset.');
    });select(cmp,'Compare to','dataset',p().datasets.map(x=>[x.id,x.name]));select(cmp,'Unique key column','key',working.rows[0]);submit(cmp,'Compare versions');
      const merge=form(tools,'Join columns from another dataset',data=>{
        const other=p().datasets.find(x=>x.id===data.dataset);working={name:working.name+' + '+other.name,rows:C.join(working.rows,other.rows,data.key)};steps=[];render();message('Left join complete. All working rows retained; unmatched values are blank.');
      });select(merge,'Add columns from','dataset',p().datasets.map(x=>[x.id,x.name]));select(merge,'Shared unique key column','key',working.rows[0]);submit(merge,'Join tables');
      tools.append(el('p','Joins keep every working row. Both tables need the same named, unique, nonblank key column. Unmatched cells stay blank; duplicate column names receive a numbered suffix.',{class:'note'}));
    }
  }
  function scenarios() {
    const root=$('view-scenarios'), entry=panel(root,'Scenario lab','Compare unit economics before committing to a plan. Enter consistent currency units. These are deterministic calculations from your assumptions.');
    const f=form(entry,'Save a scenario',data=>{C.scenario(data);p().scenarios.push({id:C.id(),name:data.name,values:Object.fromEntries(['units','price','variable','fixed'].map(k=>[k,Number(data[k])]))});changed();render();});
    field(f,'Scenario name','name');field(f,'Units','units','number','1000').step='1';field(f,'Price per unit','price','number','50');field(f,'Variable cost per unit','variable','number','20');field(f,'Fixed cost','fixed','number','10000');submit(f,'Calculate & save');
    const results=panel(root,'Compare scenarios','Break-even assumes all units sell at the entered price. “Unavailable” means contribution per unit is zero or negative.');
    if(!p().scenarios.length)empty(results,'Save a base case, then try lower demand or higher costs.');
    else{const rows=[['Scenario','Revenue','Cost','Profit','Margin','Break-even units']];for(const s of p().scenarios){const r=C.scenario(s.values);rows.push([s.name,...['revenue','cost','profit'].map(k=>r[k].toLocaleString(undefined,{maximumFractionDigits:2})),r.margin===null?'Unavailable':(100*r.margin).toFixed(1)+'%',r.breakEven===null?'Unavailable':String(r.breakEven)]);}showTable(results,rows);results.append(button('Download comparison',()=>download(C.csv(rows),'scenarios.csv','text/csv')));}
    p().scenarios.forEach(s=>row(results,s.name,`${s.values.units} units × ${s.values.price} price · Variable ${s.values.variable} · Fixed ${s.values.fixed}`,[button('Remove',()=>remove('scenarios',s.id))]));
  }
  function decisions() {
    const root=$('view-decisions'), entry=panel(root,'Decision log','Record the reasoning while it is fresh. Link evidence by dataset or saved-chart name, then set a review date.');
    const f=form(entry,'Record decision',data=>{p().decisions.push({id:C.id(),...data,status:'Open'});changed();render();});
    field(f,'Decision','title');field(f,'Reasoning and evidence','rationale','textarea');field(f,'Owner','owner','text','',false);field(f,'Review date','review','date','',false);field(f,'Next step','next','text','',false);submit(f,'Save decision');
    const list=panel(root,'Project decisions');if(!p().decisions.length)empty(list,'Your decisions and their reasoning will appear here.');
    for(const d of p().decisions)row(list,d.title,[d.rationale,d.owner,d.review?'Review '+d.review:'',d.next,d.status].filter(Boolean).join(' · '),[button(d.status==='Reviewed'?'Reopen':'Mark reviewed',()=>{d.status=d.status==='Reviewed'?'Open':'Reviewed';changed();render();}),button('Remove',()=>remove('decisions',d.id))]);
  }
  function create() {
    const root=$('view-create'), drafts=panel(root,'Create a working document','Generate an editable outline from project records. Templates use your saved notes and records; they do not infer facts or call an AI service.');
    const f=form(drafts,'',data=>{
      const project=p(), lines=['# '+project.name+' — '+data.kind,'',project.notes,''];
      if(data.kind==='Meeting agenda')lines.push('## Agenda',...project.tasks.filter(t=>t.status!=='Done').map(t=>'- '+t.title+(t.owner?' — '+t.owner:'')),'','## Decisions to discuss');
      else lines.push('## Actions',...project.tasks.map(t=>'- ['+(t.status==='Done'?'x':' ')+'] '+t.title+(t.due?' · Due '+t.due:'')),'','## Decisions');
      lines.push(...project.decisions.map(d=>'- '+d.title+'\n  Reasoning: '+d.rationale+'\n  Next: '+d.next),'','## Evidence',...project.datasets.map(d=>'- Dataset: '+d.name),...project.charts.map(c=>'- Chart: '+c.name),'','## Scenario results',...project.scenarios.map(s=>'- '+s.name+': profit '+C.scenario(s.values).profit));
      $('document-draft').value=lines.join('\n');message('Draft ready to edit and download.');
    });select(f,'Document type','kind',['Project brief','Meeting agenda','Decision memo']);submit(f,'Generate draft');
    const draft=field(drafts,'Editable draft (download before leaving this tool)','draft','textarea','',false);draft.id='document-draft';draft.rows=12;
    drafts.append(button('Download Markdown',()=>{if(!draft.value.trim())throw new Error('Generate or enter a draft first.');download(draft.value,'project-document.md','text/markdown');}));
    const extract=panel(root,'Turn notes into next actions','Only lines beginning TODO: or ACTION: are extracted. Review the list before adding.');
    const candidates=[...new Set(p().notes.split(/\r?\n/).map(s=>s.match(/^\s*(?:TODO|ACTION):\s*(.+)$/i)?.[1]).filter(Boolean))].filter(s=>!p().tasks.some(t=>t.title===s));
    if(!candidates.length)empty(extract,'Add TODO: or ACTION: lines to your project notes in Overview.');
    else{const checks=candidates.map(text=>{const label=el('label',null,{class:'console-check'}),check=el('input',null,{type:'checkbox'});check.checked=true;label.append(check,document.createTextNode(text));extract.append(label);return{check,text};});extract.append(button('Add selected actions',()=>{checks.filter(x=>x.check.checked).forEach(x=>p().tasks.push({id:C.id(),title:x.text,owner:'',due:'',status:'Open'}));changed();render();message('Selected actions added to Overview.');}));}
    const charts=panel(root,'Saved charts','Save a valid chart from Analyze. Open a snapshot to edit or export its native PowerPoint slide.');
    if(!p().charts.length)empty(charts,'No saved charts yet.');
    for(const chart of p().charts)row(charts,chart.name,'Data, chart style, axes, and colors saved together.',[button('Open in Analyze',()=>{window.ChartStudio.restore(chart.snapshot);navigate('Analyze');window.AnalysisTabs.activate('studio-tab');message('Saved chart restored. Use Export PowerPoint for an editable chart.');}),button('Remove',()=>remove('charts',chart.id))]);
  }
  function automate() {
    const root=$('view-automate'), section=panel(root,'Repeatable workflows','Save cleanup and calculated-column steps in Workbench, then replay them against a saved dataset. Results open as a working copy for review before you save or download.');
    if(!p().workflows.length)empty(section,'No workflows yet. Clean or calculate a table in Workbench and select Save steps as workflow.');
    for(const workflow of p().workflows){const box=panel(section,workflow.name,workflow.steps.map(s=>s.type==='clean'?'Trim, remove blanks and duplicates':s.name+' = '+s.a+' '+s.op+' '+s.b).join(' → '));
      if(p().datasets.length){const f=form(box,'',data=>{const source=p().datasets.find(x=>x.id===data.dataset);working={name:source.name+' — '+workflow.name,rows:C.run(source.rows,workflow.steps)};steps=structuredClone(workflow.steps);navigate('Workbench');message('Workflow complete. Review the result before saving.');});select(f,'Source dataset','dataset',p().datasets.map(x=>[x.id,x.name]));submit(f,'Run & review');}
      else empty(box,'Save a source dataset in Workbench first.');box.append(button('Remove workflow',()=>remove('workflows',workflow.id)));}
  }
  // Existing analysis tools stay mounted: navigation never resets their inputs or random samples.
  $('builder-save-project').addEventListener('click',()=>safe(()=>{const snapshot=window.ChartStudio.snapshot();p().charts.push({id:C.id(),name:snapshot.title,snapshot});changed();render();message('Chart saved to this project. Find it in Create.');}));
  $('builder-to-workbench').addEventListener('click',()=>safe(()=>{const snapshot=window.ChartStudio.snapshot();working={name:snapshot.title,rows:snapshot.rows};steps=[];navigate('Workbench');message('Applied chart data opened as a working copy.');}));
  const dialog=el('dialog',null,{class:'console-command','aria-labelledby':'command-title'}), title=el('h2','Command console',{id:'command-title'}), search=el('input',null,{type:'search','aria-label':'Search tools, projects, datasets, and charts',placeholder:'Search tools, projects, datasets, charts…'}), results=el('div',null,{class:'command-results'});
  dialog.append(title,search,results,button('Close',()=>dialog.close()));document.body.append(dialog);
  function commands() {
    const all=views.map(name=>({name:'Open '+name,action:()=>navigate(name)}));
    projects.forEach(project=>all.push({name:'Project: '+project.name,action:()=>{active=project.id;working=null;steps=[];navigate('Overview');}}));
    p().datasets.forEach(data=>all.push({name:'Dataset: '+data.name,action:()=>{working=structuredClone(data);steps=[];navigate('Workbench');}}));
    p().charts.forEach(chart=>all.push({name:'Chart: '+chart.name,action:()=>{window.ChartStudio.restore(chart.snapshot);navigate('Analyze');window.AnalysisTabs.activate('studio-tab');}}));
    results.replaceChildren(...all.filter(x=>x.name.toLowerCase().includes(search.value.toLowerCase())).slice(0,30).map(x=>button(x.name,()=>{dialog.close();x.action();})));
    if(!results.children.length)empty(results,'No matching commands.');
  }
  function openCommands(){search.value='';commands();dialog.showModal();search.focus();}
  search.addEventListener('input',commands);
  dialog.addEventListener('keydown',event=>{
    const buttons=[...results.querySelectorAll('button')];let index=buttons.indexOf(document.activeElement);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(buttons.length)buttons[index<0?(event.key==='ArrowDown'?0:buttons.length-1):(index+(event.key==='ArrowDown'?1:buttons.length-1))%buttons.length].focus();}
    if(event.key==='Enter'&&document.activeElement===search&&buttons.length){event.preventDefault();buttons[0].click();}
  });
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(dialog.open)dialog.close();else openCommands();}});
  try {
    const stored=localStorage.getItem(storageKey);
    if(stored){if(stored.length>5*1024*1024)throw new Error('Saved workspace exceeds 5 MB.');const data=JSON.parse(stored);if(data.version!==1||!Array.isArray(data.projects)||!data.projects.length||data.projects.length>100)throw new Error('Invalid saved workspace.');
      const selected=data.projects.findIndex(x=>x.id===data.active);projects=data.projects.map(project=>C.importProject(JSON.stringify({version:1,project})));active=projects[Math.max(0,selected)].id;saved=true;$('save-state').textContent='Loaded from this browser';}
  } catch(error){message('Saved workspace could not be loaded. Your saved copy has not been overwritten. '+error.message,true);}
  window.addEventListener('beforeunload',event=>{if(!saved&&(projects.some(x=>x.tasks.length||x.datasets.length||x.charts.length||x.scenarios.length||x.decisions.length||x.notes||x.workflows.length)||projects.length>1)){event.preventDefault();event.returnValue='';}});
  window.PercentageCalculator.mount($('view-calculators'));
  navigate('Overview');
})();
