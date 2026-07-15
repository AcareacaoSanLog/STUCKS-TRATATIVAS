(function(){
'use strict';

const SUPABASE_URL='https://xknmhvfueczezhdnqkgq.supabase.co';
const SUPABASE_KEY='sb_publishable_xBwEOwAWLcopYi7akl-fVA_pOf7yFbJ';
const SUPABASE_TABLE='stucks_tratativas';
const AUTH_SUPABASE_URL='https://ionlbxgwaqyracpztoiv.supabase.co';
const AUTH_SUPABASE_KEY='sb_publishable_5W-VMD2kk7OmRP1vpEYJ4g_TZCUB93g';
const DEFAULT_AUTH_EMAIL='torrede.controle_txf@sanlog.com';
const STORE='stucks_clean_dashboard_v1';
const STORE_CEP='stucks_clean_cep_v1';
const STORE_DAMAGES='stucks_clean_damages_v1';
const STORE_HISTORY='stucks_clean_history_v1';

const FIELD_ALIASES={
 shipment_id:['shipment_id','shipment id','br','tn','tracking','tracking id','tracking number','tracking_number','sls tracking number','rastreio','codigo rastreio','código rastreio','pacote','id pacote'],
 tracking_status:['tracking_status','tracking status','status','status tracking','last status','ultimo status','último status','status atual','status atualizado','status da br','status do pacote'],
 ageing_last_status:['ageing_last_status','aging_last_status','ageing last status','aging last status','ageing','aging','dias parados','diasparados','days','dias','dias parado','idade status','idade do status'],
 cogs:['cogs','cog','valor','valor r$','cost','custo','cogs r$','cod amount','amount','original asf'],
 buyer_city:['buyer_city','buyer city','cidade','cidade comprador','buyer cidade','city','cidade destino','destino'],
 driver_id:['driver_id','driver id','id driver','id motorista','motorista id','id entregador','id do entregador'],
 driver_name:['driver_name','driver name','nome driver','nome motorista','motorista','entregador','driver','nome entregador','responsavel','responsável'],
 tratativa:['tratativa','tratativas','palavra chave','palavrachave','palavra-chave','keyword','observacao','observação','obs','motivo','tratamento','comentario','comentário'],
 avaria:['avaria','damaged tag','damagedtag','damage','danificado','avariado'],
 cep:['cep','zipcode','zip code','zip','postalcode','postal code','cep destino','cep do pedido','cep pacote'],
 bairro:['bairro','neighborhood','district','localidade'],
 cidade_cep:['cidade cep','cidade_cep','cidade entrega','cidade do cep'],
 status_cep:['status cep','status_cep','tracking_status','status atualizado','status']
};
const REQUIRED=['shipment_id','tracking_status','ageing_last_status','cogs','buyer_city'];
let state={view:'dashboard',rows:[],filtered:[],treatments:new Map(),damages:new Set(),cepMap:new Map(),history:[],filters:{status:'all',statusGroup:'all',city:'all',driver:'all',ageing:'all',priority:'all',avaria:'all',cep:'all',search:''},monitor:{type:'received',city:'all',bairro:'all',days:'all',sort:'desc',search:''},currentFile:'',importedAt:null};
const el={};
let filterTimer=null, monitorTimer=null;
const authClient=window.supabase?.createClient?.(AUTH_SUPABASE_URL,AUTH_SUPABASE_KEY)||null;
const AUTH_TRUST_KEY='stucks_login_autorizado_v1';
let currentSession=null, appStarted=false, authEventsBound=false, manualAuthUnlock=false;

document.addEventListener('DOMContentLoaded',initAuth);

function boot(){
 if(appStarted)return;
 appStarted=true;
 try{
  cache(); bind(); loadLocalState(); render(); loadTreatmentsFromCloud(true);
  setStatus('Dashboard carregado. Importe a STUCKS do dia. Tratativas ficam na nuvem e são aplicadas pela BR.','warn');
 }catch(err){console.error(err); emergency('Erro crítico ao iniciar: '+(err.message||err));}
}
function cache(){['nav','title','content','status','fileInput','cepInput','importStucksBtn','importCepBtn','saveLocalBtn','loadLocalBtn','clearBtn','exportBtn','logoutBtn','rowCount','lastUpdate','baseBadge','damageBadge','treatmentBadge','historyBadge','modalRoot','loginScreen','loginForm','loginEmail','loginPassword','loginMessage'].forEach(id=>el[id]=document.getElementById(id));}
function bind(){
 document.addEventListener('click',onClick,true);
 el.fileInput.addEventListener('change',e=>handleFile(e,'stucks'));
 el.cepInput.addEventListener('change',e=>handleFile(e,'cep'));
}
function bindAuthEvents(){
 if(authEventsBound)return;
 authEventsBound=true;
 if(el.loginForm)el.loginForm.addEventListener('submit',handleAuthSubmit);
 if(el.logoutBtn)el.logoutBtn.addEventListener('click',handleLogout);
}
function setAuthMessage(message,type=''){
 if(!el.loginMessage)return;
 el.loginMessage.textContent=message;
 el.loginMessage.className='login-message'+(type?` ${type}`:'');
}
function setAuthUi(session){
 document.body.classList.toggle('auth-locked',!session);
 if(el.loginScreen)el.loginScreen.hidden=Boolean(session);
 if(el.loginEmail&&!el.loginEmail.value)el.loginEmail.value=DEFAULT_AUTH_EMAIL;
 if(el.loginPassword&&!session)el.loginPassword.value='';
}
async function verifyAllowedUser(session){
 const email=session?.user?.email?.toLowerCase();
 if(!email||!authClient)return false;
 const {data,error}=await authClient.from('dashboard_allowed_users').select('email').eq('email',email).maybeSingle();
 if(error){console.warn('verifyAllowedUser',error); return false;}
 return Boolean(data);
}
async function applySession(session){
 currentSession=session||null;
 if(!session){setAuthUi(null); return;}
 if(!manualAuthUnlock&&localStorage.getItem(AUTH_TRUST_KEY)!=='1'){
  currentSession=null;
  setAuthUi(null);
  return;
 }
 setAuthMessage('Validando acesso...');
 const allowed=await verifyAllowedUser(session);
 if(!allowed){
  await authClient.auth.signOut();
  currentSession=null;
  setAuthUi(null);
  setAuthMessage('Usuário sem permissão. Libere este e-mail no Supabase.');
  return;
 }
 setAuthUi(session);
 setAuthMessage('Acesso liberado.','ok');
 boot();
}
async function handleAuthSubmit(event){
 event.preventDefault();
 if(!authClient){setAuthMessage('Não foi possível carregar o login. Verifique a internet e recarregue.'); return;}
 const email=clean(el.loginEmail?.value).toLowerCase();
 const password=el.loginPassword?.value||'';
 if(!email||!password){setAuthMessage('Informe e-mail e senha.'); return;}
 setAuthMessage('Entrando...');
 const {data,error}=await authClient.auth.signInWithPassword({email,password});
 if(error){console.warn('handleAuthSubmit',error); setAuthMessage('Login inválido ou usuário sem acesso.'); return;}
 manualAuthUnlock=true;
 localStorage.setItem(AUTH_TRUST_KEY,'1');
 await applySession(data.session);
}
async function handleLogout(event){
 if(event)event.preventDefault();
 await authClient?.auth.signOut();
 currentSession=null;
 manualAuthUnlock=false;
 localStorage.removeItem(AUTH_TRUST_KEY);
 state.rows=[]; state.filtered=[]; state.currentFile=''; state.importedAt=null;
 if(el.content)el.content.innerHTML='';
 if(el.status)setStatus('Sessão encerrada. Entre novamente para visualizar o dashboard.','warn');
 setAuthUi(null);
 setAuthMessage('Sessão encerrada.');
}
async function initAuth(){
 cache();
 bindAuthEvents();
 setAuthUi(null);
 if(!authClient){setAuthMessage('Não foi possível carregar o login. Verifique a internet e recarregue.'); return;}
 authClient.auth.onAuthStateChange((_event,session)=>applySession(session));
 if(localStorage.getItem(AUTH_TRUST_KEY)==='1'){
  const {data,error}=await authClient.auth.getSession();
  if(error)console.warn('initAuth',error);
  await applySession(data?.session||null);
 } else {
  setAuthUi(null);
  setAuthMessage('');
 }
}
function onClick(e){
 const b=e.target.closest('button,[data-view],[data-action]'); if(!b)return;
 if(b.dataset.view){e.preventDefault(); setView(b.dataset.view); return;}
 if(b.id==='importStucksBtn'){e.preventDefault(); openFile(el.fileInput,'STUCKS'); return;}
 if(b.id==='importCepBtn'){e.preventDefault(); openFile(el.cepInput,'CEP'); return;}
 if(b.id==='saveLocalBtn'){e.preventDefault(); saveLocal(); return;}
 if(b.id==='loadLocalBtn'){e.preventDefault(); loadBaseLocal(); return;}
 if(b.id==='clearBtn'){e.preventDefault(); clearBase(); return;}
 if(b.id==='exportBtn'){e.preventDefault(); exportRows(currentRowsForExport(),'stucks_export.xlsx'); return;}
 const a=b.dataset.action; if(!a)return;
 e.preventDefault();
 if(a==='toggle-monitor') { const m=document.getElementById('monitorSubmenu'); if(m) m.classList.toggle('open'); return; }
 if(a==='open-group') return openGroup(b.dataset.key);
 if(a==='close-modal') return closeModal();
 if(a==='save-modal') return runAsync(saveModalTreatments);
 if(a==='sync-cloud') return runAsync(syncAllTreatments);
 if(a==='pull-cloud') return runAsync(()=>loadTreatmentsFromCloud(false));
 if(a==='save-one-treatment') return runAsync(saveOneTreatment);
 if(a==='remove-treatment') return runAsync(()=>removeTreatment(b.dataset.br));
 if(a==='add-damages') return addDamages();
 if(a==='clear-damages') return clearDamages();
 if(a==='copy-brs') return runAsync(copyOpenBRs);
 if(a==='export-modal') return exportRows(window.__modalRows||[],'detalhes_stucks.xlsx');
}
function runAsync(fn){Promise.resolve().then(fn).catch(err=>{console.error(err); setStatus('Erro: '+(err.message||err),'error');});}
function openFile(input,label){try{input.value='';input.click();setStatus('Selecione a planilha de '+label+'.','warn');}catch(err){setStatus('Navegador bloqueou a seleção de arquivo: '+(err.message||err),'error');}}
async function handleFile(e,type){const file=e.target.files&&e.target.files[0]; if(!file)return setStatus('Nenhum arquivo selecionado.','warn'); try{setStatus('Lendo '+file.name+'...','warn'); const raw=await parseFile(file); if(type==='stucks') await importStucks(raw,file.name); else importCep(raw,file.name); }catch(err){console.error(err); setStatus('Erro ao importar: '+(err.message||err),'error');} finally{e.target.value='';}}

async function parseFile(file){
 const name=file.name.toLowerCase(); if(!/\.(xlsx|xls|csv|tsv)$/.test(name)) throw new Error('Formato não aceito. Use XLSX, XLS, CSV ou TSV.');
 if(!file.size) throw new Error('Arquivo vazio.');
 if(/\.(csv|tsv)$/.test(name)) return parseCsv(await file.text(),name.endsWith('.tsv')?'\t':null);
 if(!window.XLSX) throw new Error('Biblioteca XLSX não carregou. Suba a pasta vendor no GitHub e use Ctrl+F5.');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false}); const sheet=wb.Sheets[wb.SheetNames[0]]; if(!sheet)throw new Error('Arquivo sem abas.');
 return XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
}
function parseCsv(text,forced){const clean=String(text||'').replace(/^\uFEFF/,''); const delim=forced||detectDelimiter(clean); return clean.split(/\r?\n/).filter(l=>l.trim()).map(l=>splitCsv(l,delim));}
function detectDelimiter(text){const line=(text.split(/\r?\n/).find(l=>l.trim())||''); return [';',',','\t'].sort((a,b)=>splitCsv(line,b).length-splitCsv(line,a).length)[0];}
function splitCsv(line,delim){let out=[],cur='',q=false; for(let i=0;i<line.length;i++){let c=line[i],n=line[i+1]; if(c==='"'&&q&&n==='"'){cur+='"';i++;} else if(c==='"')q=!q; else if(c===delim&&!q){out.push(cur);cur='';} else cur+=c;} out.push(cur); return out;}

