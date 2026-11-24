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
 if(!state.selected||!state.resumen){if(message)message.textContent='Selecciona un barrio y espera a que carguen los indicadores.';return;}
 if(!window.jspdf?.jsPDF){if(message)message.textContent='No cargó la biblioteca PDF. Comprueba la conexión y vuelve a intentarlo.';return;}
 const barrio=state.selected,p={...barrio.properties},info=barrioInfo(),code=String(p.codigo),name=String(p.barrio);
 button.disabled=true;if(message)message.textContent='Preparando cruces y mapas de '+name+'…';
 try{
  // Se calculan amenazas reales del barrio seleccionado; un fallo no se convierte en cero.
  let threat=null,threatError=null;
  try{threat=await getThreat(barrio)}catch(err){threatError=String(err.message||err)}
  const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  pdf.setProperties({title:'Ficha barrial '+name+' ('+code+') · Observatorio POT Cali',subject:'Análisis territorial exploratorio y comparación normativa 2014–2026',creator:'Observatorio ciudadano POT Cali'});
  const tr14=entriesFor(info,'tratamientos2014'),tr26=entriesFor(info,'tratamientos2026');
  const ac14=entriesFor(info,'actividad2014'),ac26=entriesFor(info,'actividad2026');
  const trans=(info?.transiciones_tratamiento||[]).map(x=>({from:String(x.desde),to:String(x.hacia),ha:Number(x.hectareas||0)})).sort((a,b)=>b.ha-a.ha);
  const area=window.turf?.area?window.turf.area(barrio)/10000:Number(threat?.bArea||info?.area_barrio_ha||0);
  p.fichaAreaHa=area;
  // PÁGINA 1: tratamientos por período, lectura con fuentes y códigos.
  base(pdf,1,'01 / PERFIL TERRITORIAL','Ficha territorial - '+name,'Comuna '+p.comuna+' - código '+code+' - cartografía del Observatorio',p);
  fillColor(pdf,'#F0EFF7');pdf.roundedRect(14,69,182,24,3,3,'F');
  line(pdf,19,78,'QUÉ MUESTRAN LOS TRATAMIENTOS',10,COLORS.navy,true);
  line(pdf,19,86,'Área del barrio intersectada por cada clasificación urbanística.',8,COLORS.muted);
  line(pdf,14,104,'POT 2014 - VIGENTE',10,COLORS.purple,true,86);
  line(pdf,111,104,'PROPUESTA POT 2026',10,COLORS.purple,true,85);
  let leftY=115,rightY=115;
  const max14=Math.max(1,...tr14.map(x=>x.ha)),max26=Math.max(1,...tr26.map(x=>x.ha));
  for(const row of tr14.slice(0,3)){leftY=bar(pdf,15,leftY,labelTreatment(row.name,2014),row.ha,max14,COLORS.green,83);line(pdf,15,leftY-5,hintTreatment(row.name),6.7,'#8993A1',false,79);leftY+=8;}
  for(const row of tr26.slice(0,3)){rightY=bar(pdf,111,rightY,labelTreatment(row.name,2026),row.ha,max26,COLORS.pink,83);line(pdf,111,rightY-5,hintTreatment(row.name),6.7,'#8993A1',false,79);rightY+=8;}
  line(pdf,14,255,'Se muestran las tres categorías de mayor superficie por cada período.',8,COLORS.muted);
  line(pdf,14,264,'Cada barra expresa hectáreas de intersección, no predios ni licencias.',8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 2: lectura sustantiva de las transiciones, con una visualización por superficie.
  base(pdf,2,'02 / TRANSFORMACIÓN NORMATIVA','¿Qué propone cambiar el POT?','La misma superficie del barrio, comparada entre la cartografía vigente y la propuesta.',p);
  line(pdf,14,76,'QUÉ ESTAMOS COMPARANDO',9.8,COLORS.purple,true);
  line(pdf,14,85,'Identificamos qué tratamiento tiene cada porción del barrio en 2014 y cuál',8.5,COLORS.navy);
  line(pdf,14,91,'se propone asignar en 2026. Cada cruce se mide en hectáreas de superficie.',8.5,COLORS.navy);
  const effectiveTrans=trans.filter(t=>Number.isFinite(t.ha)&&t.ha>=0.01);
  if(effectiveTrans.length){
    const lead=effectiveTrans[0],from=labelTreatment(lead.from,2014),to=labelTreatment(lead.to,2026);
    const areaPct=area>0?100*lead.ha/area:null;
    fillColor(pdf,'#F1F0F7');pdf.roundedRect(14,103,182,90,3,3,'F');
    line(pdf,19,114,'LA TRANSICIÓN DE MAYOR SUPERFICIE',9.7,COLORS.purple,true,170);
    line(pdf,19,127,'Antes · POT 2014',8,COLORS.muted,true,130);
    line(pdf,19,136,from,10,COLORS.navy,true,155);
    line(pdf,19,148,'Propuesta · POT 2026',8,COLORS.muted,true,130);
    line(pdf,19,157,to,10,COLORS.purple,true,155);
    fillColor(pdf,'#E2DFED');pdf.roundedRect(19,167,172,5,2,2,'F');
    if(areaPct!==null){fillColor(pdf,COLORS.purple);pdf.roundedRect(19,167,172*Math.min(100,Math.max(0,areaPct))/100,5,2,2,'F');}
    line(pdf,19,183,ha(lead.ha)+' de superficie del barrio'+(areaPct===null?'':' · '+pct(areaPct)),9.3,COLORS.navy,true,172);
    line(pdf,14,206,'OTRAS TRANSICIONES IDENTIFICADAS',9.5,COLORS.purple,true);
    let otherY=216;
    for(const t of effectiveTrans.slice(1,3)){
      const af=labelTreatment(t.from,2014),bt=labelTreatment(t.to,2026);
      const percent=area>0?pct(100*t.ha/area):'';
      line(pdf,17,otherY,af+' (2014)',8,COLORS.navy,true,143);
      line(pdf,17,otherY+7,'a '+bt+' (2026)',8,COLORS.muted,false,143);
      pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);changeColor(pdf,COLORS.purple);
      pdf.text(ha(t.ha),192,otherY+7,{align:'right'});
      if(percent)line(pdf,17,otherY+14,percent+' del barrio',7.5,COLORS.muted);
      otherY+=23;
    }
    if(effectiveTrans.length>3)line(pdf,14,264,'Se destacan los tres cruces mayores; consultar la plataforma para los restantes.',7.5,COLORS.muted);
  }else{
    fillColor(pdf,'#F1F0F7');pdf.roundedRect(14,108,182,48,3,3,'F');
    line(pdf,19,124,'Sin transiciones con superficie suficiente en el resumen barrial.',9,COLORS.navy,true,166);
    line(pdf,19,137,'No implica que se mantengan idénticas las reglas de los dos POT.',8,COLORS.muted,false,166);
  }
  line(pdf,14,275,'Mismo código no implica mismo régimen: p. ej., R2 se redefine en la propuesta 2026.',7.1,COLORS.muted);
  pdf.addPage();
  // PÁGINA 3: interpretación ciudadana, separada de la métrica y del mapa.
  base(pdf,3,'03 / LECTURA DEL CAMBIO','¿Qué significa para el barrio?','Interpretación de las modificaciones propuestas, no un dictamen sobre predios.',p);
  if(effectiveTrans.length){
    const main=effectiveTrans[0],prev=labelTreatment(main.from,2014),next=labelTreatment(main.to,2026);
    const percent=area>0?pct(100*main.ha/area):null;
    fillColor(pdf,'#F1F0F7');pdf.roundedRect(14,71,182,47,3,3,'F');
    line(pdf,19,82,'EL CAMBIO MÁS EXTENSO DEL BARRIO',9.3,COLORS.purple,true);
    line(pdf,19,93,ha(main.ha)+(percent?' ('+percent+' del barrio)':''),13,COLORS.navy,true);
    line(pdf,19,103,'Antes: '+prev,8.2,COLORS.navy,false,165);
    line(pdf,19,112,'Propuesta: '+next,8.2,COLORS.purple,false,165);
    const verified=verifiedTransitionDetail(main.from,main.to);
    line(pdf,14,137,'¿QUÉ QUIERE DECIR?',10,COLORS.purple,true);
    let y=149;
    y=softParagraph(pdf,16,y,verified?.meaning||treatmentMeaning(main.from,main.to),175,verified?8.35:9.3)+6;
    line(pdf,14,y,'¿QUÉ NO SE PUEDE CONCLUIR?',10,COLORS.purple,true);
    y+=12;
    y=softParagraph(pdf,16,y,verified?.limits||'La transición muestra la clasificación del suelo, pero no acredita pisos permitidos, autorización de un proyecto ni beneficio individual. Estas condiciones dependen de índices, delimitación del ámbito y reglas específicas.',174,verified?8.2:8.8)+4;
    line(pdf,14,y,'¿QUÉ DEBE VERIFICARSE?',10,COLORS.purple,true);
    y+=11;
    y=softParagraph(pdf,16,y,verified?.checks||'Faltan la ubicación y dimensiones de los predios, las delimitaciones efectivas de los instrumentos, los soportes urbanos y la situación ambiental y de riesgo. Las reglas generales se detallan en las páginas de gestión.',174,verified?8.1:8.7);
  }else{
    line(pdf,16,83,'No hay un cruce de tratamientos superior a 0,01 ha registrado.',9,COLORS.navy);
    line(pdf,16,96,'La ausencia de cruce no implica identidad normativa entre los POT.',8.5,COLORS.muted);
  }
  line(pdf,14,268,'Fuente: transiciones espaciales calculadas de POT 2014 y propuesta 2026.',7.5,COLORS.muted);
  line(pdf,14,275,'Lectura interpretativa general; no sustituye la norma de un predio.',7.5,COLORS.muted);
  pdf.addPage();
  // PÁGINA 4: áreas de actividad, separadas de los tratamientos.
  base(pdf,4,'04 / ÁREAS DE ACTIVIDAD','¿Cómo se distribuyen los usos?','Áreas de actividad de cada instrumento territorial; no permisos individuales.',p);
  line(pdf,14,77,'CÓMO LEER LAS ÁREAS DE ACTIVIDAD',9.8,COLORS.purple,true);
  line(pdf,14,86,'Muestran la orientación de uso, no actividades autorizadas predio a predio.',8.4,COLORS.navy);
  line(pdf,14,104,'POT 2014 - VIGENTE',10,COLORS.purple,true);
  line(pdf,111,104,'PROPUESTA 2026',10,COLORS.purple,true);
  let y14=115,y26=115;
  const mx14=Math.max(1,...ac14.map(x=>x.ha)),mx26=Math.max(1,...ac26.map(x=>x.ha));
  for(const row of ac14.slice(0,4)){y14=bar(pdf,15,y14,row.name,row.ha,mx14,COLORS.green,83);line(pdf,15,y14-5,hintActivity(row.name),6.7,'#8993A1',false,79);y14+=7;}
  for(const row of ac26.slice(0,4)){y26=bar(pdf,111,y26,row.name,row.ha,mx26,COLORS.orange,83);line(pdf,111,y26-5,hintActivity(row.name),6.7,'#8993A1',false,79);y26+=7;}
  line(pdf,14,255,'Se muestran las cuatro áreas de mayor superficie para cada instrumento.',8,COLORS.muted);
  line(pdf,14,264,'Para conocer usos permitidos o condicionados, consultar matrices y articulado.',8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 4: instrumentos de gestión. Diferenciar coincidencia cartográfica de reglas generales.
  const plans14=entriesFor(info,'planes2014');
  const plans26=entriesFor(info,'planes2026');
  const prev26=entriesFor(info,'planes_previos2026').length?entriesFor(info,'planes_previos2026'):entriesFor(info,'planes_previos');
  const instruments26=entriesFor(info,'instrumentos2026').length?entriesFor(info,'instrumentos2026'):entriesFor(info,'instrumentos');
  const treat26Raw=info?.capas?.tratamientos2026?.categorias||[];
  // Usar la misma homologación que el visor y descartar coincidencias residuales.
  // No activar reglas por texto ni por una categoría con área cero.
  const treatmentCodes=new Set(treat26Raw.filter(v=>Number(v.hectareas)>=.03).map(v=>
    typeof asCode==='function'?asCode(v,2026):String(v.codigo_original??v.codigo??'')
  ).filter(Boolean));
  const urbanRenew=treatmentCodes.has('R1')||treatmentCodes.has('R2');
  const development=treatmentCodes.has('D1')||treatmentCodes.has('D2');
  const conservation=treatmentCodes.has('CSU')||treatmentCodes.has('CTL')||treatmentCodes.has('CON');
  base(pdf,5,'05 / GESTIÓN URBANÍSTICA','¿Con qué instrumentos se transforma?','Ámbitos cartografiados y reglas generales que requieren verificación por predio.',p);
  line(pdf,14,77,'COINCIDENCIAS CARTOGRÁFICAS EN EL BARRIO',10,COLORS.purple,true);
  let gy=90;
  const planLayers=[
    ['Planes parciales POT 2014',plans14],
    ['Planes parciales propuesta 2026',plans26],
    ['Instrumentos preexistentes 2026',prev26],
    ['Otros instrumentos delimitados 2026',instruments26]
  ].filter(([,rows])=>rows.length>0);
  if(planLayers.length){
    for(const [label,rows] of planLayers){
      line(pdf,16,gy,label,8.7,COLORS.navy,true,139);
      pdf.setFont('helvetica','bold');pdf.setFontSize(8.4);changeColor(pdf,COLORS.purple);
      pdf.text(ha(rows.reduce((v,r)=>v+r.ha,0)),194,gy,{align:'right'});
      gy+=20;
    }
    line(pdf,14,gy+2,'Superficies por categoría: pueden solaparse y no son área única.',7.6,COLORS.muted);
  }else{
    fillColor(pdf,'#F2F5F7');pdf.roundedRect(14,85,182,42,3,3,'F');
    line(pdf,19,96,'Sin intersecciones registradas con instrumentos delimitados.',9.1,COLORS.navy,true,173);
    line(pdf,19,108,'Esto no elimina reglas de gestión asociadas al tratamiento.',8,COLORS.muted,false,173);
  }
  const candidates=[];
  if(urbanRenew||development){
    candidates.push(['Plan parcial','Organiza actuaciones urbanísticas en ámbitos definidos.','Procedencia: ver las condiciones del tratamiento y la delimitación.']);
  }
  if(urbanRenew){
    candidates.push(['Plan de manzana','Organiza intervenciones de renovación en una manzana.','Requiere dimensión y condiciones normativas específicas.']);
  }
  if(urbanRenew||development){
    candidates.push(['Actuación individual o licencia','Vía de intervención para ciertos predios o agrupaciones.','Su posibilidad depende de la modalidad de tratamiento y sus cargas.']);
  }
  if(treatmentCodes.has('MI'))candidates.push(['Plan de Gestión del Hábitat','Coordina actuaciones públicas de mejoramiento integral.','No es equivalente a un plan parcial de renovación.']);
  if(conservation)candidates.push(['Conservación','Protección patrimonial y contextual.','Debe identificarse modalidad de conservación y régimen especial.']);
  let iy=Math.max(gy+23,146);
  line(pdf,14,iy,'REGLAS ASOCIADAS A LOS TRATAMIENTOS PRESENTES',9.4,COLORS.purple,true);
  iy+=13;
  if(candidates.length){
    for(const [title,definition,detail] of candidates){
      if(iy>241)break;
      line(pdf,16,iy,title,8.5,COLORS.navy,true,174);
      line(pdf,16,iy+6,definition,7.2,'#8993A1',false,175);
      line(pdf,16,iy+13,detail,7.3,COLORS.muted,false,175);
      iy+=25;
    }
  }else{
    line(pdf,16,iy,'Sin modalidad particular identificada en la síntesis.',8.6,COLORS.muted,false,174);
  }
  line(pdf,14,267,'Estas son reglas vinculadas a tratamientos, NO planes delimitados aquí.',7.6,COLORS.muted);
  line(pdf,14,274,'Detalles, superficies y artículos específicos en el capítulo siguiente.',7.5,COLORS.muted);
  pdf.addPage();
  // PÁGINA 6: reglas e instrumentos concretos asociados al tratamiento cartografiado.
  base(pdf,6,'06 / INSTRUMENTOS CONCRETOS','¿Qué procedimiento podría aplicar?','Las opciones dependen del tratamiento y de las condiciones específicas del ámbito.',p);
  // Matriz normativa con soporte territorial: misma clasificación que usa el visor.
  const t2026=info?.capas?.tratamientos2026?.categorias||[];
  const t2014=info?.capas?.tratamientos2014?.categorias||[];
  const codeFor=(r,yr)=>{
    if(typeof asCode==='function')return asCode(r,yr);
    const v=String(r?.codigo_original??r?.codigo??'').trim();
    if(yr===2026)return ({'1':'CO','2':'CO','3':'C1','4':'C2','5':'C3','6':'C4','7':'D1','8':'D2','9':'MI','10':'R1','11':'R2'})[v]||v;
    return v;
  };
  function byTreatment(rows,year){
    const map=new Map();
    for(const row of rows){
      const code=codeFor(row,year),ha=Number(row.hectareas);
      if(!code||!Number.isFinite(ha)||ha<.03)continue;
      map.set(code,(map.get(code)||0)+ha);
    }
    return map;
  }
  const areas26=byTreatment(t2026,2026),areas14=byTreatment(t2014,2014);
  const norms=state.normas?.reglas||[];
  const regimes=[];
  // Regla 2026 con cruce real de su tratamiento, pero NO implica que
  // el ámbito de un plan parcial/plan manzana haya sido delimitado aquí.
  for(const rule of norms.filter(r=>r.anio==='2026')){
    const match=(rule.codigos||[]).filter(code=>areas26.has(code));
    if(!match.length)continue;
    const evidence=match.map(code=>code+': '+ha(areas26.get(code))).join(' · ');
    regimes.push({
      title:rule.titulo+' · PROPUESTA 2026',
      rule:rule.condicion,
      impact:'COINCIDENCIA DE TRATAMIENTO: '+evidence+'. Es superficie por categoría; el instrumento requiere verificar su ámbito y supuestos.',
      ref:'Proyecto de Acuerdo 2026 · arts. '+rule.articulos+' · p. '+(rule.pagina_documento||'sin dato')+' de la matriz documental.',
      weight:match.reduce((v,k)=>v+areas26.get(k),0),
      code:rule.id
    });
  }
  // Conservación CO/CSU/CTL está descrita en homologación, pero la
  // matriz no contiene una regla 2026 aplicable: no inventar instrumento.
  const conservationArea=[...areas26].filter(([k])=>['CO','CSU','CTL'].includes(k)).reduce((a,[,v])=>a+v,0);
  if(conservationArea>0)regimes.push({
    title:'CONSERVACIÓN · PROPUESTA 2026',
    rule:'La propuesta diferencia conservación de sectores urbanos de interés cultural y conservación contextual. Es necesario comprobar la modalidad, delimitación y norma patrimonial.',
    impact:'COINCIDENCIA DE TRATAMIENTO: '+ha(conservationArea)+'. La matriz no permite atribuir aquí un incentivo patrimonial específico.',
    ref:'Proyecto de Acuerdo 2026, arts. 370 y 377-378. Homologación preliminar.',
    weight:conservationArea,
    code:'conservacion-homologacion'
  });
  // Evitar repetir reglas generales antes de las específicas: ordenar
  // por superficie del tratamiento coincidente, luego instrumento.
  regimes.sort((a,b)=>b.weight-a.weight||a.title.localeCompare(b.title,'es'));
  if(!regimes.length)regimes.push({
    title:'SIN REGLA PARTICULAR VINCULABLE',
    rule:'El resumen cartográfico no identifica un tratamiento con superficie de al menos 0,03 ha que coincida con una regla de la matriz normativa cargada.',
    impact:'Esto NO implica ausencia de instrumentos, ni de obligaciones; se debe revisar la cartografía y la norma.',
    ref:'Matriz normativa del Observatorio · data/normativa_gestion.json.',
    weight:0,code:'no-rule'
  });
  // Contexto 2014: referencias jurídicas para contraste de procedimientos.
  const priorRules=norms.filter(rule=>rule.anio==='2014'&&(rule.codigos||[]).some(c=>areas14.has(c)));
  // Tarjetas de altura calculada según contenido para evitar desbordes.
  // En caso de más de dos familias aplicables, se añade una segunda página
  // de reglas territoriales con continuación y trazabilidad normativa.
  function drawRegimeCard(rg,y){
    const titleLines=pdf.splitTextToSize(pdfText(rg.title),170);
    const ruleLines=pdf.splitTextToSize(pdfText(rg.rule),170);
    const impactLines=pdf.splitTextToSize(pdfText(rg.impact),170);
    const refLines=pdf.splitTextToSize(pdfText(rg.ref),170);
    const titleH=titleLines.length*4.0,ruleH=ruleLines.length*4.15;
    const impactH=impactLines.length*3.85,refH=refLines.length*3.5;
    const height=24+titleH+ruleH+impactH+refH+8;
    fillColor(pdf,'#F3F4F8');pdf.roundedRect(14,y,182,height,3,3,'F');
    let yy=y+8;
    yy=line(pdf,19,yy,rg.title,8.6,COLORS.purple,true,170)+1;
    yy=line(pdf,19,yy,rg.rule,8.15,COLORS.navy,false,170)+2;
    yy=line(pdf,19,yy,rg.impact,7.7,COLORS.muted,false,170)+2;
    line(pdf,19,yy,rg.ref,7.0,COLORS.purple,false,170);
    return y+height+5;
  }
  line(pdf,14,72,'Reglas activadas por tratamiento: la superficie NO delimita el instrumento.',7.3,COLORS.muted);
  let rY=79, printed=0;
  for(const rg of regimes){
    const ruleLines=pdf.splitTextToSize(pdfText(rg.rule),170).length;
    const impactLines=pdf.splitTextToSize(pdfText(rg.impact),170).length;
    const approx=55+ruleLines*5+impactLines*5;
    if(rY+approx>257){
      line(pdf,14,272,'Continúa el análisis de instrumentos del barrio en la página siguiente.',7.4,COLORS.muted);
      pdf.addPage();
      base(pdf,6,'06 / INSTRUMENTOS CONCRETOS','Instrumentos: continuación','Tratamientos del barrio y condiciones normativas propuestas.',p);
      rY=79;
    }
    rY=drawRegimeCard(rg,rY);printed++;
  }
  // Contraste POT 2014: normativa vigente y superficie cartografiada.
  // Se presenta de forma separada porque R1/R2 de 2014 no son equivalentes a 2026.
  if(priorRules.length){
    if(rY>219){
      pdf.addPage();
      base(pdf,6,'06 / NORMATIVA VIGENTE','Antecedentes del POT 2014','Reglas del POT vigente para tratamientos que intersectan el barrio.',p);
      rY=79;
    }else{
      line(pdf,14,rY+1,'ANTECEDENTES DEL POT 2014 VIGENTE',9.1,COLORS.purple,true);
      rY+=14;
    }
    for(const rule of priorRules){
      const matches=(rule.codigos||[]).filter(code=>areas14.has(code));
      const evidence=matches.map(code=>code+': '+ha(areas14.get(code))).join(' · ');
      const rg={
        title:rule.titulo+' · POT 2014 VIGENTE',
        rule:rule.condicion,
        impact:'COINCIDENCIA DE TRATAMIENTO VIGENTE: '+evidence+'. No implica que un plan parcial esté efectivamente delimitado en esta superficie.',
        ref:'Acuerdo 0373 de 2014 · arts. '+rule.articulos+' · p. '+(rule.pagina_documento||'sin dato')+' de la matriz documental.'
      };
      const approx=55+pdf.splitTextToSize(pdfText(rg.rule),170).length*5+pdf.splitTextToSize(pdfText(rg.impact),170).length*5;
      if(rY+approx>257){
        pdf.addPage();
        base(pdf,6,'06 / NORMATIVA VIGENTE','Antecedentes 2014: continuación','Se identifican reglas por tratamiento vigente y superficie coincidente.',p);
        rY=79;
      }
      rY=drawRegimeCard(rg,rY);
    }
  }
  line(pdf,14,268,'Fuente: matriz normativa y cruces de tratamientos del Observatorio.',7.4,COLORS.muted);
  line(pdf,14,275,'No acredita permisos, exenciones ni derechos específicos por predio.',7.4,COLORS.muted);
  pdf.addPage();
  // CAPÍTULO 07: cargas, beneficios y garantías con explicación para ciudadanía.
  base(pdf,7,'07 / GESTIÓN E INCENTIVOS','¿Quién obtiene qué y bajo qué reglas?','La propuesta diferencia aprovechamientos, cargas y mecanismos de financiación.',p);
  const benefits=[
    {
     title:'Edificabilidad adicional: ICA e ICP',
     concept:'Son índices que regulan la construcción adicional a la edificabilidad básica.',
     mechanism:'Los planes parciales y planes de manzana pueden tener formas distintas de acceso. El ICA y el ICP no implican idénticas contraprestaciones.',
     check:'Verificar modalidad, índice aplicable, cesiones y aportes antes de concluir que hay mayor beneficio.',
     source:'Proyecto POT 2026: arts. 616, 619 y 620.'
    },
    {
     title:'Participación en plusvalía',
     concept:'Instrumento mediante el cual la ciudad participa en incrementos de valor del suelo asociados a acciones urbanísticas.',
     mechanism:'La modificación de usos o aprovechamientos puede configurar un hecho generador, pero no es equivalente a cobrar automáticamente por todo el barrio.',
     check:'Debe identificarse hecho generador, efecto, régimen de exigibilidad y actos administrativos.',
     source:'Requiere contraste con normativa distrital y régimen de plusvalía.'
    },
    {
     title:'Cesiones, cargas y beneficios',
     concept:'Contribuciones para suelo, vías, espacio público, equipamientos o infraestructuras vinculadas a una actuación.',
     mechanism:(treatmentCodes.has('R2')?'El artículo 388 propone para R2 cesiones de 12% de espacio público y 4% de área privada de vocación pública, calculadas sobre el área neta urbanizable.':treatmentCodes.has('R1')?'El artículo 388 propone para R1 cesiones de 10% de espacio público y 6% de área privada de vocación pública, calculadas sobre el área neta urbanizable.':'Las obligaciones y bases de cálculo dependen del tratamiento, del instrumento y del ámbito delimitado.'),
     check:'No sumar porcentajes de modalidades diferentes ni concluir exenciones generales.',
     source:'Proyecto POT 2026: arts. 371-372, 388 y 616-620.'
    },
    {
     title:'Conservación e incentivos',
     concept:'La conservación regula intervenciones para proteger patrimonio construido y sectores de valor cultural o contextual.',
     mechanism:'La posibilidad de incentivos depende de instrumentos y condiciones específicos; no todos los inmuebles reciben compensaciones.',
     check:'Verificar declaratoria, delimitación, nivel de protección y régimen de intervención.',
     source:'POT 2014: arts. 301-307; propuesta: arts. 377-378.'
    },
    {
     title:'Moradores y actividades económicas',
     concept:'Las transformaciones urbanas pueden generar impactos sobre hogares, arrendatarios, comercios y actividades existentes.',
     mechanism:'Deben examinarse medidas de participación, permanencia, reasentamiento o retorno previstas en el instrumento aplicable.',
     check:'No se ha acreditado un beneficio o garantía concreta para cada persona o predio.',
     source:'Revisión pendiente de disposiciones y programas complementarios.'
    }
  ];
  // No mostrar incentivos que no están vinculados al tratamiento.
  // La plusvalía se menciona como posible hecho generador sólo si hay
  // transformación normativa y un tratamiento de urbanización/renovación.
  const activityChange=trans.some(t=>Number.isFinite(t.ha)&&t.ha>=.03&&pdfText(t.from)!==pdfText(t.to));
  const benefitAllowed=(item)=>{
    if(item.title.startsWith('Edificabilidad'))return urbanRenew||development;
    if(item.title.startsWith('Participación'))return (urbanRenew||development)&&activityChange;
    if(item.title.startsWith('Cesiones'))return urbanRenew||development;
    if(item.title.startsWith('Conservación'))return conservation;
    if(item.title.startsWith('Moradores'))return urbanRenew;
    return false;
  };
  const relevantBenefits=benefits.filter(benefitAllowed);
  let benefitY=77;
  if(!relevantBenefits.length){
    fillColor(pdf,'#F2F5F7');pdf.roundedRect(14,78,182,56,3,3,'F');
    line(pdf,20,91,'Sin incentivos específicos asociados a los tratamientos',9.1,COLORS.navy,true,170);
    line(pdf,20,99,'identificados en la matriz normativa para este barrio.',9.1,COLORS.navy,true,170);
    line(pdf,20,116,'No equivale a inexistencia de cargas u obligaciones generales.',8,COLORS.muted,false,170);
  }
  for(const benefit of relevantBenefits){
    const fields=[
     [benefit.title,8.8,COLORS.purple,true],
     [benefit.concept,8.2,COLORS.navy,false],
     [benefit.mechanism,8.0,COLORS.navy,false],
     [benefit.check,7.8,COLORS.muted,false],
     [benefit.source,7.1,COLORS.purple,false]
    ];
    const heights=fields.map(([text,size])=>pdf.splitTextToSize(pdfText(text),171).length*(size*.365+1.7)+2);
    const total=heights.reduce((a,b)=>a+b,0)+15;
    if(benefitY+total>256){
      line(pdf,14,274,'Continúa el análisis de cargas e incentivos en la página siguiente.',7.4,COLORS.muted);
      pdf.addPage();
      base(pdf,7,'07 / GESTIÓN E INCENTIVOS','Beneficios y cargas: continuación','Instrumentos con condiciones de aplicación, no derechos individuales.',p);
      benefitY=77;
    }
    fillColor(pdf,'#F3F4F8');pdf.roundedRect(14,benefitY,182,total,3,3,'F');
    let dy=benefitY+9;
    for(const [value,size,color,bold] of fields){
      dy=line(pdf,19,dy,value,size,color,bold,171)+2;
    }
    benefitY+=total+7;
  }
  line(pdf,14,268,'ICA significa Índice de Construcción Adicional, no el impuesto ICA.',7.8,COLORS.muted);
  line(pdf,14,275,'La ficha no cuantifica plusvalía ni certifica beneficios tributarios.',7.8,COLORS.muted);
  pdf.addPage();
  // Si el cálculo terminó sin errores ni intersecciones, evitar tres mapas vacíos.
  const noHazardIntersection=!!threat&&threat.rows.length===0&&Number(threat.errors||0)===0;
  // PÁGINA 6: cartografía de amenazas.
  if(!noHazardIntersection){
  base(pdf,8,'08 / AMENAZAS','Zonificación de amenazas · propuesta 2026','Inundación, movimientos en masa y avenidas torrenciales: mapas separados.',p);
  if(threat){
   const titles=[['3','INUNDACIÓN'],['1','MOVIMIENTOS EN MASA'],['2','AVENIDAS TORRENCIALES']];
   for(let i=0;i<3;i++){
    const [fen,title]=titles[i],xx=14+i*62;
    line(pdf,xx,75,title,8.2,COLORS.navy,true,60);
    const subset=threat.rows.filter(r=>r.fen===fen);
    if(!subset.length){
      fillColor(pdf,'#F3F6F7');pdf.roundedRect(xx,88,57,40,3,3,'F');
      line(pdf,xx+3,105,'Sin intersección',7.8,COLORS.muted,true,51);
      line(pdf,xx+3,115,'detectable (0,01 ha)',7,COLORS.muted,false,51);
    }else{
      const canvas=buildMapCanvas(barrio,threat.rows,fen,540,390);
      pdf.addImage(canvas.toDataURL('image/jpeg',0.88),'JPEG',xx,85,57,43);
    }
    if(subset.length){
     let ry=135;
     for(const level of ['1','2','3','0']){
      const row=subset.find(r=>r.level===level);if(!row)continue;
      fillColor(pdf,RISK_COLORS[level]);pdf.rect(xx,ry-3,2.5,2.5,'F');
      line(pdf,xx+4,ry,LEVEL[level]+': '+num(row.ha)+' ha',7.8,COLORS.navy,true,52);
      line(pdf,xx+4,ry+5,pct(row.pct)+' del barrio',7.3,COLORS.muted,false,52);
      ry+=13;
     }
    }
   }
   fillColor(pdf,'#F0F3F7');pdf.roundedRect(14,191,182,68,3,3,'F');
   let ty=202;
   ty=line(pdf,19,ty,'INTERPRETACIÓN DE LOS CRUCES',10,COLORS.navy,true,174)+2;
   ty=line(pdf,19,ty,'Superficie barrial calculada: '+ha(threat.bArea)+'.',8.5,COLORS.navy,false,170)+3;
   ty=line(pdf,19,ty,'Las clases de un mismo fenómeno pueden solaparse; no sumar porcentajes sin disolver categorías.',8.2,COLORS.navy,false,169)+2;
   if(threat.errors)ty=line(pdf,19,ty,'Precaución: '+threat.errors+' geometrías no procesadas; resultados incompletos.',8.4,COLORS.danger,true,168);
   else line(pdf,19,ty,'Sin intersección significa ausencia de cruce detectable, no ausencia de peligro.',8.2,COLORS.muted,false,168);
  }else{
   fillColor(pdf,'#FFF0E9');pdf.roundedRect(14,79,182,68,3,3,'F');
   line(pdf,19,91,'NO FUE POSIBLE CALCULAR LOS MAPAS DE AMENAZA',10,COLORS.danger,true,170);
   line(pdf,19,103,'No se asignan porcentajes ni se interpreta como ausencia de peligro.',9,COLORS.navy,false,170);
   line(pdf,19,114,'Motivo: '+threatError,8,COLORS.muted,false,170);
  }
  line(pdf,14,274,'Fuente: GeoJSON simplificados de amenaza 2026; cruce Turf exploratorio.',7.5,COLORS.muted);
  pdf.addPage();
  }
  // PÁGINA 4
  base(pdf,9,'09 / RIESGO Y GESTIÓN','Sísmica, instrumentos y cautelas','Lectura territorial con trazabilidad y preguntas para decisiones públicas.',p);
  if(!noHazardIntersection)line(pdf,14,75,'MICROZONIFICACIÓN SÍSMICA · REFERENCIA ORIENTATIVA',10,COLORS.purple,true);
  const micro=state.microzonasBarrio?.barrios?.[code]?.zonas||[];
  if(noHazardIntersection){
    fillColor(pdf,'#EDF3F4');pdf.roundedRect(14,84,182,43,3,3,'F');
    line(pdf,19,96,'AMENAZAS · SIN INTERSECCIONES DETECTABLES',9,COLORS.navy,true,170);
    line(pdf,19,106,'Inundación, movimientos en masa y avenidas torrenciales:',8.2,COLORS.navy,false,169);
    line(pdf,19,115,'sin cruces a partir de 0,01 ha en el GeoJSON consultado.',8.2,COLORS.muted,false,169);
    line(pdf,14,139,'No certifica ausencia de peligro ni reemplaza estudios de riesgo.',8,COLORS.muted,false,180);
  }
  let my=noHazardIntersection?157:87;
  if(micro.length){
   if(noHazardIntersection)line(pdf,14,150,'MICROZONIFICACIÓN SÍSMICA · REFERENCIA APROXIMADA',9,COLORS.purple,true);
   const mx=Math.max(1,...micro.map(z=>Number(z.hectareas||0)));
   for(const z of micro.slice(0,noHazardIntersection?1:4)){
    my=bar(pdf,18,my,'Zona '+z.zona+' · '+pct(z.porcentaje_barrio),Number(z.hectareas),mx,COLORS.purple,174)+2;
   }
  } else my=line(pdf,18,my,'Sin intersecciones disponibles en la digitalización consultada.',9,COLORS.muted);
  line(pdf,14,197,'PREGUNTAS DE SEGUIMIENTO TERRITORIAL',10.5,COLORS.purple,true);
  let qY=208;for(const q of [
   '¿Qué actuaciones admite cada tratamiento propuesto?',
   '¿Qué cargas e instrumentos protegen a moradores?',
   '¿Qué estudios y obras se requieren ante las amenazas?']){
    qY=line(pdf,18,qY,'- '+q,9,COLORS.navy,false,174)+8;
  }
  line(pdf,14,253,'ALCANCE Y FUENTES',9.5,COLORS.purple,true);
  line(pdf,14,261,'Acuerdo 0373 de 2014 · Proyecto de Acuerdo POT 2026',8,COLORS.navy,false,180);
  line(pdf,14,268,'Datos: resumen_barrios.json, transiciones y GeoJSON de la plataforma.',8,COLORS.navy,false,180);
  line(pdf,14,275,'Microzonas digitalizadas aproximadas; no certifican riesgo ni diseño sísmico.',7.6,COLORS.muted,false,184);
  // Número de página real, incluidas las continuaciones de instrumentos.
  const totalPages=pdf.getNumberOfPages();
  for(let pn=1;pn<=totalPages;pn++){
    pdf.setPage(pn);
    pdf.setFont('helvetica','bold');pdf.setFontSize(8);changeColor(pdf,COLORS.navy);
    pdf.text(pn+' / '+totalPages,195,286,{align:'right'});
  }
  const filename='Ficha_barrial_'+safe(name)+'_'+safe(code)+'_POT_Cali.pdf';
  const blob=pdf.output('blob');
  if(!(blob instanceof Blob)||blob.size<5000)throw Error('El PDF generado no tiene contenido válido');
  if(pdfReadyUrl)URL.revokeObjectURL(pdfReadyUrl);
  pdfReadyUrl=URL.createObjectURL(blob);
  const link=document.getElementById('download-barrio-ready');
  if(link){link.href=pdfReadyUrl;link.download=filename;link.hidden=false;link.textContent='Descargar PDF generado · '+name;}
  // Se intenta la descarga inicial; el enlace visible es el respaldo cuando el
  // navegador restringe descargas automáticas repetidas desde una misma página.
  if(link)link.click();
  if(message)message.textContent='Ficha preparada para '+name+'. Si el archivo no se descargó automáticamente, usa el enlace de abajo.';
 }catch(e){
  console.error('Generación ficha barrial',e);
  if(message)message.textContent='No fue posible completar la ficha: '+(e.message||e);
 }finally{button.disabled=!state.selected;}
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