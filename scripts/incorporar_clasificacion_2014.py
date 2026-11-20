"""Exportar clasificación cartográfica POT 2014 y síntesis comparativa 2014/2026.
Requiere GDB originales accesibles localmente. NO es una interpretación jurídica del proyecto.
Fuentes: BASE_CLASIFICACION_SUELO de POT_2014.gdb y not_clasificacionsuelo,
not_cambio_perimetro_urbano de norma_ot.gdb (propuesta 2026).
"""
import json
import os
from collections import defaultdict
from pathlib import Path
import geopandas as gpd
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from pyproj import CRS

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'data'
GDB14=Path(os.environ.get('POT2014_GDB','/mnt/data/gdb2014_partial.gdb'))
GDB26=Path(os.environ.get('POT2026_GDB','/mnt/data/_tmp_norma_ot/norma_ot.gdb'))
CRS_METRIC='EPSG:9377'

def load(layer,path):
    out=gpd.read_file(path,layer=layer).to_crs(CRS_METRIC)
    if not out.geometry.is_valid.all():out.geometry=out.geometry.make_valid()
    return out

u=load('bcs_lim_perimetro_urbano',GDB14)
e=load('bcs_lim_perimetro_area_expansion',GDB14)
m=load('bcs_lim_perimetro_municipal',GDB14)
c=load('not_clasificacionsuelo',GDB26)
p=load('not_cambio_perimetro_urbano',GDB26)
ug=u.geometry.union_all();eg=e.geometry.union_all();mg=m.geometry.union_all()
rg=mg.difference(ug.union(eg))
features=[]
for idx,(name,geo,k) in enumerate([
 ('Perímetro urbano',ug,'U'),('Suelo de expansión',eg,'E'),('Suelo rural (inferido por diferencia)',rg,'R')],1):
 # simplificación 3 metros, solo para render web; no para estadística
 g=geo.simplify(3,preserve_topology=True).simplify(0)
 features.append({'type':'Feature','properties':{'codigo':k,'csnombre':name,'fuente':'POT_2014.gdb',
                  'area_ha_fuente':round(geo.area/1e4,2),'inferencia':k=='R',
                  'advertencia':'Polígono rural derivado por diferencia entre municipio, perímetro urbano y expansión' if k=='R' else ''},
                  'geometry':mapping(gpd.GeoSeries([g],crs=CRS_METRIC).to_crs(4326).iloc[0])})
(DEST/'clasificacion2014.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')),encoding='utf8')
changes=[]
for _,row in p.iterrows():
    attrs={k:row[k] for k in ['condicion','criterio','deta_cri','FICHA']}
    g=row.geometry.simplify(5,preserve_topology=True)
    changes.append({'type':'Feature','properties':{**attrs,'area_ha_fuente':round(row.geometry.area/1e4,2)},'geometry':mapping(gpd.GeoSeries([g],crs=CRS_METRIC).to_crs(4326).iloc[0])})
(DEST/'cambio_perimetro2026.geojson').write_text(json.dumps({'type':'FeatureCollection','features':changes},ensure_ascii=False,separators=(',',':')),encoding='utf8')

s={'metodologia':'Áreas calculadas en un CRS proyectado común MAGNA-SIRGAS 2018 Origen Nacional. GDB 2014 disponible incluye ajustes posteriores a 2014. GDB 2026 es propuesta.',
  'periodo_2014':'POT 2014 vigente, geodatabase con actualizaciones',
  'periodo_2026':'Propuesta POT 2026, no aprobada',
  'periodo':{'2014':{'urbano_ha':round(ug.area/1e4,1),'expansion_ha':round(eg.area/1e4,1),'rural_derivado_ha':round(rg.area/1e4,1),'municipal_ha':round(mg.area/1e4,1)},
             '2026':{'urbano_ha':round(c.loc[c.cstipo==1].geometry.area.sum()/1e4,1),
             'expansion_ha':round(c.loc[c.cstipo==3].geometry.area.sum()/1e4,1),
             'rural_ha':round(c.loc[c.cstipo==2].geometry.area.sum()/1e4,1),
             'clasificado_total_ha':round(c.geometry.area.sum()/1e4,1)}},
 'cambios':{'urbano_delta_ha':round(c.loc[c.cstipo==1].geometry.area.sum()/1e4-ug.area/1e4,1),
            'expansion_delta_ha':round(c.loc[c.cstipo==3].geometry.area.sum()/1e4-eg.area/1e4,1),
            'perimetro_por_categoria':[]},
 'advertencias':['No interpretar automáticamente un cambio cartográfico como cambio normativo aprobado.',
  'Diferencias entre delimitaciones municipales 2014 y 2026: las variaciones de rural no son directamente homologables.',
  'Las áreas provienen de las GDB originales; la web presenta geometrías simplificadas para visualizar.',
  'Un incremento neto no representa todas las incorporaciones o exclusiones: deben consultarse las dos direcciones del cambio.']}
