from pathlib import Path
import json, math
from collections import defaultdict
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
import geopandas as gpd
from shapely.ops import unary_union
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'data'
R=json.loads((D/'ficha_1722_amenaza_resultado.json').read_text())
OUT=ROOT/'fichas';OUT.mkdir(exist_ok=True)
PDF=OUT/'Prados_del_Limonar_1722_Ficha_Territorial_2026.pdf'
NAVY='#16314B';INK='#24374C';MUTED='#637488';GREEN='#126A5A';ORANGE='#E6A657';BG='#F4F7F8'
COLORS={'1':'#CF4446','2':'#E8BC39','3':'#39976A'}
bar=gpd.read_file(D/'barrios.geojson').to_crs('EPSG:9377')
B=bar[bar.codigo.astype(str).str.zfill(4)=='1722'].geometry.iloc[0]
A=gpd.read_file(D/'amenaza.geojson').to_crs('EPSG:9377')
A=A[A.intersects(B)].copy()
shapes={}
for (fen,cat),g in A.groupby(['zafenome','zacateg']):
    pieces=[x.intersection(B) for x in g.geometry if x.intersects(B)]
    pieces=[x for x in pieces if not x.is_empty]
    if pieces:shapes[(str(fen).replace('.0',''),str(cat).replace('.0',''))]=unary_union(pieces)
fig,axs=plt.subplots(1,3,figsize=(12.4,4.6))
for ax,fen,title in zip(axs,['3','1','2'],['INUNDACIÓN','MOVIMIENTOS EN MASA','AVENIDAS TORRENCIALES']):
    gpd.GeoSeries([B],crs='EPSG:9377').plot(ax=ax,color='#EAF0F3',edgecolor=NAVY,linewidth=1.3)
    if any(f==fen for (f,c) in shapes):
        for cat in ['3','2','1']:
            if (fen,cat) in shapes and shapes[(fen,cat)].area>=100:
                gpd.GeoSeries([shapes[(fen,cat)]],crs='EPSG:9377').plot(ax=ax,color=COLORS[cat],linewidth=0,alpha=.83)
        gpd.GeoSeries([B],crs='EPSG:9377').boundary.plot(ax=ax,color=NAVY,linewidth=1.4)
    else:
        ax.text(.5,-.045,'Sin intersección detectable',transform=ax.transAxes,ha='center',va='top',fontsize=9,color=MUTED)
    ax.set_title(title,loc='left',fontweight='bold',fontsize=10,color=NAVY,pad=14)
    ax.set_axis_off();ax.set_aspect('equal')
fig.subplots_adjust(left=.018,right=.985,top=.84,bottom=.12,wspace=.11)
map_file=OUT/'mapa_amenazas_1722.png'
fig.savefig(map_file,dpi=220,bbox_inches='tight',facecolor='white');plt.close(fig)

W,H=595.28,841.89
c=canvas.Canvas(str(PDF),pagesize=(W,H))
def rect(x,y,w,h,fill,stroke=None,r=0):
    c.setFillColor(HexColor(fill))
    if stroke:c.setStrokeColor(HexColor(stroke))
    else:c.setStrokeColor(HexColor(fill))
    if r:c.roundRect(x,y,w,h,r,fill=1,stroke=int(bool(stroke)))
    else:c.rect(x,y,w,h,fill=1,stroke=int(bool(stroke)))
