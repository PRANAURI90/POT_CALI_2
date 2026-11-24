/* OBSERVATORIO POT CALI · v6 · aplicación estática · fuentes del proyecto */
'use strict';
const DOM=id=>document.getElementById(id);
const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,max=1)=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:max,minimumFractionDigits:0}).format(Number(v)||0);
const SRCS={gdb14:'https://drive.google.com/drive/folders/1SA5nS9Rf-7zp8-j0Vf7KuEQotfKeEqG4',gdb26:'https://drive.google.com/drive/folders/1Sydz1ahyHOcWgw5WrFsMjUJkDCQZ85Fr'};
const CODES26={tratamientos:{'1':'Conservación de sectores urbanos','2':'Conservación contextual','3':'Consolidación urbanística (C1)','4':'Consolidación básica (C2)','5':'Consolidación moderada (C3)','6':'Consolidación cambio de patrón (C4)','7':'Desarrollo en expansión (D1)','8':'Desarrollo urbano (D2)','9':'Mejoramiento integral','10':'Renovación – Redensificación alta (R1)','11':'Renovación – Redensificación media (R2)','12':'No aplica'},actividad:{'1':'Área de Proximidad','2':'Área de Integración','3':'Área Multifuncional','4':'Área de Dinamización Económica','5':'Área de Manejo Especial','6':'PEMP Centro Histórico','7':'PEMP Plaza de Toros','8':'PEMP Cañas Gordas','9':'PEMP Piedragrande'}};
const GROUPS=[
 {title:'POT 2014 · vigente',keys:['clasificacion2014','tratamientos2014','planes2014','areas_actividad2014','edificabilidad_zonas2014','microzonas_aproximadas'],open:true},
 {title:'Propuesta POT 2026 · suelo y norma',keys:['clasificacion','cambio_perimetro2026','tratamientos','areas_actividad','planes_parciales','planes_previos','instrumentos','redensificacion'],open:true},
 {title:'Propuesta POT 2026 · amenaza y riesgo',keys:['amenaza','condicion_riesgo','condicion_amenaza','asentamientos'],open:false},
 {title:'Propuesta POT 2026 · rural',keys:['centros_poblados','norma_rural'],open:false}
];
const CONFIG={
 clasificacion2014:{label:'Clasificación del suelo',year:2014,base:'#6b9f85'},
 tratamientos2014:{label:'Tratamientos urbanísticos',year:2014,base:'#356d89',default:false},
 planes2014:{label:'Planes parciales',year:2014,base:'#6452a2'},
 edificabilidad_zonas2014:{label:'Edificabilidad (zonas)',year:2014,base:'#518872'},
 efectos_sismicos2014:{label:'Efectos sísmicos cartografiados',year:2014,base:'#bb6f79'},
 inundacion_fluvial2014:{label:'Inundación fluvial',year:2014,base:'#398fba'},
 clasificacion:{label:'Clasificación del suelo',year:2026,base:'#699f7a'},
 cambio_perimetro2026:{label:'Cambios del perímetro urbano',year:2026,base:'#65856f'},
 tratamientos:{label:'Tratamientos urbanísticos',year:2026,base:'#9e7c5d',default:true},
 areas_actividad:{label:'Áreas de actividad',year:2026,base:'#608db7'},
 areas_actividad2014:{label:'Áreas de actividad 2014',year:2014,base:'#6f99a0'},
 microzonas_aproximadas:{label:'Microzonas sísmicas (aproximadas)',year:2014,base:'#a77daa'},
 planes_parciales:{label:'Planes parciales propuestos',year:2026,base:'#9156a7'},
 planes_previos:{label:'Planes parciales preexistentes',year:2026,base:'#a089bb'},
 instrumentos:{label:'Instrumentos de planificación',year:2026,base:'#cc9e47'},
 redensificacion:{label:'Áreas de redensificación',year:2026,base:'#d38771'},
 amenaza:{label:'Zonificación de amenazas',year:2026,base:'#bf7e5f'},
 condicion_riesgo:{label:'Condición de riesgo',year:2026,base:'#b75f61'},
 condicion_amenaza:{label:'Condición de amenaza',year:2026,base:'#d6ab68'},
 asentamientos:{label:'Asentamientos identificados',year:2026,base:'#689b91'},
 centros_poblados:{label:'Centros poblados rurales',year:2026,base:'#508f7a'},
 norma_rural:{label:'Categorías normativas rurales',year:2026,base:'#89a36e'}
};
const PALETTE=['#6e9ec6','#e2a267','#82a78a','#b17caf','#ca6777','#8f97cf','#e0c16c','#6caba5','#b9a385','#8292a0','#a2c280','#ca8ea9','#a9a8ce'];
const TREAT_COLORS={C1:'#87b1d7',C2:'#4e91bd',C3:'#366a96',C4:'#254e75',R1:'#d36b75',R2:'#e7a17a',R3:'#c38aaf',D1:'#9888d0',D2:'#8372ba',DE:'#9888d0',CO:'#68a889',CON:'#68a889',MI:'#e2bb65',ND:'#9da4a4',INS:'#a0a6b0',PE:'#88b18d'};
const state={page:'inicio',topic:'tratamientos',barrios:[],byCode:new Map(),barriosGeo:null,resumen:null,normas:null,indicadores:null,transformacion:null,sueloComparacion:null,selected:null,selectedLayer:null,map:null,mapRight:null,base:null,baseRight:null,barrioLayer:null,barrioRight:null,highlight:null,highlightRight:null,geo:{},layers:{},active:new Set(['tratamientos']),catAllowed:{},catEntries:{},mapMode:'explore',compareTheme:'tratamientos',compareLayers:{left:null,right:null},syncGuard:false,leafReady:false,barriosVisible:true};
const asCode=(r,year)=>{
 const orig=String(r?.codigo_original??r?.atributos?.CODIGO??'').trim();
 if(year===2026)return ({'1':'CO','2':'CO','3':'C1','4':'C2','5':'C3','6':'C4','7':'D1','8':'D2','9':'MI','10':'R1','11':'R2','12':'NA'})[orig]||'';
 if(orig)return orig;
 const nm=String(r?.nombre??'').toUpperCase();if(nm.includes('CONSERVACION'))return 'CO';if(nm.includes('DESARROLLO'))return 'DE';return '';
};
// Etiquetas completas para transiciones cartográficas; conservan el código fuente y el año.
function etiquetaTransicionTratamiento(valor,anio){
 const codigo=String(valor??'').trim();
 const base2014={'ND':'Nodo de equipamientos','INS':'Equipamiento de gran escala','INS - SS':'Infraestructura de servicios públicos','CO':'Conservación','DE':'Desarrollo','C1':'Consolidación urbanística','C2':'Consolidación básica','C3':'Consolidación moderada','R1':'Renovación por redesarrollo','R2':'Renovación por reactivación','R3':'Renovación','MI':'Mejoramiento integral','PE':'Plan especial de manejo y protección'};
 const comun={'Consolidación':'Consolidación','Conservación':'Conservación','Desarrollo':'Desarrollo','Renovación':'Renovación','Mejoramiento integral':'Mejoramiento integral'};
 const nombre=(anio===2014?base2014[codigo]:null)||comun[codigo]||codigo;
 return nombre===codigo?codigo:(Object.prototype.hasOwnProperty.call(base2014,codigo)&&anio===2014?`${nombre} (${codigo})`:nombre);
}
function normFamily(code){if(!code)return null;if(code.startsWith('C')&&code!=='CO'&&code!=='CON')return 'Consolidación';if(code.startsWith('R'))return 'Renovación';if(code==='DE'||code.startsWith('D'))return 'Desarrollo';if(code==='MI')return 'Mejoramiento integral';if(code==='CO'||code==='CON')return 'Conservación';return null}
function barrioInfo(){if(!state.selected||!state.resumen)return null;return state.resumen.barrios[String(state.selected.properties?.codigo||'')]||null}
function entries(info,key){return info?.capas?.[key]?.categorias||[]}
function fmtArea(v){return fmt(v)+' ha'}
function districtLink(year){return `<a class="source-link" target="_blank" rel="noopener" href="${year===2014?SRCS.gdb14:SRCS.gdb26}">GDB POT ${year} ↗</a>`}
function selectedBadge(){if(!state.selected)return `<div class="info-empty"><h3>Primero, elige tu barrio</h3><p>Busca un barrio en la barra superior o selecciónalo en el mapa. Se conservará mientras navegas por la comparación, gestión e incentivos y amenaza y riesgo.</p><button class="btn btn-dark" data-go="mapa">Ir al mapa →</button></div>`;const p=state.selected.properties;return `<div class="selected-summary"><div><span class="eyebrow">TERRITORIO EN CONSULTA</span><h3>${htmlEscape(p.barrio)}</h3><small>Comuna ${htmlEscape(p.comuna)} · código ${htmlEscape(p.codigo)} · cartografía barrios y sectores 2026</small></div><button class="ghost-btn" data-go="mapa">Ver en el mapa →</button></div>`}
function pageTo(p,scroll=true){if(!DOM('page-'+p))return;state.page=p;document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));document.querySelectorAll('.nav-btn').forEach(x=>{const on=x.dataset.page===p;x.classList.toggle('active',on);if(on)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});if(p==='mapa'){initMap();setTimeout(()=>{state.map?.invalidateSize({pan:false});state.mapRight?.invalidateSize({pan:false});if(state.selected)focusSelected();},50)}else if(p==='norma'){renderNorma();renderNormaTopicExtras();}else if(p==='gestion'){renderGestion();renderExtrasGestionV7();}else if(p==='riesgo'){renderRiesgo();renderExtrasRiesgoV7();}else if(p==='glosario'){/* panel gestionado por glosario.js */}else {renderInicio();renderExtrasPortadaV7();}if(scroll)window.scrollTo({top:0,behavior:'instant'});}
function updateHeader(){const p=state.selected?.properties;DOM('current-territory').textContent=p?`${p.barrio} · Comuna ${p.comuna}`:'Cali · vista distrital';DOM('clear-territory').hidden=!p;DOM('inspector-title').textContent=p?p.barrio:'Selecciona un barrio';DOM('inspector-meta').textContent=p?`Comuna ${p.comuna} · código ${p.codigo}`:'Haz clic en el mapa o busca un barrio en la barra superior.';DOM('open-normative').disabled=!p;DOM('selected-pill').hidden=!p;DOM('selected-pill-name').textContent=p?.barrio||'';renderInspector();}
function setSelected(feature,layer,goMap=false){if(!feature)return;state.selected=feature;state.selectedLayer=layer||state.byCode.get(String(feature.properties.codigo))?.layer||null;updateHeader();drawHighlights();if(goMap)pageTo('mapa');if(state.page==='mapa')focusSelected();if(state.page==='norma'){renderNorma();renderNormaTopicExtras();}if(state.page==='gestion'){renderGestion();renderExtrasGestionV7();}if(state.page==='riesgo'){renderRiesgo();renderExtrasRiesgoV7();}DOM('search-results').replaceChildren();}
function clearSelected(){state.selected=null;state.selectedLayer=null;DOM('search').value='';removeHighlights();updateHeader();renderNorma();renderGestion();renderRiesgo();renderNormaTopicExtras();renderExtrasGestionV7();renderExtrasRiesgoV7();}
function normMatches(q){return q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim()}
function searchMatches(q){const v=normMatches(q);return v.length<2?[]:state.barrios.filter(x=>normMatches(`${x.properties.barrio} ${x.properties.comuna} ${x.properties.codigo}`).includes(v)).slice(0,12)}
function searchChange(){const q=DOM('search').value,dd=DOM('search-results');dd.replaceChildren();const items=searchMatches(q);if(normMatches(q).length<2)return;if(!items.length){const div=document.createElement('div');div.style.padding='10px';div.textContent='No se encontraron barrios con ese nombre.';dd.append(div);return;}for(const f of items){const btn=document.createElement('button');btn.type='button';btn.innerHTML=`<strong>${htmlEscape(f.properties.barrio)}</strong><small>Comuna ${htmlEscape(f.properties.comuna)} · ${htmlEscape(f.properties.tipo||'Barrio')}</small>`;btn.addEventListener('click',()=>{DOM('search').value=f.properties.barrio;setSelected(f,null,state.page==='inicio')});dd.append(btn)}}
function calcColor(key,cat,index){
 if(key==='tratamientos'){const canonical={'1':'CO','2':'CO','3':'C1','4':'C2','5':'C3','6':'C4','7':'D1','8':'D2','9':'MI','10':'R1','11':'R2','12':'NA'}[String(cat)];return TREAT_COLORS[canonical]||PALETTE[index%PALETTE.length]}
 if(key==='microzonas_aproximadas')return {'1':'#528661','2':'#8f9d41','3':'#d3b45a','4A':'#b18b48','4B':'#d18d54','4C':'#e4b266','4D':'#ba98aa','4E':'#ab8bcc','5':'#c47a87','6':'#6299b4'}[cat]||'#a0a0a0';
 if(key==='areas_actividad2014')return {'Residencial neta':'#82bfa9','Residencial predominante':'#7fa8c5','Mixta':'#c5a0a8','Industrial':'#b88693','No aplica':'#b7b7ae'}[cat]||'#91a4a2';
 if(key==='tratamientos2014')return TREAT_COLORS[cat]||TREAT_COLORS[String(cat).split(' - ')[0]]||PALETTE[index%PALETTE.length];
 if(key==='clasificacion'||key==='clasificacion2014')return {'Perímetro urbano':'#6ca7bb','Suelo rural':'#7dad83','Suelo de expansión':'#d7b46f'}[cat]||PALETTE[index%PALETTE.length];
 if(key==='cambio_perimetro2026')return cat.includes('adiciona')?'#4f9f7f':cat.includes('excluye')?'#d67c65':'#aec8ad';
 if(key==='planes2014'||key==='planes_parciales'){const s=String(cat).toLowerCase();if(s==='adoptado')return '#6aa388';if(s.includes('predelim'))return '#c89a5b';if(s.includes('formul')||s.includes('en_form'))return '#5d93bb';if(s.includes('ambient'))return '#8d79b9';}
 if(key==='condicion_riesgo'||key==='condicion_amenaza')return {'1':'#bc8660','2':'#bd6779','3':'#6e96bb'}[cat]||PALETTE[index%PALETTE.length];
 if(key==='amenaza'){const c=String(cat).split('|')[1];return {'1':'#CF4446','2':'#E8BC39','3':'#39976A','0':'#8D97A1'}[c]||'#8D97A1'}
 if(key==='inundacion_fluvial2014'){const t=String(cat).toLowerCase();return t.includes('amenaza alta')?'#CF4446':t.includes('amenaza media')?'#E8BC39':t.includes('amenaza baja')?'#39976A':t.includes('no mitigable')?'#9D3348':'#8D97A1'}
 return PALETTE[index%PALETTE.length];
}
function groupCat(key,p){
 const val=(n,def='Sin dato')=>p[n]===null||p[n]===undefined||p[n]===''?def:String(p[n]).trim();
 if(key==='tratamientos')return val('tutipo');if(key==='tratamientos2014')return val('CODIGO');
 if(key==='clasificacion')return ({'1':'Perímetro urbano','2':'Suelo rural','3':'Suelo de expansión'})[val('cstipo')]||val('csnombre');
 if(key==='clasificacion2014')return ({'U':'Perímetro urbano','E':'Suelo de expansión','R':'Suelo rural'})[val('codigo')]||val('csnombre');
 if(key==='cambio_perimetro2026')return val('condicion');
 if(key==='areas_actividad2014')return val('etiqueta');if(key==='microzonas_aproximadas')return val('zona');
 if(key==='areas_actividad')return val('aatipo');if(key==='planes2014')return val('DppEstado');if(key==='planes_parciales')return val('Estado');
 if(key==='planes_previos')return 'Plan parcial previo Nº '+val('pplanpid');
 if(key==='efectos_sismicos2014')return val('Tipo');if(key==='inundacion_fluvial2014')return val('tipo_amena');
 if(key==='edificabilidad_zonas2014')return val(state.edificabilidadIndice||'ICB');
 if(key==='amenaza')return val('zafenome')+'|'+val('zacateg');
 if(key==='condicion_riesgo')return val('acrfenome');if(key==='condicion_amenaza')return val('acafenome');
 if(key==='asentamientos')return val('ahdiobs');if(key==='instrumentos')return val('ipobserv');
 if(key==='centros_poblados')return val('cpobs');if(key==='norma_rural')return val('cnrtiposub');
 if(key==='redensificacion')return val('me3Nmb');return 'General';
}
function catLabel(key,cat){
 if(key==='tratamientos')return CODES26.tratamientos[cat]||`Código ${cat}`;
 if(key==='tratamientos2014'){const a={'C1':'Consolidación urbanística (C1)','C2':'Consolidación básica (C2)','C3':'Consolidación moderada (C3)','R1':'Renovación redesarrollo (R1)','R2':'Renovación reactivación (R2)','R3':'Renovación (R3)','DE':'Desarrollo','CO':'Conservación','ND':'Nodo equipamientos','INS':'Equipamiento de gran escala','INS - SS':'Infraestructura de servicios públicos','PE':'PEMP'};return a[cat]||cat}
 if(key==='areas_actividad2014')return cat;
 if(key==='microzonas_aproximadas')return 'Zona sísmica '+cat+' · digitalización aproximada';
 if(key==='areas_actividad')return CODES26.actividad[cat]||'Código '+cat;
 if(key==='planes2014')return {'adoptado':'Adoptado','determ':'En determinantes','en_form':'En formulación','predelim':'Predelimitado','conc_amb':'Concertación ambiental','vigen_ven':'Vigencia vencida (código GDB)'}[cat]||cat;
 if(key==='amenaza'){const [f,c]=String(cat).split('|');return (({'1':'Movimientos en masa','2':'Avenidas torrenciales','3':'Inundación'})[f]||'Fenómeno '+f)+' · '+({'1':'Alta','2':'Media','3':'Baja','0':'Otra condición (código 0)'}[c]||'Código '+c)+(c==='0'?'':' (código '+c+')')}
 if(key==='condicion_riesgo'||key==='condicion_amenaza')return {'1':'Movimientos en masa','2':'Avenidas torrenciales','3':'Inundación'}[cat]||'Fenómeno código '+cat;
 if(key==='edificabilidad_zonas2014')return (state.edificabilidadIndice||'ICB')+' '+cat;
 if(key==='norma_rural')return 'Tipo de subdivisión rural '+cat+' (código de la GDB)';
 if(key==='inundacion_fluvial2014')return String(cat).replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
 return cat;
}
function getLabelForFeature(key,p){if(key==='tratamientos'||key==='tratamientos2014'||key==='clasificacion'||key==='clasificacion2014'||key==='cambio_perimetro2026'||key==='areas_actividad'||key==='planes2014'||key==='planes_parciales'||key==='amenaza'||key==='efectos_sismicos2014')return catLabel(key,groupCat(key,p));if(key==='instrumentos')return p.ipobserv||'Instrumento de planificación';if(key==='norma_rural')return p.cnrnombre||'Norma rural';return CONFIG[key]?.label||key}
function buildLegend(key,geo){
 const cats=new Map();for(const f of geo.features){const c=groupCat(key,f.properties||{});cats.set(c,(cats.get(c)||0)+1)}
 state.catEntries[key]=[...cats].sort((a,b)=>b[1]-a[1]).map(([cat,n],i)=>({cat,n,label:catLabel(key,cat),color:calcColor(key,cat,i)}));
 if(!state.catAllowed[key])state.catAllowed[key]=new Set(cats.keys());updateLayerLegend(key);
}
function renderLayerCategoryRows(key,cats,selected,filterEnabled){
 const item=x=>`<div class="layer-filter-row"><label class="layer-filter"><input type="checkbox" data-filter-layer="${key}" data-filter-cat="${htmlEscape(x.cat)}" ${filterEnabled&&selected.has(x.cat)?'checked':''} ${filterEnabled?'':'disabled'}><i class="swatch" style="background:${x.color}"></i><span title="${htmlEscape(x.label||catLabel(key,x.cat))}">${key==='amenaza'?htmlEscape(({'1':'Alta','2':'Media','3':'Baja','0':'Otra condición (código 0)'})[String(x.cat).split('|')[1]]||x.label):htmlEscape(x.label||catLabel(key,x.cat))}</span><small class="category-count">${x.n}</small></label></div>`;
 if(key!=='amenaza')return cats.map(item).join('');
 const groups=[['1','Movimientos en masa'],['3','Inundación'],['2','Avenidas torrenciales']];
 return groups.map(([f,name])=>{
  const rows=cats.filter(x=>String(x.cat).split('|')[0]===f).sort((a,b)=>({'1':0,'2':1,'3':2,'0':3}[String(a.cat).split('|')[1]]??4)-({'1':0,'2':1,'3':2,'0':3}[String(b.cat).split('|')[1]]??4));
  if(!rows.length)return '';
  return '<div class="hazard-legend-group"><div class="hazard-legend-heading">'+htmlEscape(name)+' <small>'+rows.reduce((n,x)=>n+x.n,0)+' polígonos</small></div>'+rows.map(item).join('')+'</div>';
 }).join('')+'<p class="hazard-legend-note">Códigos 1, 2 y 3 representados como alta, media y baja. El código 0 se conserva como otra condición, sin asignarle nivel.</p>';
}
function updateLayerLegend(key){
 const holder=document.querySelector(`[data-legend="${key}"]`);if(!holder)return;
 const cats=state.catEntries[key]||[];if(!cats.length){holder.innerHTML='<p class="layer-hint">Cargando categorías cartográficas…</p>';return}
 const selected=state.catAllowed[key]||new Set(cats.map(x=>x.cat));
 const filterEnabled=state.mapMode==='compare'?Boolean(SWIPE_THEMES[state.compareTheme]?.includes(key)):state.active.has(key);
 const idxControl=key==='edificabilidad_zonas2014'?`<label class="index-switch">Mostrar índice <select data-indice-capa="${key}"><option value="ICB" ${(state.edificabilidadIndice||'ICB')==='ICB'?'selected':''}>Básico (ICB)</option><option value="ICA" ${state.edificabilidadIndice==='ICA'?'selected':''}>Adicional (ICA)</option></select></label>`:'';
 const wasOpen=holder.querySelector('details.layer-categories')?.open??false;
 holder.innerHTML=`<details class="layer-categories" ${wasOpen?'open':''}><summary>${cats.length} categorías disponibles</summary>${idxControl}<div class="layer-filter-tools"><button type="button" data-filter-all="${key}">Todas</button><button type="button" data-filter-none="${key}">Ninguna</button></div><div class="filter-scroll">${renderLayerCategoryRows(key,cats,selected,filterEnabled)}</div></details>`;
 holder.querySelectorAll('[data-filter-layer]').forEach(inp=>inp.addEventListener('change',()=>{if(inp.checked)selected.add(inp.dataset.filterCat);else selected.delete(inp.dataset.filterCat);state.catAllowed[key]=selected;restyleLayer(key)}));
 holder.querySelector('[data-filter-all]').addEventListener('click',()=>{state.catAllowed[key]=new Set(cats.map(x=>x.cat));updateLayerLegend(key);restyleLayer(key)});
 holder.querySelector('[data-filter-none]').addEventListener('click',()=>{state.catAllowed[key]=new Set();updateLayerLegend(key);restyleLayer(key)});
 const select=holder.querySelector('[data-indice-capa]');if(select)select.addEventListener('change',()=>{state.edificabilidadIndice=select.value;const data=state.leyendas?.[key]?.indices?.[select.value];if(data){state.catEntries[key]=data;state.catAllowed[key]=new Set(data.map(x=>x.cat));}else if(state.geo[key])buildLegend(key,state.geo[key]);updateLayerLegend(key);restyleLayer(key)});
}

