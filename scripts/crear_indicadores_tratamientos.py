"""Indicadores descriptivos de cartografía SIMPLIFICADA para la portada.
No reemplazan cómputos de áreas sobre GDB original; no publicar como cifras de precisión.
"""
import json, collections
from pathlib import Path
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer
p=Path(__file__).resolve().parents[1]/'data'
pr=Transformer.from_crs('EPSG:4326','EPSG:9377',always_xy=True).transform
sources={}
for k in ('tratamientos2014','tratamientos','areas_actividad'):
    data=json.loads((p/(k+'.geojson')).read_text());records=[]
    for f in data['features']:
        poly=transform(pr,shape(f['geometry']))
        if not poly.is_valid:poly=poly.buffer(0)
        cat=str(f['properties'].get('CODIGO' if k=='tratamientos2014' else 'tutipo' if k=='tratamientos' else 'aatipo','Sin dato'))
        records.append((poly,cat))
    sources[k]=records
mapping14={'CO':'Conservación','C1':'Consolidación','C2':'Consolidación','C3':'Consolidación','C4':'Consolidación','R1':'Renovación','R2':'Renovación','R3':'Renovación','DE':'Desarrollo','D1':'Desarrollo','D2':'Desarrollo','MI':'Mejoramiento integral'}
mapping26={'1':'Conservación','2':'Conservación','3':'Consolidación','4':'Consolidación','5':'Consolidación','6':'Consolidación','7':'Desarrollo','8':'Desarrollo','9':'Mejoramiento integral','10':'Renovación','11':'Renovación','12':'No aplica'}
names26={'1':'Área de Proximidad','2':'Área de Integración','3':'Área Multifuncional','4':'Área de Dinamización Económica','5':'Área de Manejo Especial','6':'PEMP Centro Histórico','7':'PEMP Plaza de Toros','8':'PEMP Cañas Gordas','9':'PEMP Piedragrande'}
def hist(k,mapx):
 d=collections.defaultdict(float)
 for poly,cat in sources[k]:d[mapx.get(cat,cat)]+=poly.area/10000
 return [{'categoria':x,'ha':round(y,1)} for x,y in sorted(d.items(),key=lambda x:-x[1])]
# GeoJSON geometries represent subsets/versions; overlay may have overlaps. Only publish if validation after union.
tr=collections.defaultdict(float)
for a,ac in sources['tratamientos2014']:
 for b,bc in sources['tratamientos']:
  if not a.intersects(b):continue
  z=a.intersection(b)
  if z.is_empty:continue
  tr[(mapping14.get(ac,ac),mapping26.get(bc,bc))]+=z.area/10000
out={'metodologia':'Estimaciones exploratorias sobre GeoJSON simplificados; NO son cifras oficiales ni sustituyen las GDB originales. Comprobar solapamientos antes de publicar como resultados.','tratamientos2014':hist('tratamientos2014',mapping14),'tratamientos2026':hist('tratamientos',mapping26),'actividades2026':hist('areas_actividad',names26),'transiciones_tratamientos':sorted([{'desde':x,'hacia':y,'ha':round(v,1)} for (x,y),v in tr.items()],key=lambda x:-x['ha'])}
(p/'indicadores_transformacion_exploratorios.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps({k:v[:10] if isinstance(v,list) else v for k,v in out.items()},ensure_ascii=False,indent=2)[:3500])
