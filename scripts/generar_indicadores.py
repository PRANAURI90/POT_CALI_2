"""Indicadores descriptivos (NO cambios 2014-26) a partir de capas propuestas.
No sumar superficies de amenazas como categorías excluyentes.
"""
import json, pathlib, collections
from shapely.geometry import shape
from shapely.ops import unary_union, transform
from pyproj import Transformer
P=pathlib.Path(__file__).resolve().parent.parent/'data'
out={'fuente':'GDB propuesta POT 2026; superficies provenientes del atributo csarea para clasificación; geometrías simplificadas para tratamientos','estado':'Indicadores descriptivos 2026; NO representan variación comprobada 2014–2026'}
cl=json.loads((P/'clasificacion.geojson').read_text())['features']
out['clasificacion2026']=[{'nombre':x['properties']['csnombre'].strip(),'hectareas':round(x['properties']['csarea']/10000,1)} for x in cl]
out['urbano2026_ha']=next(x['hectareas'] for x in out['clasificacion2026'] if x['nombre']=='Perímetro urbano')
out['expansion2026_ha']=round(sum(x['hectareas'] for x in out['clasificacion2026'] if x['nombre'].lower().startswith('expansión')),1)
out['rural2026_ha']=next(x['hectareas'] for x in out['clasificacion2026'] if x['nombre']=='Suelo rural')
tr=json.loads((P/'tratamientos.geojson').read_text())['features']
# El mapa está en EPSG:4326, usamos una proyección métrica para mediciones orientativas
conv=Transformer.from_crs('EPSG:4326','EPSG:6249',always_xy=True).transform
renov=[transform(conv,shape(x['geometry'])) for x in tr if str(x['properties'].get('tutipo')) in ('10','11')]
out['renovacion2026_ha_aprox']=round(unary_union(renov).area/10000,1)
out['renovacion2026_advertencia']='Aproximación sobre geometría simplificada de la capa de tratamientos; no constituye cálculo de incremento respecto al POT 2014.'
am=json.loads((P/'amenaza.geojson').read_text())['features']
out['amenaza2026_num_poligonos']=len(am)
out['amenaza2026_estudios']=[{'nombre':k,'poligonos':v} for k,v in collections.Counter(x['properties'].get('zadesc','No especificado') for x in am).most_common(6)]
out['planes_parciales2026_num_poligonos']=len(json.loads((P/'planes_parciales.geojson').read_text())['features'])
out['barrios_num']=len(json.loads((P/'barrios.geojson').read_text())['features'])
(P/'indicadores2026.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2)[:3000])
