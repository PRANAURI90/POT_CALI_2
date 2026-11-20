from pathlib import Path
import csv,json
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer
root=Path(__file__).resolve().parents[1]
barr=json.loads((root/'data/barrios.geojson').read_text())['features']
bycode={str(x['properties']['codigo']):x for x in barr}
t=Transformer.from_crs('EPSG:4326','EPSG:9377',always_xy=True).transform
features={key:[(x['properties'], transform(t,shape(x['geometry']))) for x in json.loads((root/'data'/f'{key}.geojson').read_text())['features']] for key in ['tratamientos2014','efectos_sismicos2014']}
alerts=list(csv.DictReader(open('/mnt/data/auditoria_pot_fase1/ALERTAS_PORCENTAJES_BARRIO.csv',encoding='utf-8-sig')))
from shapely.ops import unary_union
rows=[]
for a in alerts:
 poly=transform(t,shape(bycode[a['codigo_barrio']]['geometry']));sections=[]
 for props,geo in features[a['capa']]:
  if not geo.intersects(poly):continue
  inter=geo.intersection(poly)
  if inter.area/10000>.02:sections.append((props,inter))
 union=unary_union([x[1] for x in sections]);sumha=sum(x[1].area for x in sections)/1e4;unionha=union.area/1e4
 rows.append({'codigo_barrio':a['codigo_barrio'],'barrio':a['barrio'],'capa':a['capa'],'suma_intersecciones_ha':round(sumha,2),'union_intersecciones_ha':round(unionha,2),'superposicion_ha':round(sumha-unionha,2),'union_porcentaje_barrio':round(union.area/poly.area*100,1),'conclusion':'Categorías cartográficas superpuestas, no aptas para torta excluyente' if sumha-unionha>.01 else 'Revisar procedimiento de intersección'})
with open(root/'ALERTAS_SOLAPAMIENTOS_VERIFICADOS.csv','w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
print('Alerts processed',len(rows),'verified overlaps',sum(x['superposicion_ha']>.01 for x in rows))
for x in rows:print(x['barrio'],x['capa'],x['superposicion_ha'])
