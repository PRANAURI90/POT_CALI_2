"""Convierta barrios y sectores oficiales Cali a GeoJSON local de GitHub Pages.

Uso:
    python scripts/convertir_barrios.py /ruta/pdt_dpa_barrios_sectores.zip
    python scripts/convertir_barrios.py /ruta/pdt_dpa_barrios_sectores.shp

Fuente: capa IDESC pdt_dpa_barrios_sectores, acuerdo 0636 de 2026.
Se conservan geometrias completas; no utilizar para certificados prediales.
Dependencia de mantenimiento: geopandas.
"""
from pathlib import Path
import json
import sys
import zipfile
import tempfile
import geopandas as gpd
from shapely.geometry import mapping

if len(sys.argv)<2:
    raise SystemExit('Uso: python scripts/convertir_barrios.py archivo.zip | archivo.shp')
source=Path(sys.argv[1])
if not source.exists():
    raise SystemExit(f'No se encuentra: {source}')

def convert(shp):
    gdf=gpd.read_file(shp)
    required={'barcodigo','barnombre','barcomuna','barcategor'}
    missing=required.difference(gdf.columns)
    if missing:raise RuntimeError(f'La fuente no tiene los campos oficiales esperados: {sorted(missing)}')
    if gdf.crs is None: raise RuntimeError('Sin CRS: no es seguro reproyectar.')
    print(f'CRS fuente: {gdf.crs}. Registros: {len(gdf)}')
    gdf=gdf.to_crs(epsg=4326)
    features=[]
    seen=set()
    for _,row in gdf.iterrows():
        geo=row.geometry
        if geo is None or geo.is_empty: continue
        if not geo.is_valid: raise RuntimeError('Geométria no válida: '+str(row.barcodigo))
        codigo=str(row['barcodigo']).zfill(4)
        if codigo in seen: raise RuntimeError('Código repetido: '+codigo)
        seen.add(codigo)
        props={
            'codigo':codigo,
            'barrio':str(row['barnombre']).strip(),
            'comuna':str(row['barcomuna']).zfill(2),
            'tipo':str(row['barcategor']).strip(),
            'plano':str(row['barmapa']) if 'barmapa' in row and row['barmapa'] else '',
            'acuerdo':str(row['baracusan']) if 'baracusan' in row and row['baracusan'] else '',
            'fuente':'IDESC Cali — pdt_dpa_barrios_sectores (Acuerdo 0636 de 2026)'
        }
        features.append({'type':'Feature','properties':props,'geometry':mapping(geo)})
    types={t:sum(f['properties']['tipo']==t for f in features) for t in set(f['properties']['tipo'] for f in features)}
    destination=Path(__file__).resolve().parents[1]/'data'/'barrios.geojson'
    destination.write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')),encoding='utf8')
    print(f'Exportadas {len(features)} unidades: {types} · {destination.stat().st_size:,} bytes · {destination}')

if source.suffix.lower()=='.zip':
    with zipfile.ZipFile(source) as z, tempfile.TemporaryDirectory() as td:
        members=z.namelist()
        if any(Path(name).is_absolute() or '..' in Path(name).parts for name in members):
            raise RuntimeError('ZIP no seguro')
        z.extractall(td)
        files=list(Path(td).rglob('*.shp'))
        if len(files)!=1:raise RuntimeError('Debe haber exactamente un shapefile en el ZIP')
        convert(files[0])
else:
    convert(source)
