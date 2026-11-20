from pathlib import Path
p=Path(__file__).resolve().parents[1]; js=p/'assets/app.js';html=p/'index.html';css=p/'assets/styles.css'
s=js.read_text()
s=s.replace("['leyendas','leyendas.json']", "['leyendas','leyendas.json'],['transformacion','indicadores_transformacion_exploratorios.json']")
s=s.replace("indicadores:null,sueloComparacion:null", "indicadores:null,transformacion:null,sueloComparacion:null")
s=s.replace(" // El mapa de la derecha es TRANSPARENTE. El mapa base se dibuja una sola vez en la izquierda.\n // Así nunca hay desfases visuales entre dos mosaicos de OpenStreetMap.\n state.mapRight.getContainer().style.background='transparent';", " // Fondo independiente para que NUNCA se trasluzca la norma de 2014 bajo la de 2026.\n state.mapRight.getContainer().style.background='#edf2ed';\n state.baseRight=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(state.mapRight);")
s=s.replace("state.mapRight.setView(c,z,{animate:false});", "state.mapRight.setView(c,z,{animate:false});")
s=s.replace("if(risk){risk.innerHTML=", "if(risk){risk.innerHTML=")
needle="\n}\n/* Componentes reutilizables de análisis por barrio */"
assert needle in s
s=s.replace(needle,"\n renderTransformacionInicio();\n}\n/* Componentes reutilizables de análisis por barrio */",1)
ins='''
/* Indicadores de transición cartográfica: solo aproximaciones de capas simplificadas.
   No se deducen permisos comerciales a partir de cambios de categoría. */
function renderTransformacionInicio(){
 const r=state.transformacion;
 const here=DOM('home-transformations');if(!here||!r)return;
 const display={Consolidación:'#6799b3',Renovación:'#be7786',Desarrollo:'#a995c1','Mejoramiento integral':'#dfb965',Conservación:'#78a98b','Área de Proximidad':'#6a9d93','Área Multifuncional':'#9c8dc4','Área de Integración':'#be9d70','Área de Dinamización Económica':'#cc8267'};
 const sums=(arr)=>arr.reduce((a,b)=>a+Number(b.ha||0),0);
 const mini=(items,limit=7)=>{const total=sums(items);return `<div class="district-bars">${items.slice(0,limit).map(x=>`<div class="district-bar"><div class="district-bar-label"><span>${htmlEscape(x.categoria)}</span><strong>${fmt(x.ha)} ha · ${fmt(x.ha/total*100)}%</strong></div><div class="district-track"><i style="width:${Math.min(100,x.ha/total*100)}%;background:${display[x.categoria]||'#a7afa8'}"></i></div></div>`).join('')}</div>`};
 const names=['Consolidación','Renovación','Desarrollo','Mejoramiento integral','Conservación'];
 const find=(arr,n)=>arr.find(x=>x.categoria===n)?.ha||0;
 const chart=names.map(n=>{let a=find(r.tratamientos2014,n),b=find(r.tratamientos2026,n);let max=Math.max(a,b,1);return `<div class="district-comparison"><div class="district-bar-label"><b>${htmlEscape(n)}</b><span>2014 ${fmt(a)} ha · 2026 ${fmt(b)} ha</span></div><div class="paired-line"><small>2014</small><div class="district-track"><i style="width:${a/max*100}%;background:${display[n]};opacity:.58"></i></div></div><div class="paired-line"><small>2026</small><div class="district-track"><i style="width:${b/max*100}%;background:${display[n]}"></i></div></div></div>`}).join('');
 const tr=r.transiciones_tratamientos.filter(x=>x.desde!==x.hacia&&x.ha>=20).slice(0,8);
 here.innerHTML=`<div class="section-heading"><div><span class="eyebrow">DÓNDE SE TRANSFORMA EL SUELO</span><h3>Tratamientos, áreas de actividad y transiciones</h3><p>Lectura territorial exploratoria de las capas disponibles: las categorías se explicarán con los articulados, no únicamente con los colores.</p></div></div><div class="home-insight-grid"><section class="surface-card"><div class="card-head"><span class="eyebrow">TRATAMIENTOS 2014 → 2026</span><h3>Cómo cambia la distribución</h3></div>${chart}<p class="caption">Familias comparativas para orientación; los tratamientos de ambos años no son jurídicamente equivalentes. Incluye categorías históricas no homologadas y posibles diferencias de extensión.</p></section><section class="surface-card"><div class="card-head"><span class="eyebrow">USOS EN LA PROPUESTA</span><h3>Áreas de actividad de 2026</h3></div>${mini(r.actividades2026)}<p class="caption">Las áreas de actividad NO equivalen directamente a usos exclusivos ni autorizan por sí solas comercio, vivienda o industria.</p></section></div><section class="surface-card transition-home-card"><div class="card-head"><span class="eyebrow">CRUCE SOBRE EL MISMO TERRITORIO</span><h3>¿De qué tratamiento a cuál pasa el suelo?</h3></div><div class="transition-home-grid">${tr.map(x=>`<div class="transition-home-row"><span>${htmlEscape(x.desde)} <b>→</b> ${htmlEscape(x.hacia)}</span><strong>${fmt(x.ha)} ha</strong></div>`).join('')}</div><div class="method-note"><b>Importante:</b> estas hectáreas son aproximaciones geométricas obtenidas sobre GeoJSON simplificados, sujetas a contraste con las GDB originales y a resolver solapamientos. No representan incrementos de derechos de construcción. <b>Residencial → comercial:</b> cifra pendiente del cruce completo de áreas de actividad de 2014 con 2026 y sus tablas de usos.</div></section>`;
}
'''
s=s.replace('/* Componentes reutilizables de análisis por barrio */',ins+'\n/* Componentes reutilizables de análisis por barrio */',1)
js.write_text(s)
h=html.read_text()
h=h.replace('<section class="intro-maps-card"', '<div id="home-transformations" aria-label="Indicadores de tratamientos y usos"></div>\n      <section class="intro-maps-card"',1)
h=h.replace('assets/app.js?v=6.1.1','assets/app.js?v=6.2.0')
h=h.replace('DOS MAPAS · UN MISMO TERRITORIO','CARTOGRAFÍA DE REFERENCIA · DETALLE OPCIONAL')
h=h.replace('Contrasta el suelo urbano, de expansión y rural. Los mapas se construyen con ambas geodatabases, utilizando exactamente la misma proyección, escala y extensión.','Resumen visual compacto de los límites urbano, rural y de expansión. Puedes ampliarlo en el comparador. Ambos mapas usan la misma proyección, escala y extensión.')
html.write_text(h)
c=css.read_text();c+='''
/* v6.2: portada menos centrada en mapas; mapas confinados al contenedor */
.home-content .intro-maps-card{margin:18px 0;padding:16px}
.home-content .intro-maps-heading h3{font-size:20px}
.home-content .intro-maps-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:810px;margin:10px auto}
.home-content .intro-map-panel img{display:block;max-height:220px;width:100%;height:220px;object-fit:contain;background:#f3f7f4}
.home-content .intro-map-panel figcaption{padding:8px;font-size:11px}
.home-content .intro-map-panel figcaption span{font-size:10px}
.home-insight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:12px 0}
.district-comparison{margin-bottom:13px}
.district-bar-label{display:flex;justify-content:space-between;gap:12px;align-items:baseline;font-size:12px;line-height:1.35;margin-bottom:5px}
.district-bar-label span:last-child,.district-bar-label strong{color:#5a7665;font-size:11px}
.district-track{height:9px;border-radius:9px;background:#eaf0ea;overflow:hidden;flex:1}
.district-track i{height:100%;display:block;border-radius:9px}
.paired-line{display:flex;gap:8px;align-items:center;margin-bottom:4px}.paired-line small{width:31px;font-size:10px;color:#607e6c}
.district-bar{margin:0 0 12px}
.transition-home-card{margin-bottom:15px}
.transition-home-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px}
.transition-home-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;border-bottom:1px solid #ecf0eb;padding:10px 2px;font-size:12px}
.transition-home-row strong{white-space:nowrap;color:#215d46}.transition-home-row b{color:#996b32}
.map-right-clip{background:#edf2ed}
.map-right-clip .leaf-map{background:#edf2ed!important}
@media(max-width:700px){.home-insight-grid,.transition-home-grid{grid-template-columns:1fr}.home-content .intro-maps-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-content .intro-map-panel img{height:150px}.home-content .intro-map-panel figcaption{display:block;font-size:10px}.home-content .intro-map-panel figcaption span{display:block}}
@media(max-width:370px){.home-content .intro-maps-grid{grid-template-columns:1fr}}
'''
css.write_text(c)