async function importStucks(raw,fileName){
 if(!raw||raw.length<2) throw new Error('A planilha precisa ter cabeçalho e dados.');
 await loadTreatmentsFromCloud(true).catch(()=>{});
 const headerIndex=findHeader(raw,REQUIRED); if(headerIndex<0) throw new Error('Não encontrei os cabeçalhos obrigatórios: shipment_id/status/dias/cogs/cidade.');
 const headers=raw[headerIndex].map(clean); const map=buildMap(headers);
 const missing=REQUIRED.filter(f=>map[f]==null); if(missing.length) throw new Error('Colunas obrigatórias não encontradas: '+missing.join(', '));
 const rows=[];
 for(let i=headerIndex+1;i<raw.length;i++){
  const r=raw[i]||[]; const row={}; Object.keys(FIELD_ALIASES).forEach(f=>row[f]=map[f]!=null?clean(r[map[f]]):'');
  row.shipment_id=normalizeTrace(row.shipment_id); if(!row.shipment_id)continue;
  row.ageing_num=parseAgeing(row.ageing_last_status); row.cogs_num=parseMoney(row.cogs); row.avaria=normalizeYesNo(row.avaria)||'Não'; row.tratativa=clean(row.tratativa); row.cep=normalizeCep(row.cep); row.cidade_cep=clean(row.cidade_cep); row.bairro=clean(row.bairro); enrich(row); rows.push(row);
 }
 state.rows=dedupe(rows); state.currentFile=fileName; state.importedAt=new Date().toISOString(); applyCep(); applyDamages(); applyTreatments(); addHistory(fileName,state.rows.length); resetFilters(); saveLocal(true); render(); setStatus('Importação concluída: '+state.rows.length+' stucks carregados de '+fileName+'. Tratativas da nuvem reaplicadas pela BR.','ok');
}
function importCep(raw,fileName){
 if(!raw||raw.length<2) throw new Error('A planilha de CEP precisa ter cabeçalho e dados.');
 const headerIndex=findCepHeader(raw); if(headerIndex<0) throw new Error('Não encontrei CEP com BR, cidade ou bairro na planilha.');
 const headers=raw[headerIndex].map(clean); const map=buildMap(headers); let byBr=0, byCep=0;
 for(let i=headerIndex+1;i<raw.length;i++){
  const r=raw[i]||[];
  const br=normalizeTrace(map.shipment_id!=null?r[map.shipment_id]:'');
  const cep=normalizeCep(map.cep!=null?r[map.cep]:'');
  const item={cep,bairro:clean(map.bairro!=null?r[map.bairro]:''),cidade:cepCityValue(r,map),status:clean(map.tracking_status!=null?r[map.tracking_status]:(map.status_cep!=null?r[map.status_cep]:''))};
  if(br){state.cepMap.set(br,{...item,tipo:'BR'}); byBr++;}
  if(cep&&(item.bairro||item.cidade||item.status)){state.cepMap.set('CEP:'+cep,{...item,tipo:'CEP'}); byCep++;}
 }
 applyCep(); saveCep(); saveLocal(true); render(); setStatus('CEP importado: '+byBr+' BRs cruzadas e '+byCep+' CEPs/bairros mapeados. Cidades adjacentes atualizadas quando o CEP bater.','ok');
}
function findCepHeader(raw){for(let i=0;i<Math.min(raw.length,25);i++){const map=buildMap((raw[i]||[]).map(clean)); if(map.cep!=null&&(map.shipment_id!=null||map.bairro!=null||map.cidade_cep!=null||map.buyer_city!=null))return i;}return -1;}
function findHeader(raw,fields){for(let i=0;i<Math.min(raw.length,25);i++){const headers=(raw[i]||[]).map(h=>normHeader(h)); const ok=fields.every(f=>FIELD_ALIASES[f].some(a=>headers.includes(normHeader(a)))); if(ok)return i;}return -1;}
function buildMap(headers){const n=headers.map(normHeader), map={}; Object.keys(FIELD_ALIASES).forEach(f=>{for(const a of FIELD_ALIASES[f]){const idx=n.indexOf(normHeader(a)); if(idx>=0){map[f]=idx;break;}}}); return map;}
function cepCityValue(r,map){return clean(map.cidade_cep!=null?r[map.cidade_cep]:(map.buyer_city!=null?r[map.buyer_city]:''));}
function dedupe(rows){const m=new Map(); rows.forEach(r=>m.set(r.shipment_id,r)); return [...m.values()];}
function enrich(r){r.city=clean(r.cidade_cep)||clean(r.buyer_city)||'Sem cidade'; r.bairro=r.bairro||'Sem bairro'; r.driver=clean(r.driver_name)||clean(r.driver_id)||'Sem driver'; r.priority=priority(r); r.status_key=statusKey(r.tracking_status); r.tratativa_display=displayTreatment(r);}
function applyCep(){state.rows.forEach(r=>{const direct=state.cepMap.get(r.shipment_id); if(direct&&direct.cep)r.cep=direct.cep; const byCep=r.cep?state.cepMap.get('CEP:'+normalizeCep(r.cep)):null; const c={cep:direct?.cep||byCep?.cep||'',cidade:direct?.cidade||byCep?.cidade||'',bairro:direct?.bairro||byCep?.bairro||'',status:direct?.status||byCep?.status||''}; if(c.cep||c.cidade||c.bairro||c.status){if(c.cep)r.cep=c.cep; if(c.cidade)r.cidade_cep=c.cidade; if(c.bairro)r.bairro=c.bairro; if(c.status)r.tracking_status=c.status;} enrich(r);});}
function applyDamages(){state.rows.forEach(r=>{if(state.damages.has(r.shipment_id))r.avaria='Sim'; enrich(r);});}
function applyTreatments(){state.rows.forEach(r=>{const t=state.treatments.get(r.shipment_id); if(t)r.tratativa=t; enrich(r);});}
function displayTreatment(r){const t=clean(r.tratativa); if(t)return t; if(r.avaria==='Sim'||statusKey(r.tracking_status)==='avaria')return 'AVARIA'; return 'Sem tratativa';}
function treatmentInputDisplay(r){const t=clean(r&&r.tratativa); return t || 'Sem tratativa';}
function normalizeTreatmentSave(v){const t=clean(v); return normSearch(t)==='sem tratativa' ? '' : t;}

