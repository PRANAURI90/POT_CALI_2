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
 if(f==='renovacion'&&t==='renovacion')return 'El barrio sigue en una familia de renovación, pero cambian su modalidad y las formas de intervención que plantea la norma. El mismo código no conserva necesariamente las mismas reglas.';
 if(f==='consolidacion'&&t==='renovacion')return 'La propuesta traslada esta superficie de conservación o transformación gradual del tejido a una lógica de renovación. Deben examinarse densidad, instrumentos, cargas y protección a residentes.';
 if(f==='consolidacion'&&t==='desarrollo')return 'Parte del barrio cambia de consolidación a desarrollo. Conviene aclarar qué suelo se considera urbanizable y con qué obras, cesiones y procedimientos podría intervenirse.';
 if(t==='conservacion')return 'La propuesta orienta esta superficie a protección patrimonial o contextual. Las intervenciones quedan sujetas a las reglas y delimitaciones específicas de conservación.';
 if(t==='mejoramiento')return 'La propuesta plantea cualificar el hábitat y los soportes urbanos. No se trata, por sí solo, de una autorización de mayor edificabilidad.';
 if(f===t)return 'Aunque conserve una familia o denominación semejante, deben compararse las definiciones y condiciones de ambos POT; la coincidencia cartográfica no prueba equivalencia jurídica.';
 return 'Esta porción del barrio cambia de clasificación entre los dos instrumentos. Para saber su efecto real se deben comparar las reglas de uso, edificabilidad, gestión y cargas aplicables.';
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
 pdf.setFontSize(8);changeColor(pdf,COLORS.navy);pdf.text(n+'/9',195,286,{align:'right'});
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
  line(pdf,14,91,'se le asigna en 2026. Cada cruce se mide en hectáreas de superficie.',8.5,COLORS.navy);
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
    line(pdf,14,137,'¿QUÉ QUIERE DECIR?',10,COLORS.purple,true);
    let y=149;
    y=softParagraph(pdf,16,y,treatmentMeaning(main.from,main.to),175,9.3)+8;
    line(pdf,14,y,'¿QUÉ NO SE PUEDE CONCLUIR?',10,COLORS.purple,true);
    y+=12;
    y=softParagraph(pdf,16,y,'El mapa no demuestra que aumenten los pisos, que un proyecto quede aprobado ni que todos los propietarios reciban un beneficio. Para ello deben comprobarse los índices, las delimitaciones y los instrumentos exigidos.',174,8.8)+5;
    line(pdf,14,y,'¿QUÉ DEBE VERIFICARSE?',10,COLORS.purple,true);
    y+=11;
    y=softParagraph(pdf,16,y,'Consultar los artículos de cada tratamiento, los requisitos de plan parcial o plan de manzana, el reparto de cargas y beneficios, y las medidas frente a moradores y riesgos.',174,8.7);
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
  const treatmentCodes=new Set(treat26Raw.map(v=>{
    const orig=String(v.codigo_original??v.codigo??v.atributos?.CODIGO??'').trim();
    return ({'1':'CSU','2':'CTL','3':'C1','4':'C2','5':'C3','6':'C4','7':'D1','8':'D2','9':'MI','10':'R1','11':'R2'})[orig]||orig;
  }));
  for(const t of tr26){
    if(/renovaci[oó]n|redensificaci[oó]n/i.test(t.name)){
      if(/alta|R1/i.test(t.name))treatmentCodes.add('R1');
      if(/media|R2/i.test(t.name))treatmentCodes.add('R2');
    }
    if(/desarrollo urbano|D2/i.test(t.name))treatmentCodes.add('D2');
    if(/conservaci[oó]n/i.test(t.name))treatmentCodes.add('CON');
  }
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
  ];
  for(const [name,rows] of planLayers){
    line(pdf,16,gy,name,8.6,COLORS.navy,true,138);
    pdf.setFont('helvetica','bold');pdf.setFontSize(8.4);changeColor(pdf,COLORS.purple);
    pdf.text(rows.length?ha(rows.reduce((v,r)=>v+r.ha,0)):'Sin cruce registrado',194,gy,{align:'right'});
    gy+=18;
  }
  line(pdf,14,170,'PROCEDIMIENTOS QUE PODRÍAN SER PERTINENTES',9.7,COLORS.purple,true);
  let iy=181;
  const candidates=[
    ['Plan parcial','Ordena un ámbito de urbanización o renovación.','Debe verificarse su exigencia, delimitación y vigencia.'],
    ['Plan de manzana','Instrumento para intervenir una manzana o agrupación.','Su procedencia depende del tratamiento y del área.'],
    ['Actuación individual','Intervención tramitada sobre predio o agrupación.','Exige cumplir aprovechamientos y cargas aplicables.'],
    ['Conservación','Régimen de protección del patrimonio o del contexto.','Aplicación según declaratoria, delimitación y normas.']
  ];
  for(const [title,definition,detail] of candidates){
    line(pdf,16,iy,title,8.5,COLORS.navy,true,175);
    line(pdf,16,iy+5,definition,7.1,'#8993A1',false,175);
    line(pdf,16,iy+11,detail,7.2,COLORS.muted,false,175);
    iy+=21;
  }
  line(pdf,14,268,'Refs.: Acuerdo 0373/2014 arts. 313-325; propuesta 2026 arts. 379-388 y 615.',7.2,COLORS.muted);
  pdf.addPage();
  // PÁGINA 6: reglas e instrumentos concretos asociados al tratamiento cartografiado.
  base(pdf,6,'06 / INSTRUMENTOS CONCRETOS','¿Qué procedimiento podría aplicar?','Las opciones dependen del tratamiento y de las condiciones específicas del ámbito.',p);
  const regimes=[];
  if(treatmentCodes.has('R1'))regimes.push({
   title:'RENOVACIÓN CON REDENSIFICACIÓN ALTA · R1',
   rule:'Propuesta: actuación individual en predios o agrupaciones menores de 3.000 m²; plan de manzana desde 3.000 m²; plan parcial a partir de dos manzanas, con condiciones y excepciones.',
   impact:'Esto abre distintas vías de intervención. No significa que cada predio pueda construir más sin cumplir cargas o estudios.',
   ref:'Proyecto de Acuerdo 2026: arts. 387, 615 y 619.'
  });
  if(treatmentCodes.has('R2'))regimes.push({
   title:'RENOVACIÓN CON REDENSIFICACIÓN MEDIA · R2',
   rule:'La propuesta contempla actuación individual, plan de manzana y plan parcial según ámbito. Bajo el POT 2014, R2 era reactivación y el cuadro del art. 319 no permitía plan parcial de renovación.',
   impact:'Lo relevante es el cambio de modalidad y de procedimiento, no la repetición del código R2.',
   ref:'POT 2014: arts. 317, 319 y 321; propuesta: 387 y 615.'
  });
  if(treatmentCodes.has('D2'))regimes.push({
   title:'DESARROLLO URBANO · D2',
   rule:'La propuesta admite proyecto urbanístico general o licencia. Requiere plan parcial cuando exista gestión asociada por unidades de actuación o cuando se superen 10 ha netas urbanizables y se involucren al menos dos predios.',
   impact:'No equivale a eliminar el plan parcial para cualquier terreno: hay que revisar tamaño, propiedad, afectaciones y cargas.',
   ref:'Proyecto de Acuerdo 2026: arts. 383 y 615.'
  });
  if(treatmentCodes.has('D1'))regimes.push({
   title:'DESARROLLO · D1',
   rule:'El plan parcial es obligatorio en suelo de expansión y en ámbitos urbanos delimitados. Se contemplan otras vías en suelo urbano sin delimitación, conforme a la propuesta.',
   impact:'La ruta de trámite depende de la clasificación del suelo y de la delimitación vigente.',
   ref:'Proyecto de Acuerdo 2026: arts. 381, 382 y 615.'
  });
  if([...treatmentCodes].some(x=>/^C[1-4]$/.test(x)))regimes.push({
   title:'CONSOLIDACIÓN · C1 A C4',
   rule:'Los planes parciales en consolidación solo se contemplan bajo la excepción de delimitación mediante Proyecto Urbanístico Integral (PUI). Se proponen reglas particulares para otros ámbitos.',
   impact:'Tener consolidación no activa por sí mismo un plan parcial ni una mayor edificabilidad.',
   ref:'Proyecto de Acuerdo 2026: art. 379.'
  });
  if(treatmentCodes.has('MI'))regimes.push({
   title:'MEJORAMIENTO INTEGRAL',
   rule:'Se plantean Planes de Gestión del Hábitat (PGHAB) para coordinar intervenciones de mejoramiento y soportes urbanos.',
   impact:'Un PGHAB no equivale automáticamente a un plan parcial de renovación.',
   ref:'Proyecto de Acuerdo 2026: art. 380.'
  });
  if(conservation)regimes.push({
   title:'CONSERVACIÓN CULTURAL Y CONTEXTUAL',
   rule:'Se proponen modalidades de protección de sectores y contextos urbanos. Las actuaciones deben respetar su régimen y delimitación.',
   impact:'No toda intervención se prohíbe, pero tampoco se presume un incentivo o compensación.',
   ref:'POT 2014: arts. 301-307; propuesta: arts. 377-378.'
  });
  if(!regimes.length)regimes.push({
   title:'CONSULTA SEGÚN TRATAMIENTO DEL BARRIO',
   rule:'La información disponible no identifica una modalidad especial de gestión en esta ficha. Debe consultarse el tratamiento preciso y el instrumento delimitado.',
   impact:'La ausencia de una modalidad aquí no equivale a ausencia de obligaciones urbanísticas.',
   ref:'Consultar matriz normativa y geodatabase del POT.'
  });
  let rY=79;
  for(const rg of regimes.slice(0,3)){
   fillColor(pdf,'#F3F4F8');pdf.roundedRect(14,rY-6,182,57,3,3,'F');
   line(pdf,19,rY,rg.title,8.8,COLORS.purple,true,172);
   let ly=line(pdf,19,rY+10,rg.rule,8.2,COLORS.navy,false,172);
   ly=line(pdf,19,Math.max(rY+30,ly+2),rg.impact,7.6,COLORS.muted,false,171);
   line(pdf,19,rY+46,rg.ref,7,COLORS.purple,false,173);
   rY+=63;
  }
  if(regimes.length>3)line(pdf,14,261,'Otras modalidades del barrio deben revisarse en el análisis de la plataforma.',7.6,COLORS.muted);
  line(pdf,14,273,'Las reglas se asocian a categorías del barrio, no a cada predio.',7.6,COLORS.muted);
  pdf.addPage();
  // PÁGINA 5: financiación, incentivos, obligaciones y distinciones.
  base(pdf,7,'07 / GESTIÓN E INCENTIVOS','¿Qué beneficios y cargas existen?','Instrumentos generales del POT; la ficha no acredita derechos o exenciones individuales.',p);
  const tools=[
    ['Edificabilidad adicional (ICA / ICP)','Capacidad edificatoria adicional a la básica.','Acceso condicionado a reglas y contraprestaciones.','Propuesta 2026, arts. 371, 388 y 616-620.'],
    ['Participación en plusvalía','Participación pública en incrementos de valor del suelo.','Exige verificar hecho generador y exigibilidad.','Verificar normativa y actos distritales aplicables.'],
    ['Cesiones y cargas urbanísticas','Obligaciones para espacio público y soportes urbanos.','Se determinan según instrumento y actuación.','POT 2014 arts. 320-322; propuesta arts. 616-620.'],
    ['Incentivos por conservación','Medidas para fomentar la protección patrimonial.','No se presume compensación ni beneficio automático.','POT 2014 arts. 301-307; propuesta arts. 377-378.'],
    ['Protección de moradores','Medidas frente a impactos sobre residentes y actividades.','Verificar permanencia, retorno y garantías específicas.','Requiere revisión de normas e instrumentos aplicables.']
  ];
  let fy=79;
  for(const [title,definition,meaning,ref] of tools){
    fillColor(pdf,'#F2F3F8');pdf.roundedRect(14,fy-6,182,35,2,2,'F');
    line(pdf,18,fy,title,8.9,COLORS.purple,true,174);
    line(pdf,18,fy+7,definition,7.7,'#8993A1',false,174);
    line(pdf,18,fy+14,meaning,7.5,COLORS.navy,false,174);
    line(pdf,18,fy+22,ref,7,COLORS.muted,false,174);
    fy+=37;
  }
  line(pdf,14,267,'ICA = Índice de Construcción Adicional; NO equivale al impuesto ICA.',8,COLORS.danger,true);
  line(pdf,14,274,'No se calculan beneficios tributarios, avalúos ni plusvalía predial.',7.8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 6: cartografía de amenazas.
  base(pdf,8,'08 / AMENAZAS','Zonificación de amenazas · propuesta 2026','Inundación, movimientos en masa y avenidas torrenciales: mapas separados.',p);
  if(threat){
   const titles=[['3','INUNDACIÓN'],['1','MOVIMIENTOS EN MASA'],['2','AVENIDAS TORRENCIALES']];
   for(let i=0;i<3;i++){
    const [fen,title]=titles[i],xx=14+i*62;
    line(pdf,xx,75,title,8.2,COLORS.navy,true,60);
    const canvas=buildMapCanvas(barrio,threat.rows,fen,540,390);
    pdf.addImage(canvas.toDataURL('image/jpeg',0.88),'JPEG',xx,85,57,43);
    const subset=threat.rows.filter(r=>r.fen===fen);
    if(!subset.length){line(pdf,xx,135,'Sin intersección',7.5,COLORS.muted,true,57);line(pdf,xx,140,'detectable >=0,01 ha',7,COLORS.muted,false,57);}
    else{
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
  // PÁGINA 4
  base(pdf,9,'09 / RIESGO Y GESTIÓN','Sísmica, instrumentos y cautelas','Lectura territorial con trazabilidad y preguntas para decisiones públicas.',p);
  line(pdf,14,75,'MICROZONIFICACIÓN SÍSMICA · REFERENCIA ORIENTATIVA',10,COLORS.purple,true);
  const micro=state.microzonasBarrio?.barrios?.[code]?.zonas||[];
  let my=87;
  if(micro.length){
   const mx=Math.max(1,...micro.map(z=>Number(z.hectareas||0)));
   for(const z of micro.slice(0,4)){
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