function populateLegends(){
 if(!state.leyendas)return;
 for(const [key,m] of Object.entries(state.leyendas)){
  const cats=key==='edificabilidad_zonas2014'?m.indices.ICB:m.categorias;
  state.catEntries[key]=cats;
  if(!state.catAllowed[key])state.catAllowed[key]=new Set(cats.map(x=>x.cat));
  updateLayerLegend(key);
 }
}

function styleFeature(key,f){
 const cat=groupCat(key,f.properties||{}),list=state.catEntries[key]||[],info=list.find(x=>x.cat===cat),allowed=!state.catAllowed[key]||state.catAllowed[key].has(cat);
 return {color:info?.color||CONFIG[key]?.base||'#4f846a',fillColor:info?.color||CONFIG[key]?.base||'#4f846a',weight:allowed?1.6:0,opacity:allowed?.95:0,fillOpacity:allowed?.49:0,interactive:allowed};
}
function restyleLayer(key){
 const lay=state.layers[key];if(lay)lay.eachLayer(l=>{if(!l.feature)return;const isAllowed=state.catAllowed[key]?.has(groupCat(key,l.feature.properties||{}));l.setStyle(styleFeature(key,l.feature));const dom=l.getElement?.();if(dom)dom.style.pointerEvents=isAllowed?'auto':'none'});
 if(state.mapMode==='compare'){for(const [side,themeKey] of [['left',SWIPE_THEMES[state.compareTheme][0]],['right',SWIPE_THEMES[state.compareTheme][1]]]){if(key===themeKey){const group=state.compareLayers[side];group?.eachLayer(l=>{if(l.feature)l.setStyle(styleFeature(key,l.feature))})}}}
}
async function getGeo(key){if(state.geo[key])return state.geo[key];const r=await fetch(`data/${key}.geojson`);if(!r.ok)throw new Error('Falta '+key);return state.geo[key]=await r.json()}
function makeLayer(key,geo,opts={}){return L.geoJSON(geo,{renderer:L.canvas({padding:0}),style:f=>styleFeature(key,f),onEachFeature:(f,l)=>{l.bindTooltip(htmlEscape(getLabelForFeature(key,f.properties||{})),{sticky:true,direction:'top'});l.on('click',e=>{L.DomEvent.stopPropagation(e);const item=f.properties||{};const msg=`${getLabelForFeature(key,item)} · ${CONFIG[key]?.year} · ${CONFIG[key]?.label}`;DOM('map-status').textContent=msg.slice(0,130)})}})}
async function ensureLayer(key){
 if(state.layers[key])return;
 const geo=await getGeo(key);if(!state.catEntries[key])buildLegend(key,geo);
 state.layers[key]=makeLayer(key,geo);
}
function makeSidebar(){
 DOM('layers').innerHTML=GROUPS.map(g=>`<details ${g.open?'open':''}><summary><span>${htmlEscape(g.title)}</span><span class="group-count">${g.keys.length} capas</span></summary><div class="layer-list">${g.keys.map(k=>`<div class="layer-unit"><label class="layer-main-label"><input type="checkbox" data-layer="${k}" ${state.active.has(k)?'checked':''}><i class="swatch" style="background:${CONFIG[k].base}"></i><span class="layer-name">${htmlEscape(CONFIG[k].label)}</span></label><div class="layer-legend" data-legend="${k}"></div></div>`).join('')}</div></details>`).join('');
 DOM('layers').querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('change',()=>{if(state.mapMode==='compare'){const theme=Object.keys(SWIPE_THEMES).find(t=>SWIPE_THEMES[t].includes(b.dataset.layer));if(theme){selectCompareTheme(theme);return}}toggleLayer(b.dataset.layer,b.checked)}));
 if(state.leyendas)populateLegends();
}
async function toggleLayer(key,on){if(on)state.active.add(key);else state.active.delete(key);updateLayerLegend(key);if(!state.map)return;if(state.mapMode==='compare'){if(SWIPE_THEMES[state.compareTheme]?.includes(key))restyleLayer(key);return;}try{if(on){await ensureLayer(key);state.layers[key].addTo(state.map)}else if(state.layers[key])state.map.removeLayer(state.layers[key]);}catch(e){console.error(e);DOM('map-status').textContent=`No fue posible cargar: ${CONFIG[key].label}`}}
function initMap(){if(state.leafReady)return;if(!window.L){DOM('map').innerHTML='<p style="padding:24px;color:#824235">Leaflet no se cargó. Comprueba tu conexión a internet y recarga el sitio.</p>';return}state.map=L.map('map',{preferCanvas:true,zoomControl:true,maxZoom:19}).setView([3.43,-76.54],11);state.map.attributionControl.setPrefix(false);state.map.createPane('barrios');state.map.getPane('barrios').style.zIndex=480;state.map.createPane('resaltado');state.map.getPane('resaltado').style.zIndex=650;state.map.getPane('resaltado').style.pointerEvents='none';state.base=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(state.map);makeSidebar();state.leafReady=true;for(const key of state.active)toggleLayer(key,true);drawBarrios();updateHeader();}
function drawBarrios(){if(!state.leafReady||!state.barrios.length||state.barrioLayer)return;const gj={type:'FeatureCollection',features:state.barrios};state.barrioLayer=L.geoJSON(gj,{pane:'barrios',style:{color:'#365f62',weight:1.1,opacity:.72,fillColor:'#f8f2cf',fillOpacity:.015},onEachFeature:(feature,layer)=>{state.byCode.set(String(feature.properties.codigo),{feature,layer});layer.on('click',e=>{L.DomEvent.stopPropagation(e);setSelected(feature,layer)});layer.bindTooltip(htmlEscape(feature.properties.barrio),{sticky:true})}});if(state.barriosVisible)state.barrioLayer.addTo(state.map);const b=state.barrioLayer.getBounds();if(b.isValid()&&!state.selected)state.map.fitBounds(b.pad(.025),{maxZoom:12});drawHighlights();DOM('map-status').textContent=`${state.barrios.length} barrios y sectores disponibles`}
function removeHighlights(){if(state.highlight&&state.map){state.map.removeLayer(state.highlight);state.highlight=null}if(state.highlightRight&&state.mapRight){state.mapRight.removeLayer(state.highlightRight);state.highlightRight=null}}
function drawHighlights(){removeHighlights();if(!state.selected||!state.map)return;const color={color:'#9d6208',fillColor:'#ffd251',weight:4.2,opacity:1,fillOpacity:.38};state.highlight=L.geoJSON(state.selected,{pane:'resaltado',interactive:false,style:color}).addTo(state.map);if(state.mapRight){state.highlightRight=L.geoJSON(state.selected,{pane:'resaltado',interactive:false,style:color}).addTo(state.mapRight)}}
function focusSelected(){if(!state.map||!state.selected)return;let layer=state.byCode.get(String(state.selected.properties.codigo))?.layer;const b=layer?.getBounds?.();if(b?.isValid())state.map.fitBounds(b,{padding:[40,40],maxZoom:15,animate:true})}
function resetMap(){if(!state.map)return;const b=state.barrioLayer?.getBounds();if(b?.isValid())state.map.fitBounds(b.pad(.025),{maxZoom:12});else state.map.setView([3.43,-76.54],11)}
function setSwipePercent(p){
 const val=Math.max(10,Math.min(90,Number(p)));const overlay=DOM('map-right-clip');
 overlay.style.clipPath=`inset(0 0 0 ${val}%)`;overlay.style.webkitClipPath=`inset(0 0 0 ${val}%)`;
 DOM('compare-divider').style.left=val+'%';DOM('compare-slider').value=val;
 const w=DOM('map-frame')?.clientWidth||0;
 const leftTag=DOM('compare-left-label'),rightTag=DOM('compare-right-label');
 if(leftTag)leftTag.dataset.visible=String(w*val/100>=Math.max(110,leftTag.scrollWidth+16));
 if(rightTag)rightTag.dataset.visible=String(w*(100-val)/100>=Math.max(110,rightTag.scrollWidth+16));
}
function ensureRightMap(){
 if(state.mapRight)return;
 state.mapRight=L.map('map-right',{zoomControl:false,attributionControl:false,preferCanvas:false,maxZoom:19,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,zoomSnap:1}).setView(state.map.getCenter(),state.map.getZoom(),{animate:false});
 state.mapRight.createPane('barrios');state.mapRight.getPane('barrios').style.zIndex=480;
 state.mapRight.createPane('resaltado');state.mapRight.getPane('resaltado').style.zIndex=650;state.mapRight.getPane('resaltado').style.pointerEvents='none';
 // Fondo independiente para que NUNCA se trasluzca la norma de 2014 bajo la de 2026.
 state.mapRight.getContainer().style.background='#edf2ed';
 state.baseRight=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(state.mapRight);
 state.mapRight.getContainer().style.pointerEvents='none';
 const geo={type:'FeatureCollection',features:state.barrios};
 state.barrioRight=L.geoJSON(geo,{pane:'barrios',interactive:false,style:{color:'#365f62',weight:1,opacity:.7,fillOpacity:.01}});
 if(state.barriosVisible)state.barrioRight.addTo(state.mapRight);
 let scheduled=false;
 const sync=()=>{if(state.mapMode!=='compare'||scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(!state.mapRight)return;const c=state.map.getCenter();const z=state.map.getZoom();state.mapRight.setView(c,z,{animate:false});});};
 state.map.on('move zoom resize',sync);
 state.mapRight.invalidateSize({pan:false});sync();
}
const SWIPE_THEMES={usos:['areas_actividad2014','areas_actividad'],clasificacion:['clasificacion2014','clasificacion'],tratamientos:['tratamientos2014','tratamientos'],planes:['planes2014','planes_parciales']};
function updateCompareLegendVisibility(){
 const compare=state.mapMode==='compare';
 const paired=new Set(SWIPE_THEMES[state.compareTheme]||[]);
 document.querySelectorAll('#layers .layer-unit').forEach(el=>{
  const key=el.querySelector('[data-layer]')?.dataset.layer;
  const isPair=paired.has(key),chk=el.querySelector('[data-layer]');
  el.hidden=false;
  el.classList.toggle('compare-paired',compare&&isPair);
  el.classList.toggle('compare-other',compare&&!isPair);
  const legend=el.querySelector('.layer-legend');
  if(legend)legend.hidden=compare&&!isPair;
  if(chk){
   chk.disabled=false;
   chk.checked=compare?isPair:state.active.has(key);
   chk.title=compare?'Seleccionar este tema para comparar 2014 y 2026':'Activar u ocultar esta capa';
  }
 });
 document.querySelectorAll('#layers>details').forEach(group=>{group.hidden=false;});
 if(compare){
  const pair=SWIPE_THEMES[state.compareTheme]||[];
  for(const key of pair){const el=document.querySelector(`#layers [data-layer="${key}"]`)?.closest('details');if(el)el.open=true;}
 }
}
function selectCompareTheme(theme){
 if(!SWIPE_THEMES[theme])return;
 state.compareTheme=theme;
 const select=DOM('compare-theme');
 if(select)select.value=theme;
 updateCompareLegendVisibility();
 Object.keys(state.catEntries).forEach(updateLayerLegend);
 if(state.mapMode==='compare')updateSwipeLayers();
}
async function updateSwipeLayers(){
 if(state.mapMode!=='compare'||!state.mapRight)return;
 const seq=state.swipeSequence=(state.swipeSequence||0)+1;
 const pair=SWIPE_THEMES[state.compareTheme];if(!pair)return;
 DOM('map-status').textContent='Cargando cartografías de ambos años…';
 try{
  const [oldGeo,newGeo]=await Promise.all(pair.map(getGeo));
  if(seq!==state.swipeSequence||state.mapMode!=='compare')return;
  for(const [key,geo] of [[pair[0],oldGeo],[pair[1],newGeo]])if(!state.catEntries[key])buildLegend(key,geo);
  const left=makeLayer(pair[0],oldGeo),right=makeLayer(pair[1],newGeo);
  if(state.compareLayers.left)state.map.removeLayer(state.compareLayers.left);
  if(state.compareLayers.right)state.mapRight.removeLayer(state.compareLayers.right);
  state.compareLayers.left=left;state.compareLayers.right=right;
  for(const key of pair)updateLayerLegend(key);
  left.addTo(state.map);right.addTo(state.mapRight);
  DOM('map-right-clip').dataset.comparator='2026';
  state.mapRight.invalidateSize({pan:false});state.mapRight.setView(state.map.getCenter(),state.map.getZoom(),{animate:false});
  setSwipePercent(DOM('compare-slider').value);drawHighlights();
  DOM('map-status').textContent=`${CONFIG[pair[0]].label}: ${oldGeo.features.length} polígonos (2014) · ${CONFIG[pair[1]].label}: ${newGeo.features.length} polígonos (2026). Si no se ven, hay un problema de visualización, no de carga de datos.`;
 }catch(err){console.error('Comparador:',err);DOM('map-status').textContent='No fue posible cargar las dos capas. Comprueba la conexión.'}
}
function updateCompareStyles(){if(state.mapMode==='compare')updateSwipeLayers()}
async function modeMap(mode){
 if(!state.map)return;state.mapMode=mode;
 document.querySelectorAll('[data-map-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mapMode===mode));
 const compare=mode==='compare';
 if(compare){const activeTheme=Object.keys(SWIPE_THEMES).find(t=>SWIPE_THEMES[t].some(k=>state.active.has(k)));if(activeTheme)state.compareTheme=activeTheme;DOM('compare-theme').value=state.compareTheme;}
 for(const id of ['map-right-clip','compare-divider','map-period-tags','compare-slider-wrap','compare-theme-wrap'])DOM(id).hidden=!compare;
 DOM('layers').classList.toggle('comparison-active',compare);
 updateCompareLegendVisibility();
 Object.keys(state.catEntries).forEach(updateLayerLegend);
 if(compare){
  for(const key of state.active)if(state.layers[key])state.map.removeLayer(state.layers[key]);
  ensureRightMap();
  state.map.invalidateSize({pan:false});state.mapRight.invalidateSize({pan:false});
  state.mapRight.setView(state.map.getCenter(),state.map.getZoom(),{animate:false});
  await updateSwipeLayers();
 }else{
  state.swipeSequence=(state.swipeSequence||0)+1;
  if(state.compareLayers.left)state.map.removeLayer(state.compareLayers.left);
  if(state.compareLayers.right&&state.mapRight)state.mapRight.removeLayer(state.compareLayers.right);
  state.compareLayers.left=null;state.compareLayers.right=null;
  for(const key of state.active)await toggleLayer(key,true);
  drawHighlights();DOM('map-status').textContent='Explora por categorías, selecciona tu barrio y abre su ficha';
 }
 state.map.invalidateSize({pan:false});
}
function renderInspector(){const el=DOM('map-inspector-content');if(!state.selected){el.innerHTML='<div class="empty-state"><b>Comienza con tu barrio</b><p>Elige un barrio en el mapa o búscalo arriba.</p></div>';return}const info=barrioInfo();const a=entries(info,'tratamientos2014'),b=entries(info,'tratamientos2026');const top=arr=>arr.slice(0,3).map(x=>`<div style="font-size:10px;padding:6px 0;border-bottom:1px solid #e6ece5"><b>${htmlEscape(x.nombre)}</b><br><span style="color:#51735e">${fmt(x.porcentaje_barrio)}% · ${fmtArea(x.hectareas)}</span></div>`).join('')||'<p>Pendiente de cargar</p>';el.innerHTML=`<div class="inspector-card"><span class="mini-kicker">COMPARACIÓN DE TRATAMIENTOS</span><div class="mini-count"><div><b>${a.length}</b><span>Categorías 2014</span></div><div><b>${b.length}</b><span>Categorías 2026</span></div></div></div><div class="inspector-card"><h4>POT 2014</h4>${top(a)}</div><div class="inspector-card"><h4>Propuesta 2026</h4>${top(b)}</div><p class="caption">Los listados son sólo orientación espacial. En «Comparación normativa» encontrarás gráficos y explicaciones, sin repetirlos aquí.</p>`;}
function renderInicio(){
 const v=state.indicadores,c=state.sueloComparacion;
 if(!v)return;
 const pos=n=>n>0?'+'+fmt(n):fmt(n);
 const stats=c?[
 ['Crecimiento neto del perímetro urbano',pos(c.cambios.urbano_delta_ha),'ha','Diferencia de superficie entre las delimitaciones de 2014 y 2026.'],
 ['Aumento neto del suelo de expansión',pos(c.cambios.expansion_delta_ha),'ha','No equivale a suelo urbanizado ni a viviendas autorizadas.'],
 ['Nuevo suelo cartografiado como renovación',fmt(c.renovacion_cartografica.nuevamente_clasificada_2026_ha),'ha','En 2026 aparece como renovación donde 2014 no la registraba; modalidades no jurídicamente equivalentes.'],
 ['Suelo que sale de renovación',fmt(c.renovacion_cartografica.fuera_de_renovacion_2026_ha),'ha','Cruce territorial de tratamientos 2014 frente a la propuesta 2026.']
 ]:[
 ['Perímetro urbano propuesto',fmt(v.urbano2026_ha),'ha','Pendiente de cargar comparación 2014.'],
 ['Suelo de expansión propuesto',fmt(v.expansion2026_ha),'ha','Pendiente de cargar comparación 2014.']];
 DOM('home-stats').innerHTML=stats.map(([title,value,unit,note])=>`<div class="stat-card"><div class="stat-kicker">${htmlEscape(title)}</div><strong>${value} <span style="font:500 15px system-ui">${unit}</span></strong><p>${htmlEscape(note)}</p></div>`).join('');
 const cls=c?[
 {n:'Perímetro urbano',old:c.periodo['2014'].urbano_ha,now:c.periodo['2026'].urbano_ha,color:'#679eb6'},
 {n:'Suelo de expansión',old:c.periodo['2014'].expansion_ha,now:c.periodo['2026'].expansion_ha,color:'#d2ae6b'},
 {n:'Suelo rural',old:c.periodo['2014'].rural_derivado_ha,now:c.periodo['2026'].rural_ha,color:'#78a988'}
 ]:[];
 const maxArea=Math.max(1,...cls.flatMap(x=>[x.old,x.now]));
 DOM('home-soil-bars').innerHTML=cls.map(x=>`<div class="comparison-bar-block"><div class="comparison-bar-title"><strong>${htmlEscape(x.n)}</strong><span>${fmt(x.old)} → ${fmt(x.now)} ha</span></div><div class="comparison-bar-row"><span>2014</span><div class="bar-track"><i style="width:${x.old/maxArea*100}%;background:${x.color};opacity:.55"></i></div><b>${fmt(x.old)} ha</b></div><div class="comparison-bar-row"><span>2026</span><div class="bar-track"><i style="width:${x.now/maxArea*100}%;background:${x.color}"></i></div><b>${fmt(x.now)} ha</b></div></div>`).join('')||'<p>Comparación pendiente.</p>';

 renderTransformacionInicio();
}

/* Indicadores de transición cartográfica: solo aproximaciones de capas simplificadas.
   No se deducen permisos comerciales a partir de cambios de categoría. */
function renderTransformacionInicio(){
 const r=state.transformacion;
 const here=DOM('home-transformations');if(!here||!r)return;
 const display={Consolidación:'#6799b3',Renovación:'#be7786',Desarrollo:'#a995c1','Mejoramiento integral':'#dfb965',Conservación:'#78a98b','Área de Proximidad':'#6a9d93','Área Multifuncional':'#9c8dc4','Área de Integración':'#be9d70','Área de Dinamización Económica':'#cc8267'};
 const sums=(arr)=>arr.reduce((a,b)=>a+Number(b.ha||0),0);
 const mini=(items,limit=7)=>{const total=sums(items);return `<div class="district-bars">${items.slice(0,limit).map(x=>`<div class="district-bar"><div class="district-bar-label"><span>${glossaryWord(x.categoria,2026,x.categoria,'actividad')}</span><strong>${fmt(x.ha)} ha · ${fmt(x.ha/total*100)}%</strong></div><div class="district-track"><i style="width:${Math.min(100,x.ha/total*100)}%;background:${display[x.categoria]||'#a7afa8'}"></i></div></div>`).join('')}</div>`};
 const names=['Consolidación','Renovación','Desarrollo','Conservación'];
 const find=(arr,n)=>arr.find(x=>x.categoria===n)?.ha||0;
 const chart=names.map(n=>{let a=find(r.tratamientos2014,n),b=find(r.tratamientos2026,n);let max=Math.max(a,b,1);return `<div class="district-comparison"><div class="district-bar-label"><b>${htmlEscape(n)}</b><span>2014 ${fmt(a)} ha · 2026 ${fmt(b)} ha</span></div><div class="paired-line"><small>${glossaryWord('Definición (2014)',2014,n)}</small><div class="district-track"><i style="width:${a/max*100}%;background:${display[n]};opacity:.58"></i></div></div><div class="paired-line"><small>${glossaryWord('Definición propuesta (2026)',2026,n)}</small><div class="district-track"><i style="width:${b/max*100}%;background:${display[n]}"></i></div></div></div>`}).join('');
 const t2014=new Set(['Consolidación','Renovación','Desarrollo','Conservación','C1','C2','C3','R1','R2','R3','CO','DE']);
 const t2026=new Set(['Consolidación','Renovación','Desarrollo','Conservación','Mejoramiento integral','C1','C2','C3','C4','R1','R2','D1','D2','CSU','CTL']);
 const tr=r.transiciones_tratamientos.filter(x=>x.desde!==x.hacia&&x.ha>=20&&t2014.has(x.desde)&&t2026.has(x.hacia)).slice(0,8);
 here.innerHTML=`<div class="section-heading"><div><span class="eyebrow">DÓNDE SE TRANSFORMA EL SUELO</span><h3>Tratamientos, áreas de actividad y transiciones</h3><p>Lectura territorial exploratoria de las capas disponibles: haz clic en los nombres subrayados para consultar definiciones y fuentes de cada período.</p></div></div><div class="home-insight-grid"><section class="surface-card"><div class="card-head"><span class="eyebrow">TRATAMIENTOS 2014 → 2026</span><h3>Cómo cambia la distribución</h3></div>${chart}<p class="caption">Familias de tratamientos presentes en ambas normas, comparadas solo cartográficamente; sus modalidades no son necesariamente equivalentes. El mejoramiento integral es un tratamiento propio de la propuesta 2026.</p></section><section class="surface-card"><div class="card-head"><span class="eyebrow">USOS EN LA PROPUESTA</span><h3>Áreas de actividad de 2026</h3></div>${mini(r.actividades2026)}<p class="caption">Las áreas de actividad NO equivalen directamente a usos exclusivos ni autorizan por sí solas comercio, vivienda o industria.</p></section></div><section class="surface-card transition-home-card"><div class="card-head"><span class="eyebrow">CRUCE SOBRE EL MISMO TERRITORIO · POT 2014 → PROPUESTA 2026</span><h3>¿De qué tratamiento a cuál pasa el suelo?</h3></div><div class="transition-home-grid">${tr.map(x=>`<div class="transition-home-row"><span>${glossaryWord(etiquetaTransicionTratamiento(x.desde,2014),2014,x.desde)} <b>→</b> ${glossaryWord(etiquetaTransicionTratamiento(x.hacia,2026),2026,x.hacia)}</span><strong>${fmt(x.ha)} ha</strong></div>`).join('')}</div><div class="method-note"><b>Importante:</b> solo se incluyen transiciones entre categorías identificadas como tratamientos en cada instrumento; ND, INS y otras categorías especiales de 2014 no se presentan como tratamientos. Estas hectáreas son aproximaciones geométricas sobre GeoJSON simplificados, sujetas a contraste con las GDB originales y a resolver solapamientos. No representan incrementos de derechos de construcción. <b>Áreas de actividad 2014→2026:</b> el cruce cartográfico ya se incorporó a continuación. Los permisos comerciales específicos siguen sujetos a las matrices de usos.</div></section>`;
}

/* Componentes reutilizables de análisis por barrio */
function categoryView(records,max=14){if(!records?.length)return '<p class="caption">No hay intersección registrada en esta capa; no implica ausencia de regulación.</p>';return `<ul class="area-list">${records.slice(0,max).map(r=>`<li><span>${htmlEscape(r.nombre)}</span><strong>${fmtArea(r.hectareas)} · ${fmt(r.porcentaje_barrio)}%</strong></li>`).join('')}</ul>${records.length>max?`<p class="caption">${records.length-max} categorías adicionales en el archivo completo.</p>`:''}`}
function donut(records,caption,layerKey){if(!records?.length)return '<p class="caption">Sin datos de distribución para esta capa.</p>';const total=records.reduce((s,x)=>s+Number(x.porcentaje_barrio||0),0);if(layerKey==='efectos_sismicos2014'||(layerKey==='tratamientos2014'&&records.some(r=>/NODO DE EQUIPAMIENTOS/i.test(r.nombre))))return `<div class="warn-box"><strong>Superficies superpuestas; no se muestran como torta</strong>Estas categorías no son necesariamente excluyentes: una parte del barrio puede estar incluida en más de una. Cada porcentaje indica el área ocupada por el fenómeno o delimitación, no una porción independiente de un total de 100 %.</div>${categoryView(records)}`;if(total>100.5)return `<div class="warn-box"><strong>No se representa en torta</strong>Las superficies de categorías suman ${fmt(total)}% del barrio. Puede haber solapamientos o categorías no excluyentes; consulta las hectáreas de la tabla.</div>${categoryView(records)}`;const filled=Math.min(100,total),uncovered=Math.max(0,100-filled);const sorted=records.slice().sort((a,b)=>b.porcentaje_barrio-a.porcentaje_barrio);const items=sorted.length>6?[...sorted.slice(0,5),{nombre:'Otras categorías',porcentaje_barrio:sorted.slice(5).reduce((s,x)=>s+x.porcentaje_barrio,0)}]:sorted.slice();if(uncovered>.1)items.push({nombre:'Sin cobertura en esta capa',porcentaje_barrio:uncovered,uncovered:true});let current=0;const wedges=items.map((it,i)=>{const end=Math.min(100,current+it.porcentaje_barrio);const str=`${it.uncovered?'#e5ebe6':PALETTE[i%PALETTE.length]} ${current.toFixed(3)}% ${end.toFixed(3)}%`;current=end;return str});const grad=`conic-gradient(${wedges.join(',')})`;return `<div class="pie-layout"><div class="pie" role="img" aria-label="Distribución porcentual: ${htmlEscape(caption)}" style="background:${grad}"><div class="pie-center"><div style="text-align:center"><strong>${fmt(total)}%</strong><small style="display:block">cubierto</small></div></div></div><div class="pie-legend">${items.map((it,i)=>`<div class="legend-entry"><i class="mini-swatch" style="background:${it.uncovered?'#e5ebe6':PALETTE[i%PALETTE.length]}"></i><span><b>${fmt(it.porcentaje_barrio)}%</b>${htmlEscape(it.nombre)}</span></div>`).join('')}</div></div>`}
const TOPICS={clasificacion:{title:'Clasificación del suelo',a:'clasificacion2014',b:'clasificacion2026',lead:'Define qué sectores son suelo urbano, rural o de expansión, y cómo cambia su delimitación territorial.',implication:'Una superficie clasificada como urbana o de expansión no equivale a un permiso automático de urbanizar. Deben verificarse las restricciones, instrumentos, cargas, servicios y normas aplicables. Las diferencias de delimitación municipal también requieren cautela.'},tratamientos:{title:'Tratamientos urbanísticos',a:'tratamientos2014',b:'tratamientos2026',lead:'El tratamiento define cómo se interviene urbanísticamente un área. No es equivalente a un permiso automático para construir.',implication:'Si la categoría cambia, deben revisarse las reglas específicas de uso, edificabilidad, planes parciales y obligaciones del nuevo tratamiento. Una transición de color no prueba por sí misma una flexibilización.'},usos:{title:'Áreas de actividad y usos',a:'actividad2014',b:'actividad2026',lead:'Las áreas de actividad expresan la orientación de uso del territorio; conocer los usos permitidos y condicionados exige consultar tablas y artículos.',implication:'La clasificación de 2014 no es jurídicamente idéntica a las nuevas áreas de actividad de 2026. No podemos afirmar que un uso fue autorizado o prohibido sin la tabla normativa de ambos años.'},edificabilidad:{title:'Edificabilidad',a:'edificabilidad_zonas2014',b:null,lead:'La edificabilidad regula el aprovechamiento del suelo mediante índices y otras condiciones.',implication:'La cartografía disponible de 2014 contiene zonas e índices. El archivo de edificabilidad urbana 2026 consultado tiene 0 registros, por lo que no sería riguroso afirmar aumentos o reducciones hasta obtener una fuente completa.'},planes:{title:'Planes parciales',a:'planes2014',b:'planes2026',lead:'Los planes parciales son instrumentos de planeamiento y gestión para determinados ámbitos, no una regla general que aplique automáticamente a todo un barrio.',implication:'Que un polígono de plan parcial figure en una base y no en la otra no prueba que la exigencia desaparezca. Es necesario contrastar el articulado, la situación urbanística y el régimen de transición.'}};
function renderNorma(){const root=DOM('norma-content');if(!state.selected){root.innerHTML=selectedBadge()+`<div class="topic-tabs">${Object.entries(TOPICS).map(([k,x])=>`<button type="button" class="${k===state.topic?'selected':''}" data-topic="${k}">${htmlEscape(x.title)}</button>`).join('')}</div><div class="opening-card"><span class="eyebrow">${htmlEscape(TOPICS[state.topic].title.toUpperCase())}</span><h3>¿Qué cambia en tu barrio?</h3><p>${htmlEscape(TOPICS[state.topic].lead)} Selecciona un barrio para consultar sus superficies y las disposiciones que correspondan a este tema.</p></div>`;root.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{state.topic=b.dataset.topic;renderNorma();renderNormaTopicExtras()}));return;}const info=barrioInfo();const t=TOPICS[state.topic],r14=entries(info,t.a),r26=t.b?entries(info,t.b):[];const trans=(info?.transiciones_tratamiento||[]).filter(t=>t.hectareas>=.02).sort((a,b)=>b.hectareas-a.hectareas);const transBlock=state.topic==='tratamientos'?`<section class="section-card"><span class="eyebrow">LA MISMA SUPERFICIE, DOS PERIODOS</span><h3>¿Dónde cambian los tratamientos?</h3><p>Estas transiciones se obtuvieron al cruzar ambas cartografías sobre el mismo espacio del barrio; no implican automáticamente un cambio de derechos edificatorios.</p><div class="transition-list">${trans.slice(0,12).map(x=>`<div class="transition-row"><span><small>POT 2014</small> ${glossaryWord(etiquetaTransicionTratamiento(x.desde,2014),2014,x.desde)}</span><b>→</b><span><small>Propuesta 2026</small> ${glossaryWord(etiquetaTransicionTratamiento(x.hacia,2026),2026,x.hacia)}</span><strong>${fmtArea(x.hectareas)} · ${fmt(x.porcentaje_barrio)}%</strong></div>`).join('')||'<p>Sin transiciones registradas.</p>'}</div></section>`:'';
root.innerHTML=selectedBadge()+`<div class="topic-tabs">${Object.entries(TOPICS).map(([k,x])=>`<button type="button" class="${k===state.topic?'selected':''}" data-topic="${k}">${htmlEscape(x.title)}</button>`).join('')}</div><div class="opening-card"><span class="eyebrow">${htmlEscape(t.title.toUpperCase())}</span><h3>¿Qué establece cada cartografía?</h3><p>${htmlEscape(t.lead)}</p><span class="status-pill">Cruces espaciales calculados</span> ${!t.b?'<span class="status-pill pending">Datos 2026 pendientes</span>':''}</div><div class="chart-grid"><div class="chart-card"><h4>POT 2014 · vigente (GDB actualizada)</h4>${donut(r14,'2014',t.a)}</div><div class="chart-card"><h4>Propuesta POT 2026</h4>${t.b?donut(r26,'2026',t.b):'<div class="warn-box"><strong>La capa de 2026 no contiene polígonos</strong>No se calcula una diferencia de índices ni se sustituyen los datos faltantes por supuestos.</div>'}</div></div><div class="analysis-grid"><div><section class="section-card"><span class="eyebrow">LECTURA TÉCNICA Y CIUDADANA</span><h3>¿Qué significa esta comparación?</h3><p>${htmlEscape(t.implication)}</p><div class="fact-pair"><div class="fact-card prev"><h4>2014 · categorías registradas</h4>${categoryView(r14,9)}</div><div class="fact-card next"><h4>2026 · categorías propuestas</h4>${t.b?categoryView(r26,9):'<p>Información pendiente.</p>'}</div></div><div class="explanation"><b>Cómo interpretar porcentajes:</b> cada valor indica el porcentaje de superficie del barrio intersectada por la categoría. No representa porcentaje de población, viviendas, predios ni beneficiarios económicos.</div></section>${transBlock}</div><div><section class="section-card"><span class="eyebrow">¿CÓMO LEER ESTO?</span><h3>Las cifras no dicen todo</h3><p>Un barrio puede contener diferentes reglas. La comparación de usos, tratamientos y edificabilidad requiere estudiar cada polígono y las disposiciones de ambos POT.</p><h4>Si necesitas saber quién se beneficia</h4><p>Revisa la sección Gestión e incentivos. Allí se examinan las condiciones para acceder al aprovechamiento y las obligaciones que permanecen.</p><button class="btn btn-dark" data-go="gestion">Entender cargas y beneficios →</button></section><section class="section-card"><span class="eyebrow">FUENTES</span><h3>Consultar la evidencia</h3><p>Las superficies de este barrio proceden del cruce espacial precalculado de ambas geodatabases. Los términos normativos y su equivalencia se verifican por separado.</p>${districtLink(2014)}${districtLink(2026)}<p class="source-line">Nota: GDB POT 2014 actualizada con revisiones posteriores a 2014; propuesta POT 2026 no vigente.</p></section></div></div>`;root.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{state.topic=b.dataset.topic;renderNorma();renderNormaTopicExtras()}));}
function ruleBox(rule){return `<article class="rule-card"><span class="rule-kicker">${htmlEscape(rule.tipo||'Regla general')} · ${rule.anio}</span><h4>${htmlEscape(rule.titulo)}</h4><p>${htmlEscape(rule.condicion)}</p><small>${htmlEscape(rule.fuente)} · artículos ${htmlEscape(rule.articulos)} · páginas PDF ${htmlEscape(rule.pagina_documento)}</small></article>`}
function activeRules(info,year){if(!state.normas)return[];const key=year===2014?'tratamientos2014':'tratamientos2026';const codes=new Set(entries(info,key).filter(x=>Number(x.hectareas)>=.03).map(x=>asCode(x,year)));return state.normas.reglas.filter(r=>r.anio===String(year)&&r.codigos.some(c=>codes.has(c)))}
function renderGestion(){const root=DOM('gestion-content');const info=barrioInfo(),rules14=activeRules(info,2014),rules26=activeRules(info,2026),comp=state.normas?.comparaciones||[];const intro=`<div class="opening-card"><span class="eyebrow">PREGUNTA CENTRAL</span><h3>¿Qué derecho de desarrollo se concede y con qué obligaciones?</h3><p>Esta sección ordena las reglas en cinco preguntas: <b>aprovechamiento</b>, <b>procedimiento</b>, <b>cargas</b>, <b>incentivos</b> y <b>garantías a moradores</b>. No calcula rentabilidades ni afirma beneficiarios empresariales individuales.</p><div class="method-note">Una condición general de un tratamiento no equivale a una respuesta definitiva para cada predio. Se requieren las delimitaciones, el instrumento vigente y las excepciones concretas.</div></div>`;const cols=state.selected?`<section class="section-card"><span class="eyebrow">CONDICIONES DE LOS TRATAMIENTOS DEL BARRIO</span><h3>Planes parciales y actuaciones: ¿qué dicen los artículos?</h3><p>Las siguientes reglas generales están vinculadas a categorías que intersectan el barrio. <b>No indican que todos sus predios deban tramitar o estén exentos de un plan parcial.</b></p><div class="rule-grid"><div><h4>POT 2014 vigente</h4>${rules14.map(ruleBox).join('')||'<p>Sin reglas específicas coincidentes en la matriz actual.</p>'}</div><div><h4>Propuesta 2026</h4>${rules26.map(ruleBox).join('')||'<p>Sin reglas específicas coincidentes en la matriz actual.</p>'}</div></div></section>`:'';root.innerHTML=(state.selected?selectedBadge():'')+intro+`<div class="analysis-grid"><div>${cols}<section class="section-card"><span class="eyebrow">CAMBIOS DE PROCEDIMIENTO</span><h3>¿Se exige plan parcial, licencia o plan manzana?</h3><p>Estos cambios generales fueron identificados en los articulados. Su aplicación territorial depende de los tratamientos y las condiciones particulares.</p>${comp.map(c=>`<details class="rule-card"><summary><b>${htmlEscape(c.tema)}</b></summary><div class="fact-pair"><div class="fact-card prev"><h4>2014 · vigente</h4><p>${htmlEscape(c.antes)}</p></div><div class="fact-card next"><h4>2026 · propuesta</h4><p>${htmlEscape(c.propuesta)}</p></div></div><p>${htmlEscape(c.interpretacion)}</p><small>${htmlEscape(c.ref2014)} · ${htmlEscape(c.ref2026)}</small></details>`).join('')}</section><section class="section-card"><span class="eyebrow">CARGAS Y CONTRAPRESTACIONES</span><h3>¿Qué recibe la ciudad?</h3><div class="rule-grid"><div class="rule-card"><h4>Cesiones y obligaciones urbanísticas</h4><p>Verificar qué cesiones de suelo, espacio público, equipamientos y cargas de urbanización exige cada modalidad. El cambio de instrumento no elimina automáticamente esas obligaciones.</p><span class="status-pill pending">Aplicación por ámbito pendiente</span></div><div class="rule-card"><h4>Participación en plusvalía</h4><p>Un mayor aprovechamiento podría configurar hechos generadores, pero la exigibilidad, las exenciones y el tratamiento fiscal requieren norma aplicable y verificación particular.</p><span class="status-pill pending">Cuantificación no requerida</span></div></div></section></div><div><section class="section-card"><span class="eyebrow">BENEFICIOS Y EXCEPCIONES</span><h3>¿Qué puede recibir el desarrollador?</h3><ul><li>Posibilidad de actuación individual o mediante instrumento intermedio cuando la norma lo permita.</li><li>Condiciones de acceso a edificabilidad básica y adicional, pendientes de la capa 2026.</li><li>Incentivos urbanísticos expresos, sujetos a requisitos.</li><li>Exenciones tributarias únicamente si existe norma fiscal que las establezca.</li></ul><div class="warn-box"><strong>Atención con «ICA»</strong>En la regulación de edificabilidad, ICA puede significar <b>Índice de Construcción Adicional</b>; no debe confundirse con el impuesto de industria y comercio.</div></section><section class="section-card"><span class="eyebrow">PROTECCIÓN DE MORADORES</span><h3>¿Qué garantías tienen quienes ya viven aquí?</h3><p>La búsqueda textual inicial en los articulados del proyecto 2026 y del POT 2014 no permitió localizar una <b>política integral de protección a moradores formulada con ese nombre</b>. Esto no prueba que no existan otras medidas ni descarta normas externas aplicables.</p><div class="warn-box"><strong>Hallazgo en verificación</strong>Debemos revisar programas, anexos y disposiciones complementarias para saber si hay garantías de permanencia, retorno, participación, reasentamiento y protección de residentes y actividades económicas.</div><p><b>La pregunta distributiva:</b> ¿qué obligaciones de protección a quienes habitan el área acompañan los nuevos derechos de desarrollo?</p></section><section class="section-card"><span class="eyebrow">FUENTES PRIMARIAS</span><h3>Articulados y datos</h3>${districtLink(2014)}${districtLink(2026)}<p class="source-line">Matriz «normativa_gestion.json» y «MATRIZ_REGLAS_GESTION.csv» elaboradas a partir de los articulados del proyecto. Exenciones específicas pendientes de verificar.</p></section></div></div>`;}