function setView(view){state.view=view; if(view.startsWith('monitor-')){const nextType=view.replace('monitor-',''); if(state.monitor.type!==nextType){state.monitor={type:nextType,city:'all',bairro:'all',days:'all',sort:'desc',search:''};} else state.monitor.type=nextType;} render();}
function render(){renderBadges(); renderNav(); const v=state.view; if(v==='dashboard')renderDashboard(); else if(v.startsWith('monitor-'))renderMonitor(); else if(v==='base')renderBase(); else if(v==='damages')renderDamages(); else if(v==='treatments')renderTreatments(); else if(v==='cities')renderRanking('city','Cidades com mais stucks'); else if(v==='drivers')renderRanking('driver','Drivers'); else if(v==='status')renderStatus(); else if(v==='ceps')renderCeps(); else if(v==='history')renderHistory();}
function renderNav(){
 document.querySelectorAll('#nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
 const monitorActive=String(state.view||'').startsWith('monitor-');
 const heading=document.querySelector('.nav-heading');
 if(heading) heading.classList.toggle('active', monitorActive);
 const submenu=document.getElementById('monitorSubmenu');
 if(submenu && monitorActive) submenu.classList.add('open');
 el.rowCount.textContent=state.rows.length;
 el.lastUpdate.textContent=state.importedAt?formatDate(state.importedAt):'Aguardando importação';
}
function renderBadges(){el.baseBadge.textContent=state.rows.length; el.damageBadge.textContent=state.damages.size; el.treatmentBadge.textContent=state.treatments.size; el.historyBadge.textContent=state.treatments.size;}
function renderDashboard(){
 el.title.textContent='🏠 Dashboard Stucks';
 const rows=filteredRows();
 const total=rows.length;
 const allTotal=state.rows.length;
 const critical=rows.filter(r=>r.ageing_num>=4).length;
 const noDriver=rows.filter(r=>r.driver==='Sem driver').length;
 const damaged=rows.filter(r=>r.avaria==='Sim').length;
 const withDriver=rows.filter(r=>r.driver!=='Sem driver').length;
 const withCep=rows.filter(r=>r.cep).length;
 const withBairro=rows.filter(r=>r.bairro&&r.bairro!=='Sem bairro').length;
 const topCity=groupCount(rows,'city')[0]||['Aguardando dados',0];

 const statusDefs=[
  ['total','📦 TOTAL DE STUCKS',total,'Dentro dos filtros atuais','all'],
  ['onhold','⏸️ ONHOLD',countStatus(rows,'onhold'),pct(countStatus(rows,'onhold'),total)+' do total filtrado','onhold'],
  ['received','📥 HUB_RECEIVED',countStatus(rows,'received'),pct(countStatus(rows,'received'),total)+' do total filtrado','received'],
  ['assigned','📌 HUB_ASSIGNED',countStatus(rows,'assigned'),pct(countStatus(rows,'assigned'),total)+' do total filtrado','assigned'],
  ['soclh','🚚 SOC_LHTRANSPORTED',countStatus(rows,'soclh'),pct(countStatus(rows,'soclh'),total)+' do total filtrado','soclh'],
  ['intercepting','⛔ INTERCEPTING',countStatus(rows,'intercepting'),pct(countStatus(rows,'intercepting'),total)+' do total filtrado','intercepting'],
  ['packed','📦 HUB_PACKED',countStatus(rows,'packed'),pct(countStatus(rows,'packed'),total)+' do total filtrado','packed'],
  ['returnsoc','↩️ RETURN_SOC_RECEIVED',countStatus(rows,'returnsoc'),pct(countStatus(rows,'returnsoc'),total)+' do total filtrado','returnsoc'],
  ['returnhub','🔁 RETURN_HUB_RECEIVED',countStatus(rows,'returnhub'),pct(countStatus(rows,'returnhub'),total)+' do total filtrado','returnhub'],
  ['avaria','⚠️ TOTAL DE AVARIAS',damaged,pct(damaged,total)+' com avaria','avaria']
 ];

 el.content.innerHTML=
  filtersHtml()+
  quickFiltersHtml()+
  `<div class="old-kpi-row">${statusDefs.map(k=>`<button type="button" class="old-kpi ${k[0]}" data-qf="${k[4]}"><h3>${k[1]}</h3><div class="old-kpi-number">${k[2]}</div><p>${k[3]}</p></button>`).join('')}</div>`+
  `<div class="old-main-grid">
    <section class="old-health-card">
      <div class="ring" style="--p:${total?pctNumber(critical,total):0}"><span>${pct(critical,total)}</span></div>
      <div>
        <h3>🚨 AGEING CRÍTICO</h3>
        <strong>${critical?critical+' BRs críticas':'Aguardando dados'}</strong>
        <p>Prioridade para tratar primeiro pela maior idade do último status.</p>
      </div>
      <button class="btn primary" data-view="base" data-quick="critical">Ver críticos</button>
    </section>
    <section class="old-health-card">
      <div class="ring" style="--p:${total?pctNumber(withDriver,total):0}"><span>${pct(withDriver,total)}</span></div>
      <div>
        <h3>🚚 ATRIBUIÇÃO</h3>
        <strong>${withDriver} com driver</strong>
        <p>${noDriver} BRs ainda sem driver informado.</p>
      </div>
      <button class="btn primary" data-view="base" data-quick="no-driver">Sem driver</button>
    </section>
    <section class="panel old-attention">
      <h3>🤖 Pontos de atenção</h3>
      ${attentionLine('Tratar ageing 4+ primeiro',critical+' BRs críticas na visão atual.',pct(critical,total))}
      ${attentionLine('Checar BRs sem driver',noDriver+' BRs sem responsável informado.',pct(noDriver,total))}
      ${attentionLine('Avarias na fila',damaged+' BRs marcadas como avaria.',pct(damaged,total))}
      ${attentionLine('Cruzamento de CEP',withCep+' BRs com CEP cruzado.',pct(withCep,total))}
      ${attentionLine('Cidade de maior volume',topCity[0]+' concentra mais stucks.',topCity[1])}
    </section>
    <section class="panel old-active">
      <h3>📌 Filtros ativos</h3>
      <div class="active-filter-box"><b>${activeFilterTitle()}</b><span>Mostrando ${total} linha(s) de ${allTotal} importada(s)</span></div>
    </section>
    <section class="panel">
      <div class="panel-title-row"><h3>🚨 Fila prioritária de stucks</h3><button class="mini" data-view="base">Abrir base</button></div>
      <div class="table-wrap">${table(rows.slice().sort((a,b)=>(b.ageing_num||0)-(a.ageing_num||0)).slice(0,8),['shipment_id','tracking_status','ageing_last_status','city','bairro','driver','tratativa_display'],{tracking_status:r=>statusPill(r.tracking_status),tratativa_display:r=>esc(r.tratativa_display)})}</div>
    </section>
    <section class="panel">
      <div class="panel-title-row"><h3>📍 Cidades com mais stucks</h3><button class="mini" data-view="cities">Ver cidades</button></div>
      <div class="table-wrap">${simpleTable(groupCount(rows,'city').slice(0,8),['Cidade','Qtd'])}</div>
    </section>
    <section class="panel">
      <div class="panel-title-row"><h3>📊 Stucks por status</h3><button class="mini" data-view="status">Ver status</button></div>
      <div class="table-wrap">${simpleTable(groupCount(rows,'tracking_status').slice(0,8),['Status','Qtd'])}</div>
    </section>
    <section class="panel">
      <div class="panel-title-row"><h3>🚚 Top drivers</h3><button class="mini" data-view="drivers">Ver drivers</button></div>
      <div class="table-wrap">${simpleTable(groupCount(rows,'driver').slice(0,8),['Driver','Qtd'])}</div>
    </section>
  </div>`;
 bindFilterInputs();
 bindDashboardQuickFilters();
} 

function quickFiltersHtml(){
 return `<div class="quick-row">
  <button class="mini" data-qf="all">Todos</button>
  <button class="mini" data-qf="critical">Críticos 4+</button>
  <button class="mini" data-qf="no-driver">Sem driver</button>
  <button class="mini" data-qf="avaria">Avaria</button>
  <button class="mini" data-qf="cep">Com CEP</button>
  <button class="mini" data-qf="bairro">Com bairro</button>
  <button class="mini" data-qf="sem-cep">Sem CEP</button>
  <button class="mini" data-qf="cogs">Maior COGS</button>
 </div>`;
}

function bindDashboardQuickFilters(){
 document.querySelectorAll('[data-qf]').forEach(btn=>btn.addEventListener('click',()=>{
  const q=btn.dataset.qf;
  if(q==='all') resetFilters();
  if(['onhold','received','assigned','soclh','intercepting','packed','returnsoc','returnhub'].includes(q)){state.filters.status='all'; state.filters.statusGroup=q;}
  if(q==='critical') state.filters.ageing='4+';
  if(q==='no-driver') state.filters.driver='Sem driver';
  if(q==='avaria') state.filters.avaria='Sim';
  if(q==='cep') state.filters.cep='with';
  if(q==='bairro') state.filters.cep='bairro';
  if(q==='sem-cep') state.filters.cep='without';
  if(q==='cogs') state.filters.search='';
  renderDashboard();
 }));
 document.querySelectorAll('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.dataset.quick==='critical') state.filters.ageing='4+';
  if(btn.dataset.quick==='no-driver') state.filters.driver='Sem driver';
  setView('base');
 }));
}