for cond,group in p.groupby('condicion'):
    s['cambios']['perimetro_por_categoria'].append({'nombre':cond,'poligonos':len(group),'hectareas':round(group.geometry.area.sum()/1e4,1)})
# Superficies en la familia cartográfica de renovación: categorías no necesariamente
# equivalentes en términos de intensidad o instrumentos, pero espacialmente contrastables.
t14=load('nur_tratamientos_urbanisticos',GDB14)
t26=load('not_urb_tratamientourbanistico',GDB26)
ren14=t14.loc[t14['CODIGO'].isin(['R1','R2','R3'])].geometry.union_all()
ren26=t26.loc[t26['tutipo'].isin([10,11])].geometry.union_all()
s['renovacion_cartografica']={
 '2014_ha':round(ren14.area/1e4,1),
 '2026_ha':round(ren26.area/1e4,1),
 'nuevamente_clasificada_2026_ha':round(ren26.difference(ren14).area/1e4,1),
 'fuera_de_renovacion_2026_ha':round(ren14.difference(ren26).area/1e4,1),
 'variacion_neta_ha':round((ren26.area-ren14.area)/1e4,1),
 'precaucion':'Se comparan las categorías nominales de renovación 2014 R1/R2/R3 contra 2026 R1/R2; no son necesariamente equivalentes en obligaciones, aprovechamientos o derechos de construcción.'
}
(DEST/'comparacion_suelo_2014_2026.json').write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf8')

# Resumen de clasificación por cada barrio para las fichas gráficas
res_path=DEST/'resumen_barrios.json'
res=json.loads(res_path.read_text(encoding='utf8'))
barrios=gpd.read_file(DEST/'barrios.geojson').to_crs(CRS_METRIC)
geo2014=[('Perímetro urbano',ug),('Suelo de expansión',eg),('Suelo rural',rg)]
geo2026=[(row.csnombre.strip(),row.geometry) for row in c.itertuples()]
for row in barrios.itertuples():
    cod=str(row.codigo)
    b=res['barrios'].get(cod)
    if not b: continue
    barrio_geo=row.geometry
    barrio_area=barrio_geo.area/1e4
    for key,cats in [('clasificacion2014',geo2014),('clasificacion2026',geo2026)]:
        # keep geometries disjoint, with priority in displayed ordering
        intersections=[]; already=None
        for name,poly in cats:
            inter=barrio_geo.intersection(poly)
            if already is not None: inter=inter.difference(already)
            if inter.area/1e4<.01: continue
            intersections.append({'nombre':name,'hectareas':round(inter.area/1e4,2),
                  'porcentaje_barrio':round(inter.area/barrio_geo.area*100,1),
                  'cantidad_intersecciones':1})
            already=inter if already is None else already.union(inter)
        b['capas'][key]={'categorias':intersections,'total_categorias':len(intersections),
          'superficie_cruzada_ha':round(sum(x['hectareas'] for x in intersections),2),
          'nota':'Cruce cartográfico; las geometrías se reproyectaron a un sistema común. Área rural 2014 derivada por diferencia.'}
res_path.write_text(json.dumps(res,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps(s,ensure_ascii=False,indent=2))
