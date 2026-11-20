/* POT CALI · Glosario ciudadano · módulo independiente */
(function(){
'use strict';
const DATA_URL='data/glosario_pot_integrado_v1.json';
let items=[],year='todos',group='todos',term='',active=null;
const $=s=>document.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const unaccent=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const yearLabel=x=>x.periodo===2014?'POT 2014 · norma de referencia':'Propuesta POT 2026 · no adoptada';
const searchable=x=>unaccent([x.concepto,x.codigo,x.grupo,x.explicacion_ciudadana,x.articulo].join(' '));
function cleanGroup(s){return String(s||'Otros');}
function relatedLayer(x){
 if(x.grupo==='Áreas de actividad')return x.periodo===2014?'areas_actividad2014':'areas_actividad';
 if(x.grupo==='Tratamientos urbanísticos'||x.grupo==='Categorías especiales sin tratamiento urbanístico')return x.periodo===2014?'tratamientos2014':'tratamientos';
 return null;
}
function mount(){
 const host=$('#glosario-content');
 if(!host)return;
 host.innerHTML='<div class="glosario-intro"><p>Definiciones diferenciadas entre el POT 2014 y la propuesta de 2026. Son explicaciones ciudadanas basadas en el articulado y su soporte técnico, no certificados urbanísticos.</p></div><div class="glosario-toolbar"><label>Buscar concepto o sigla<input id="glosario-buscar" type="search" placeholder="Ej. ND, consolidación, DL4, proximidad" autocomplete="off"></label><label>Instrumento<select id="glosario-periodo"><option value="todos">Ambos periodos</option><option value="2014">POT 2014</option><option value="2026">Propuesta 2026</option></select></label><label>Temática<select id="glosario-grupo"><option value="todos">Todas las temáticas</option></select></label></div><div class="glosario-cuenta" id="glosario-cuenta" aria-live="polite"></div><div class="glosario-grid" id="glosario-results"></div><p class="glosario-note">La referencia a la propuesta 2026 no significa que sus disposiciones estén adoptadas. Las definiciones literales y las correspondencias entre categorías requieren comprobación específica.</p>';
 $('#glosario-buscar').addEventListener('input',e=>{term=e.target.value;render()});
 $('#glosario-periodo').addEventListener('change',e=>{year=e.target.value;render()});
 $('#glosario-grupo').addEventListener('change',e=>{group=e.target.value;render()});
}
function groups(){
 const select=$('#glosario-grupo');if(!select)return;
 const ss=[...new Set(items.map(x=>cleanGroup(x.grupo)))].sort((a,b)=>a.localeCompare(b,'es'));
 select.innerHTML='<option value="todos">Todas las temáticas</option>'+ss.map(g=>'<option value="'+safe(g)+'">'+safe(g)+'</option>').join('');
}
function card(x){
 const status=x.estado_verificacion==='nombre_y_dominio_verificados_atributo_pendiente'?'Nombre verificado · atributo pendiente':String(x.estado_verificacion||'En revisión').replaceAll('_',' ');
 const layer=relatedLayer(x);
 const map=layer?'<button class="glosario-link" type="button" data-glos-map="'+safe(layer)+'" data-glos-id="'+safe(x.id)+'">Consultar capa cartográfica</button>':'';
 return '<article class="glosario-card"><div class="glosario-card-top"><span class="glosario-year">'+safe(yearLabel(x))+'</span><span class="glosario-status">'+safe(status)+'</span></div><h3>'+safe(x.concepto)+(x.codigo?' <small>('+safe(x.codigo)+')</small>':'')+'</h3><p>'+safe(x.explicacion_ciudadana||x.extracto_normativo)+'</p><div class="glosario-source"><b>Fuente:</b> '+safe(x.fuente)+' · '+safe(x.articulo||'Referencia por precisar')+'</div><div class="glosario-card-actions"><button class="glosario-link" type="button" data-glos-id="'+safe(x.id)+'">Leer ficha</button>'+map+'</div></article>';
}
function render(){
 const dest=$('#glosario-results');if(!dest)return;
 const q=unaccent(term.trim());
 const show=items.filter(x=>(year==='todos'||String(x.periodo)===year)&&(group==='todos'||cleanGroup(x.grupo)===group)&&(!q||searchable(x).includes(q)));
 $('#glosario-cuenta').textContent=show.length+' de '+items.length+' conceptos · '+(year==='todos'?'ambos instrumentos':year);
 dest.innerHTML=show.map(card).join('')||'<div class="glosario-empty">No se encontraron conceptos con estos filtros.</div>';
}
function ficha(id){
 const x=items.find(y=>y.id===id);if(!x)return;
 active=x;
 const dialog=$('#glosario-dialog');if(!dialog)return;
 const layer=relatedLayer(x);
 const map=layer?'<button class="glosario-link" type="button" data-glos-map="'+safe(layer)+'" data-glos-id="'+safe(x.id)+'">Consultar la capa correspondiente en el mapa</button>':'';
 dialog.querySelector('.glosario-dialog-body').innerHTML=
 '<div class="glosario-card-top"><span class="glosario-year">'+safe(yearLabel(x))+'</span><span class="glosario-status">'+safe(x.estado_verificacion).replaceAll('_',' ')+'</span></div>'+
 '<h2>'+safe(x.concepto)+(x.codigo?' ('+safe(x.codigo)+')':'')+'</h2>'+
 '<h3>¿Qué significa?</h3><p>'+safe(x.explicacion_ciudadana)+'</p>'+
 '<h3>Alcance descrito en la fuente</h3><p>'+safe(x.extracto_normativo)+'</p>'+
 '<p class="glosario-precaution">El texto anterior es una <b>síntesis pedagógica</b>, no transcripción literal de la norma.</p>'+
 '<div class="glosario-source"><b>Fuente:</b> '+safe(x.fuente)+'<br><b>Artículo / referencia:</b> '+safe(x.articulo||'Por precisar')+
 (x.cartografia?'<br><b>Referencia cartográfica:</b> '+safe(x.cartografia):'')+
 (x.fuente_complementaria?'<br><b>Soporte técnico:</b> '+safe(x.fuente_complementaria):'')+'</div>'+
 (x.observacion?'<p class="glosario-precaution"><b>Precaución:</b> '+safe(x.observacion)+'</p>':'')+
 '<div class="glosario-card-actions">'+map+'<button type="button" class="glosario-link" data-glos-compare="1">Ir a comparación normativa</button></div>';
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.hidden=false;
}
function openBy(text,y){
 const key=unaccent(text).replace(/\s*\([^)]*\)\s*$/,'').trim();
 const found=items.find(x=>(!y||x.periodo===y)&&(unaccent(x.concepto)===key||unaccent(x.codigo)===key))||
 items.find(x=>(!y||x.periodo===y)&&key.includes(unaccent(x.concepto)))||
 items.find(x=>(!y||x.periodo===y)&&unaccent(x.concepto).includes(key)&&key.length>=5);
 if(found)ficha(found.id);
 else{year=y?String(y):'todos';term=text;const f=$('#glosario-periodo');if(f)f.value=year;const b=$('#glosario-buscar');if(b)b.value=term;render();pageTo('glosario');}
}
function addContext(){
 const roots=document.querySelectorAll('.transition-home-row,.transition-row,.v7-transition');
 for(const el of roots){
  if(el.dataset.glossReady)return; // handled below with scoped guard
 }
}
function contextScan(){
 document.querySelectorAll('.transition-home-row,.transition-row').forEach(el=>{
  if(el.dataset.glossReady)return;
  const raw=el.textContent||'';
  if(!raw.includes('→'))return;
  el.dataset.glossReady='1';
  const btn=document.createElement('button');btn.type='button';btn.className='glosario-inline';btn.textContent='¿Qué significan estas categorías?';btn.title='Consultar definiciones del POT 2014 y de la propuesta 2026';
  btn.addEventListener('click',()=>{
   const terms=raw.split('→').map(s=>s.replace(/\d[\d.,]*\s*(ha|%)[\s\S]*/i,'').trim());
   const first=terms[0]; const second=terms[1]||'';
   if(first)openBy(first,2014);
   // La ficha incluye enlace a la comparación; evitar afirmar equivalencia automática.
  });
  el.appendChild(btn);
 });
}
function mapGo(layer){
 const dialog=$('#glosario-dialog');if(dialog?.open)dialog.close();
 pageTo('mapa');
 const cb=document.querySelector('#layers [data-layer="'+layer+'"]');
 if(cb&&!cb.checked){cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));}
 const label=layer.includes('2014')?'POT 2014':'Propuesta POT 2026';
 const status=$('#map-status');if(status)status.textContent='Capa de '+label+' solicitada. Selecciona el área o barrio para consultar sus atributos. La ficha no identifica un predio específico.';
}
function installHandlers(){
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-glos-id],[data-glos-map],[data-glos-compare]');
  if(!b)return;
  if(b.dataset.glosMap){mapGo(b.dataset.glosMap);return;}
  if(b.dataset.glosCompare){$('#glosario-dialog')?.close();pageTo('norma');return;}
  ficha(b.dataset.glosId);
 });
 $('#glosario-close')?.addEventListener('click',()=>$('#glosario-dialog')?.close());
 const observer=new MutationObserver(()=>{if(contextScanQueued)return;contextScanQueued=true;requestAnimationFrame(()=>{contextScanQueued=false;contextScan();});});
 let contextScanQueued=false;
 observer.observe($('#main'),{childList:true,subtree:true});
 contextScan();
}
document.addEventListener('DOMContentLoaded',async()=>{
 mount();
 installHandlers();
 try{
  const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw Error(String(r.status));
  const d=await r.json();items=d.conceptos||[];groups();render();
 }catch(e){const node=$('#glosario-results');if(node)node.innerHTML='<p>No se pudo cargar el catálogo. Consulta las fuentes y vuelve a intentarlo.</p>';console.error('Glosario POT',e);}
});
})();