const RISK_TOPICS=[
{key:'amenaza',label:'Amenazas 2026',data:'amenaza2026',sub:'Zonas de movimientos en masa, inundaciones y avenidas torrenciales.'},
{key:'condicion_amenaza',label:'Condición de amenaza',data:'condicion_amenaza2026',sub:'Ámbitos que requieren precisar la amenaza y realizar estudios.'},
{key:'condicion_riesgo',label:'Condición de riesgo',data:'condicion_riesgo2026',sub:'Ámbitos que requieren evaluar vulnerabilidad, exposición y medidas.'},
{key:'asentamientos',label:'Hábitat y asentamientos',data:'asentamientos2026',sub:'Asentamientos y alternativas de intervención propuestas.'}
];
const RISK_AREA_STATS={
 amenaza:{title:'Zonificación de amenaza · propuesta 2026',total:41916.219,rows:[['Movimientos en masa · categoría 2',18445.550],['Movimientos en masa · categoría 1',16909.584],['Movimientos en masa · categoría 3',4423.308],['Inundación · categoría 1',3121.757],['Inundación · categoría 3',2273.015],['Avenidas torrenciales · categoría 3',1139.586],['Inundación · categoría 2',884.074],['Avenidas torrenciales · categoría 1',608.476],['Avenidas torrenciales · categoría 2',328.399],['Avenidas torrenciales · categoría 0',159.292],['Inundación · categoría 0',21.241],['Movimientos en masa · categoría 0',13.671]],note:'Las categorías 0–3 son códigos cartográficos; no se interpretan automáticamente como niveles de amenaza alta, media o baja.'},
 condicion_amenaza:{title:'Áreas con condición de amenaza · propuesta 2026',total:285.515,rows:[['Movimientos en masa',274.560],['Avenidas torrenciales',9.664],['Inundación',1.291]],note:'Superficies cartografiadas donde se condicionan decisiones a estudios posteriores.'},
 condicion_riesgo:{title:'Áreas con condición de riesgo · propuesta 2026',total:1008.444,rows:[['Movimientos en masa',893.652],['Avenidas torrenciales',93.515],['Inundación',23.482]],note:'No equivale a superficie de riesgo no mitigable ni a viviendas que deban reubicarse.'},
 asentamientos:{title:'Asentamientos y condiciones de intervención · propuesta 2026',total:1155.782,rows:[['Condicionado a estudio de detalle',313.831],['No aplica',273.214],['Reubicación',171.872],['Regularización condicionada',126.298],['Condicionado a régimen normativo de PNN',123.112],['Condicionado a diseño y ejecución de obras de mitigación',69.177],['Regularización integral',63.497],['Hábitat y Vivienda Diferencial',10.859],['Riesgo no mitigable',4.319]],note:'Las categorías describen polígonos de asentamientos, no cifras de hogares o decisiones individuales.'}
};

