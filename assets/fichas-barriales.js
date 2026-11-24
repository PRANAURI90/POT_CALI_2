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
const hexRgb=(h)=>h.replace('#','').match(/.{2}/g).map(v=>parseInt(v,16));
const changeColor=(pdf,h)=>pdf.setTextColor(...hexRgb(h));
const fillColor=(pdf,h)=>pdf.setFillColor(...hexRgb(h));
const num=(v,d=2)=>Number(v||0).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
const ha=v=>num(v)+' ha';
const pct=v=>num(v,1)+' %';
const safe=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
function line(pdf,x,y,text,size=10,color=COLORS.navy,bold=false,maxWidth=178){
 pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);changeColor(pdf,color);
 const lines=pdf.splitTextToSize(String(text),maxWidth);
 pdf.text(lines,x,y);
 return y+lines.length*(size*.37+1.7);
}
function bar(pdf,x,y,label,value,max,color,w=172){
 line(pdf,x,y,label,9,COLORS.navy,true,w-40);
 pdf.setFont('helvetica','bold');pdf.setFontSize(9);changeColor(pdf,COLORS.navy);
 pdf.text(ha(value),x+w,y,{align:'right'});
 fillColor(pdf,COLORS.line);pdf.roundedRect(x,y+4,w,4,1.5,1.5,'F');
 if(value>0&&max>0){fillColor(pdf,color);pdf.roundedRect(x,y+4,Math.max(1,Math.min(w,w*value/max)),4,1.5,1.5,'F')}
 return y+18;
}
function base(pdf,n,k,title,sub,selected){
 fillColor(pdf,COLORS.navy);pdf.rect(0,0,210,27,'F');
 fillColor(pdf,COLORS.purple);pdf.rect(0,0,4,27,'F');
 line(pdf,14,10,'CALI, ¿QUÉ CAMBIA EN MI TERRITORIO?',11,'#FFFFFF',true);
 line(pdf,14,17,'OBSERVATORIO CIUDADANO DEL ORDENAMIENTO TERRITORIAL',7.5,'#E4E0F5');
 line(pdf,14,39,k,8,COLORS.purple,true);
 line(pdf,14,49,title,18,COLORS.navy,true,182);
 line(pdf,14,60,sub,8.6,COLORS.muted,false,184);
 pdf.setDrawColor(...hexRgb(COLORS.line));pdf.line(14,280,196,280);
 line(pdf,14,287,'POT 2014 vigente (GDB actualizada) · propuesta 2026 aún no adoptada',7,COLORS.muted);
 pdf.setFontSize(8);changeColor(pdf,COLORS.navy);pdf.text(n+'/4',195,287,{align:'right'});
}
function entriesFor(info,key){
 return (info?.capas?.[key]?.categorias||[]).map(r=>({name:String(r.nombre||r.codigo||'Sin categoría'),ha:Number(r.hectareas||0),pct:Number(r.porcentaje_barrio||0)})).filter(r=>r.ha>.009).sort((a,b)=>b.ha-a.ha);
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
  const area=Number(threat?.bArea||info?.area_barrio_ha||0);
  // PÁGINA 1
  base(pdf,1,'01 / PERFIL TERRITORIAL','Ficha barrial · '+name,'Comuna '+p.comuna+' · código '+code+' · análisis sobre la cartografía del Observatorio',p);
  fillColor(pdf,'#F0EFF7');pdf.roundedRect(14,67,182,20,3,3,'F');
  line(pdf,19,76,'¿QUÉ DICE LA CARTOGRAFÍA SOBRE ESTE TERRITORIO?',10,COLORS.navy,true);
  line(pdf,14,99,'PRINCIPALES TRATAMIENTOS · POT 2014',11,COLORS.purple,true);
  let y=108;y=drawCategories(pdf,17,y,tr14,3,176,COLORS.green);
  if(y>177){y=178}
  line(pdf,14,184,'PRINCIPALES TRATAMIENTOS · PROPUESTA 2026',11,COLORS.purple,true);
  y=193;drawCategories(pdf,17,y,tr26,4,176,COLORS.pink);
  line(pdf,14,274,'Superficies por categoría: no equivalen a derechos prediales ni licencias.',7.2,COLORS.muted);
  pdf.addPage();
  // PÁGINA 2
  base(pdf,2,'02 / TRANSICIONES Y USOS','¿Qué cambia en los usos y tratamientos?','Las transiciones muestran coincidencias espaciales, no permisos automáticos.',p);
  line(pdf,14,74,'PRINCIPALES TRANSICIONES DE TRATAMIENTO',10.5,COLORS.purple,true);
  let tY=84;const maxT=Math.max(1,...trans.map(r=>r.ha));
  for(const t of trans.slice(0,5)){tY=bar(pdf,17,tY,t.from+' → '+t.to,t.ha,maxT,COLORS.pink,174)+2;}
  line(pdf,14,193,'PRINCIPALES ÁREAS DE ACTIVIDAD · PROPUESTA 2026',10.5,COLORS.purple,true);
  drawCategories(pdf,17,202,ac26,3,174,COLORS.orange);
  line(pdf,14,266,'Los nombres de área no autorizan automáticamente comercio ni servicios.',8,COLORS.muted);
  line(pdf,14,273,'Aplican la matriz de actividades, el articulado y las condiciones del predio.',8,COLORS.muted);
  pdf.addPage();
  // PÁGINA 3
  base(pdf,3,'03 / AMENAZAS','Zonificación de amenazas · propuesta 2026','Inundación, movimientos en masa y avenidas torrenciales: mapas separados.',p);
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
  base(pdf,4,'04 / RIESGO Y GESTIÓN','Sísmica, instrumentos y cautelas','Lectura territorial con trazabilidad y preguntas para decisiones públicas.',p);
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
  pdf.save('Ficha_barrial_'+safe(name)+'_'+safe(code)+'_POT_Cali.pdf');
  if(message)message.textContent='Ficha PDF generada para '+name+'.';
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
  new MutationObserver(()=>{btn.disabled=!state.selected;const status=document.getElementById('download-barrio-status');if(status)status.textContent='';}).observe(node,{childList:true,characterData:true,subtree:true});
 }
}
document.addEventListener('DOMContentLoaded',init);
})();