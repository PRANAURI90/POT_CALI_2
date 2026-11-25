/* Fichas barriales dinámicas · Observatorio POT Cali.
 * Generación bajo demanda: cada barrio toma datos del estado actual, no del piloto 1722.
 * Datos de amenaza: cruce Turf sobre geometrías web simplificadas; no certificado.
 */
'use strict';
(function(){
const COLORS={navy:'#2F294B',purple:'#6253A8',muted:'#677287',line:'#E3E8EC',paper:'#F5F6FA',green:'#23816F',pink:'#C5687C',orange:'#D9A067',danger:'#C94F54'};
const RISK_COLORS={'1':'#CF4446','2':'#E8BC39','3':'#39976A','0':'#8D97A1'};
const PHENOM={'1':'Movimientos en masa','2':'Avenidas torrenciales','3':'Inundación'};
const LEVEL={'1':'Alta','2':'Media','3':'Baja','0':'Otra condición'};
let pdfReadyUrl=null;
const hexRgb=(h)=>h.replace('#','').match(/.{2}/g).map(v=>parseInt(v,16));
const changeColor=(pdf,h)=>pdf.setTextColor(...hexRgb(h));
const fillColor=(pdf,h)=>pdf.setFillColor(...hexRgb(h));
const num=(v,d=2)=>Number(v||0).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
const ha=v=>num(v)+' ha';
const pct=v=>num(v,1)+' %';
const safe=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
// Limpieza de codificaciones de capas GIS y tipografía compatible con Helvetica PDF.
function pdfText(value){
 let s=String(value??'').replace(/\u0000/g,'').replace(/[\u0001-\u001F\u007F]/g,' ').replace(/[\u200B-\u200F\uFEFF]/g,'').normalize('NFC');
 // Los caracteres no soportados por la codificación base de jsPDF se escriben como ASCII.
 return s.replace(/[‐‑–—]/g,'-').replace(/[→➜]/g,' a ').replace(/\s+/g,' ').trim();
}
function labelTreatment(raw,year){
 const value=pdfText(raw);
 const s=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const c=s.replace(/[^A-Z0-9]/g,'');
 const aliases=year===2014?[
  [/^R1$|RENOVACION.*1.*REDESARROLLO/,'Renovación por redesarrollo (R1)'],
  [/^R2$|RENOVACION.*2.*REACTIVACION/,'Renovación por reactivación (R2)'],
  [/^R3$|RENOVACION.*3.*CAMBIO/,'Renovación por cambio de patrón (R3)'],
  [/^C1$|CONSOLIDACION.*URBANISTICA/,'Consolidación urbanística (C1)'],
  [/^C2$|CONSOLIDACION.*BASICA/,'Consolidación básica (C2)'],
  [/^C3$|CONSOLIDACION.*MODERADA/,'Consolidación moderada (C3)'],
  [/^DE$|^DESARROLLO$/,'Desarrollo'],
 ]:[
  [/^R1$|^10$|REDENSIFICACION.*ALTA/,'Renovación con redensificación alta (R1)'],
  [/^R2$|^11$|REDENSIFICACION.*MEDIA/,'Renovación con redensificación media (R2)'],
  [/^D1$|^7$/,'Desarrollo en expansión (D1)'],
  [/^D2$|^8$/,'Desarrollo urbano (D2)'],
  [/^C1$|^3$/,'Consolidación urbanística (C1)'],
  [/^C2$|^4$/,'Consolidación básica (C2)'],
  [/^C3$|^5$/,'Consolidación moderada (C3)'],
  [/^C4$|^6$/,'Consolidación con cambio de patrón (C4)'],
  [/^MI$|^9$/,'Mejoramiento integral']
 ];
 for(const [re,label] of aliases)if(re.test(s)||re.test(c))return label;
 return value.toLocaleLowerCase('es').replace(/^\p{L}/u,x=>x.toUpperCase());
}
function hintTreatment(label){
 const v=pdfText(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if(/CONSERVACION|^CSU|^CTL/.test(v))return 'Protege valores del territorio.';
 if(/CONSOLIDACION|^C[1-4]$/.test(v))return 'Regula la transformación del tejido.';
 if(/RENOVACION|REDENSIFICACION|^R[1-3]$/.test(v))return 'Orienta la renovación del sector.';
 if(/DESARROLLO|^D[12]$/.test(v))return 'Regula urbanización de suelo.';
 if(/MEJORAMIENTO/.test(v))return 'Busca cualificar el hábitat.';
 return 'Verificar régimen de la categoría.';
}
function hintActivity(label){
 const v=pdfText(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if(/PROXIMIDAD/.test(v))return 'Actividades de escala cercana.';
 if(/MULTIFUNCIONAL|MIXTA/.test(v))return 'Convivencia de diferentes usos.';
 if(/INTEGRACION/.test(v))return 'Articulación de funciones urbanas.';
 if(/DINAMIZACION/.test(v))return 'Actividades económicas orientadas.';
 if(/RESIDENCIAL/.test(v))return 'Predomina la función de vivienda.';
 if(/INDUSTRIAL/.test(v))return 'Ámbito con función productiva.';
 if(/PEMP|CONSERVACION/.test(v))return 'Ámbito con régimen especial.';
 return 'Consultar matriz de actividades.';
}
function treatmentFamily(value){
 const n=pdfText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if(/RENOVACION|REDENSIFICACION|^R[123]$/.test(n))return 'renovacion';
 if(/CONSOLIDACION|^C[1-4]$/.test(n))return 'consolidacion';
 if(/DESARROLLO|^D[12]$|^DE$/.test(n))return 'desarrollo';
 if(/CONSERVACION|^CTL$|^CSU$|^CON$/.test(n))return 'conservacion';
 if(/MEJORAMIENTO|^MI$/.test(n))return 'mejoramiento';
 return 'otro';
}
function treatmentMeaning(from,to){
 const f=treatmentFamily(from), t=treatmentFamily(to);
 const previous=pdfText(from).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const proposed=pdfText(to).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if((/REACTIVACION|^R2$/.test(previous))&&(/REDENSIFICACION MEDIA|^R2$/.test(proposed)))return 'En 2014, R2 significaba renovación por reactivación: el plan parcial de renovación no estaba permitido, aunque existían proyectos de renovación con condiciones. En la propuesta 2026, R2 pasa a redensificación media y contempla otras vías de actuación, entre ellas plan manzana o plan parcial según los supuestos establecidos. No significa una licencia automática.';
 if((/REDESARROLLO|^R1$/.test(previous))&&(/REDENSIFICACION ALTA|^R1$/.test(proposed)))return 'En 2014, la renovación por redesarrollo R1 requería plan parcial conforme a sus condiciones. La propuesta redefine R1 como redensificación alta y contempla actuación individual, plan de manzana o plan parcial según tamaño y delimitación. Deben revisarse las cargas y las garantías territoriales.';
 if(f==='renovacion'&&t==='renovacion')return 'El barrio sigue en una familia de renovación, pero cambian su modalidad y las formas de intervención que plantea la norma. El mismo código no conserva necesariamente las mismas reglas.';
 if(f==='consolidacion'&&t==='renovacion')return 'La propuesta cambia esta superficie de un tratamiento de consolidación del tejido urbano a uno de renovación. Deben examinarse densidad, instrumentos, cargas y protección a residentes.';
 if(f==='consolidacion'&&t==='desarrollo')return 'Parte del barrio pasa de consolidación a desarrollo. Conviene aclarar qué suelo se considera urbanizable y con qué obras, cesiones y procedimientos podría intervenirse.';
 if(t==='conservacion')return 'La propuesta orienta esta superficie a protección patrimonial o contextual. Las intervenciones quedan sujetas a las reglas y delimitaciones específicas de conservación.';
 if(t==='mejoramiento')return 'La propuesta plantea cualificar el hábitat y los soportes urbanos. No se trata, por sí solo, de una autorización de mayor edificabilidad.';
 if(f===t)return 'Aunque conserve una familia o denominación semejante, deben compararse las definiciones y condiciones de ambos POT; la coincidencia cartográfica no prueba equivalencia jurídica.';
 return 'Esta porción del barrio cambia de clasificación entre los dos instrumentos. Para saber su efecto real se deben comparar las reglas de uso, edificabilidad, gestión y cargas aplicables.';
}
// Conclusiones y comprobaciones pendientes: artículos verificados por modalidad.
function verifiedTransitionDetail(from,to){
 const a=pdfText(from).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const b=pdfText(to).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if((/REACTIVACION|\bR2\b/.test(a))&&(/(?:REDENSIFICACION|DENSIFICACION) MEDIA|\bR2\b/.test(b)))return {
  meaning:'Hay un cambio normativo concreto: en el POT 2014 R2 no admitía plan parcial de renovación, pero sí proyecto de renovación de mínimo dos manzanas. La propuesta 2026, que denomina esta modalidad densificación media (art. 370), contempla actuación individual para predios o agrupaciones menores de 3.000 m², plan de manzana desde 3.000 m² hasta una manzana y plan parcial para ámbitos de mínimo dos manzanas. Fuente: arts. 317 y 319 del POT 2014; arts. 387, 615 y 619-620 del proyecto.',
  limits:'El cambio permite identificar nuevas modalidades de gestión; no determina por sí mismo el número de pisos, el índice aplicable o la viabilidad de un predio. Las cesiones específicas del art. 388 de la propuesta corresponden a planes parciales y planes de manzana, no automáticamente a toda actuación individual.',
  checks:'Falta localizar cada predio frente a las delimitaciones de instrumentos y al Corredor Verde, conocer el tamaño de la agrupación y contrastar índices, capacidad de servicios, restricciones ambientales y condiciones de riesgo. Estas son verificaciones territoriales, no artículos por identificar.'
 };
 if((/REDESARROLLO|\bR1\b/.test(a))&&(/REDENSIFICACION ALTA|\bR1\b/.test(b)))return {
  meaning:'El POT 2014 exigía plan parcial para la renovación por redesarrollo R1, con un ámbito mínimo de 20.000 m². La propuesta 2026 redefine R1 como redensificación alta y contempla actuación individual menor de 3.000 m², plan de manzana desde 3.000 m² y plan parcial de mínimo dos manzanas. Fuente: arts. 316, 319-320 (2014) y 370, 387, 615, 619-620 (2026).',
  limits:'La propuesta diversifica los instrumentos de gestión, pero el tratamiento no fija por sí solo los pisos de cada predio ni concede una licencia. El art. 388 señala cargas específicas para planes parciales y planes de manzana.',
  checks:'Falta comprobar la delimitación concreta, el área y agrupación predial, el índice permitido, las cargas y la localización respecto del Corredor Verde, soportes urbanos y restricciones ambientales y de riesgo.'
 };
 return null;
}
function citizenReading(from,to){
 const norm=v=>pdfText(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const before=norm(from),after=norm(to);
 const famBefore=treatmentFamily(from),famAfter=treatmentFamily(to);
 const renovation=famAfter==='renovacion';
 const codes=/\bR2\b|DENSIFICACION MEDIA/.test(after)?'R2':/\bR1\b|DENSIFICACION ALTA/.test(after)?'R1':'';
 if(famBefore==='consolidacion'&&renovation)return {
  change:'Esta parte del barrio pasa de consolidación a renovación urbana. En vez de seguir únicamente las reglas de consolidación del tejido existente, la propuesta contempla mecanismos para transformar predios y conjuntos de predios.',
  tools:'En renovación '+(codes||'R1/R2')+' se contemplan actuaciones individuales, planes de manzana y planes parciales según el tamaño y la delimitación. Los planes de manzana y parciales pueden implicar nuevas cesiones y obligaciones.',
  watch:'Prestar atención a los índices de construcción, las alturas, las cesiones para espacio público, los servicios, las medidas para moradores y las condiciones ambientales y de riesgo.',
  refs:'Proyecto POT 2026: arts. 379, 387, 388, 615 y 619-620.'
 };
 if(renovation&&famBefore==='renovacion')return {
  change:'El territorio permanece en la familia de renovación, pero cambia la modalidad. Aunque el código se parezca, las reglas de intervención propuestas no son idénticas a las del POT vigente.',
  tools:'La propuesta contempla actuación individual, plan de manzana y plan parcial para distintos tamaños y condiciones. Esto no significa que un proyecto esté aprobado.',
  watch:'Revisar cuánto se permite construir, qué cargas y cesiones corresponden a cada modalidad, las garantías a moradores y las restricciones ambientales y de riesgo.',
  refs:'POT 2014: arts. 315-321. Proyecto POT 2026: arts. 370, 387, 388 y 615-620.'
 };
 if(famAfter==='conservacion')return {
  change:'La propuesta identifica esta superficie para conservación urbana o cultural, priorizando la protección de sus valores y características.',
  tools:'Las intervenciones deben ajustarse al régimen de conservación correspondiente; la clasificación no crea por sí misma un incentivo económico.',
  watch:'Revisar la delimitación exacta, las obras permitidas y si existen instrumentos de apoyo o compensación realmente aplicables.',
  refs:'Proyecto POT 2026: arts. 377-379.'
 };
 if(famAfter==='desarrollo')return {
  change:'La propuesta asigna un tratamiento de desarrollo: las nuevas actuaciones deben resolver su urbanización y los soportes necesarios antes de ejecutarse.',
  tools:'Según el suelo, la superficie y los predios involucrados, puede requerirse plan parcial o tramitarse mediante proyecto urbanístico y licencia.',
  watch:'Verificar las redes de servicios, accesos, espacio público, cesiones, restricciones ambientales y condiciones de riesgo.',
  refs:'Proyecto POT 2026: arts. 381-383 y 615.'
 };
 if(famAfter==='consolidacion')return {
  change:'La propuesta orienta esta superficie a consolidar el tejido construido. La forma en que puede modificarse la edificación depende de la modalidad correspondiente.',
  tools:'Los planes parciales o planes de manzana en consolidación tienen supuestos específicos de delimitación; no se habilitan de forma general.',
  watch:'Revisar alturas, capacidad de servicios y si la zona pertenece a un proyecto urbanístico integral o al Corredor Verde.',
  refs:'Proyecto POT 2026: art. 379.'
 };
 return {
  change:'En esta parte del barrio cambia la clasificación urbanística entre el POT vigente y la propuesta. El efecto concreto depende de los dos tratamientos comparados.',
  tools:'Solo se detallan los instrumentos asociados a los tratamientos presentes en las páginas de gestión.',
  watch:'Revisar los usos, la edificabilidad y las obligaciones señaladas para la modalidad identificada.',
  refs:'POT 2014 vigente y Proyecto POT 2026. Ver capítulo técnico.'
 };
}
function softParagraph(pdf,x,y,text,width=174,size=9){
 return line(pdf,x,y,text,size,COLORS.navy,false,width)+3;
}
function line(pdf,x,y,text,size=10,color=COLORS.navy,bold=false,maxWidth=178){
 pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);changeColor(pdf,color);
 const lines=pdf.splitTextToSize(pdfText(text),maxWidth);
 pdf.text(lines,x,y);
 return y+lines.length*(size*.365+1.7);
}
function bar(pdf,x,y,label,value,max,color,w=172){
 pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);changeColor(pdf,COLORS.navy);
 const lines=pdf.splitTextToSize(pdfText(label),w-42);
 pdf.text(lines,x,y);
 pdf.text(ha(value),x+w,y,{align:'right'});
 const trackY=y+(lines.length-1)*4.2+5;
 fillColor(pdf,COLORS.line);pdf.roundedRect(x,trackY,w,4,1.5,1.5,'F');
 if(value>0&&max>0){fillColor(pdf,color);pdf.roundedRect(x,trackY,Math.max(1,Math.min(w,w*value/max)),4,1.5,1.5,'F')}
 return trackY+15;
}
function base(pdf,n,k,title,sub,selected){
 fillColor(pdf,COLORS.navy);pdf.rect(0,0,210,27,'F');
 fillColor(pdf,COLORS.purple);pdf.rect(0,0,4,27,'F');
 line(pdf,14,10,'CALI, ¿QUÉ CAMBIA EN MI TERRITORIO?',11,'#FFFFFF',true);
 line(pdf,14,17,'OBSERVATORIO CIUDADANO DEL ORDENAMIENTO TERRITORIAL',7.5,'#E4E0F5');
 if(Number.isFinite(selected?.fichaAreaHa)&&selected.fichaAreaHa>0)line(pdf,14,24,'COMUNA '+pdfText(selected.comuna)+'  |  CÓDIGO '+pdfText(selected.codigo)+'  |  EXTENSIÓN DEL BARRIO '+ha(selected.fichaAreaHa),7,'#DCD7F1',false,185);
 line(pdf,14,39,k,8,COLORS.purple,true);
 const size=pdfText(title).length>49?13:pdfText(title).length>35?15:18;
 line(pdf,14,49,title,size,COLORS.navy,true,184);
 line(pdf,14,61,sub,8.1,COLORS.muted,false,184);
 pdf.setDrawColor(...hexRgb(COLORS.line));pdf.line(14,280,196,280);
 line(pdf,14,286,'POT 2014 vigente (GDB actualizada) - propuesta 2026 no adoptada',7,COLORS.muted);
 // La numeración física se agrega al final: un capítulo puede ocupar varias páginas.
}
function entriesFor(info,key){
 return (info?.capas?.[key]?.categorias||[]).map(r=>({name:pdfText(r.nombre||r.codigo||'Sin categoría'),ha:Number(r.hectareas||0),pct:Number(r.porcentaje_barrio||0)})).filter(r=>r.ha>.009).sort((a,b)=>b.ha-a.ha);
}
function bbox(g){
 const b=window.turf?.bbox(g);return b&&b.every(Number.isFinite)?b:null;
}
function buildMapCanvas(barrio,shapes,phen,width=700,height=430){
 const cnv=document.createElement('canvas');cnv.width=width;cnv.height=height;
 const cx=cnv.getContext('2d');cx.fillStyle='#FFFFFF';cx.fillRect(0,0,width,height);
 const b=bbox(barrio);if(!b)return cnv;
 const pad=24,lonD=Math.max(1e-9,b[2]-b[0]),latD=Math.max(1e-9,b[3]-b[1]);
 const scale=Math.min((width-2*pad)/lonD,(height-2*pad)/latD);
 const tx=x=>width/2+(x-(b[0]+b[2])/2)*scale;
 const ty=y=>height/2-(y-(b[1]+b[3])/2)*scale;
 function drawCoords(coords,close){
  coords.forEach((ring)=>{if(!Array.isArray(ring)||ring.length<3)return;
    cx.moveTo(tx(ring[0][0]),ty(ring[0][1]));
    for(let j=1;j<ring.length;j++)cx.lineTo(tx(ring[j][0]),ty(ring[j][1]));
    if(close)cx.closePath();
  });
 }
 function geom(g,fill,stroke,widthLine=1.5){
  if(!g)return;cx.beginPath();
  const geometry=g.type==='Feature'?g.geometry:g;
  if(!geometry)return;
  const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
  for(const p of polys)drawCoords(p,true);
  if(fill){cx.fillStyle=fill;cx.fill('evenodd')}
  if(stroke){cx.strokeStyle=stroke;cx.lineWidth=widthLine;cx.stroke()}
 }
 cx.save();geom(barrio.geometry,'#EAF0F5','#273E61',2.5);
 for(const c of ['3','2','1','0']){
  for(const r of shapes.filter(x=>x.fen===phen&&x.level===c)){
   geom(r.geometry,RISK_COLORS[c],null);
  }
 }
 geom(barrio.geometry,null,'#273E61',3);cx.restore();
 return cnv;
}
function drawCategories(pdf,x,y,rows,limit=7,barWidth=178,color=COLORS.purple,space=18){
 if(!rows.length){line(pdf,x,y,'Sin categorías registradas en la tabla barrial.',8.7,COLORS.muted);return y+12}
 let max=Math.max(...rows.map(r=>r.ha));
 rows.slice(0,limit).forEach((r,i)=>{y=bar(pdf,x,y,r.name,r.ha,max,[color,COLORS.orange,COLORS.green,COLORS.pink][i%4],barWidth)+Math.max(0,space-18)});
 return y;
}
async function getThreat(barrio){
 if(typeof barrioRiskIntersect!=='function')throw Error('Intersección SIG no disponible');
 const result=await barrioRiskIntersect(barrio,'amenaza');
 if(!result||!Number.isFinite(result.bArea))throw Error('Datos SIG incompletos');
 const rows=result.rows.map(r=>{const [fen,level]=r.cat.split('|');return {fen,level,ha:r.ha,pct:r.pct,geometry:r.geometry?.type==='Feature'?r.geometry.geometry:r.geometry,label:r.label,color:r.color}});
 if(rows.some(r=>r.ha>0&&(!r.geometry||!['Polygon','MultiPolygon'].includes(r.geometry.type))))throw Error('La geometría de amenaza no es un polígono representable');
 // Totales por fenómeno: unión geométrica de categorías para evitar doble conteo.
 // El porcentaje corresponde al área del barrio; el total no es la suma de niveles.
 const totals={};let errors=Number(result.errors||0);
 for(const fen of ['3','1','2']){
  const pieces=rows.filter(r=>r.fen===fen&&r.geometry&&r.ha>=.01);
  if(!pieces.length){totals[fen]={ha:0,pct:0,levels:0};continue;}
  try{
   let united=window.turf.feature(pieces[0].geometry);
   for(const part of pieces.slice(1)){
    const joined=window.turf.union(united,window.turf.feature(part.geometry));
    if(!joined)throw Error('Fallo en disolución entre categorías');
    united=joined;
   }
   const a=window.turf.area(united)/10000;
   if(!Number.isFinite(a)||a>result.bArea*1.002)throw Error('Área total fuera del barrio');
   totals[fen]={ha:a,pct:100*a/result.bArea,levels:pieces.length};
  }catch(e){errors++;totals[fen]={ha:null,pct:null,levels:pieces.length,error:'No fue posible disolver clases solapadas'};}
 }
 return {rows,errors,bArea:result.bArea,totals,method:'Cruce exploratorio Turf sobre GeoJSON web simplificados; unión geométrica por categoría y fenómeno'};
}
async function downloadBarrio(){
 const button=document.getElementById('download-barrio-pdf'),message=document.getElementById('download-barrio-status');
 if(!state.selected||!state.resumen){if(message)message.textContent='Selecciona un barrio y espera la carga de los datos.';return}
 if(!window.jspdf?.jsPDF){if(message)message.textContent='No cargó la biblioteca PDF.';return}
 const barrio=state.selected,p={...barrio.properties},info=barrioInfo(),code=String(p.codigo),name=String(p.barrio);
 button.disabled=true;if(message)message.textContent='Construyendo ficha territorial de '+name+'...';
 try{
  let threat=null,threatError=null;
  try{threat=await getThreat(barrio)}catch(e){threatError=String(e.message||e)}
  let cr=null,crError=null;
  try{cr=await barrioRiskIntersect(barrio,'condicion_riesgo')}catch(e){crError=String(e.message||e)}
  const area=Number(info?.area_barrio_ha)||window.turf.area(barrio)/10000;
  if(!(area>0))throw Error('Área barrial no calculable');
  p.fichaAreaHa=area;
  const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  pdf.setProperties({title:'Ficha territorial '+name+' ('+code+')',subject:'Ficha ciudadana POT Cali: normativa, gestión y amenazas',creator:'Observatorio ciudadano POT Cali'});
  const treatment14=entriesFor(info,'tratamientos2014');
  const treatment26=entriesFor(info,'tratamientos2026');
  const activity14=entriesFor(info,'actividad2014');
  const activity26=entriesFor(info,'actividad2026');
  const trans=(info?.transiciones_tratamiento||[]).map(x=>({from:String(x.desde),to:String(x.hacia),ha:Number(x.hectareas||0)})).filter(x=>x.ha>=.01).sort((a,b)=>b.ha-a.ha);
  const main=trans[0],reading=main?citizenReading(main.from,main.to):null;
  const section=(y,title)=>{line(pdf,14,y,title,10,COLORS.purple,true,180);pdf.setDrawColor(...hexRgb(COLORS.line));pdf.line(14,y+3,196,y+3);return y+12};
  const panel=(x,y,w,h,col='#F1EFF7')=>{fillColor(pdf,col);pdf.roundedRect(x,y,w,h,3,3,'F')};
  const txt=(x,y,value,width=176,size=8.4,color=COLORS.navy,bold=false)=>line(pdf,x,y,value,size,color,bold,width);
  const list=(rows,x,y,max=3,w=85)=>{const m=Math.max(.01,...rows.map(z=>z.ha));for(const z of rows.slice(0,max))y=bar(pdf,x,y,z.name,z.ha,m,COLORS.purple,w);return y};
  const fact=(y,label,value)=>{txt(19,y,label,164,8,COLORS.muted);txt(19,y+8,value,164,10,COLORS.navy,true)};
  // 01: lectura de la transformación y comparación normativa.
  base(pdf,1,'01 / ENTIENDE EL CAMBIO','¿Qué cambia en '+name+'?','Tratamientos del POT 2014 vigente frente a la propuesta 2026.',p);
  let y=section(72,'EL CAMBIO TERRITORIAL MÁS EXTENSO');
  panel(14,y-3,182,47);
  if(main){
   fact(y+6,'TRANSICIÓN IDENTIFICADA',labelTreatment(main.from,2014)+' a '+labelTreatment(main.to,2026));
   txt(19,y+28,ha(main.ha)+' · '+pct(100*main.ha/area)+' del barrio',167,12,COLORS.purple,true);
  }else txt(19,y+15,'Sin transición de tratamiento cuantificable superior a 0,01 ha.',169,9);
  y=section(143,'TRATAMIENTOS POR SUPERFICIE');
  txt(14,y,'POT 2014 · vigente',85,9,COLORS.navy,true);txt(111,y,'PROPUESTA 2026',85,9,COLORS.purple,true);
  const yA=list(treatment14,14,y+9,4,84),yB=list(treatment26,111,y+9,4,84);
  y=Math.max(yA,yB)+2;
  if(y<225){
   y=section(y,'QUÉ SIGNIFICA PARA EL BARRIO');
   y=txt(16,y,reading?.change||'La ausencia de transición cartográfica no acredita que todas las reglas sean iguales.',175,8.5)+6;
   y=txt(16,y,'El cambio de tratamiento no autoriza automáticamente mayores alturas ni derechos de edificación.',175,8.2,COLORS.muted);
  }
  txt(14,263,'Fuente: resumen barrial y transiciones de tratamiento · POT 2014 / propuesta 2026.',183,7.6,COLORS.muted);
  txt(14,272,'No se homologan automáticamente los códigos R1 de ambos instrumentos.',182,7.5,COLORS.muted);
  pdf.addPage();
  // 02: usos, instrumentos y obligaciones sin listados genéricos de categorías ausentes.
  base(pdf,2,'02 / CÓMO SE TRANSFORMA','Usos, instrumentos y obligaciones','Reglas a estudiar según las categorías efectivamente presentes en el barrio.',p);
  y=section(71,'ÁREAS DE ACTIVIDAD');
  txt(14,y,'POT 2014 · vigente',86,8.8,COLORS.navy,true);txt(111,y,'PROPUESTA 2026',85,8.8,COLORS.purple,true);
  const aY=list(activity14,14,y+9,3,84),bY=list(activity26,111,y+9,3,84);
  y=Math.max(aY,bY)+2;
  y=section(Math.max(143,y),'INSTRUMENTOS Y OBLIGACIONES POR VERIFICAR');
  const unique=[...new Set(treatment26.map(z=>z.name))];
  const instrumentHints=[];
  for(const label of unique){
   const c=labelTreatment(label,2026),norm=c.toUpperCase();
   if(/RENOVACI|REDENSIFIC|R1|R2/.test(norm))instrumentHints.push(['Renovación / redensificación','Verificar modalidad, área mínima, plan de manzana o plan parcial, cargas y protección de moradores.']);
   else if(/DESARROLLO|D1|D2/.test(norm))instrumentHints.push(['Desarrollo','Verificar plan parcial cuando proceda, licencias, urbanización, cesiones, vías y redes.']);
   else if(/CONSOLIDACI|C1|C2|C3|C4/.test(norm))instrumentHints.push(['Consolidación','Verificar índices, altura, obligaciones y excepciones; el tratamiento no demuestra aumento de edificabilidad.']);
   else instrumentHints.push([c,'Revisar delimitación, régimen de usos, actuaciones e instrumentos aplicables.']);
  }
  for(const [h,body] of instrumentHints.slice(0,3)){
   if(y>231)break;
   panel(14,y-5,182,28);
   txt(19,y+2,h,172,8.5,COLORS.purple,true);
   txt(19,y+10,body,169,7.8,COLORS.navy);
   y+=35;
  }
  if(!instrumentHints.length)txt(16,y,'Sin tratamiento propuesto verificable en el resumen barrial.',172,8.4);
  txt(14,265,'Un instrumento no se presume aprobado ni localizado en toda la zona de tratamiento.',181,7.6,COLORS.muted);
  txt(14,273,'Los beneficios e incentivos están sujetos a condiciones y obligaciones específicas.',181,7.5,COLORS.muted);
  pdf.addPage();
  // 03: amenazas, condición de riesgo y respuesta sísmica, sin simular comparación histórica.
  base(pdf,3,'03 / AMENAZAS Y CARACTERÍSTICAS DEL SUELO','Amenaza, riesgo y respuesta sísmica','Lectura territorial 2026; no es comparación de riesgo entre POT.',p);
  y=section(71,'AMENAZAS CUANTIFICADAS · PROPUESTA 2026');
  if(threat){
   const items=[['3','INUNDACIÓN'],['1','MOVIMIENTOS EN MASA'],['2','AVENIDAS TORRENCIALES']];
   for(let i=0;i<3;i++){
    const [fen,title]=items[i],x=14+i*62,rows=threat.rows.filter(z=>z.fen===fen),total=threat.totals?.[fen];
    panel(x,85,57,14);
    txt(x+2,91,title,53,7.2,COLORS.purple,true);
    txt(x+2,97,total?.ha===null?'No verificable':total?ha(total.ha)+' · '+pct(total.pct):'Sin dato',53,7.1,COLORS.navy,true);
    if(rows.length){
     const canvas=buildMapCanvas(barrio,rows,fen,540,390);
     pdf.addImage(canvas.toDataURL('image/jpeg',.89),'JPEG',x,102,57,41);
    }else{panel(x,102,57,41,'#EDF0F3');txt(x+4,119,'Sin intersección',49,7.5,COLORS.muted,true);txt(x+4,127,'detectada >=0,01 ha',49,6.7,COLORS.muted)}
    let ry=150;
    for(const z of rows.sort((a,b)=>Number(a.level)-Number(b.level)).slice(0,4)){
     txt(x+1,ry,LEVEL[z.level]+': '+ha(z.ha),55,7.1,COLORS.navy,true);
     txt(x+1,ry+6,pct(z.pct)+' del barrio',55,6.9,COLORS.muted);ry+=15;
    }
   }
  }else{
   panel(14,87,182,56,'#FFF1EC');
   txt(19,101,'Cálculo de amenaza no disponible; no se asignan valores cero.',169,9,COLORS.danger,true);
   txt(19,113,String(threatError||'Error de capas geográficas'),169,7.8,COLORS.muted);
  }
  y=section(215,'CONDICIÓN DE RIESGO Y MICROZONIFICACIÓN');
  const riskRows=cr?.rows||[];
  if(cr?.errors)txt(16,y,'Condición de riesgo: cruce incompleto ('+cr.errors+' errores).',177,7.8,COLORS.danger);
  else if(cr)txt(16,y,riskRows.length?'Condición de riesgo: '+riskRows.length+' categorías con intersección.':'Condición de riesgo: sin intersección detectable en la capa consultada.',176,7.7);
  else txt(16,y,'Condición de riesgo: cruce no disponible. '+String(crError||''),176,7.5,COLORS.danger);
  const micro=(state.microzonasBarrio?.barrios?.[code]?.zonas||[]).filter(z=>Number(z.hectareas)>0).sort((a,b)=>b.hectareas-a.hectareas);
  if(micro.length){
   const top=micro[0];
   txt(16,y+13,'Microzona predominante '+top.zona+': '+ha(top.hectareas)+' · '+pct(top.porcentaje_barrio),177,8.5,COLORS.purple,true);
   if(String(top.zona)==='4D')txt(16,y+23,'4D: Abanico de Meléndez y Lili; respuesta local del suelo, no nivel de riesgo.',177,7.5,COLORS.navy);
  }else txt(16,y+13,'Microzonificación: no hay cruce barrial verificable.',177,8,COLORS.muted);
  txt(14,263,threat?.errors?'Advertencia: '+threat.errors+' geometrías o uniones de amenaza sin procesar.':'Las categorías y fenómenos pueden solaparse; no sumar porcentajes.',181,7.4,threat?.errors?COLORS.danger:COLORS.muted);
  txt(14,271,'Fuente: GeoJSON web simplificados y microzonas aproximadas; verificación GDB pendiente.',181,7.2,COLORS.muted);
  // Numeración física y descarga.
  const pages=pdf.getNumberOfPages();
  for(let i=1;i<=pages;i++){pdf.setPage(i);txt(185,286,i+' / '+pages,12,8,COLORS.navy,true)}
  const filename='Ficha_territorial_'+safe(name)+'_'+safe(code)+'_POT_Cali.pdf';
  const blob=pdf.output('blob');if(!(blob instanceof Blob)||blob.size<4000)throw Error('PDF incompleto');
  if(pdfReadyUrl)URL.revokeObjectURL(pdfReadyUrl);
  pdfReadyUrl=URL.createObjectURL(blob);
  const link=document.getElementById('download-barrio-ready');
  if(link){link.href=pdfReadyUrl;link.download=filename;link.hidden=false;link.textContent='Descargar ficha territorial · '+name;link.click()}
  if(message)message.textContent='Ficha territorial de tres páginas preparada. Si no se descargó, usa el enlace.';
 }catch(e){console.error('Ficha territorial',e);if(message)message.textContent='No se pudo generar la ficha: '+String(e.message||e)}
 finally{button.disabled=!state.selected}
}
function init(){
 const btn=document.getElementById('download-barrio-pdf');
 if(!btn)return;
 btn.addEventListener('click',downloadBarrio);
 // El estado original se actualiza en la aplicación; sincronizamos sin duplicar selección.
 const original=window.MutationObserver;
 if(original){
  const node=document.getElementById('inspector-title');
  new MutationObserver(()=>{btn.disabled=!state.selected;const status=document.getElementById('download-barrio-status');if(status)status.textContent='';const link=document.getElementById('download-barrio-ready');if(link)link.hidden=true;}).observe(node,{childList:true,characterData:true,subtree:true});
 }
}
document.addEventListener('DOMContentLoaded',init);
})();