/* Fichas AHDI de la propuesta POT 2026. Síntesis de arts. 357–358 y 541–542.
   No son transcripción literal ni decisiones administrativas individuales. */
const AHDI_DEFINITIONS={
 'Condicionado a estudio de detalle':{ambito:'AHDI urbanos y de expansión · áreas condicionadas por amenazas y riesgos',fuente:'Proyecto POT 2026, artículos 357 literal B y 358',significado:'La información disponible no permite precisar la magnitud del riesgo ni determinar si es mitigable.',implicacion:'Se requieren estudios detallados geotécnicos, hidrológicos o hidráulicos, según el fenómeno, para definir la viabilidad de permanencia y las intervenciones pertinentes.'},
 'Reubicación':{ambito:'AHDI urbanos y rurales · según el régimen aplicable',fuente:'Proyecto POT 2026, artículos 357 literal A, 358 y 541 literal A y 542',significado:'Intervención de traslado o reasentamiento cuando la permanencia no resulta viable por riesgo no mitigable u otras restricciones críticas. En el componente rural la categoría normativa es reubicación prioritaria.',implicacion:'Requiere programas y procedimientos específicos, identificación de hogares y alternativas de ubicación, junto con medidas de acompañamiento social. La etiqueta cartográfica no constituye por sí sola una decisión individual de traslado.'},
 'Regularización condicionada':{ambito:'AHDI rurales',fuente:'Proyecto POT 2026, artículos 541 literal B y 542',significado:'Asentamientos con afectaciones parciales que pueden corregirse mediante intervenciones ambientales, de infraestructura o de mitigación.',implicacion:'La regularización depende de estudios técnicos y del cumplimiento de las medidas necesarias. Pueden coexistir áreas susceptibles de regularización y predios que requieran reasentamiento.'},
 'Condicionado a régimen normativo de PNN':{ambito:'AHDI rurales en ámbito de Parque Nacional Natural',fuente:'Proyecto POT 2026, artículos 541 literal D y 542',significado:'La intervención se encuentra sometida al régimen especial del Parque Nacional Natural y a la competencia de la autoridad ambiental.',implicacion:'La autoridad competente define, conforme a sus instrumentos, acuerdos comunitarios, posibilidades de permanencia o necesidades de reubicación. El POT no equivale a una autorización automática de permanencia.'},
 'Condicionado a diseño y ejecución de obras de mitigación':{ambito:'AHDI urbanos y de expansión · áreas con riesgo mitigable',fuente:'Proyecto POT 2026, artículos 357 literal C y 358',significado:'La permanencia puede ser viable si se diseñan y ejecutan las obras necesarias para reducir las condiciones de amenaza y vulnerabilidad.',implicacion:'Durante el proceso se restringen nuevas actuaciones que aumenten la exposición. La autoridad debe verificar técnicamente la reducción del riesgo antes de avanzar en regularización o consolidación.'},
 'Regularización integral':{ambito:'AHDI urbanos y rurales · con condiciones favorables',fuente:'Proyecto POT 2026, artículo 357 parágrafo 1 y artículo 541 literal C',significado:'Intervención en asentamientos sin las restricciones críticas señaladas, con posibilidad de articularse a redes de servicios e infraestructura.',implicacion:'Permite orientar procesos de regularización urbanística y mejoramiento integral del hábitat conforme a los instrumentos y requisitos correspondientes.'},
 'Hábitat y Vivienda Diferencial':{ambito:'AHDI rurales',fuente:'Proyecto POT 2026, artículo 541 literal E',significado:'Categoría para asentamientos con particularidades territoriales y prácticas productivas que requieren reconversión y adaptación al cambio climático.',implicacion:'El Plan de Gestión del Hábitat debe precisar sus condiciones, las reglas específicas y las posibilidades de permanencia con respeto a las exigencias ambientales.'},
 'Riesgo no mitigable':{ambito:'AHDI urbanos y de expansión · áreas en riesgo no mitigable',fuente:'Proyecto POT 2026, artículos 357 literal A y 358',significado:'La permanencia no es viable porque no resulta técnicamente posible implementar medidas de reducción del riesgo suficientes.',implicacion:'La acción prioritaria es reasentamiento o reubicación mediante planes y procedimientos específicos. La identificación cartográfica no reemplaza la individualización de personas y viviendas ni los procedimientos exigibles.'}
};
function ahdiDefinitionName(name){
 if(!AHDI_DEFINITIONS[name])return htmlEscape(name);
 return '<button type="button" class="ahdi-definition-term" data-ahdi-definition="'+htmlEscape(name)+'" title="Consultar significado y fundamento normativo" aria-label="Leer definición de '+htmlEscape(name)+'">'+htmlEscape(name)+'</button>';
}
function openAhdiDefinition(name){
 const data=AHDI_DEFINITIONS[name],modal=DOM('ahdi-definition-dialog');
 if(!data||!modal)return;
 const dest=modal.querySelector('.ahdi-definition-body');
 if(!dest)return;
 dest.innerHTML='<span class="eyebrow">PROPUESTA POT 2026 · NO ADOPTADA</span><h3>'+htmlEscape(name)+'</h3><p><b>Ámbito:</b> '+htmlEscape(data.ambito)+'</p><h4>¿Qué significa?</h4><p>'+htmlEscape(data.significado)+'</p><h4>¿Qué implica?</h4><p>'+htmlEscape(data.implicacion)+'</p><p class="caption"><b>Fuente normativa:</b> '+htmlEscape(data.fuente)+'. Síntesis explicativa; la decisión sobre un asentamiento requiere los estudios, instrumentos y procedimientos pertinentes.</p>';
 if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}

