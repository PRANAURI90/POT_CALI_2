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
 pdf.setFontSize(8);changeColor(pdf,COLORS.navy);pdf.text(n+'/7',195,286,{align:'right'});
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
  for(const row of tr14.slice(0,3))leftY=bar(pdf,15,leftY,labelTreatment(row.name,2014),row.ha,max14,COLORS.green,83)+5;
  for(const row of tr26.slice(0,3))rightY=bar(pdf,111,rightY,labelTreatment(row.name,2026),row.ha,max26,COLORS.pink,83)+5;
  line(pdf,14,255,'Se muestran las tres categorías de mayor superficie por cada período.',8,COLORS.muted);
  line(pdf,14,264,'Cada barra expresa hectáreas de intersección, no predios ni licencias.',8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 2: transiciones explícitas y SIN cadenas de atributos sin interpretar.
  base(pdf,2,'02 / TRANSICIONES','¿Dónde cambian los tratamientos?','Intersección espacial del POT 2014 con los tratamientos propuestos para 2026.',p);
  line(pdf,14,75,'CÓMO LEER LAS TRANSICIONES',10,COLORS.purple,true);
  line(pdf,14,84,'Desde: tratamiento del POT 2014. Hacia: tratamiento de la propuesta 2026.',8.7,COLORS.navy,false,180);
  line(pdf,14,92,'Las hectáreas corresponden a la superficie compartida por ambos polígonos.',8.7,COLORS.navy,false,180);
  let tY=109;
  for(const t of trans.slice(0,4)){
    const a=labelTreatment(t.from,2014),b=labelTreatment(t.to,2026);
    fillColor(pdf,'#F2F3F8');pdf.roundedRect(14,tY-8,182,35,2,2,'F');
    const top2014=line(pdf,18,tY,'POT 2014: '+a,8.0,COLORS.navy,true,137);
    line(pdf,18,Math.max(tY+11,top2014+1),'Propuesta 2026: '+b,8.0,COLORS.purple,true,137);
    pdf.setFont('helvetica','bold');pdf.setFontSize(9);changeColor(pdf,COLORS.navy);
    pdf.text(ha(t.ha),192,tY+10,{align:'right'});
    tY+=39;
  }
  if(!trans.length)line(pdf,18,112,'No se registran transiciones para este territorio.',9,COLORS.muted);
  line(pdf,14,264,'Se muestran hasta cuatro cruces de mayor superficie; los códigos no son equivalentes.',8,COLORS.muted);
  line(pdf,14,272,'Los cruces no prueban aumento de edificabilidad, licencias o cambios tributarios.',8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 3: áreas de actividad, separadas de los tratamientos.
  base(pdf,3,'03 / ÁREAS DE ACTIVIDAD','¿Cómo se distribuyen los usos?','Áreas de actividad de cada instrumento territorial; no permisos individuales.',p);
  line(pdf,14,77,'CÓMO LEER LAS ÁREAS DE ACTIVIDAD',9.8,COLORS.purple,true);
  line(pdf,14,86,'Muestran la orientación de uso, no actividades autorizadas predio a predio.',8.4,COLORS.navy);
  line(pdf,14,104,'POT 2014 - VIGENTE',10,COLORS.purple,true);
  line(pdf,111,104,'PROPUESTA 2026',10,COLORS.purple,true);
  let y14=115,y26=115;
  const mx14=Math.max(1,...ac14.map(x=>x.ha)),mx26=Math.max(1,...ac26.map(x=>x.ha));
  for(const row of ac14.slice(0,4))y14=bar(pdf,15,y14,row.name,row.ha,mx14,COLORS.green,83)+5;
  for(const row of ac26.slice(0,4))y26=bar(pdf,111,y26,row.name,row.ha,mx26,COLORS.orange,83)+5;
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
  base(pdf,4,'04 / GESTIÓN URBANÍSTICA','¿Con qué instrumentos se transforma?','Ámbitos cartografiados y reglas generales que requieren verificación por predio.',p);
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
  // PÁGINA 5: financiación, incentivos, obligaciones y distinciones.
  base(pdf,5,'05 / GESTIÓN E INCENTIVOS','¿Qué beneficios y cargas existen?','Instrumentos generales del POT; la ficha no acredita derechos o exenciones individuales.',p);
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
  base(pdf,6,'06 / AMENAZAS','Zonificación de amenazas · propuesta 2026','Inundación, movimientos en masa y avenidas torrenciales: mapas separados.',p);
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
  base(pdf,7,'07 / RIESGO Y GESTIÓN','Sísmica, instrumentos y cautelas','Lectura territorial con trazabilidad y preguntas para decisiones públicas.',p);
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