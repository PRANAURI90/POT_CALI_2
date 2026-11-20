"""Mapas introductorios ESTÁTICOS para GitHub Pages.
Geometrías de las GDB 2014 y propuesta 2026 ya convertidas a GeoJSON;
ambos mapas comparten MAGNA-SIRGAS / Origen Nacional, escala y extensión.
"""
from pathlib import Path
import geopandas as gpd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

BASE=Path(__file__).resolve().parent.parent
OUT=BASE/'assets';OUT.mkdir(exist_ok=True)
old=gpd.read_file(BASE/'data/clasificacion2014.geojson').to_crs(9377)
new=gpd.read_file(BASE/'data/clasificacion.geojson').to_crs(9377)
a=old.total_bounds;b=new.total_bounds
bounds=[min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3])]
dx=bounds[2]-bounds[0];dy=bounds[3]-bounds[1]
xlim=(bounds[0]-.045*dx,bounds[2]+.045*dx)
ylim=(bounds[1]-.035*dy,bounds[3]+.035*dy)
colors={'R':'#D9E5D8','U':'#3D8D84','E':'#E0B45F'}
for year,g in [(2014,old),(2026,new)]:
 fig=plt.figure(figsize=(5.3,5.75),dpi=160,facecolor='#F3F7F4')
 ax=fig.add_axes([.02,.02,.96,.96]);ax.set_facecolor('#F3F7F4')
 for code in ['R','E','U']:
  gg=g[g.codigo==code] if year==2014 else g[g.cstipo=={'R':2,'E':3,'U':1}[code]]
  if len(gg):gg.plot(ax=ax,color=colors[code],edgecolor='#506F64',linewidth=.35,zorder={'R':1,'E':3,'U':4}[code])
 ax.set_xlim(xlim);ax.set_ylim(ylim);ax.set_aspect('equal');ax.set_xticks([]);ax.set_yticks([])
 for sp in ax.spines.values():sp.set_visible(False)
 f=OUT/f'clasificacion_{year}_intro.png';fig.savefig(f,dpi=160,facecolor='#F3F7F4',pad_inches=0)
 plt.close(fig)
 print(f)