const RISK_MAP_PERIODS={'2026':[{key:'amenaza',title:'Zonificación de amenazas 2026'},{key:'condicion_amenaza',title:'Condición de amenaza 2026'},{key:'condicion_riesgo',title:'Condición de riesgo 2026'},{key:'asentamientos',title:'Asentamientos e intervenciones 2026'}]};
const RISK_PERIOD_DEFAULT={'2026':'amenaza'};
function riskMapKey(year){return state['riskPeriod'+year]||RISK_PERIOD_DEFAULT[year]}
function riskCategories(key){
 return (state.leyendas?.[key]?.categorias||[]).filter(x=>key!=='asentamientos'||String(x.cat).trim().toLowerCase()!=='no aplica').map((x,i)=>({cat:String(x.cat),label:x.label||catLabel(key,x.cat),color:x.color||PALETTE[i%PALETTE.length]}));
}
function riskCatSelection(year,key){
 const cats=riskCategories(key);
 const saved=state['riskCat'+year];
 if(saved&&cats.some(x=>x.cat===saved))return saved;
 // De entrada se representa una sola categoria para que sea reconocible.
 const initial=key==='amenaza'?(cats.find(x=>x.cat==='1|2')||cats[0]):cats[0];
 return initial?.cat||'';
}
function renderRiskBarPanel(year){
 const key=riskMapKey(year),d=RISK_AREA_STATS[key];
 if(!d)return '<div class="risk-bar-panel"><h4>Distribución por superficie</h4><p class="caption">Consulta las delimitaciones de esta capa en el mapa. El proyecto no incluye una tabla distrital de hectáreas desagregadas para esta selección.</p></div>';
 const max=Math.max(1,...d.rows.map(x=>x[1]));
 const cats=riskCategories(key),active=riskCatSelection(year,key);
 const clean=x=>String(x||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(' (')[0].trim();
 const visibleRows=key==='asentamientos'?d.rows.filter(r=>String(r[0]).trim().toLowerCase()!=='no aplica'):d.rows;
 const rows=visibleRows.map((r,i)=>{
  const matched=key==='amenaza'?cats.find(x=>{const m=String(r[0]).match(/^(Movimientos en masa|Avenidas torrenciales|Inundación) · categoría (\d)/);if(!m)return false;return String(x.cat)===({'Movimientos en masa':'1','Avenidas torrenciales':'2','Inundación':'3'}[m[1]]+'|'+m[2])}):cats.find(x=>clean(x.label)===clean(r[0])||clean(x.label).startsWith(clean(r[0])));
  const selected=matched?.cat===active;
  const color=matched?.color||['#397b73','#629da0','#c58f67','#6e91b2','#9a8bb9'][i%5];
  if(key==='asentamientos')return '<div class="risk-bar-row ahdi-bar-row"><div class="risk-bar-label">'+ahdiDefinitionName(r[0])+'<b>'+fmt(r[1],1)+' ha</b></div><button type="button" class="risk-bar-track ahdi-bar-select '+(selected?'selected':'')+'" '+(matched?'data-risk-pick="'+year+'" data-risk-cat-value="'+htmlEscape(matched.cat)+'" aria-label="Mostrar '+htmlEscape(r[0])+' en el mapa"':'disabled')+'><i style="width:'+Math.max(.2,100*r[1]/max)+'%;background:'+color+'"></i></button></div>';
  return '<button type="button" class="risk-bar-row risk-bar-button '+(selected?'selected':'')+'" '+(matched?'data-risk-pick="'+year+'" data-risk-cat-value="'+htmlEscape(matched.cat)+'"':'disabled')+'><div class="risk-bar-label"><span>'+htmlEscape(r[0])+'</span><b>'+fmt(r[1],1)+' ha</b></div><div class="risk-bar-track"><i style="width:'+Math.max(.2,100*r[1]/max)+'%;background:'+color+'"></i></div></button>';
 }).join('');
 return '<div class="risk-bar-panel"><div class="risk-kpis"><div><small>Superficie única de la capa</small><strong>'+fmt(d.total,1)+' ha</strong></div></div><h4>Extensión por categoría</h4><div class="risk-district-bars">'+rows+'</div><p class="caption">'+htmlEscape(d.note)+'</p><p class="caption">Superficies en hectáreas calculadas sobre la cartografía. Los solapamientos pueden hacer que la suma de barras supere la superficie única.</p>'+(key==='asentamientos'?'<p class="caption">Se excluye «No aplica» del selector y de las barras por no describir una intervención específica. Sus registros permanecen en la superficie total de la capa; esta no es la suma de las categorías visibles. Haz clic en cada nombre para consultar su definición.</p>':'')+'</div>';
}
function renderRiskPeriodPanel(year){
 const key=riskMapKey(year),cats=riskCategories(key),current=riskCatSelection(year,key);
 const selectLayers=RISK_MAP_PERIODS[year].map(x=>'<option value="'+x.key+'" '+(key===x.key?'selected':'')+'>'+htmlEscape(x.title)+'</option>').join('');
 const selectCategories=cats.map(x=>'<option value="'+htmlEscape(x.cat)+'" '+(current===x.cat?'selected':'')+'>'+htmlEscape(x.label)+'</option>').join('');
 return '<article class="risk-period-panel risk-period-'+year+'"><div class="risk-period-heading"><span class="eyebrow">'+'PROPUESTA POT · NO ADOPTADA'+'</span><h3>'+year+'</h3></div><label class="risk-control-label">Tema cartográfico<select class="risk-period-select" data-risk-period="'+year+'">'+selectLayers+'</select></label><label class="risk-control-label">Categoría a mostrar<select class="risk-category-select" data-risk-category="'+year+'">'+selectCategories+'</select></label><div class="risk-legend-selection"><i style="background:'+(cats.find(x=>x.cat===current)?.color||'#9f8271')+'"></i><span>'+(key==='asentamientos'?ahdiDefinitionName(cats.find(x=>x.cat===current)?.label||''):htmlEscape(cats.find(x=>x.cat===current)?.label||'Cargando categorías…'))+'</span></div><div class="risk-period-map" id="risk-map-'+year+'" role="img" aria-label="Vista cartográfica fija del POT '+year+'"></div><p class="caption" id="risk-map-status-'+year+'">Cargando superficie cartográfica…</p>'+renderRiskBarPanel(year)+'</article>';
}
function renderRiskDistrictDashboard(){return '<div class="risk-dash"><div class="risk-dash-header"><span class="eyebrow">PROPUESTA POT 2026</span><h3>Amenazas, condiciones de riesgo y asentamientos</h3><p>Los mapas y estadísticas de esta sección corresponden únicamente a la cartografía del proyecto 2026. Las categorías requieren el estudio de cada fenómeno.</p></div><div class="risk-period-grid risk-period-grid-single">'+renderRiskPeriodPanel('2026')+'</div><dialog id="ahdi-definition-dialog" class="ahdi-definition-dialog" aria-label="Definición de intervención en AHDI"><div class="ahdi-definition-head"><strong>Asentamientos e intervenciones 2026</strong><button type="button" data-ahdi-close aria-label="Cerrar definición">×</button></div><div class="ahdi-definition-body"></div></dialog></div>';}
const riskPanelMaps={'2026':null},riskPanelSeq={'2026':0};
function destroyRiskPanelMaps(){
 for(const year of ['2026']){riskPanelSeq[year]++;if(riskPanelMaps[year]){riskPanelMaps[year].remove();riskPanelMaps[year]=null;}}
}
async function renderRiskPanelMap(year){
 const host=DOM('risk-map-'+year);if(!host||!window.L)return;
 if(riskPanelMaps[year]){riskPanelMaps[year].remove();riskPanelMaps[year]=null;}
 const key=riskMapKey(year),category=riskCatSelection(year,key),status=DOM('risk-map-status-'+year),seq=++riskPanelSeq[year];
 const map=L.map(host,{preferCanvas:true,zoomControl:false,scrollWheelZoom:false,doubleClickZoom:false,dragging:false,keyboard:false,touchZoom:false,boxZoom:false,attributionControl:true}).setView([3.43,-76.54],10);
 riskPanelMaps[year]=map;
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
 if(status)status.textContent='Cargando categoría seleccionada…';
 try{
  const data=await getGeo(key);if(seq!==riskPanelSeq[year]||riskPanelMaps[year]!==map)return;
  const features=data.features.filter(f=>String(groupCat(key,f.properties||{}))===category);
  const color=riskCategories(key).find(x=>x.cat===category)?.color||'#bb7162';
  const layer=L.geoJSON({type:'FeatureCollection',features},{renderer:L.canvas({padding:.12}),style:{color,weight:1,opacity:.9,fillColor:color,fillOpacity:.69},interactive:false}).addTo(map);
  // Escala territorial común aproximada para comparar localizaciones sin acercamientos automáticos.
  map.setView([3.43,-76.54],10,{animate:false});
  if(status)status.textContent=fmt(features.length)+' polígonos de la categoría seleccionada · Vista cartográfica fija';
  setTimeout(()=>{if(riskPanelMaps[year]===map)map.invalidateSize()},50);
 }catch(e){if(status)status.textContent='No fue posible cargar esta categoría.';console.error(e)}
}
function bindRiskPeriodControls(root){
 root.querySelectorAll('[data-risk-period]').forEach(sel=>sel.addEventListener('change',()=>{
  const year=sel.dataset.riskPeriod;state['riskPeriod'+year]=sel.value;state['riskCat'+year]=null;renderRiesgo();
 }));
 root.querySelectorAll('[data-risk-category]').forEach(sel=>sel.addEventListener('change',()=>{
  state['riskCat'+sel.dataset.riskCategory]=sel.value;renderRiesgo();
 }));
 root.querySelectorAll('[data-risk-pick]').forEach(btn=>btn.addEventListener('click',()=>{
  state['riskCat'+btn.dataset.riskPick]=btn.dataset.riskCatValue;renderRiesgo();
 }));
 root.querySelectorAll('[data-ahdi-definition]').forEach(btn=>btn.addEventListener('click',()=>openAhdiDefinition(btn.dataset.ahdiDefinition)));
 root.querySelector('[data-ahdi-close]')?.addEventListener('click',()=>root.querySelector('#ahdi-definition-dialog')?.close());
 if(state.page==='riesgo'){renderRiskPanelMap('2026');}
}

/* Microzonificación ilustrativa: mapa MZSC-RS2 digitalizado sin certificación; estimaciones 100 m */
const MICRO_INFO={
'1':['Cerros','Roca y materiales intermedios; respuesta ligada a propiedades del terreno y topografía.'],
'2':['Flujos y suelo residual','Materiales de flujo y suelos residuales, con respuesta dependiente de sus propiedades dinámicas.'],
'3':['Piedemonte','Franja entre ladera y depósitos aluviales; pueden presentarse amplificaciones por cambios topográficos y de materiales.'],
'4A':['Abanico medio de Cali','Depósitos del abanico aluvial medio de Cali.'],
'4B':['Abanico distal de Cali y Menga','Depósitos distales con respuesta influida por estratigrafía y periodos del suelo.'],
'4C':['Abanico de Cañaveralejo','El estudio señala amplificaciones espectrales relevantes asociadas a espesores y rigidez de depósitos.'],
'4D':['Abanico de Meléndez y Lili','Depósitos aluviales de Meléndez y Lili con parámetros sísmicos específicos.'],
'4E':['Abanico de Pance','Depósitos aluviales de Pance con respuesta geotécnica particular.'],
'5':['Transición abanicos–llanura','Transición hacia la llanura aluvial; algunos depósitos pueden requerir análisis de licuación.'],
'6':['Llanura aluvial','Depósitos aluviales de planicie, con sectores susceptibles a licuación que requieren estudios particulares.']
};
const MICRO_TREAT={'1':'Conservación de sectores urbanos','2':'Conservación contextual','3':'Consolidación urbanística (C1)','4':'Consolidación básica (C2)','5':'Consolidación moderada (C3)','6':'Consolidación por cambio de patrón (C4)','7':'Desarrollo en expansión (D1)','8':'Desarrollo urbano (D2)','9':'Mejoramiento integral','10':'Renovación / redensificación alta (R1)','11':'Renovación / redensificación media (R2)','12':'No aplica'};
const MICRO_KEYS=Object.keys(MICRO_INFO);let microMap=null;
function destroyMicroMap(){if(microMap){microMap.remove();microMap=null}}
function microZone(){return MICRO_INFO[state.microzoneSelected]?state.microzoneSelected:'4C'}

function renderMicrozoneSection(){
 const z=microZone(),meta=MICRO_INFO[z],stats=state.microzonaTratamientos?.resultado?.find(r=>r.zona===z);
 const opts=MICRO_KEYS.map(k=>'<option value="'+k+'" '+(z===k?'selected':'')+'>Zona '+k+' · '+htmlEscape(MICRO_INFO[k][0])+'</option>').join('');
 const treatments=(stats?.tratamientos||[]).filter(r=>r.ha_estimadas>0).map(r=>'<div class="micro-treatment-row"><span class="micro-treatment-label">'+htmlEscape(MICRO_TREAT[r.codigo]||r.codigo)+'</span><b>≈ '+fmt(r.ha_estimadas)+' ha</b></div>').join('');
 const microLegend='<div class="micro-legend" aria-label="Leyenda de microzonificación sísmica"><h4>Leyenda de microzonificación sísmica</h4><div class="micro-legend-grid">'+MICRO_KEYS.map(k=>'<div class="micro-legend-item"><i class="micro-legend-swatch" style="background:'+calcColor('microzonas_aproximadas',String(k),0)+'" aria-hidden="true"></i><span>Zona '+htmlEscape(k)+' · '+htmlEscape(MICRO_INFO[k][0])+'</span></div>').join('')+'</div><p class="caption">Colores de las microzonas representadas en el mapa. La zona seleccionada se destaca además con un contorno oscuro.</p></div>';
  const b=state.selected,bz=b&&state.microzonasBarrio?.barrios?.[String(b.properties.codigo||'')];const local=b?'<p><b>Microzonas digitalizadas en '+htmlEscape(b.properties.barrio)+':</b> '+(bz?.zonas?.length?bz.zonas.map(v=>'zona '+htmlEscape(v.zona)+' ≈ '+fmt(v.hectareas,1)+' ha').join(' · '):'sin coincidencias registradas; no implica ausencia de zonificación')+'</p>':'';
 return '<section class="section-card microzone-section"><span class="eyebrow">SUBCAPÍTULO · RESPUESTA SÍSMICA LOCAL</span><h3>Microzonificación sísmica y tratamientos urbanísticos propuestos</h3><p>La microzonificación distingue <b>tipos de respuesta del subsuelo</b>, no niveles ordinales de riesgo. Se utiliza una digitalización aproximada del mapa MZSC-RS2, asociado al Decreto 411.0.20.0158 de 2014, para contrastarla con los tratamientos de la <b>propuesta POT 2026</b>.</p><div class="v7-note"><b>Precaución indispensable:</b> los límites sísmicos digitalizados no son geometrías oficiales certificadas. Las estadísticas se estimaron con una malla de 100 × 100 m y capas GeoJSON simplificadas; no sirven para licencias, clasificación predial de riesgo o diseño estructural.</div><label class="risk-control-label">Selecciona una zona<select class="risk-category-select" id="microzone-select">'+opts+'</select></label><div class="micro-layout"><div><div id="microzone-map" class="micro-map" aria-label="Mapa orientativo de microzonas sísmicas y tratamientos 2026"></div>'+microLegend+'</div><div class="surface-card"><span class="eyebrow">MICROZONA '+z+'</span><h4>'+htmlEscape(meta[0])+'</h4><p>'+htmlEscape(meta[1])+'</p><h4>Tratamientos 2026 estimados en esta microzona</h4><div class="micro-treatment-list">'+(treatments||'<p>Sin intersecciones muestreadas.</p>')+'</div><p class="caption">Hectáreas estimadas mediante muestreo; no son una intersección vectorial exacta. Los tratamientos fuera de cobertura no deben interpretarse como ausencia de regulación.</p></div></div><h4>¿Qué significa cada zona?</h4><div class="micro-zone-guide">'+MICRO_KEYS.map(k=>'<article><b>Zona '+k+' · '+htmlEscape(MICRO_INFO[k][0])+'</b><p>'+htmlEscape(MICRO_INFO[k][1])+'</p></article>').join('')+'</div>'+local+'<p class="caption">Fuentes: <a href="https://web1.cali.gov.co/publico2/documentos/dagma/estudios_ambientales/CONTRATO022002/TOMO6CONVENIO022002.pdf" target="_blank" rel="noopener">INGEOMINAS–DAGMA, tabla 8.1 y conclusiones</a>; <a href="https://aivalle.com/pdf/Decreto_Marzo_del_2014_-_Adopta_la_MZS_Cali.pdf" target="_blank" rel="noopener">Decreto 0158/2014</a>; <code>data/microzonas_aproximadas.geojson</code> y <code>data/tratamientos.geojson</code>.</p></section>';
}
async function drawMicroMap(){
 const host=DOM('microzone-map');if(!host||!window.L)return;
 destroyMicroMap();const z=microZone(),map=L.map(host,{preferCanvas:true,scrollWheelZoom:false}).setView([3.43,-76.54],11);microMap=map;
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
 try{
  const [micro,trat]=await Promise.all([getGeo('microzonas_aproximadas'),getGeo('tratamientos')]);if(microMap!==map)return;
  L.geoJSON(micro,{style:f=>({color:'#7c7890',weight:.6,fillColor:calcColor('microzonas_aproximadas',String(f.properties.zona),0),fillOpacity:.35}),onEachFeature:(f,l)=>l.bindTooltip('Zona '+htmlEscape(f.properties.zona)+' · aproximada')}).addTo(map);
  L.geoJSON(trat,{style:f=>({color:calcColor('tratamientos',String(f.properties.tutipo),0),weight:1,fillOpacity:0,opacity:.8}),interactive:false}).addTo(map);
  const hi=L.geoJSON({type:'FeatureCollection',features:micro.features.filter(f=>String(f.properties.zona)===z)},{style:{color:'#302d45',weight:2.5,fillColor:'#d0a85a',fillOpacity:.2},interactive:false}).addTo(map);
  if(hi.getBounds().isValid())map.fitBounds(hi.getBounds(),{maxZoom:13,padding:[20,20]});setTimeout(()=>{if(microMap===map)map.invalidateSize()},100);
 }catch(e){console.error(e);host.textContent='Mapa interactivo no disponible. Consulta la imagen orientativa inferior.'}
}
function bindMicrozoneSection(root){root.querySelector('#microzone-select')?.addEventListener('change',e=>{state.microzoneSelected=e.target.value;renderRiesgo()});drawMicroMap()}


/* Intersecciones territoriales por barrio con GeoJSON de consulta.
   Se calcula al seleccionar barrio, nunca se extrapola a predios.
   Turf 6.5.0: recortes y disoluciones en cada categoría; se muestran fallas. */
let barrioRiskSerial=0;
const barrioRiskCache=new Map();
const BARRIO_PHENOM={'1':'Movimientos en masa','3':'Inundación','2':'Avenidas torrenciales'};
const BARRIO_LEVELS={'1':'Amenaza alta','2':'Amenaza media','3':'Amenaza baja','0':'Otra condición (código 0)'};
function barrioRiskCategoryColor(key,cat){
 return key==='amenaza'?calcColor('amenaza',cat,0):(riskCategories(key).find(c=>c.cat===cat)?.color||'#788e9a');
}
function barrioRiskSummaryBar(label,ha,pct,color){
 return '<div class="barrio-risk-summary-row"><div><strong>'+htmlEscape(label)+'</strong><span>'+fmt(ha,2)+' ha · '+fmt(pct,2)+' % del barrio</span></div><div class="barrio-risk-track"><i style="background:'+color+';width:'+Math.max(0,Math.min(100,pct))+'%"></i></div></div>';
}
function barrioRiskSvg(barrio,parts,title,subtitle){
 /* Un JPG sin teselas externas garantiza reproducibilidad y evita restricciones CORS. */
 const t=window.turf,bb=t.bbox(barrio),lat=(bb[1]+bb[3])/2,cos=Math.cos(lat*Math.PI/180);
 const spanX=Math.max(.000001,(bb[2]-bb[0])*cos),spanY=Math.max(.000001,bb[3]-bb[1]);
 const scale=Math.min(680/spanX,410/spanY),cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2;
 const xy=p=>[(450+(p[0]-cx)*cos*scale).toFixed(2),(273-(p[1]-cy)*scale).toFixed(2)];
 function path(g){
  const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);
  return polys.map(poly=>poly.map(r=>r.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ')+' Z').join(' ')).join(' ');
 }
 const background='<rect x="0" y="0" width="900" height="650" fill="#ffffff"/><rect x="42" y="89" width="816" height="440" rx="12" fill="#f7f7f8" stroke="#e5e2ea"/>';
 const shape='<path d="'+path(barrio.geometry)+'" fill="#e8e7ee" stroke="#3a3658" stroke-width="2.1" fill-rule="evenodd"/>';
 const fills=parts.map(p=>'<path d="'+path(p.geometry.geometry)+'" fill="'+p.color+'" fill-opacity=".73" stroke="'+p.color+'" stroke-width="1.1" fill-rule="evenodd"/>').join('');
 const outline='<path d="'+path(barrio.geometry)+'" fill="none" stroke="#342e55" stroke-width="2.8"/>';
 const legend=parts.map((p,i)=>'<rect x="'+(56+i%2*405)+'" y="'+(546+Math.floor(i/2)*24)+'" width="13" height="13" rx="2" fill="'+p.color+'"/><text x="'+(76+i%2*405)+'" y="'+(557+Math.floor(i/2)*24)+'" font-family="Arial" font-size="12" fill="#403a55">'+htmlEscape(p.label)+'</text>').join('');
 const footer='<text x="55" y="635" font-family="Arial" font-size="10" fill="#6b6873">GeoJSON de consulta 2026 · intersección aproximada · no válido para decisión predial</text>';
 const tt='<text x="52" y="40" font-family="Arial" font-size="22" font-weight="bold" fill="#302c52">'+htmlEscape(title)+'</text><text x="52" y="65" font-family="Arial" font-size="14" fill="#6a6475">'+htmlEscape(subtitle)+'</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650">'+background+tt+shape+fills+outline+legend+footer+'</svg>';
}
async function barrioRiskIntersect(barrio,key){
 const t=window.turf;if(!t||typeof t.intersect!=='function'||typeof t.union!=='function')throw Error('Motor SIG no disponible');
 const gj=await getGeo(key);if(!Array.isArray(gj.features))throw Error('GeoJSON incompleto');
 const b=t.bbox(barrio),bArea=t.area(barrio)/10000;if(!(bArea>0))throw Error('Área barrial no válida');
 const byCat=new Map();let errors=0;
 for(const f of gj.features){
  if(key==='asentamientos'&&String(f.properties?.ahdiobs||'').toLowerCase()==='no aplica')continue;
  try{
   const box=t.bbox(f);if(box[2]<=b[0]||box[0]>=b[2]||box[3]<=b[1]||box[1]>=b[3])continue;
   const cut=t.intersect(barrio,f);if(!cut||t.area(cut)<100)continue;
   const cat=String(groupCat(key,f.properties||{}));if(!byCat.has(cat))byCat.set(cat,[]);byCat.get(cat).push(cut);
  }catch(e){errors++}
 }
 const rows=[];
 for(const [cat,pieces] of byCat){
  let geom=pieces[0],failed=false;
  for(let i=1;i<pieces.length;i++){
   try{geom=t.union(geom,pieces[i]);if(!geom){failed=true;break}}catch(e){failed=true;break}
  }
  if(failed){errors++;continue}
  const ha=t.area(geom)/10000;if(ha<.01)continue;
  if(!Number.isFinite(ha)||ha>bArea*1.002){errors++;continue}
  rows.push({cat,ha,pct:100*ha/bArea,geometry:geom,color:barrioRiskCategoryColor(key,cat),label:catLabel(key,cat)});
 }
 return {rows:rows.sort((a,b)=>b.ha-a.ha),errors,bArea};
}
function barrioRiskCard(title,subtitle,barrio,rows,code){
 const relevant=rows.filter(r=>r.ha>=.01),empty=relevant.length===0;
 if(empty)return '<section class="barrio-risk-card"><h4>'+htmlEscape(title)+'</h4><p class="barrio-risk-empty">No se registran intersecciones cartográficas de esta categoría en el barrio (umbral: 0,01 ha). Esto no equivale a ausencia de amenaza.</p></section>';
 const parts=relevant.map(r=>({geometry:r.geometry,color:r.color,label:r.shortLabel||r.label}));
 const svg=barrioRiskSvg(barrio,parts,barrio.properties.barrio,title+' · propuesta 2026');
 const mapId='risk-export-'+code+'-'+title.normalize('NFD').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
 const bars=relevant.map(r=>barrioRiskSummaryBar(r.shortLabel||r.label,r.ha,r.pct,r.color)).join('');
 return '<section class="barrio-risk-card"><h4>'+htmlEscape(title)+'</h4><p class="caption">'+htmlEscape(subtitle)+'</p><div class="barrio-risk-layout"><div class="barrio-risk-svg" id="'+mapId+'">'+svg+'</div><div class="barrio-risk-values">'+bars+'</div></div><button type="button" class="small-btn barrio-risk-download" data-risk-svg="'+mapId+'" data-risk-file="'+htmlEscape(barrio.properties.barrio+'-'+title)+'">Descargar mapa JPG</button></section>';
}
function renderBarrioRiskResult(key,result,barrio,code){
 let html='';
 if(key==='amenaza'){
  for(const fen of ['1','3','2']){
   const subset=result.rows.filter(r=>r.cat.split('|')[0]===fen).map(r=>({...r,shortLabel:BARRIO_LEVELS[r.cat.split('|')[1]]||r.label}))
    .sort((a,b)=>({'1':0,'2':1,'3':2,'0':3}[a.cat.split('|')[1]]??4)-({'1':0,'2':1,'3':2,'0':3}[b.cat.split('|')[1]]??4));
   if(subset.length)html+=barrioRiskCard(BARRIO_PHENOM[fen],'Niveles de amenaza que intersectan el barrio',barrio,subset,code);
   else html+='<section class="barrio-risk-card"><h4>'+BARRIO_PHENOM[fen]+'</h4><p class="barrio-risk-empty">No se registra intersección cartográfica de este fenómeno en el barrio.</p></section>';
  }
 }else html+=barrioRiskCard((RISK_TOPICS.find(x=>x.key===key)?.label||key),'Ámbitos cartografiados que intersectan el barrio',barrio,result.rows,code);
 if(key==='amenaza')html+=renderBarrioMicrozoneCard(barrio,code);
 const alert=result.errors?'<p class="barrio-risk-warning">Atención: '+result.errors+' geometrías no pudieron procesarse. Este cruce es incompleto y no se pueden descartar otras coincidencias.</p>':'';
 return '<div class="barrio-risk-report">'+alert+html+'<p class="caption">Porcentajes calculados sobre la superficie total del barrio seleccionado. La unión por categoría evita sumar dos veces superposiciones internas, pero diferentes fenómenos y categorías pueden coincidir entre sí. Fuente: GeoJSON simplificados de la propuesta POT 2026; cálculos exploratorios, no certificaciones prediales.</p></div>';
}
function renderBarrioMicrozoneCard(barrio,code){
 const data=state.microzonasBarrio,rec=data?.barrios?.[code],zones=(rec?.zonas||[]).filter(z=>Number(z.hectareas)>0);
 if(!data)return '<section class="barrio-risk-card"><h4>Microzonificación sísmica</h4><p>Información de cruce sísmico no disponible.</p></section>';
 if(!zones.length)return '<section class="barrio-risk-card"><h4>Microzonificación sísmica</h4><p>No hay intersecciones registradas en la digitalización disponible. No significa ausencia de respuesta sísmica.</p></section>';
 const rows=zones.map(z=>({cat:String(z.zona),ha:Number(z.hectareas),pct:Number(z.porcentaje_barrio),color:calcColor('microzonas_aproximadas',String(z.zona),0),label:'Zona '+z.zona+' · '+(MICRO_INFO[z.zona]?.[0]||'')})).sort((a,b)=>b.ha-a.ha);
 const chart=rows.map(r=>barrioRiskSummaryBar(r.label,r.ha,r.pct,r.color)).join('');
 return '<section class="barrio-risk-card"><h4>Microzonificación sísmica</h4><p class="caption">Respuesta local del suelo; no es una escala de niveles de riesgo sísmico. Mapa digitalizado aproximado.</p><div class="barrio-risk-micro-preview" id="barrio-risk-micro-preview"><p class="caption">Preparando representación geográfica de las microzonas coincidentes…</p></div><div class="barrio-risk-values">'+chart+'</div><p class="caption">Las hectáreas y porcentajes proceden del cruce previo en EPSG:9377. Linderos digitalizados no certificados.</p></section>';
}
async function loadBarrioMicroMap(barrio,code){
 const host=DOM('barrio-risk-micro-preview');if(!host)return;
 try{
  const t=window.turf,gj=await getGeo('microzonas_aproximadas'),bb=t.bbox(barrio),pieces=[];
  const names=new Set((state.microzonasBarrio?.barrios?.[code]?.zonas||[]).map(z=>String(z.zona)));
  for(const feat of gj.features){
   const z=String(feat.properties?.zona);if(!names.has(z))continue;
   try{const fb=t.bbox(feat);if(fb[0]>=bb[2]||fb[2]<=bb[0]||fb[1]>=bb[3]||fb[3]<=bb[1])continue;
    const cut=t.intersect(barrio,feat);if(cut&&t.area(cut)>100)pieces.push({geometry:cut,color:calcColor('microzonas_aproximadas',z,0),label:'Zona '+z+' · '+(MICRO_INFO[z]?.[0]||'')});
   }catch(e){console.warn('Microzona',e)}
  }
  if(!host.isConnected||String(state.selected?.properties.codigo)!==code)return;
  if(!pieces.length){host.innerHTML='<p class="caption">No fue posible representar las intersecciones de las microzonas; se mantienen las superficies calculadas previamente.</p>';return}
  const id='risk-export-'+code+'-sismica';
  host.innerHTML='<div class="barrio-risk-svg" id="'+id+'">'+barrioRiskSvg(barrio,pieces,barrio.properties.barrio,'Microzonificación sísmica · digitalización orientativa')+'</div><button type="button" class="small-btn barrio-risk-download" data-risk-svg="'+id+'" data-risk-file="'+htmlEscape(barrio.properties.barrio+'-microzonificacion-sismica')+'">Descargar mapa JPG</button>';
  bindBarrioRiskDownloads(host);
 }catch(e){host.textContent='No fue posible producir la representación gráfica de microzonificación.';console.error(e)}
}
function bindBarrioRiskDownloads(root){
 root.querySelectorAll('[data-risk-svg]').forEach(btn=>btn.addEventListener('click',()=>{
  const svg=DOM(btn.dataset.riskSvg)?.querySelector('svg');if(!svg)return;
  const xml=new XMLSerializer().serializeToString(svg),blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
  const img=new Image();img.onload=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1300;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1800,1300);ctx.drawImage(img,0,0,1800,1300);
   const a=document.createElement('a');a.download=(btn.dataset.riskFile||'barrio-riesgo').normalize('NFD').replace(/[^a-zA-Z0-9_-]+/g,'_')+'.jpg';a.href=canvas.toDataURL('image/jpeg',.94);a.click();
  }finally{URL.revokeObjectURL(url)}};img.onerror=()=>{URL.revokeObjectURL(url);alert('No se pudo exportar el mapa JPG.')};img.src=url;
 }));
}
let barrioRiskSeq=0;
const barrioRiskGeoCache=new Map();
async function updateBarrioRiskPanel(){
 const host=DOM('barrio-risk-intersections'),sel=state.selected;if(!host||!sel)return;
 const key=state.riskTopic||'amenaza',code=String(sel.properties.codigo),token=++barrioRiskSeq,cache=code+'|'+key;
 host.innerHTML='<p class="caption">Calculando intersecciones geográficas y porcentajes por barrio…</p>';
 try{
  const result=barrioRiskGeoCache.has(cache)?barrioRiskGeoCache.get(cache):await barrioRiskIntersect(sel,key);
  barrioRiskGeoCache.set(cache,result);
  if(token!==barrioRiskSeq||!host.isConnected||String(state.selected?.properties.codigo)!==code||state.riskTopic!==key)return;
  host.innerHTML=renderBarrioRiskResult(key,result,sel,code);
  bindBarrioRiskDownloads(host);
  if(key==='amenaza')loadBarrioMicroMap(sel,code);
 }catch(e){if(token!==barrioRiskSeq||!host.isConnected)return;host.innerHTML='<p class="barrio-risk-warning">No fue posible calcular el cruce con la cartografía disponible. No se interpreta como ausencia de amenaza. Comprueba que se hayan cargado las capas y el motor SIG.</p>';console.error('Cruce barrio',e)}
}