function countStatus(rows,key){return rows.filter(r=>statusKey(r.tracking_status)===key).length;}
function pctNumber(v,t){return t?Math.round(v/t*100):0;}
function attentionLine(title,desc,value){return `<div class="attention-line"><div><b>${esc(title)}</b><span>${esc(desc)}</span></div><strong>${esc(value)}</strong></div>`;}
function ageFilterValues(){const v=state.filters.ageing; return Array.isArray(v)?v:(v&&v!=='all'?[v]:[]);}
function ageFilterLabel(){const vals=ageFilterValues(); if(!vals.length)return 'Todos'; if(vals.length===1&&vals[0]==='4+')return 'Críticos 4+'; if(vals.length<=3)return vals.map(v=>v==='Sem dias'||v==='4+'?v:v+' dias').join(', '); return vals.length+' dias selecionados';}
function isAgeSelected(value){return ageFilterValues().includes(String(value));}
function matchesAgeFilter(row){const vals=ageFilterValues(); if(!vals.length)return true; return vals.some(v=>v==='4+'?row.ageing_num>=4:ageValue(row)===v);}
function activeFilterTitle(){
 const parts=[];
 if(state.filters.status!=='all')parts.push('Status: '+state.filters.status);
 if(state.filters.statusGroup&&state.filters.statusGroup!=='all')parts.push('Grupo: '+state.filters.statusGroup);
 if(state.filters.city!=='all')parts.push('Cidade: '+state.filters.city);
 if(state.filters.driver!=='all')parts.push('Driver: '+state.filters.driver);
 if(ageFilterValues().length)parts.push('Dias: '+ageFilterLabel());
 if(state.filters.avaria!=='all')parts.push('Avaria: '+state.filters.avaria);
 if(state.filters.cep!=='all')parts.push('CEP: '+state.filters.cep);
 if(state.filters.search)parts.push('Busca: '+state.filters.search);
 return parts.length?parts.join(' | '):'Sem filtros ativos';
}

