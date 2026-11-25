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
 return {rows,errors:result.errors,bArea:result.bArea};
}
async function downloadBarrio(){
 const button=document.getElementById('download-barrio-pdf');
 const message=document.getElementById('download-barrio-status');
 if(!state.selected||!state.resumen){if(message)message.textContent='Selecciona un barrio y espera los indicadores.';return}
 if(!window.jspdf?.jsPDF){if(message)message.textContent='No se cargó la biblioteca PDF.';return}
 const barrio=state.selected,p={...barrio.properties},info=barrioInfo(),code=String(p.codigo),name=String(p.barrio);
 button.disabled=true;
 if(message)message.textContent='Generando cuatro páginas con datos de '+name+'…';
 try{
  let threat=null,threatError='',conditionRisk=null,conditionRiskError='';
  try{threat=await getThreat(barrio)}catch(e){threatError=String(e.message||e)}
  try{const cr=await barrioRiskIntersect(barrio,'condicion_riesgo');conditionRisk={rows:cr.rows||[],errors:Number(cr.errors||0),bArea:Number(cr.bArea||0)}}
  catch(e){conditionRiskError=String(e.message||e)}
  const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  pdf.setProperties({title:'Ficha barrial '+name+' ('+code+')',subject:'POT Cali 2014 vigente y propuesta 2026; cruces territoriales exploratorios',creator:'Observatorio POT Cali'});
  const area=Number(window.turf?.area?.(barrio)||0)/10000||Number(info?.area_barrio_ha||0);
  const tr14=entriesFor(info,'tratamientos2014'),tr26=entriesFor(info,'tratamientos2026');
  const ac14=entriesFor(info,'actividad2014'),ac26=entriesFor(info,'actividad2026');
  const trans=(info?.transiciones_tratamiento||[]).map(t=>({from:String(t.desde),to:String(t.hacia),ha:Number(t.hectareas||0)})).filter(t=>t.ha>=.01).sort((a,b)=>b.ha-a.ha);
  const raw=info?.capas?.tratamientos2026?.categorias||[];
  const codeFor=r=>{
   if(typeof asCode==='function')return asCode(r,2026);
   const v=String(r?.codigo_original??r?.codigo??'').trim();
   return ({'1':'CO','2':'CO','3':'C1','4':'C2','5':'C3','6':'C4','7':'D1','8':'D2','9':'MI','10':'R1','11':'R2'})[v]||v;
  };
  const areas=new Map();
  for(const r of raw){const c=codeFor(r),n=Number(r.hectareas||0);if(c&&n>=.03)areas.set(c,(areas.get(c)||0)+n)}
  const currentRules=(state.normas?.reglas||[]).filter(r=>r.anio==='2026');
  const C={navy:'#302747',purple:'#6654A8',muted:'#687385',paper:'#F2F0F8',track:'#E5E6EA',green:'#148879',blue:'#6998B2',red:'#C94F54'};
  const drawText=(x,y,text,size=9,color=C.navy,bold=false,width=178)=>{
   pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);changeColor(pdf,color);
   const lines=pdf.splitTextToSize(pdfText(text),width);
   pdf.text(lines,x,y);return y+lines.length*(size*.36+1.7);
  };
  const rect=(x,y,w,h,c,r=0)=>{
   fillColor(pdf,c);if(r)pdf.roundedRect(x,y,w,h,r,r,'F');else pdf.rect(x,y,w,h,'F');
  };
  const page=(n,k,title,subtitle)=>{
   if(n>1)pdf.addPage();
   rect(0,0,210,29,C.navy);rect(0,0,4,29,C.purple);
   drawText(13,12,'CALI · ¿QUÉ CAMBIA EN MI BARRIO?',13,'#FFFFFF',true);
   drawText(13,21,name+'  |  '+code+'  |  Comuna '+String(p.comuna??'sin dato')+'  |  '+ha(area)+' aprox.',8,'#E4DFF2',false,184);
   drawText(14,44,k,9,C.purple,true);
   drawText(14,57,title,16,C.navy,true);
   drawText(14,65,subtitle,8,C.muted,false,182);
   pdf.setDrawColor(222,224,231);pdf.line(14,279,196,279);
   drawText(14,286,'POT 2014 vigente · Propuesta POT 2026 no adoptada · SIG exploratorio',7,C.muted,false,169);
   drawText(194,286,String(n)+' / 4',8,C.navy,true,20);
  };
  const metric=(x,y,value,label,color=C.purple)=>{
   drawText(x,y,value,18,color,true,80);drawText(x,y+8,label,7.8,C.muted,false,85);
  };
  const miniBars=(rows,x,y,w,color,maxItems=3)=>{
   const chosen=rows.slice(0,maxItems),max=Math.max(.001,...chosen.map(r=>r.ha));
   for(const [i,r] of chosen.entries()){
    const yy=y+i*23;
    drawText(x,yy,r.name,8,C.navy,true,w-35);
    pdf.setFont('helvetica','normal');pdf.setFontSize(7.6);changeColor(pdf,C.muted);
    pdf.text(ha(r.ha),x+w,yy,{align:'right'});
    rect(x,yy+5,w,3.4,C.track,1.5);
    if(r.ha>0)rect(x,yy+5,Math.max(1,w*r.ha/max),3.4,color,1.5);
   }
   if(rows.length>maxItems)drawText(x,y+maxItems*23,'+'+(rows.length-maxItems)+' categorías adicionales en el visor',7.3,C.muted,false,w);
  };
  // Interpretaciones abreviadas, sin sustituir la norma aplicable al predio.
  const ruleText=c=>{
   const choose={
    C1:['Consolidación urbanística','Protege tejidos de baja ocupación con valores ambientales o restricciones. La edificabilidad se verifica predio a predio; no habilita alturas automáticamente.','Arts. 370 y 379'],
    C2:['Consolidación básica','Busca cualificar sectores urbanizados con déficits de vías, espacio público, servicios o equipamientos. Toda intervención debe comprobar alturas, índices y soporte urbano. Plan parcial en consolidación solo mediante PUI.','Arts. 370 y 379'],
    C3:['Consolidación moderada','Orienta densificación moderada donde existen servicios, equipamientos y transporte suficientes. No asigna pisos automáticamente: revisar índices y alturas. Plan parcial únicamente en PUI; verificar plan de manzana y transferencia de derechos.','Arts. 370, 379, 390-393 y 637'],
    C4:['Consolidación con cambio de patrón','Transforma tejidos de baja intensidad en sectores estratégicos. Revisar capacidad de redes, espacio público y movilidad antes de proyectar edificabilidad.','Arts. 370 y 379'],
    D1:['Desarrollo en expansión','Requiere plan parcial en suelo de expansión. Cesiones propuestas sobre área neta urbanizable: 22 % espacio público y 8 % equipamientos. No corresponden al área total del barrio.','Arts. 381, 382 y 385'],
    D2:['Desarrollo urbano','Cesiones propuestas: 16 % para espacio público y 8 % para equipamientos, sobre área neta urbanizable. Se gestiona mediante licencia, proyecto urbanístico general o plan parcial según tamaño, predios y gestión asociada.','Arts. 383 y 385'],
    MI:['Mejoramiento integral','Orienta intervención articulada en asentamientos de desarrollo incompleto para resolver déficits urbanos y de hábitat. Verificar delimitación y condiciones de los Planes de Gestión del Hábitat.','Arts. 380 y 580-591'],
    R1:['Renovación con redensificación alta','Transformación urbana con mayor intensidad donde hay soporte y accesibilidad. Según tamaño y condiciones: actuación individual, plan de manzana o parcial, con cargas y cesiones distintas. Verificar gestión del suelo y protección a moradores.','Arts. 387, 388, 615 y 619-620'],
    R2:['Renovación con redensificación media','Orienta transformación progresiva de sectores de transición. La actuación y sus cargas dependen del instrumento, área y delimitación; planes de manzana y parciales pueden implicar cesiones y medidas para moradores.','Arts. 387, 388, 615 y 619-620'],
    CO:['Conservación','Protege valores patrimoniales, paisajísticos o contextuales. Las obras dependen del régimen de protección y no reciben incentivos automáticos.','Arts. 370 y 377-378'],
    CSU:['Conservación urbana','Preserva sectores urbanos de interés cultural; revisar restricciones de intervención del inmueble y entorno.','Arts. 377-378'],
    CTL:['Conservación contextual','Preserva la relación entre tejido, paisaje y espacio público; consultar reglas de intervención y volumetría.','Arts. 377-378']
   };
   if(choose[c])return choose[c];
   const rule=currentRules.find(r=>(r.codigos||[]).includes(c));
   return rule?[rule.titulo,rule.condicion,'Arts. '+rule.articulos]:['Tratamiento '+c,'Consultar la reglamentación aplicable a la localización.','Proyecto POT'];
  };
  const activityMeaning=name=>{
   const a=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
   if(a.includes('PROXIMIDAD'))return 'Prioriza vivienda y habitabilidad, con comercio y servicios de cercanía regulados.';
   if(a.includes('MULTIFUNCIONAL'))return 'Busca coexistencia regulada de vivienda, comercio y servicios compatibles.';
   if(a.includes('INTEGRACION'))return 'Admite mezcla controlada de actividades económicas en entornos residenciales.';
   if(a.includes('DINAMIZACION'))return 'Concentra servicios especializados y actividades económicas de mayor intensidad.';
   if(a.includes('MANEJO ESPECIAL'))return 'Destina ámbitos a infraestructuras y servicios urbanos básicos y colectivos.';
   return 'El régimen de usos y las condiciones deben verificarse en el art. 365.';
  };
  const microMeaning=zone=>{
   const z=String(zone||'').replace(/^ZONA\s*/i,'').trim().toUpperCase();
   const desc={
    '4D':'Abanico de los ríos Meléndez y Lili: depósitos aluviales con respuesta sísmica específica.',
    '5':'Transición entre abanicos y llanura: el subsuelo tiene respuesta sísmica diferenciada.',
    '4B':'Abanico distal de Cali y Menga: depósitos con respuesta sísmica específica.',
    '4A':'Sector de abanico aluvial; consultar espectro oficial de diseño.',
    '4C':'Sector de abanico aluvial; consultar espectro oficial de diseño.',
    '4E':'Sector de abanico aluvial; consultar espectro oficial de diseño.'
   };
   return desc[z]||'Sector con parámetros propios de respuesta sísmica y diseño estructural.';
  };
  // PÁGINA 1 · comparación de tratamientos y transición dominante.
  page(1,'01 / ENTIENDE EL CAMBIO','¿Qué cambia en '+name+'?','Comparación de tratamientos del POT 2014 y la propuesta 2026.');
  drawText(14,81,'LA TRANSICIÓN TERRITORIAL MÁS EXTENSA',9,C.purple,true);
  rect(14,88,182,48,C.paper,4);
  if(trans.length){
   const t=trans[0],share=area>0?100*t.ha/area:0;
   drawText(20,101,pct(share),20,C.purple,true);
   drawText(80,100,ha(t.ha)+' · '+labelTreatment(t.from,2014)+' → '+labelTreatment(t.to,2026),8.8,C.navy,true,110);
   const reading=citizenReading(t.from,t.to);
   drawText(20,118,reading.change,8,C.navy,false,169);
  }else drawText(20,106,'No se identificó una transición de tratamientos con área verificable.',9,C.navy,false,165);
  drawText(14,151,'TRATAMIENTOS URBANÍSTICOS EN '+name.toLocaleUpperCase('es'),9,C.purple,true,180);
  drawText(14,162,'POT 2014 · vigente',8.7,C.navy,true);
  drawText(111,162,'Propuesta 2026',8.7,C.purple,true);
  miniBars(tr14,14,174,82,C.blue,3);
  miniBars(tr26,111,174,82,C.purple,3);
  drawText(14,256,'¿QUÉ SIGNIFICA?',9,C.purple,true);
  const summary=trans.length?citizenReading(trans[0].from,trans[0].to).watch:'La ausencia de transición en el resumen no demuestra que toda la norma del barrio permanezca igual.';
  drawText(14,265,summary,7.5,C.navy,false,181);
  // PÁGINA 2 · usos e instrumentos por categorías presentes en el barrio.
  page(2,'02 / CÓMO SE TRANSFORMA','Suelo, usos e instrumentos','Área de actividad regula usos; tratamiento orienta la transformación urbana.');
  drawText(14,78,'ÁREAS DE ACTIVIDAD',9,C.purple,true);
  drawText(14,89,'POT 2014 · vigente',8.7,C.navy,true);
  drawText(111,89,'Propuesta 2026',8.7,C.purple,true);
  miniBars(ac14,14,99,82,C.blue,2);miniBars(ac26,111,99,82,C.green,2);
  drawText(14,145,'¿QUÉ SIGNIFICAN LOS USOS PROPUESTOS?',8.5,C.purple,true);
  let ay=154;
  for(const r of ac26.slice(0,2)){
   ay=drawText(14,ay,r.name+': '+activityMeaning(r.name),7.1,C.navy,false,181)+1;
  }
  if(!ac26.length)drawText(14,157,'Sin categorías verificables en el resumen cartográfico.',7.2,C.muted,false,181);
  drawText(14,179,'INSTRUMENTOS Y OBLIGACIONES PROPUESTOS',9,C.purple,true);
  drawText(14,186,'No son derechos automáticos: verificar normas, ámbito y licencia de cada predio.',7,C.muted,false,182);
  const treatments=[...areas.entries()].sort((a,b)=>b[1]-a[1]);
  let y=192;
  if(!treatments.length){rect(14,y,182,65,C.paper,3);drawText(19,y+12,'No hay tratamiento propuesto verificable en el resumen cartográfico.',8.5,C.navy,false,173)}
  const maxCards=Math.min(3,treatments.length);
  const cardH=Math.min(27,(274-y)/Math.max(1,maxCards));
  for(let i=0;i<maxCards;i++){
   const [c,extent]=treatments[i],entry=ruleText(c);
   rect(14,y,182,cardH-2,C.paper,3);
   drawText(19,y+6.3,entry[0]+' ('+c+') · '+ha(extent),8.1,C.purple,true,172);
   drawText(19,y+12,entry[1]+' Proyecto POT: '+entry[2]+'.',6.6,C.navy,false,172);
   y+=cardH;
  }
  if(treatments.length>3)drawText(14,276,'+'+(treatments.length-3)+' tratamientos adicionales: consultar el visor.',6.2,C.muted,false,182);
  // PÁGINA 3 · mapas compactos con cifras junto a cada fenómeno.
  page(3,'03 / AMENAZAS CUANTIFICADAS','Zonificación de amenazas · propuesta 2026','Cruce SIG exploratorio. Los fenómenos y sus porcentajes no deben sumarse.');
  const phen=[['1','MOVIMIENTOS EN MASA'],['3','INUNDACIÓN'],['2','AVENIDAS TORRENCIALES']];
  drawText(14,79,'MAPAS Y CIFRAS POR FENÓMENO',9,C.purple,true);
  for(let i=0;i<3;i++){
   const [fen,title]=phen[i],x=14+i*62,subset=threat?.rows?.filter(r=>r.fen===fen)||[];
   drawText(x,92,title,7,C.navy,true,59);
   if(threat&&subset.length){
    const cnv=buildMapCanvas(barrio,threat.rows,fen,380,265);
    pdf.addImage(cnv.toDataURL('image/jpeg',.84),'JPEG',x+7,97,44,31);
    let yy=138;
    for(const lvl of ['1','2','3','0']){
     const rr=subset.filter(r=>r.level===lvl);if(!rr.length)continue;
     const total=rr.reduce((a,r)=>a+r.ha,0),percent=rr.reduce((a,r)=>a+r.pct,0);
     drawText(x,yy,LEVEL[lvl]+': '+ha(total)+' · '+pct(percent),7.1,lvl==='1'?C.red:lvl==='3'?C.green:C.navy,true,59);
     yy+=11;
    }
   }else{
    rect(x+7,97,44,31,'#EEF1F5',3);
    drawText(x+10,113,threat?'Sin cruce':'Sin datos SIG',7,C.muted,true,38);
   }
  }
  drawText(14,208,'CÓMO INTERPRETAR LOS PORCENTAJES',9,C.purple,true);
  rect(14,215,182,51,C.paper,3);
  if(threat){
   drawText(19,225,'Superficie SIG de referencia: '+ha(threat.bArea),9,C.navy,true,172);
   drawText(19,237,'Alta, media y baja son categorías de amenaza: no equivalen a viviendas ni personas expuestas.',8,C.navy,false,172);
   drawText(19,250,'Los cruces no determinan riesgo predial ni sustituyen estudios de detalle.',7.7,C.muted,false,172);
   if(threat.errors)drawText(19,261,'Precaución: '+threat.errors+' geometrías sin procesar.',7.2,C.red,true,172);
  }else{
   drawText(19,230,'No fue posible calcular los cruces SIG para este barrio.',8.3,C.red,true,171);
   drawText(19,242,'Motivo: '+threatError,7,C.muted,false,171);
  }
  // PÁGINA 4 · interpretación de microzonas y condición de riesgo cuando existe.
  page(4,'04 / MICROZONIFICACIÓN Y RIESGO','Respuesta sísmica local','Una microzona define respuesta del suelo, no el nivel de riesgo de las viviendas.');
  drawText(14,80,'MICROZONAS SÍSMICAS APROXIMADAS',9,C.purple,true);
  const micro=state.microzonasBarrio?.barrios?.[code]?.zonas||[];
  const zones=micro.filter(z=>Number(z.hectareas||0)>0).sort((a,b)=>Number(b.hectareas)-Number(a.hectareas));
  if(zones.length){
   const max=Math.max(...zones.map(z=>Number(z.hectareas)));
   let zy=94;
   for(const z of zones.slice(0,4)){
    const v=Number(z.hectareas||0);
    drawText(16,zy,'Zona '+z.zona+' · '+ha(v)+' ('+pct(Number(z.porcentaje_barrio||0))+')',8.1,C.navy,true,170);
    rect(16,zy+4,177,3.1,C.track,1);
    rect(16,zy+4,Math.max(1,177*v/max),3.1,C.purple,1);
    zy+=17;
   }
   if(zones.length>4)drawText(16,165,'+'+(zones.length-4)+' microzonas adicionales en el visor.',7,C.muted,false,175);
   drawText(14,174,'¿QUÉ SIGNIFICA CADA MICROZONA?',9,C.purple,true);
   let my=185;
   for(const z of zones.slice(0,2))my=drawText(14,my,'Zona '+z.zona+': '+microMeaning(z.zona),7.6,C.navy,false,181)+3;
   drawText(14,222,'No clasifica riesgo alto, medio o bajo ni prueba vulnerabilidad de edificaciones.',7.3,C.muted,false,181);
   drawText(14,234,'Fuente normativa: Decreto 411.0.20.0158 de 2014; proyecto POT, art. 80.',7,C.muted,false,181);
  }else{
   rect(14,90,182,57,C.paper,3);
   drawText(19,111,'No hay microzonas barriales verificables para esta ficha.',8.5,C.muted,false,171);
   drawText(14,168,'No se infiere una microzona por ausencia de cartografía.',8,C.navy,false,181);
  }
  const riskRows=conditionRisk?.rows||[];
  if(riskRows.length){
   const top=riskRows.slice().sort((a,b)=>b.ha-a.ha)[0];
   drawText(14,246,'CONDICIÓN DE RIESGO · PROPUESTA 2026',9,C.purple,true);
   drawText(14,257,String(top.label||top.cat||'Categoría intersectada')+' · '+ha(top.ha)+' ('+pct(top.pct)+' del barrio)',8.1,C.navy,true,182);
   drawText(14,267,'Cruce indicativo: requiere verificación predial y técnica.',7,C.muted,false,182);
  }else if(conditionRiskError){
   drawText(14,254,'No se pudo consultar la capa de condición de riesgo.',7.7,C.muted,false,181);
  }
  if(pdf.getNumberOfPages()!==4)throw Error('La ficha no tiene exactamente cuatro páginas');
  const filename='Ficha_barrial_'+safe(name)+'_'+safe(code)+'_POT_Cali.pdf';
  const blob=pdf.output('blob');
  if(!(blob instanceof Blob)||blob.size<4500)throw Error('El PDF generado está incompleto');
  if(pdfReadyUrl)URL.revokeObjectURL(pdfReadyUrl);
  pdfReadyUrl=URL.createObjectURL(blob);
  const link=document.getElementById('download-barrio-ready');
  if(link){link.href=pdfReadyUrl;link.download=filename;link.hidden=false;link.textContent='Descargar PDF generado · '+name;link.click()}
  if(message)message.textContent='Ficha de cuatro páginas preparada para '+name+'.';
 }catch(e){
  console.error('Ficha barrial de cuatro páginas',e);
  if(message)message.textContent='No fue posible completar la ficha: '+(e.message||e);
 }finally{button.disabled=!state.selected}
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