function renderRiesgo(){
 const root=DOM('riesgo-content');if(!root)return;
 destroyRiskPanelMaps();destroyMicroMap();
 const actual=state.riskTopic||'amenaza';const chosen=RISK_TOPICS.find(x=>x.key===actual)||RISK_TOPICS[0];
 const info=barrioInfo(),selected=state.selected,code=String(selected?.properties?.codigo||'');

 const counts=[
  ['Amenazas propuestas',state.leyendas?.amenaza?.count,'polígonos', 'amenaza'],
  ['Condiciones de riesgo',state.leyendas?.condicion_riesgo?.count,'polígonos', 'condicion_riesgo'],
  ['Asentamientos cartografiados',state.leyendas?.asentamientos?.count,'polígonos', 'asentamientos']
 ].filter(x=>Number.isFinite(Number(x[1])));
 const facts=counts.map(x=>'<article class="surface-card"><small class="eyebrow">'+htmlEscape(x[0])+'</small><h3>'+fmt(x[1])+'</h3><p class="caption">'+x[2]+' en la cartografía de la propuesta 2026. No son habitantes, viviendas ni hectáreas.</p><button class="small-btn" data-risk-layer="'+x[3]+'">Ver capa en el mapa</button></article>').join('');
 const local=selected?'<div class="surface-card"><span class="eyebrow">CONSULTA TERRITORIAL</span><h3>'+htmlEscape(chosen.label)+' en '+htmlEscape(selected.properties.barrio)+'</h3><p>'+htmlEscape(chosen.sub)+'</p><div id="barrio-risk-intersections" aria-live="polite"></div></div>':'<div class="surface-card"><h3>Selecciona un barrio</h3><p>Busca el barrio en la barra superior; se mostrarán los cruces con amenazas y microzonificación, con superficies y porcentajes.</p></div>';
 root.innerHTML='<div class="opening-card risk-concepts-intro"><span class="eyebrow">MARCO CONCEPTUAL Y NORMATIVO DE LA GESTIÓN DEL RIESGO</span><h3>¿Qué representan los mapas de amenaza y de condiciones de amenaza y riesgo?</h3><p>La propuesta POT 2026 distingue tres tipos de delimitaciones que <b>no son equivalentes</b>. Su interpretación depende de las definiciones nacionales y de los estudios que sustentan cada capa.</p><div class="risk-legal-grid"><article><h4>1. Amenaza</h4><p>Es el peligro latente asociado a un evento físico que puede presentarse con intensidad suficiente para causar daños y pérdidas. Su cartografía permite delimitar y categorizar la amenaza de cada fenómeno, pero <b>no equivale a una evaluación del riesgo de las construcciones o personas expuestas</b>.</p><small>Fuente: Ley 1523 de 2012, art. 4, definición de amenaza; Decreto 1077 de 2015, art. 2.2.2.1.3.1.3.</small></article><article><h4>2. Área con condición de amenaza</h4><p>Corresponde a un área de <b>amenaza alta o media</b> donde el POT contempla clasificar suelo urbano, de expansión urbana, rural suburbano o centros poblados rurales para permitir su desarrollo. Deben identificarse las condiciones y estudios detallados requeridos antes de desarrollar el ámbito.</p><small>Fuente: Decreto 1077 de 2015, art. 2.2.2.1.3.1.3, parágrafo 1; compilación del Decreto 1807 de 2014, art. 3.</small></article><article><h4>3. Área con condición de riesgo</h4><p>Corresponde a un área clasificada con <b>amenaza alta</b> que ya está urbanizada, ocupada o edificada, o en la que existen vías, equipamientos o infraestructura de servicios públicos. Los estudios detallados deben precisar el riesgo y las medidas pertinentes.</p><small>Fuente: Decreto 1077 de 2015, art. 2.2.2.1.3.1.3, parágrafo 1; compilación del Decreto 1807 de 2014, art. 3.</small></article></div><div class="v7-note"><b>Distinción esencial:</b> estar delimitado como área con condición de riesgo <b>no significa automáticamente riesgo alto no mitigable</b>. La categoría señala un ámbito que requiere análisis detallado para establecer su nivel de riesgo, viabilidad de mitigación y medidas de ordenamiento. Tampoco debe confundirse la microzonificación sísmica —que caracteriza respuesta local del suelo— con una zonificación de riesgo sísmico.</div><p class="risk-legal-sources"><b>Normas consultadas:</b> <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=59488" target="_blank" rel="noopener noreferrer">Decreto 1807 de 2014, art. 3</a> · <a href="https://normograma.sena.edu.co/compilacion/docs/decreto_1077_2015_pr021.htm" target="_blank" rel="noopener noreferrer">Decreto 1077 de 2015, art. 2.2.2.1.3.1.3</a> · <a href="https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/ley_1523_2012.htm" target="_blank" rel="noopener noreferrer">Ley 1523 de 2012, art. 4</a>.</p></div>'+
 '<section class="section-card risk-panorama"><span class="eyebrow">Amenaza y riesgo EN CALI</span>'+renderRiskDistrictDashboard()+'</section>'+
 renderMicrozoneSection()+'<section class="section-card"><span class="eyebrow">HÁBITAT Y VIVIENDA</span><h3>¿Qué alternativas de intervención identifica el POT?</h3><p>En los polígonos de asentamientos aparecen categorías de regularización, estudios detallados, obras de mitigación, reubicación y otras condiciones de manejo. Sus superficies se pueden comparar en el gráfico de arriba seleccionando «Hábitat y asentamientos».</p><button class="small-btn" data-risk-layer="asentamientos">Explorar asentamientos en el mapa territorial</button></section>'+
 (selected?selectedBadge():'')+
 '<section class="section-card"><span class="eyebrow">FICHA DEL BARRIO</span><h3>¿Qué se identifica en tu territorio?</h3><p>Selecciona una categoría para consultar su distribución en el barrio y verla en el mapa.</p><div class="topic-tabs">'+RISK_TOPICS.map(x=>'<button type="button" class="'+(x.key===chosen.key?'selected':'')+'" data-risk-topic="'+x.key+'">'+htmlEscape(x.label)+'</button>').join('')+'</div>'+local+'<div class="v7-note"><b>Cómo interpretar el mapa:</b> las categorías de distintos fenómenos y estudios no son directamente equivalentes. Un área con condición de riesgo no es automáticamente suelo de riesgo no mitigable.</div><button class="btn btn-dark" data-risk-layer="'+chosen.key+'">Ver '+htmlEscape(chosen.label.toLowerCase())+' en el mapa territorial →</button></section>'+
 '';
 root.querySelectorAll('[data-risk-topic]').forEach(b=>b.addEventListener('click',()=>{state.riskTopic=b.dataset.riskTopic;renderRiesgo()}));
 bindRiskPeriodControls(root);
 bindMicrozoneSection(root);
 if(selected)updateBarrioRiskPanel();
}
async function loadData(){const keys=[['barrios','barrios.geojson'],['resumen','resumen_barrios.json'],['normas','normativa_gestion.json'],['indicadores','indicadores2026.json'],['sueloComparacion','comparacion_suelo_2014_2026.json'],['leyendas','leyendas.json'],['transformacion','indicadores_transformacion_exploratorios.json'],['transicionesV7','transiciones_actividad_v7.json'],['usosNormaV7','lectura_normativa_usos_v7.json'],['microzonasBarrio','microzonas_por_barrio_APROXIMADAS.json'],['microzonaTratamientos','microzonas_tratamientos_2026_EXPLORATORIO.json'],['crucesRiesgoMicro2026','cruces_riesgo_microzonas_tratamientos_2026_EXPLORATORIO.json'],['tratamientosNormaV7','lectura_tratamientos_v7.json']];await Promise.all(keys.map(async ([key,file])=>{try{const r=await fetch('data/'+file+(key==='leyendas'?'?v=10.2':''));if(!r.ok)throw Error(file);const d=await r.json();if(key==='barrios'){state.barrios=d.features||[];DOM('search-info').textContent=`${state.barrios.length} barrios y sectores consultables`;}else state[key]=d;}catch(e){console.error('Error cargando',file,e);if(key==='indicadores')DOM('home-stats').innerHTML=`<p class="loading-msg">No se pudieron cargar los indicadores (${file}).</p>`;}}));if(state.leafReady)populateLegends();renderInicio();renderNorma();renderGestion();renderRiesgo();renderExtrasPortadaV7();renderNormaTopicExtras();renderExtrasGestionV7();renderExtrasRiesgoV7();if(state.leafReady)drawBarrios();}