function renderBase(){el.title.textContent='📦 Base Stucks'; const rows=filteredRows(); el.content.innerHTML=filtersHtml()+`<div class="table-wrap">${table(rows,['shipment_id','tracking_status','ageing_last_status','cogs','city','bairro','driver','avaria','tratativa_display'],{cogs:r=>formatMoney(r.cogs_num),avaria:r=>pill(r.avaria==='Sim'?'Sim':'Não'),tracking_status:r=>statusPill(r.tracking_status),tratativa_display:r=>esc(r.tratativa_display)})}</div>`; bindFilterInputs();}
function renderMonitor(){const def={received:'Received',assigned:'Assigned',soclh:'SOC LH',onhold:'OnHold'}[state.monitor.type]||'Monitoramento'; el.title.textContent='📥 '+def; const rows=state.rows.filter(r=>monitorMatch(r,state.monitor.type)); normalizeMonitorFilters(rows); const groups=monitorGroups(rows); window.__groups=groups; el.content.innerHTML=monitorFiltersHtml(rows)+`<div class="panel"><h3>BRs em ${def} por cidade/bairro</h3><p class="tabs-note">Clique em Abrir para preencher ou revisar tratativas.</p><div class="table-wrap"><table class="monitor-table"><thead><tr><th>Cidade</th><th>Bairro</th><th>Status</th><th>Tratativa</th><th>Dias parados</th><th>Qtd</th><th></th></tr></thead><tbody>${groups.length?groups.map((g,i)=>`<tr><td>${esc(g.city)}</td><td>${esc(g.bairro)}</td><td>${esc(g.status)}</td><td class="treatment">${esc(g.treatment)}</td><td><b>${g.daysText}</b></td><td><b>${g.rows.length}</b></td><td><button class="mini" data-action="open-group" data-key="${i}">Abrir</button></td></tr>`).join(''):'<tr><td colspan="7">Nenhuma BR encontrada neste status.</td></tr>'}</tbody></table></div></div>`; bindMonitorFilters();}
function monitorFiltersHtml(rows){const cities=unique(rows.map(r=>r.city)); const bairros=unique(rows.map(r=>r.bairro)); const days=unique(rows.map(r=>r.ageing_num==null?'Sem dias':String(r.ageing_num)),true); return `<div class="filters"><label>Cidade<select id="mCity"><option value="all">Todas</option>${opts(cities,state.monitor.city)}</select></label><label>Bairro<select id="mBairro"><option value="all">Todos</option>${opts(bairros,state.monitor.bairro)}</select></label><label>Dias parados<select id="mDays"><option value="all">Todos</option>${opts(days,state.monitor.days)}</select></label><label>Quantidade<select id="mSort"><option value="desc">Maior para menor</option><option value="asc" ${state.monitor.sort==='asc'?'selected':''}>Menor para maior</option></select></label><label>Buscar BR<input id="mSearch" value="${esc(state.monitor.search)}" placeholder="Digite BR ou tracking"></label></div>`;}
function bindMonitorFilters(){['mCity','mBairro','mDays','mSort','mSearch'].forEach(id=>{const x=document.getElementById(id); if(!x)return; x.addEventListener(id==='mSearch'?'input':'change',()=>{readMonitorFilters(); if(id==='mSearch') scheduleMonitorRender(); else renderMonitor();});});}
function readMonitorFilters(){state.monitor.city=document.getElementById('mCity')?.value||'all'; state.monitor.bairro=document.getElementById('mBairro')?.value||'all'; state.monitor.days=document.getElementById('mDays')?.value||'all'; state.monitor.sort=document.getElementById('mSort')?.value||'desc'; state.monitor.search=document.getElementById('mSearch')?.value||'';}
function scheduleMonitorRender(){const input=document.getElementById('mSearch'), pos=input&&typeof input.selectionStart==='number'?input.selectionStart:null; clearTimeout(monitorTimer); monitorTimer=setTimeout(()=>{renderMonitor(); restoreInputFocus('mSearch',pos);},180);}
function normalizeMonitorFilters(rows){if(state.monitor.city!=='all'&&!rows.some(r=>r.city===state.monitor.city))state.monitor.city='all'; const cityRows=rows.filter(r=>state.monitor.city==='all'||r.city===state.monitor.city); if(state.monitor.bairro!=='all'&&!cityRows.some(r=>r.bairro===state.monitor.bairro))state.monitor.bairro='all'; const bairroRows=cityRows.filter(r=>state.monitor.bairro==='all'||r.bairro===state.monitor.bairro); if(state.monitor.days!=='all'&&!bairroRows.some(r=>String(r.ageing_num)===state.monitor.days))state.monitor.days='all';}
function monitorGroups(rows){let r=rows.filter(x=>monitorMatch(x,state.monitor.type)&&(state.monitor.city==='all'||x.city===state.monitor.city)&&(state.monitor.bairro==='all'||x.bairro===state.monitor.bairro)&&(state.monitor.days==='all'||String(x.ageing_num)===state.monitor.days)&&(state.monitor.search===''||normSearch([x.shipment_id,x.tracking_status,x.city,x.bairro,x.tratativa].join(' ')).includes(normSearch(state.monitor.search)))); const m=new Map(); r.forEach(x=>{const key=[x.city,x.bairro,x.ageing_num,displayTreatment(x),x.tracking_status].join('|'); if(!m.has(key))m.set(key,{city:x.city,bairro:x.bairro,days:x.ageing_num,status:x.tracking_status,treatment:displayTreatment(x),rows:[]}); m.get(key).rows.push(x);}); let g=[...m.values()]; g.forEach(x=>x.daysText=x.days==null?'Sem dias':x.days+' dias'); g.sort((a,b)=>state.monitor.sort==='asc'?a.rows.length-b.rows.length:b.rows.length-a.rows.length); return g;}
function openGroup(key){const g=window.__groups&&window.__groups[key]; if(!g)return setStatus('Grupo não encontrado. Atualize a tela e tente novamente.','error'); window.__modalRows=g.rows.map(r=>({...r})); renderModal(g);}
function renderModal(g){el.modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><h3>${esc(g.city)} / ${esc(g.bairro)} - ${g.daysText}</h3><p class="muted">${g.rows.length} BR(s) abertas</p></div><div class="modal-actions"><button class="btn" data-action="copy-brs">Copiar BRs</button><button class="btn" data-action="export-modal">Exportar</button><button class="btn" data-action="close-modal">Fechar</button></div></div><div class="modal-body"><div class="table-wrap"><table class="modal-table"><thead><tr><th>BR</th><th>Status</th><th>Cidade</th><th>Bairro</th><th>Driver</th><th>Dias</th><th>COGS</th><th>Avaria</th><th>Tratativa</th></tr></thead><tbody>${window.__modalRows.map(r=>`<tr><td><b>${esc(r.shipment_id)}</b></td><td>${statusPill(r.tracking_status)}</td><td>${esc(r.city)}</td><td>${esc(r.bairro)}</td><td>${esc(r.driver)}</td><td>${r.ageing_num??'-'}</td><td>${formatMoney(r.cogs_num)}</td><td>${pill(r.avaria==='Sim'?'Sim':'Não')}</td><td><textarea class="textarea" data-br="${esc(r.shipment_id)}">${esc(treatmentInputDisplay(r))}</textarea></td></tr>`).join('')}</tbody></table></div><div class="modal-actions" style="margin-top:12px"><button class="btn primary" data-action="save-modal">Salvar tratativas preenchidas</button></div></div></div></div>`;}
async function saveModalTreatments(){const inputs=[...document.querySelectorAll('#modalRoot textarea[data-br]')]; const rec=[], del=[]; inputs.forEach(i=>{const br=normalizeTrace(i.dataset.br), t=normalizeTreatmentSave(i.value); const r=state.rows.find(x=>x.shipment_id===br); if(r){r.tratativa=t; enrich(r);} if(t){state.treatments.set(br,t); rec.push(buildTreatmentRecord(br,t));} else {state.treatments.delete(br); del.push(br);}}); saveLocal(true); render(); closeModal(); setStatus('Tratativas salvas localmente. Sincronizando com Supabase...','warn'); await upsertTreatments(rec); await Promise.all(del.map(deleteTreatmentFromCloud)); setStatus('Tratativas sincronizadas na nuvem: '+rec.length+' salva(s), '+del.length+' removida(s).','ok');}
function closeModal(){el.modalRoot.innerHTML='';}
async function copyOpenBRs(){const txt=(window.__modalRows||[]).map(r=>r.shipment_id).join('\n'); try{if(!navigator.clipboard)throw new Error('Clipboard indisponivel'); await navigator.clipboard.writeText(txt); setStatus('BRs copiadas.','ok');}catch(err){console.error(err); setStatus('Nao consegui copiar automaticamente. Selecione e copie manualmente.','warn');}}

function renderDamages(){el.title.textContent='⚠️ Avarias'; el.content.innerHTML=`<div class="panel"><h3>Adicionar avarias em massa</h3><p class="muted">Cole várias BRs, uma por linha. Elas serão marcadas como avaria no dashboard.</p><textarea id="damageInput" class="textarea" style="width:100%;height:140px" placeholder="BR123...\nBR456..."></textarea><div class="row-actions" style="margin-top:10px"><button class="btn primary" data-action="add-damages">Adicionar avarias</button><button class="btn" data-action="clear-damages">Limpar avarias</button></div></div><div class="panel" style="margin-top:12px"><h3>Avarias cadastradas</h3><div class="table-wrap">${simpleTable([...state.damages].sort().map(b=>[b, state.rows.some(r=>r.shipment_id===b)?'Sim':'Não']),['BR','Na base atual'])}</div></div>`;}
function addDamages(){const txt=document.getElementById('damageInput')?.value||''; txt.split(/\s+/).map(normalizeTrace).filter(Boolean).forEach(b=>state.damages.add(b)); applyDamages(); saveDamages(); render(); setStatus('Avarias adicionadas e aplicadas na base.','ok');}
function clearDamages(){if(!confirm('Limpar todas as avarias?'))return; state.damages.clear(); state.rows.forEach(r=>{r.avaria='Não';enrich(r);}); saveDamages(); render();}
function renderTreatments(){el.title.textContent='📝 Tratativas'; const rows=treatmentRows(); el.content.innerHTML=`<div class="panel"><h3>Tratativas na nuvem</h3><p class="muted">As tratativas ficam no Supabase. Em outro PC, clique em Importar tratativas da nuvem e depois importe a STUCKS do dia.</p><div class="row-actions"><button class="btn primary" data-action="pull-cloud">Importar tratativas da nuvem</button><button class="btn" data-action="sync-cloud">Sincronizar tratativas</button></div></div><div class="panel" style="margin-top:12px"><h3>Salvar tratativa manual</h3><div class="form-row"><input id="oneBr" placeholder="BR do pacote"><textarea id="oneTrat" placeholder="Digite a tratativa"></textarea><button class="btn primary" data-action="save-one-treatment">Salvar</button></div></div><div class="panel" style="margin-top:12px"><h3>Tratativas salvas (${rows.length})</h3><div class="table-wrap"><table class="treatments-table"><thead><tr><th>BR</th><th>Tratativa</th><th>Na base</th><th>Status</th><th>Cidade</th><th>Ação</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><b>${esc(r.shipment_id)}</b></td><td class="treatment">${esc(r.tratativa)}</td><td>${pill(r.found?'Sim':'Não')}</td><td>${esc(r.status||'-')}</td><td>${esc(r.city||'-')}</td><td><button class="mini" data-action="remove-treatment" data-br="${esc(r.shipment_id)}">Remover</button></td></tr>`).join(''):'<tr><td colspan="6">Nenhuma tratativa salva.</td></tr>'}</tbody></table></div></div>`;}
async function saveOneTreatment(){const br=normalizeTrace(document.getElementById('oneBr')?.value), t=clean(document.getElementById('oneTrat')?.value); if(!br||!t)return setStatus('Digite a BR e a tratativa.','warn'); state.treatments.set(br,t); const row=state.rows.find(r=>r.shipment_id===br); if(row){row.tratativa=t;enrich(row);} saveLocal(true); render(); await upsertTreatments([buildTreatmentRecord(br,t)]); setStatus('Tratativa salva na nuvem para '+br+'.','ok');}
async function removeTreatment(br){br=normalizeTrace(br); state.treatments.delete(br); const r=state.rows.find(x=>x.shipment_id===br); if(r){r.tratativa='';enrich(r);} saveLocal(true); render(); setStatus('Removendo tratativa da nuvem...','warn'); try{await deleteTreatmentFromCloud(br); setStatus('Tratativa removida localmente e na nuvem.','ok');}catch(err){console.error(err); setStatus('Tratativa removida localmente, mas falhou na nuvem: '+(err.message||err),'error');}}
function treatmentRows(){return [...state.treatments.entries()].map(([br,t])=>{const r=state.rows.find(x=>x.shipment_id===br); return {shipment_id:br,tratativa:t,found:!!r,status:r?.tracking_status,city:r?.city,bairro:r?.bairro,driver:r?.driver,ageing:r?.ageing_num,avaria:r?.avaria};}).sort((a,b)=>a.shipment_id.localeCompare(b.shipment_id));}
function renderStatus(){
 el.title.textContent='📊 Status';
 const grouped = new Map();

 state.rows.forEach(r => {
  const status = clean(r.tracking_status) || 'Sem status';
  if(!grouped.has(status)) grouped.set(status, { total:0, days:new Map() });
  const item = grouped.get(status);
  item.total++;
  const day = Number.isFinite(Number(r.ageing_num)) && r.ageing_num !== null ? Number(r.ageing_num) : null;
  const key = day === null ? 'Sem dias' : String(day);
  item.days.set(key, (item.days.get(key)||0)+1);
 });

 const rows = [...grouped.entries()].sort((a,b)=>b[1].total-a[1].total || String(a[0]).localeCompare(String(b[0]),'pt-BR'));

 const body = rows.length ? rows.map(([status,data]) => {
  const days = [...data.days.entries()].sort((a,b)=>{
   if(a[0]==='Sem dias') return 1;
   if(b[0]==='Sem dias') return -1;
   return Number(b[0])-Number(a[0]);
  }).map(([day,count]) => {
   const label = day === 'Sem dias' ? 'sem dias informado' : (Number(day) === 1 ? '1 dia' : day + ' dias');
   return `<span class="days-chip"><b>${count}</b> BR${count===1?'':'s'} com ${esc(label)}</span>`;
  }).join('');
  return `<tr>
   <td><strong>${esc(status)}</strong></td>
   <td><strong>${data.total}</strong></td>
   <td><div class="days-summary">${days || '<span class="days-chip">Sem dias informado</span>'}</div></td>
  </tr>`;
 }).join('') : '<tr><td colspan="3">Nenhum status encontrado.</td></tr>';

 el.content.innerHTML = `<div class="panel">
  <h3>📊 Status por dias parados</h3>
  <p class="tabs-note">Mostra a quantidade de BRs em cada status separada pelo dia parado exato.</p>
  <div class="table-wrap">
   <table class="status-days-table">
    <thead><tr><th>Status</th><th>Qtd total</th><th>Quantidade por dias parados</th></tr></thead>
    <tbody>${body}</tbody>
   </table>
  </div>
 </div>`;
}