def txt(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(HexColor(color));c.setFont('Helvetica-Bold' if bold else 'Helvetica',size);c.drawString(x,y,s)
def para(x,y,lines,size=9,leading=14,color=INK):
    for line in lines:txt(x,y,line,size,color);y-=leading
    return y
def base(n,k,title,sub):
    rect(0,H-75,W,75,NAVY)
    rect(0,H-75,9,75,GREEN)
    txt(36,H-31,'CALI: ¿QUÉ CAMBIA EN MI TERRITORIO?',11,'#FFFFFF',True)
    txt(36,H-54,'FICHAS TERRITORIALES  /  PRADOS DEL LIMONAR  /  1722',8,'#C4D6E1')
    txt(36,H-110,k,9,GREEN,True)
    txt(36,H-143,title,23,NAVY,True)
    txt(36,H-166,sub,9,MUTED)
    c.setStrokeColor(HexColor('#CED8DD'));c.line(36,47,W-36,47)
    txt(36,30,'OBSERVATORIO CIUDADANO · POT CALI · PILOTO 2026',7,MUTED)
    txt(W-65,30,f'{n}/6',8,NAVY,True)
def page():c.showPage()
def bar_chart(x,y,items,width=475,height=15,maximum=None):
    maximum=maximum or max(v for name,v,co in items)
    for label,v,color in items:
        txt(x,y+19,label,9,INK,True)
        rect(x,y,width,height,'#E9EEF1',r=4)
        if v>0:rect(x,y,max(1,width*v/maximum),height,color,r=4)
        txt(x+width-70,y+19,f'{v:.2f} ha',9,INK,True)
        y-=52
def inset(y,heading,lines,fill='#EDF4F5'):
    rect(36,y-70,W-72,88,fill,r=9)
    txt(51,y-1,heading,10,NAVY,True)
    para(51,y-22,lines,8.7,15)
# 1
base(1,'01 / PANORAMA','¿Qué cambia en Prados del Limonar?','Lectura barrial de la norma y de sus condiciones territoriales.')
rect(36,493,W-72,140,'#F0F6F4',r=13)
txt(54,591,'35,4 %',32,GREEN,True)
txt(188,591,'del barrio pasa de C1 a R1',15,NAVY,True)
para(188,570,['20,06 ha de consolidación urbanística (2014)','a redensificación alta (propuesta 2026).'],9.5,17)
txt(54,517,'Adicionalmente, 17,98 ha pasan de C1 a D2.',10,INK,True)
txt(36,454,'TRATAMIENTOS · PROPUESTA 2026',11,NAVY,True)
bar_chart(45,405,[('R1 · Redensificación alta',20.15,'#D67E6F'),('C3 · Consolidación moderada',18.60,'#7DA6A2'),('D2 · Desarrollo urbano',17.98,'#D7B36D')],490,16)
inset(211,'LECTURA TERRITORIAL',['La reconfiguración cartográfica no equivale a licencias automáticas.','Deben verificarse aprovechamientos, instrumentos, cargas y soporte urbano.'])
txt(36,94,'POT 2014: C1 56,46 ha; C3 0,19 ha. Propuesta: R1 20,15; C3 18,60; D2 17,98 ha.',8,MUTED)
page()
# 2
base(2,'02 / COMPARACIÓN NORMATIVA','Tratamientos y transiciones','Dos mapas normativos distintos, no equivalencias jurídicas automáticas.')
txt(36,637,'POT 2014',12,NAVY,True);txt(314,637,'PROPUESTA 2026',12,NAVY,True)
rect(36,448,248,169,'#EDF3F4',r=8);rect(311,448,248,169,'#F5F1EC',r=8)
txt(51,576,'C1: 56,46 ha',18,GREEN,True);txt(51,545,'99,7 % de los tratamientos',10,INK)
txt(51,508,'C3: 0,19 ha',14,NAVY,True)
txt(325,575,'R1: 20,15 ha',15,'#AB4D45',True)
txt(325,545,'C3: 18,60 ha',15,GREEN,True)
txt(325,515,'D2: 17,98 ha',15,'#956B31',True)
txt(36,418,'TRANSICIONES DESTACADAS',11,NAVY,True)
bar_chart(43,360,[('C1 → R1',20.06,'#CF6560'),('C1 → D2',17.98,'#D9AA64')],490,19)
inset(202,'¿POR QUÉ IMPORTA?',['El tratamiento R1 cambia de significado: redesarrollo (2014) frente a','redensificación alta (2026). D2 exige revisar urbanización e instrumentos.'])
txt(36,94,'Fuentes: GDB asociadas al Observatorio; Acuerdo 0373/2014; Proyecto de Acuerdo 2026.',8,MUTED)
page()
# 3
base(3,'03 / ÁREAS DE ACTIVIDAD','Usos y convivencia urbana','Clasificación cartográfica propuesta: no autoriza actividades específicas.')
txt(36,628,'PROPUESTA 2026 · ÁREAS DE ACTIVIDAD',11,NAVY,True)
bar_chart(43,576,[('Área de Proximidad',28.59,'#D9A064'),('Área Multifuncional',27.97,'#C76879')],490,24)
txt(36,430,'TRANSICIONES DE ÁREA DE ACTIVIDAD IDENTIFICADAS',10,NAVY,True)
items=[('Residencial neta → Proximidad',13.973),('Mixta → Multifuncional',12.242),('Mixta → Proximidad',5.265),('No aplica → Multifuncional',3.687),('No aplica → Proximidad',3.0),('Residencial neta → Multifuncional',2.933)]
for i,(label,val) in enumerate(items):
    y=396-i*39
    txt(42,y,label,8.6,INK)
    rect(284,y-1,230,13,'#E6ECEE',r=3)
    rect(284,y-1,230*val/14,13,'#5B9794' if i%2==0 else '#DA9779',r=3)
    txt(523,y,f'{val:.2f}',8,NAVY,True)
inset(145,'PRECAUCIÓN',['Para determinar usos permitidos, condicionados o prohibidos es obligatorio','consultar las matrices de actividades y las disposiciones especiales.'])
page()
# 4
base(4,'04 / AMENAZA Y TERRITORIO','Mapa de amenazas · propuesta 2026','Intersecciones espaciales calculadas para el polígono barrial 1722.')
c.drawImage(ImageReader(map_file),27,338,width=541,height=266,preserveAspectRatio=True,anchor='c')
txt(40,333,'LEYENDA INUNDACIÓN:',9,NAVY,True)
for xx,label,col in [(199,'Alta','#CF4446'),(290,'Media','#E8BC39'),(399,'Baja','#39976A')]:
    rect(xx,323,12,12,col,r=2);txt(xx+18,324,label,9,INK)
txt(36,292,'SUPERFICIE INTERSECADA POR CATEGORÍA',10,NAVY,True)
for i,(label,ha,pct,color) in enumerate([('Alta',23.5825,41.552,'#CF4446'),('Media',10.6781,18.815,'#E8BC39'),('Baja',7.3252,12.907,'#39976A')]):
    y=258-i*45
    rect(37,y-3,10,30,color,r=2)
    txt(58,y+10,label,10,INK,True)
    txt(205,y+10,f'{ha:.2f} ha',12,NAVY,True)
    txt(382,y+10,f'{pct:.2f} %',12,NAVY,True)
rect(36,65,W-72,66,'#F3F5F6',r=8)
para(48,111,['Movimientos en masa y avenidas torrenciales: sin intersección detectable (>0,01 ha).','No implica ausencia de peligro. Resultados exploratorios sobre GeoJSON simplificados.','Las categorías de inundación se solapan aproximadamente 0,79 ha.'],8,15)
page()
# 5
base(5,'05 / GESTIÓN DEL RIESGO','Interpretar los resultados','Amenaza, exposición, vulnerabilidad y riesgo son dimensiones diferentes.')
rect(36,519,W-72,114,'#F0F4F7',r=12)
txt(54,593,'56,75 ha',25,NAVY,True)
txt(234,598,'Superficie barrial de referencia',11,INK,True)
txt(54,560,'0,79 ha',21,'#B76258',True)
txt(234,565,'Solapamiento entre categorías de inundación',10,INK)
txt(36,477,'QUÉ SE PUEDE CONCLUIR',11,NAVY,True)
para(40,448,['El visor permite identificar coincidencias espaciales con categorías','de amenaza por inundación. Estas superficies no determinan por sí','mismas riesgo de cada vivienda ni condiciones de mitigabilidad.'],10,18)
txt(36,356,'MICROZONIFICACIÓN SÍSMICA · REFERENCIA',11,NAVY,True)
rect(36,228,W-72,102,'#EAF3F0',r=12)
txt(55,276,'4D',30,GREEN,True)
txt(166,290,'53,635 ha',19,NAVY,True)
txt(166,262,'94,5 % · archivo de microzonas aproximadas',10,INK)
txt(40,194,'La zona sísmica 4D es una clase de respuesta del suelo, no un nivel de riesgo.',9,INK)
inset(151,'LÍMITE DE CERTIDUMBRE',['La microzonificación se digitalizó a partir de una referencia técnica y no','sustituye la cartografía vectorial certificada del Decreto 0158 de 2014.'])
page()
# 6
base(6,'06 / LECTURA CIUDADANA','Preguntas para el seguimiento','Qué debe verificarse antes de incorporar las determinaciones del POT.')
questions=[
('01','¿Cómo se justifican 20,15 ha con redensificación alta R1?'),
('02','¿Por qué 17,98 ha aparecen con tratamiento D2?'),
('03','¿Con qué condiciones de infraestructura se plantea la transformación?'),
('04','¿Qué cambia para moradores, cargas y actuaciones urbanísticas?'),
('05','¿Cómo se articulan los niveles de amenaza por inundación con el POT?'),
]
for i,(num,q) in enumerate(questions):
    y=625-i*93
    rect(36,y-55,W-72,76,'#F2F5F6',r=8)
    txt(51,y-10,num,18,GREEN,True)
    txt(91,y-8,q[:78],9.5,INK,True)
    para(91,y-28,['Requiere soporte técnico, localización y verificación normativa.'],8,MUTED)
rect(36,93,W-72,72,'#E7F1EF',r=8)
txt(49,144,'TRAZABILIDAD',9,GREEN,True)
para(49,127,['Base: Observatorio POT_CALI_2, cruce barrio 1722 vs. amenaza.geojson.','Propuesta POT 2026 no aprobada. Cruce exploratorio, no certificación predial.'],8,14)
page()
c.save()
print('PDF',PDF,PDF.stat().st_size)