/* V7.0 · Construcciones con fuentes independientes y limitaciones declaradas. */
const v7El=id=>document.getElementById(id);
const V7_DOMAIN=['AREA DE ACTIVIDAD RESIDENCIAL NETA','AREA DE ACTIVIDAD RESIDENCIAL PREDOMINANTE','AREA DE ACTIVIDAD MIXTA','AREA DE ACTIVIDAD INDUSTRIAL','NO APLICA'];
const V7_COLORS={'Área de proximidad':'#77a9a5','Área de integración':'#82a1c6','Área multifuncional':'#aa8ec1','Área de dinamización económica':'#cc9770','Área de manejo especial':'#9a9d90'};
function v7Bar(rows,max=7){const top=rows.slice(0,max),base=Math.max(1,...top.map(x=>x.ha));return `<div class="v7-bars">${top.map(x=>`<div class="v7-row"><div class="v7-row-label"><b>${x.desde&&x.hacia?(glossaryWord(x.desde,2014,x.desde,'actividad')+' → '+glossaryWord(x.hacia,2026,x.hacia,'actividad')):htmlEscape(x.nombre)}</b><span>${fmt(x.ha)} ha</span></div><div class="v7-bar-bg"><i style="width:${Math.max(2,100*x.ha/base)}%;background:${x.color||'#6c9b87'}"></i></div></div>`).join('')}</div>`;}

/* Vínculos directos al glosario: IDs fijados por año y figura normativa.
   No inferir equivalencia entre nombres iguales en ambos POT. */