function renderRanking(field,title){el.title.textContent=title; const rows=groupCount(state.rows,field); el.content.innerHTML=`<div class="panel"><h3>${esc(title)}</h3><div class="table-wrap">${simpleTable(rows,[title,'Qtd'])}</div></div>`;}
function renderCeps(){el.title.textContent='🗺️ CEPs'; const rows=[...state.cepMap.entries()].map(([key,c])=>[key.startsWith('CEP:')?'CEP':'BR',key.replace(/^CEP:/,''),c.cep||'-',c.cidade||'-',c.bairro||'-',c.status||'-']); el.content.innerHTML=`<div class="panel"><h3>CEPs importados</h3><p class="tabs-note">Aceita planilha por BR ou uma base de CEP com cidade e bairro para preencher cidades adjacentes.</p><div class="table-wrap">${simpleTable(rows,['Tipo','Chave','CEP','Cidade','Bairro','Status'])}</div></div>`;}
function renderHistory(){el.title.textContent='🕓 Histórico'; const rows=treatmentRows(); el.content.innerHTML=`<div class="panel"><h3>Histórico de tratativas preenchidas</h3><p class="tabs-note">Mostra as BRs que possuem tratativa salva localmente ou importada da nuvem.</p><div class="table-wrap">${simpleTable(rows.map(r=>[r.shipment_id,r.tratativa,r.status||'-',r.city||'-',r.bairro||'-',r.driver||'-',r.ageing==null?'-':r.ageing+' dias',r.avaria||'-',r.found?'Sim':'Não']),['BR','Tratativa','Status','Cidade','Bairro','Driver','Dias','Avaria','Na base'])}</div></div>`;}

