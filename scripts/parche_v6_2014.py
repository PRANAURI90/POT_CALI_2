from pathlib import Path
p=Path(__file__).resolve().parent.parent
app=p/'assets/app.js'
s=app.read_text(encoding='utf8')
def repl(a,b):
 global s
 assert a in s, f'NO EXISTE {a[:100]}'
 s=s.replace(a,b)
repl("{title:'POT 2014 · vigente',keys:['tratamientos2014'", "{title:'POT 2014 · vigente',keys:['clasificacion2014','tratamientos2014'")
repl("keys:['clasificacion','tratamientos','areas_actividad','planes_parciales','planes_previos','instrumentos','redensificacion']", "keys:['clasificacion','cambio_perimetro2026','tratamientos','areas_actividad','planes_parciales','planes_previos','instrumentos','redensificacion']")
repl("const CONFIG={\n tratamientos2014", "const CONFIG={\n clasificacion2014:{label:'Clasificación del suelo',year:2014,base:'#6b9f85'},\n tratamientos2014")
repl(" clasificacion:{label:'Clasificación del suelo',year:2026,base:'#699f7a'},", " clasificacion:{label:'Clasificación del suelo',year:2026,base:'#699f7a'},\n cambio_perimetro2026:{label:'Cambios del perímetro urbano',year:2026,base:'#65856f'},")
repl("resumen:null,normas:null,indicadores:null,selected:","resumen:null,normas:null,indicadores:null,sueloComparacion:null,selected:")
repl("compareTheme:'tratamientos'", "compareTheme:'clasificacion'")
repl("if(key==='clasificacion'){if(cat==='Perímetro urbano')return '#6ca7bb';if(cat==='Suelo rural')return '#7dad83';return '#d7b46f';}", "if(key==='clasificacion'||key==='clasificacion2014'){if(cat==='Perímetro urbano')return '#6ca7bb';if(cat==='Suelo rural')return '#7dad83';return '#d7b46f';}if(key==='cambio_perimetro2026'){if(cat.includes('adiciona'))return '#4f9f7f';if(cat.includes('excluye'))return '#d67c65';return '#aec8ad';}")
repl("if(key==='clasificacion')return String(p.csnombre??'Sin nombre').trim();", "if(key==='clasificacion')return ({'1':'Perímetro urbano','2':'Suelo rural','3':'Suelo de expansión'})[String(p.cstipo)]||String(p.csnombre??'Sin nombre').trim();if(key==='clasificacion2014')return ({'U':'Perímetro urbano','E':'Suelo de expansión','R':'Suelo rural'})[String(p.codigo)]||String(p.csnombre??'Sin nombre').trim();if(key==='cambio_perimetro2026')return String(p.condicion??'No clasificado');")
repl("if(key==='tratamientos'||key==='tratamientos2014'||key==='clasificacion'||key==='areas_actividad'", "if(key==='tratamientos'||key==='tratamientos2014'||key==='clasificacion'||key==='clasificacion2014'||key==='cambio_perimetro2026'||key==='areas_actividad'")
repl("const SWIPE_THEMES={tratamientos:['tratamientos2014','tratamientos'],planes:['planes2014','planes_parciales']};", "const SWIPE_THEMES={clasificacion:['clasificacion2014','clasificacion'],tratamientos:['tratamientos2014','tratamientos'],planes:['planes2014','planes_parciales']};")
repl("const TOPICS={tratamientos:", "const TOPICS={clasificacion:{title:'Clasificación del suelo',a:'clasificacion2014',b:'clasificacion2026',lead:'Define qué sectores son suelo urbano, rural o de expansión, y cómo cambia su delimitación territorial.',implication:'Una superficie clasificada como urbana o de expansión no equivale a un permiso automático de urbanizar. Deben verificarse las restricciones, instrumentos, cargas, servicios y normas aplicables. Las diferencias de delimitación municipal también requieren cautela.'},tratamientos:")
# Vista de inicio completamente revisada con dos años y actualización de riesgos/renovación
start=s.index('function renderInicio(){')
end=s.index('/* Componentes reutilizables de análisis por barrio */',start)
func="""function renderInicio(){
 const v=state.indicadores,c=state.sueloComparacion;
 if(!v)return;
 const pos=n=>n>0?'+'+fmt(n):fmt(n);
 const stats=c?[
 ['Crecimiento neto del perímetro urbano',pos(c.cambios.urbano_delta_ha),'ha','Diferencia de superficie entre las delimitaciones de 2014 y 2026.'],
 ['Aumento neto del suelo de expansión',pos(c.cambios.expansion_delta_ha),'ha','No equivale a suelo urbanizado ni a viviendas autorizadas.'],
 ['Suelo incorporado al perímetro urbano',fmt(c.cambios.perimetro_por_categoria.find(x=>x.nombre.includes('adiciona'))?.hectareas||0),'ha','49 polígonos adicionados según la capa de cambios 2026.'],
 ['Suelo excluido del perímetro urbano',fmt(c.cambios.perimetro_por_categoria.find(x=>x.nombre.includes('excluye'))?.hectareas||0),'ha','46 polígonos excluidos según la capa de cambios 2026.']
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
 const risk=document.getElementById('home-risk-stats');
 if(risk){risk.innerHTML=`<div class="tiny-facts"><div><strong>${fmt(v.renovacion2026_ha_aprox)}</strong><small>ha aproximadas de renovación en propuesta 2026</small></div><div><strong>${fmt(v.amenaza2026_num_poligonos)}</strong><small>polígonos de zonificación de amenaza 2026</small></div></div><p class="caption">La renovación debe contrastarse con las categorías 2014. Los polígonos de amenaza no representan hectáreas ni población expuesta.</p>`}
}
"""
s=s[:start]+func+s[end:]
repl("['indicadores','indicadores2026.json']", "['indicadores','indicadores2026.json'],['sueloComparacion','comparacion_suelo_2014_2026.json']")
app.write_text(s,encoding='utf8')
html=p/'index.html'
h=html.read_text(encoding='utf8')
h=h.replace('<option value="tratamientos">Tratamientos</option>', '<option value="clasificacion">Clasificación del suelo</option><option value="tratamientos">Tratamientos</option>')
h=h.replace('Datos descriptivos de la cartografía 2026. No son todavía variaciones respecto al perímetro ni al suelo de expansión de 2014.', 'Comparación cartográfica 2014–2026 calculada a partir de las dos geodatabases. El proyecto de 2026 todavía no es norma vigente.')
h=h.replace('Fuente: GDB propuesta 2026', 'Fuentes: GDB POT 2014 y GDB propuesta 2026')
h=h.replace('Superficies tomadas del atributo de área de la GDB propuesta. La variación 2014–2026 requiere el perímetro de 2014 homologado.', 'Superficies calculadas con las geometrías originales de 2014 y 2026 en un sistema proyectado común. La categoría rural de 2014 se derivó como área municipal menos suelo urbano y de expansión; las delimitaciones municipales difieren entre las fuentes.')
h=h.replace('Cambio de perímetros 2014–2026</b><p>Pendiente de preparar la capa equivalente de clasificación del suelo 2014.', 'Cambio de perímetros 2014–2026</b><p>Calculado con perímetros urbanos y de expansión de ambas geodatabases. El mapa permite visualizar las diferencias.')
h=h.replace('<span class="checkdot wait">·</span><div><b>Cambio de perímetros', '<span class="checkdot yes">✓</span><div><b>Cambio de perímetros')
h=h.replace('clasificacion de 2014', 'clasificación de 2014')
h=h.replace('<div class="section-heading"><div><span class="eyebrow">LECTURA CRÍTICA DEL MODELO</span>', '<div class="home-risk-panel" id="home-risk-stats"></div><div class="section-heading"><div><span class="eyebrow">LECTURA CRÍTICA DEL MODELO</span>')
h=h.replace('assets/styles.css?v=6.0','assets/styles.css?v=6.1').replace('assets/app.js?v=6.0','assets/app.js?v=6.1')
html.write_text(h,encoding='utf8')
css=p/'assets/styles.css';cs=css.read_text(encoding='utf8')
cs+='\n/* Comparación métrica entre GDB 2014 y propuesta 2026 */\n.comparison-bar-block{padding:13px 0;border-bottom:1px solid #e1eae1}.comparison-bar-title{display:flex;justify-content:space-between;gap:15px;margin-bottom:8px;color:#244d3a;font-size:12px}.comparison-bar-title span{font-size:10px;color:#607868}.comparison-bar-row{display:grid;grid-template-columns:34px minmax(0,1fr) 98px;gap:9px;align-items:center;margin:6px 0}.comparison-bar-row>span{font-size:10px;color:#5d7665}.comparison-bar-row>b{font-size:10px;text-align:right;color:#3d634e}.comparison-bar-row .bar-track{height:11px;background:#e9eeeb;overflow:hidden;border-radius:5px}.comparison-bar-row .bar-track i{display:block;height:100%;border-radius:5px}.home-risk-panel{background:#fff;border:1px solid #e1eae1;border-radius:12px;padding:20px;margin:15px 0}.tiny-facts{display:flex;gap:25px;align-items:center;justify-content:space-around}.tiny-facts>div{display:flex;flex-direction:column;gap:6px;flex:1}.tiny-facts strong{font:700 24px Georgia,serif;color:#255b44}.tiny-facts small{font-size:11px;color:#5c7866;max-width:240px}.home-risk-panel .caption{font-size:10px;color:#84968b;margin-bottom:0}@media(max-width:680px){.comparison-bar-title{flex-direction:column;gap:2px}.comparison-bar-row{grid-template-columns:34px minmax(0,1fr) 81px}.tiny-facts{align-items:start;gap:12px}.tiny-facts strong{font-size:20px}}\n'
css.write_text(cs,encoding='utf8')
print('Parches aplicados a app.js, index.html, styles.css')