const GLOSSARY_TREATMENT_IDS={
 2014:{Consolidación:'2014-006',Conservación:'2014-005',Desarrollo:'2014-008',Renovación:'2014-007','Mejoramiento integral':'2014-021',ND:'2014-009',INS:'2014-010','INS - SS':'2014-011',C1:'2014-015',C2:'2014-016',C3:'2014-017',R1:'2014-018',R2:'2014-019',R3:'2014-020'},
 2026:{Consolidación:'2026-trat-021',Conservación:'2026-trat-018',Desarrollo:'2026-030',Renovación:'2026-trat-026','Mejoramiento integral':'2026-029',C1:'2026-trat-022',C2:'2026-trat-023',C3:'2026-trat-024',C4:'2026-trat-025',R1:'2026-trat-027',R2:'2026-trat-028',D1:'2026-031',D2:'2026-032',CSU:'2026-trat-019',CTL:'2026-trat-020'}
};
const GLOSSARY_ACTIVITY_IDS={
 2014:{'AREA DE ACTIVIDAD RESIDENCIAL NETA':'2014-001','AREA DE ACTIVIDAD RESIDENCIAL PREDOMINANTE':'2014-002','AREA DE ACTIVIDAD MIXTA':'2014-003','AREA DE ACTIVIDAD INDUSTRIAL':'2014-004'},
 2026:{'Área de Proximidad':'2026-012','Área de Integración':'2026-013','Área Multifuncional':'2026-014','Área de Dinamización Económica':'2026-015','Área de Manejo Especial':'2026-016','PEMP Centro Histórico':'2026-pemp-centro','PEMP Cañas Gordas':'2026-pemp-canas'}
};
function glossaryWord(label,period,category,scope='tratamiento'){
 const keys=scope==='actividad'?GLOSSARY_ACTIVITY_IDS:GLOSSARY_TREATMENT_IDS;
 const id=keys[period]?.[category];
 return id?'<button type="button" class="glossary-term" data-glos-id="'+htmlEscape(id)+'" aria-label="'+(period===2014?'Definición (2014): ':'Definición propuesta (2026): ')+htmlEscape(label)+'" title="'+(period===2014?'Definición (2014)':'Definición propuesta (2026)')+'">'+htmlEscape(label)+'</button>':'<span title="Ficha normativa específica no disponible">'+htmlEscape(label)+'</span>';
}

function v7TransitionContent(rows,limit=7){return rows.slice(0,limit).map(r=>`<div class="v7-transition"><div><small>POT 2014</small><b>${glossaryWord(r.desde,2014,r.desde,'actividad')}</b></div><span aria-hidden="true">→</span><div><small>Propuesta 2026</small><b>${glossaryWord(r.hacia,2026,r.hacia,'actividad')}</b></div><strong>${fmt(r.ha)} ha</strong></div>`).join('')||'<p>No se encontraron cruces para esta selección.</p>'}
function renderExtrasPortadaV7(){const host=v7El('v7-home');if(!host||!state.transicionesV7)return;const d=state.transicionesV7;const data=d.distrital.filter(r=>r.desde!=='NO APLICA'&&r.ha>=25).sort((a,b)=>b.ha-a.ha);
 const t=d.control;const top=data.slice(0,8).map(x=>({...x,nombre:`${x.desde.replace('AREA DE ACTIVIDAD ','').toLowerCase()} → ${x.hacia}`}));
 host.innerHTML=`<div class="v7-section-title"><span class="eyebrow">TRANSFORMACIÓN DE ÁREAS DE ACTIVIDAD · CRUCE GEOGRÁFICO</span><h3>¿Qué superficies cambian de vocación normativa?</h3><p>Esta comparación muestra transiciones cartográficas, no cambios automáticos de permisos comerciales. Haz clic en el nombre de cada categoría para consultar su definición normativa.</p></div><div class="v7-grid"><article class="surface-card"><h4>Mayores cruces entre categorías</h4>${v7Bar(top,8)}<p class="caption">Hectáreas de intersecciones brutas. No sumar indiscriminadamente por posibles solapamientos.</p></article><article class="surface-card"><h4>Principales transiciones</h4>${v7TransitionContent(data,5)}<button class="v7-link" data-goto="norma">Comprender el significado normativo →</button></article></div><p class="caption">Datos: GDB 2014 actualizada a 2026; GeoJSON 2026 simplificado; análisis EPSG:9377. Ninguna cifra representa hectáreas de comercio autorizado.</p>`;
}
function renderExtrasNormaV7(){const host=v7El('v7-norma');if(!host||!state.transicionesV7||!state.usosNormaV7)return;const d=state.transicionesV7,n=state.usosNormaV7,code=String(state.selected?.properties.codigo||'');const local=code?d.barrios[code]||[]:d.distrital;
 const data=local.filter(r=>r.desde!=='NO APLICA').sort((a,b)=>b.ha-a.ha);let index=0;
 host.innerHTML=`<div class="v7-section-title"><span class="eyebrow">FICHA DE USOS · ARTICULADOS 2014 Y 2026</span><h3>${state.selected?'Transiciones en '+htmlEscape(state.selected.properties.barrio):'¿Qué permiten las categorías de actividad?'}</h3><p>El cambio cartográfico se lee junto con las definiciones y los usos condicionados de cada norma.</p></div><div class="v7-grid"><section class="surface-card"><h4>Transiciones territoriales ${state.selected?'del barrio':'más extensas del distrito'}</h4>${v7TransitionContent(data,9)}<p class="caption">Intersecciones de categorías, no conversiones automáticas a comercio. Datos exploratorios con geometrías simplificadas.</p></section><section class="surface-card"><h4>¿Qué significa la transición seleccionada?</h4><label class="v7-select-label" for="v7-transition-select">Seleccione una transición</label><select id="v7-transition-select" class="v7-select">${data.slice(0,50).map((x,i)=>`<option value="${i}">${htmlEscape(x.desde.replace('AREA DE ACTIVIDAD ',''))} → ${htmlEscape(x.hacia)} (${fmt(x.ha)} ha)</option>`).join('')}</select><div id="v7-transition-detail"></div></section></div><div class="v7-note"><strong>Precaución jurídica:</strong> el artículo 288 del Acuerdo 0373 de 2014 remite a la Matriz CIIU del Anexo 4. La propuesta 2026 establece grupos de usos (art. 362). Se requiere contrastar la actividad específica, su escala, condiciones y posibles prohibiciones antes de concluir si hay flexibilización.</div>`;
 const sel=host.querySelector('#v7-transition-select'),out=host.querySelector('#v7-transition-detail');const update=()=>{const x=data[Number(sel.value)||0];if(!x){out.innerHTML='<p>Sin datos.</p>';return;}const a=n.vigente2014[x.desde],b=n.propuesta2026[x.hacia];out.innerHTML=`<div class="v7-compare"><div><small>VIGENTE · ${htmlEscape(a?.articulos||'GDB')}</small><p>${htmlEscape(a?.significado||'Categoría no homologada; verificar régimen particular.')}</p></div><div><small>PROPUESTA · ${htmlEscape(b?.articulos||'GDB')}</small><p>${htmlEscape(b?.significado||'Categoría especial; verificar articulado y anexos.')}</p></div></div><p class="caption"><b>Lectura:</b> cambia la categoría y potencialmente las condiciones para localizar actividades; no se demuestra que cualquier comercio quede permitido. Se deben verificar matrices y excepciones aplicables.</p>`};if(sel){sel.addEventListener('change',update);update();}
}

function renderTratamientosV7(){const host=v7El('v7-tratamientos');if(!host)return;const cat=state.tratamientosNormaV7;if(!cat){host.innerHTML='';return;}
 const info=barrioInfo();const present=[];for(const [year,key] of [[2014,'tratamientos2014'],[2026,'tratamientos2026']]){let entriesYear=entries(info,key);for(const item of entriesYear){const name=String(item.nombre||'').toUpperCase(),code=String(item.codigo_original||item.atributos?.CODIGO||'').toUpperCase();const match=cat.filter(c=>Number(c.Año)===year).find(c=>{const x=c['Código o modalidad'].toUpperCase();const marker=x.match(/(?:^|\s)(R[123]|C[1234]|D[12]|CSU|CTL)(?:\s|$)/)?.[1];return marker?(code===marker||name.includes(marker)||name.includes(x.replace(marker,'').trim())):name.includes(x);});if(match&&!present.includes(match))present.push(match)}}
 const selected=state.selected?present:cat.filter(c=>['2014','2026'].includes(c.Año));
 host.innerHTML=`<div class="v7-section-title"><span class="eyebrow">TRATAMIENTOS · SIGNIFICADO NORMATIVO</span><h3>Un mismo código puede tener reglas diferentes</h3><p>Las categorías deben leerse con su articulado. <b>R1</b> en 2014 significa redesarrollo; en la propuesta significa densificación alta. <b>C4</b> es modalidad nueva de la propuesta.</p></div><div class="v7-treatment-grid">${selected.map(x=>`<article class="surface-card"><small class="eyebrow">POT ${htmlEscape(x.Año)} · ${htmlEscape(x['Artículo fuente'])}</small><h4>${htmlEscape(x['Código o modalidad'])}</h4><p>${htmlEscape(x['Descripción para público no experto'])}</p><p class="caption"><b>Precaución:</b> ${htmlEscape(x['Implicación urbana y cautela'])}</p></article>`).join('')}</div>`;
}
function renderEdificabilidadV7(){
 const host=v7El('v7-edificabilidad');if(!host)return;
 const info=barrioInfo(),cats=state.selected?entries(info,'edificabilidad_zonas2014'):[];
 const rows=cats.map(x=>{
  const raw=String(x.nombre??'').trim();
  const value=/^\d+(?:[.,]\d+)?$/.test(raw)?Number(raw.replace(',','.')):null;
  return {...x,indice:value,denominacion:raw};
 });
 const numeric=rows.filter(x=>x.indice!==null&&x.indice>0);
 const other=rows.filter(x=>x.indice===null);
 const plot=(x)=>{const hect=Number(x.hectareas)||0,pct=Number(x.porcentaje_barrio)||0;return `<div class="v7-row"><div class="v7-row-label"><b>${htmlEscape(x.denominacion)}</b><span>${fmt(hect,3)} ha · ${fmt(pct,2)} % del barrio</span></div></div>`};
 const examples=numeric.filter(x=>(Number(x.hectareas)||0)>=0.005).map(x=>{
  const calc=200*x.indice;
  return `<article class="surface-card"><span class="eyebrow">ÍNDICE CARTOGRAFIADO EN EL BARRIO</span><h4>ICB ${fmt(x.indice,2)}</h4><p>Superficie donde se registra: <b>${fmt(Number(x.hectareas)||0,3)} ha</b> (${fmt(x.porcentaje_barrio,2)} % del barrio).</p><div class="v7-index-example"><div><small>Terreno hipotético</small><strong>200 m²</strong></div><span>×</span><div><small>Índice ilustrado</small><strong>${fmt(x.indice,2)}</strong></div><span>=</span><div><small>Construcción computable ilustrativa</small><strong>${fmt(calc,1)} m²</strong></div></div></article>`;
 }).join('');
 host.innerHTML=`<section class="surface-card"><span class="eyebrow">EDIFICABILIDAD · NORMAS APLICABLES POR ZONAS</span><h3>¿Qué índices de construcción se registran en ${state.selected?htmlEscape(state.selected.properties.barrio):'los barrios de Cali'}?</h3><p>Un mismo barrio puede tener varias zonas con índices diferentes. Cada índice expresa cuánta área construida computable se obtiene por unidad de terreno computable; <b>no determina por sí solo el número de pisos</b>.</p>${state.selected?(numeric.length?`<h4>Índices de la cartografía 2014</h4><div class="v7-bars">${numeric.map(plot).join('')}</div>`:'<p>No hay índices numéricos registrados en la ficha de este barrio.</p>')+(other.length?`<h4>Otras categorías cartográficas</h4><div class="v7-bars">${other.map(plot).join('')}</div><p class="caption">Estas denominaciones no son valores numéricos de un índice.</p>`:'')+(examples?`<h4>Ejemplos según los índices presentes</h4><div class="v7-treatment-grid">${examples}</div>`:''):'<p>Selecciona un barrio para conocer los índices realmente cartografiados y ver ejemplos correspondientes a sus distintas zonas.</p>'}<p class="caption">Los ejemplos usan un lote hipotético de 200 m². No representan una licencia ni aplican uniformemente a todos los predios del barrio. Deben revisarse ocupación, aislamientos, volumetría y reglas de cálculo del POT 2014, arts. 344–347.</p><div class="v7-note">Esta consulta muestra índices de la cartografía 2014. No se cuantifican aumentos o reducciones frente a 2026 sin geometrías verificables de edificabilidad propuesta.</div></section>`;
}

function renderNormaTopicExtras(){
 const areas={tratamientos:'v7-tratamientos',usos:'v7-norma',edificabilidad:'v7-edificabilidad'};
 for(const id of Object.values(areas)){const el=v7El(id);if(el){el.replaceChildren();el.hidden=true;}}
 const target=areas[state.topic];if(!target)return;
 const host=v7El(target);if(!host)return;
 host.hidden=false;
 if(state.topic==='tratamientos')renderTratamientosV7();
 else if(state.topic==='usos')renderExtrasNormaV7();
 else if(state.topic==='edificabilidad')renderEdificabilidadV7();
}

function renderExtrasGestionV7(){const host=v7El('v7-gestion');if(!host)return;host.innerHTML=`<section class="surface-card"><span class="eyebrow">BALANCE DISTRIBUTIVO · SIN REPETIR NORMAS DE USO</span><h3>¿Qué contraprestación recibe la ciudad?</h3><div class="v7-grid"><div><h4>Derechos y beneficios a verificar</h4><p>Mayor aprovechamiento, condiciones de edificabilidad adicional, flexibilización de actuaciones e incentivos condicionados. No se cuantifican derechos nuevos sin los índices 2026 completos.</p><small>Fuentes de contraste: Acuerdo 0373 de 2014; propuesta 2026, capítulos de gestión y financiación.</small></div><div><h4>Cargas y salvaguardas a verificar</h4><p>Cesiones, financiación de infraestructuras, espacio público, participación en plusvalía, protección de moradores, permanencia y retorno, conforme a instrumento y ámbito de actuación.</p><small>Una ampliación de derechos no prueba por sí sola que desaparezcan las cargas.</small></div></div><div class="v7-note"><b>Criterio de lectura:</b> primero identificar el hecho generador del mayor aprovechamiento, después el instrumento aplicable y finalmente las obligaciones exigibles. Estas fichas no sustituyen certificaciones urbanísticas.</div></section>`}
function renderExtrasRiesgoV7(){const host=v7El('v7-riesgo');if(host)host.replaceChildren();}

function bindEvents(){document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>pageTo(b.dataset.page)));document.body.addEventListener('click',e=>{const r=e.target.closest?.('[data-risk-layer]');if(r){const key=r.dataset.riskLayer;pageTo('mapa');if(state.mapMode==='compare')modeMap('explore');const ch=document.querySelector('#layers [data-layer="'+key+'"]');if(ch){ch.checked=true;toggleLayer(key,true)}return;}const swipe=e.target.closest?.('[data-open-swipe]');if(swipe){pageTo('mapa');modeMap('compare');return;}const go=e.target.closest?.('[data-goto],[data-go]');if(go)pageTo(go.dataset.goto||go.dataset.go)});DOM('search').addEventListener('input',searchChange);DOM('search').addEventListener('keydown',e=>{if(e.key==='Escape')DOM('search-results').replaceChildren();if(e.key==='Enter'){const f=searchMatches(e.target.value)[0];if(f){setSelected(f,null,state.page==='inicio');DOM('search-results').replaceChildren()}}});document.addEventListener('click',e=>{if(!e.target.closest?.('.search-box'))DOM('search-results').replaceChildren()});DOM('clear-territory').addEventListener('click',clearSelected);DOM('barrios-visible').addEventListener('change',e=>{state.barriosVisible=e.target.checked;if(!state.leafReady)return;for(const [map,layer] of [[state.map,state.barrioLayer],[state.mapRight,state.barrioRight]]){if(!map||!layer)continue;if(state.barriosVisible)layer.addTo(map);else map.removeLayer(layer)}});DOM('open-normative').addEventListener('click',()=>pageTo('norma'));DOM('map-reset').addEventListener('click',resetMap);DOM('base-toggle').addEventListener('click',()=>{if(!state.base||!state.map)return;const on=state.map.hasLayer(state.base);if(on)state.map.removeLayer(state.base);else state.base.addTo(state.map);if(state.mapRight&&state.baseRight){if(on)state.mapRight.removeLayer(state.baseRight);else state.baseRight.addTo(state.mapRight)}});document.querySelectorAll('[data-map-mode]').forEach(b=>b.addEventListener('click',()=>modeMap(b.dataset.mapMode)));DOM('compare-theme').addEventListener('change',e=>selectCompareTheme(e.target.value));DOM('compare-slider').addEventListener('input',e=>setSwipePercent(e.target.value));window.addEventListener('resize',()=>{state.map?.invalidateSize({pan:false});state.mapRight?.invalidateSize({pan:false})});}
document.addEventListener('DOMContentLoaded',()=>{bindEvents();loadData();});