function filtersHtml(){const rows=state.rows; const ageDays=unique(rows.map(ageValue),true); const ageChecks=ageDays.map(day=>`<label class="multi-option"><input type="checkbox" class="fAgeCheck" value="${esc(day)}" ${isAgeSelected(day)?'checked':''}><span>${esc(day==='Sem dias'?day:day+' dias')}</span></label>`).join(''); return `<div class="filters old-filters">
<label>Status<select id="fStatus"><option value="all">Todos</option>${opts(unique(rows.map(r=>r.tracking_status)),state.filters.status)}</select></label>
<label>Cidade<select id="fCity"><option value="all">Todas</option>${opts(unique(rows.map(r=>r.city)),state.filters.city)}</select></label>
<label>Driver<select id="fDriver"><option value="all">Todos</option>${opts(unique(rows.map(r=>r.driver)),state.filters.driver)}</select></label>
<div class="field multi-field"><span>Dias parados</span><div class="multi-select" id="fAgeMulti"><button class="multi-select-button" id="fAgeButton" type="button" aria-expanded="false">${esc(ageFilterLabel())}</button><div class="multi-select-menu" id="fAgeMenu"><label class="multi-option"><input type="checkbox" id="fAgeAll" value="all" ${ageFilterValues().length?'':'checked'}><span>Todos</span></label>${ageChecks}</div></div></div>
<label>Dias parados<select id="fAge"><option value="all">Todos</option><option value="4+" ${state.filters.ageing==='4+'?'selected':''}>Críticos 4+</option>${opts(unique(rows.map(ageValue),true),state.filters.ageing)}</select></label>
<label>Prioridade<select id="fPriority"><option value="all">Todas</option>${opts(unique(rows.map(r=>r.priority)),state.filters.priority)}</select></label>
<label>Avaria<select id="fAvaria"><option value="all">Todas</option><option value="Sim" ${state.filters.avaria==='Sim'?'selected':''}>Sim</option><option value="Não" ${state.filters.avaria==='Não'?'selected':''}>Não</option></select></label>
<label>CEP<select id="fCep"><option value="all">Todos</option><option value="with" ${state.filters.cep==='with'?'selected':''}>Com CEP</option><option value="bairro" ${state.filters.cep==='bairro'?'selected':''}>Com bairro</option><option value="without" ${state.filters.cep==='without'?'selected':''}>Sem CEP</option></select></label>
<label>Buscar<input id="fSearch" value="${esc(state.filters.search)}" placeholder="BR, cidade, status..."></label>
</div>`;}
function bindFilterInputs(){['fStatus','fCity','fDriver','fPriority','fAvaria','fCep','fSearch'].forEach(id=>{const x=document.getElementById(id); if(!x)return; x.addEventListener(id==='fSearch'?'input':'change',()=>{readFilters(); if(id==='fSearch') scheduleFilterRender(); else renderFilteredView();});}); bindAgeFilterInputs();}
function bindAgeFilterInputs(){const btn=document.getElementById('fAgeButton'), menu=document.getElementById('fAgeMenu'), all=document.getElementById('fAgeAll'); if(btn&&menu)btn.addEventListener('click',()=>{const open=!menu.classList.contains('open'); menu.classList.toggle('open',open); btn.setAttribute('aria-expanded',open?'true':'false');}); if(all)all.addEventListener('change',()=>{if(all.checked)document.querySelectorAll('.fAgeCheck').forEach(c=>c.checked=false); readFilters(); renderFilteredView();}); document.querySelectorAll('.fAgeCheck').forEach(c=>c.addEventListener('change',()=>{if(c.checked&&all)all.checked=false; const checked=[...document.querySelectorAll('.fAgeCheck:checked')]; if(!checked.length&&all)all.checked=true; readFilters(); renderFilteredView();}));}
function readFilters(){state.filters.status=document.getElementById('fStatus')?.value||'all'; state.filters.statusGroup='all'; state.filters.city=document.getElementById('fCity')?.value||'all'; state.filters.driver=document.getElementById('fDriver')?.value||'all'; const checked=[...document.querySelectorAll('.fAgeCheck:checked')].map(x=>x.value), allChecked=document.getElementById('fAgeAll')?.checked, legacyAge=document.getElementById('fAge')?.value||'all'; state.filters.ageing=allChecked?'all':(checked.length?checked:(legacyAge!=='all'?legacyAge:'all')); state.filters.priority=document.getElementById('fPriority')?.value||'all'; state.filters.avaria=document.getElementById('fAvaria')?.value||'all'; state.filters.cep=document.getElementById('fCep')?.value||'all'; state.filters.search=document.getElementById('fSearch')?.value||'';}
function renderFilteredView(){state.view==='dashboard'?renderDashboard():renderBase();}
function scheduleFilterRender(){const input=document.getElementById('fSearch'), pos=input&&typeof input.selectionStart==='number'?input.selectionStart:null; clearTimeout(filterTimer); filterTimer=setTimeout(()=>{renderFilteredView(); restoreInputFocus('fSearch',pos);},180);}
function restoreInputFocus(id,pos){const input=document.getElementById(id); if(!input)return; input.focus(); if(pos!=null&&input.setSelectionRange){const p=Math.min(pos,input.value.length); input.setSelectionRange(p,p);}}
function filteredRows(){return state.rows.filter(r=>
 (state.filters.status==='all'||r.tracking_status===state.filters.status)&&
 (!state.filters.statusGroup||state.filters.statusGroup==='all'||statusKey(r.tracking_status)===state.filters.statusGroup)&&
 (state.filters.city==='all'||r.city===state.filters.city)&&
 (state.filters.driver==='all'||r.driver===state.filters.driver)&&
 matchesAgeFilter(r)&&
 (state.filters.priority==='all'||r.priority===state.filters.priority)&&
 (state.filters.avaria==='all'||r.avaria===state.filters.avaria)&&
 (state.filters.cep==='all'||(state.filters.cep==='with'?!!r.cep:(state.filters.cep==='without'?!r.cep:(state.filters.cep==='bairro'&&r.bairro&&r.bairro!=='Sem bairro'))))&&
 (!state.filters.search||normSearch(Object.values(r).join(' ')).includes(normSearch(state.filters.search)))
);}
function resetFilters(){state.filters={status:'all',statusGroup:'all',city:'all',driver:'all',ageing:'all',priority:'all',avaria:'all',cep:'all',search:''};}
function currentRowsForExport(){if(state.view==='base')return filteredRows(); if(state.view.startsWith('monitor-'))return state.rows.filter(r=>monitorMatch(r,state.monitor.type)); return state.rows;}

