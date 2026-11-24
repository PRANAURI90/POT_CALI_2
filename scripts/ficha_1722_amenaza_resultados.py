import json, hashlib
from pathlib import Path
from collections import defaultdict
import geopandas as gpd
from shapely.ops import unary_union, transform
from shapely.geometry import mapping
from pyproj import Transformer
root=Path(__file__).resolve().parents[1]; data=root/'data'
b=gpd.read_file(data/'barrios.geojson').to_crs('EPSG:9377')
sel=b[b['codigo'].astype(str).str.zfill(4)=='1722']
assert len(sel)==1, f'Barrio 1722 encontrado {len(sel)} veces'
geom=sel.geometry.iloc[0].buffer(0); total=geom.area/10000
a=gpd.read_file(data/'amenaza.geojson').to_crs('EPSG:9377')
assert {'zafenome','zacateg'}.issubset(a.columns)
a=a[a.intersects(geom)]
groups=defaultdict(list)
for _,r in a.iterrows():
    clip=r.geometry.buffer(0).intersection(geom)
    if not clip.is_empty and clip.area>0:groups[(str(r.zafenome).replace('.0',''),str(r.zacateg).replace('.0',''))].append(clip)
to_wgs=Transformer.from_crs('EPSG:9377','EPSG:4326',always_xy=True).transform
to_poly=lambda g:mapping(transform(to_wgs,g.simplify(1.5,preserve_topology=True)))
labels={'1':'Movimientos en masa','2':'Avenidas torrenciales','3':'Inundación'}
rows=[]; shapes=[]; overlap=[]
for f in sorted({k[0] for k in groups}):
    cats=[]
    for (ff,c),listg in sorted(groups.items()):
        if f!=ff:continue
        combined=unary_union(listg).intersection(geom)
        if combined.area <100:continue
        ha=combined.area/10000
        cats.append(combined)
        rows.append({'fenomeno_codigo':f,'fenomeno':labels.get(f,'Código '+f),'categoria_codigo':c,'ha':round(ha,4),'porcentaje':round(ha/total*100,3)})
        shapes.append({'fenomeno_codigo':f,'categoria_codigo':c,'geometry':to_poly(combined)})
    if cats:
        double=(sum(g.area for g in cats)-unary_union(cats).area)/10000
        if double>.01:overlap.append({'fenomeno_codigo':f,'solapamiento_ha':round(double,4)})
result={'barrio':'Prados del Limonar','codigo':'1722','area_barrial_ha':round(total,4),'metodo':'interseccion geometrica EPSG:9377 sobre GeoJSON web simplificados; umbral 0.01 ha','fuentes_sha256':{x:hashlib.sha256((data/x).read_bytes()).hexdigest() for x in ['barrios.geojson','amenaza.geojson']},'filas':rows,'poligono_barrio':to_poly(geom),'poligonos_cruzados':shapes,'solapamientos':overlap,'etiquetas':labels,'no_equivale_a':'certificacion oficial o diagnostico predial'}
out=data/'ficha_1722_amenaza_resultado.json'
out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('AREA:',total,'RESULTADOS:',rows,'BYTES:',out.stat().st_size)