async function loadTreatmentsFromCloud(silent){try{const rows=await supabase('stucks_tratativas?select=shipment_id,tratativa,tracking_status,cidade,bairro,driver,ageing_last_status,avaria,updated_at&order=updated_at.desc&limit=10000'); let count=0, cloud=new Map(); (rows||[]).forEach(r=>{const br=normalizeTrace(r.shipment_id),t=clean(r.tratativa); if(br&&t){cloud.set(br,t);count++;}}); state.treatments=cloud; state.rows.forEach(r=>{if(!cloud.has(r.shipment_id))r.tratativa='';}); applyTreatments(); saveLocal(true); renderBadges(); if(state.rows.length) render(); if(!silent)setStatus('Tratativas importadas da nuvem: '+count+' BR(s). Agora importe a STUCKS para cruzar pela BR.','ok'); return count;}catch(err){console.error(err); if(!silent)setStatus('Erro ao puxar Supabase: '+(err.message||err),'error'); return 0;}}
async function syncAllTreatments(){const rec=[...state.treatments.entries()].map(([br,t])=>buildTreatmentRecord(br,t)); await upsertTreatments(rec); setStatus('Sincronização concluída: '+rec.length+' tratativa(s).','ok');}
async function upsertTreatments(records){records=(records||[]).filter(r=>r.shipment_id&&r.tratativa); if(!records.length)return 0; await supabase('stucks_tratativas?on_conflict=shipment_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)}); return records.length;}
async function deleteTreatmentFromCloud(br){br=normalizeTrace(br); if(!br)return 0; await supabase('stucks_tratativas?shipment_id=eq.'+encodeURIComponent(br),{method:'DELETE',headers:{Prefer:'return=minimal'}}); return 1;}
function buildTreatmentRecord(br,t){const r=state.rows.find(x=>x.shipment_id===normalizeTrace(br)); return {shipment_id:normalizeTrace(br),tratativa:clean(t),tracking_status:r?.tracking_status||'',cidade:r?.city||'',bairro:r?.bairro||'',driver:r?.driver||'',ageing_last_status:r?.ageing_last_status||'',avaria:r?.avaria||'Não'};}
async function supabase(path,opt={}){const res=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',...(opt.headers||{})}}); const text=await res.text(); if(!res.ok)throw new Error(`Supabase ${res.status}: ${text||res.statusText}`); return text?JSON.parse(text):null;}

function saveLocal(silent){if(storageSet(STORE,JSON.stringify({rows:state.rows,currentFile:state.currentFile,importedAt:state.importedAt,treatments:[...state.treatments],history:state.history}))&&!silent)setStatus('Base salva neste navegador.','ok');}
function loadLocalState(){try{const s=JSON.parse(localStorage.getItem(STORE)||'{}'); state.rows=s.rows||[]; state.rows.forEach(enrich); state.treatments=new Map(s.treatments||[]); state.history=s.history||[]; state.currentFile=s.currentFile||''; state.importedAt=s.importedAt||null;}catch{} try{state.cepMap=new Map(JSON.parse(localStorage.getItem(STORE_CEP)||'[]'));}catch{} try{state.damages=new Set(JSON.parse(localStorage.getItem(STORE_DAMAGES)||'[]'));}catch{}}
function loadBaseLocal(){loadLocalState(); applyCep(); applyDamages(); applyTreatments(); render(); setStatus('Base local carregada.','ok');}
function saveCep(){storageSet(STORE_CEP,JSON.stringify([...state.cepMap]));}
function saveDamages(){storageSet(STORE_DAMAGES,JSON.stringify([...state.damages]));}
function clearBase(){if(!confirm('Limpar a base atual?'))return; state.rows=[]; state.filtered=[]; state.currentFile=''; state.importedAt=null; saveLocal(true); render(); setStatus('Base limpa. Tratativas na nuvem permanecem salvas.','warn');}
function addHistory(file,count){state.history.unshift({file,count,at:new Date().toISOString()}); state.history=state.history.slice(0,20); storageSet(STORE_HISTORY,JSON.stringify(state.history));}
function storageSet(key,value){try{localStorage.setItem(key,value); return true;}catch(err){console.error(err); setStatus('Nao foi possivel salvar no navegador. Exporte os dados e limpe o armazenamento local.','error'); return false;}}

function table(rows,fields,fmt={}){return `<table class="data-table"><thead><tr>${fields.map(f=>`<th>${label(f)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${fields.map(f=>`<td>${fmt[f]?fmt[f](r):esc(r[f]??'-')}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${fields.length}">Nenhum dado.</td></tr>`}</tbody></table>`;}
function simpleTable(rows,heads){return `<table class="simple-table"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${heads.length}">Nenhum dado.</td></tr>`}</tbody></table>`;}
function groupCount(rows,field){const m=new Map(); rows.forEach(r=>{const k=clean(r[field])||'Sem informação'; m.set(k,(m.get(k)||0)+1);}); return [...m.entries()].sort((a,b)=>b[1]-a[1]);}
function monitorMatch(r,t){const k=statusKey(r.tracking_status); return t==='received'?k==='received':t==='assigned'?k==='assigned':t==='soclh'?k==='soclh':t==='onhold'?k==='onhold':true;}
function statusKey(s){const n=normSearch(s); if(n.includes('avaria'))return 'avaria'; if(n.includes('onhold')||n.includes('on hold'))return 'onhold'; if(n.includes('return')&&n.includes('soc'))return 'returnsoc'; if(n.includes('return')&&n.includes('hub'))return 'returnhub'; if(n.includes('intercept'))return 'intercepting'; if(n.includes('packed'))return 'packed'; if(n.includes('assigned'))return 'assigned'; if(n.includes('soc')||n.includes('lhtransport'))return 'soclh'; if(n.includes('received')||n.includes('receveid'))return 'received'; return n||'outros';}
function priority(r){if(r.avaria==='Sim'||r.ageing_num>=10)return 'Crítica'; if(r.ageing_num>=7||r.driver==='Sem driver')return 'Alta'; if(r.ageing_num>=4)return 'Média'; return 'Baixa';}
function normalizeTrace(v){return clean(v).replace(/\s+/g,'').toUpperCase();} function normalizeCep(v){return clean(v).replace(/\D/g,'').slice(0,8);} function clean(v){const s=String(v??'').trim(); return /^(null|undefined|nan)$/i.test(s)?'':s;}
function normHeader(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function normSearch(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function parseAgeing(v){const m=clean(v).replace(',','.').match(/-?\d+(\.\d+)?/); return m?Math.round(Number(m[0])):null;}
function parseMoney(v){let t=clean(v).replace(/R\$/gi,'').replace(/\s/g,''); if(t.includes(',')&&t.includes('.'))t=t.replace(/\./g,'').replace(',','.'); else t=t.replace(',','.'); const n=Number(t.replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:0;}
function normalizeYesNo(v){const n=normSearch(v); if(['sim','s','yes','y','true','1','avaria','damaged'].includes(n))return 'Sim'; if(['nao','não','n','no','false','0'].includes(n))return 'Não'; return '';}
function formatMoney(n){return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});} function formatDate(iso){try{return new Date(iso).toLocaleString('pt-BR')}catch{return '-'}}
function pct(v,t){return t?Math.round(v/t*100)+'%':'0%';} function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));} function label(f){return ({shipment_id:'BR',tracking_status:'Status',ageing_last_status:'Dias parados',cogs:'COGS',city:'Cidade',bairro:'Bairro',driver:'Driver',avaria:'Avaria',tratativa_display:'Tratativa'}[f]||f);} function opts(vals,current){return vals.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');}
function ageValue(r){return r.ageing_num==null?'Sem dias':String(r.ageing_num);}
function unique(vals,num){let a=[...new Set(vals.filter(v=>v!==''&&v!=null))]; if(num)a.sort((x,y)=>x==='Sem dias'?1:y==='Sem dias'?-1:Number(x)-Number(y)); else a.sort((a,b)=>String(a).localeCompare(String(b),'pt-BR')); return a;}
function pill(v){return `<span class="pill ${v==='Sim'?'yes':'no'}">${esc(v)}</span>`;} function statusPill(s){return `<span class="pill statuspill">${esc(s||'-')}</span>`;} function setStatus(msg,type='warn'){el.status.textContent=msg; el.status.className='status '+type;} function emergency(msg){const s=document.getElementById('status'); if(s){s.textContent=msg;s.className='status error'}else alert(msg);} 
function exportRows(rows,name){if(!rows||!rows.length)return setStatus('Não há dados para exportar.','warn'); const out=rows.map(r=>({shipment_id:r.shipment_id,tracking_status:r.tracking_status,ageing_last_status:r.ageing_num??r.ageing_last_status,cogs:formatMoney(r.cogs_num),buyer_city:r.buyer_city,cidade:r.city,bairro:r.bairro,driver_id:r.driver_id,driver_name:r.driver_name,avaria:r.avaria,tratativa:r.tratativa||''})); if(window.XLSX){const ws=XLSX.utils.json_to_sheet(out); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'STUCKS'); XLSX.writeFile(wb,name);} else setStatus('Biblioteca XLSX não carregou para exportar.','error');}
window.STUCKS_CLEAN_APP={state,importStucks,importCep,render,setView};
})();
