"""Intersecciones geométricas reproducibles con capas de la web POT Cali.

Requisitos: geopandas>=1.0, shapely>=2.0, pyproj.
Ejecutar desde la raíz: python scripts/cruzar_riesgo_microzonas_2026.py

IMPORTANTE: las microzonas se digitalizaron aproximadamente y los GeoJSON
del sitio están simplificados. 'Exacto' se refiere a la intersección entre
estas geometrías, NO a exactitud legal, cartográfica u oficial.
"""
from pathlib import Path
import hashlib
import json
import geopandas as gpd
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CRS = "EPSG:9377"
INPUTS = {
    "microzonas": "microzonas_aproximadas.geojson",
    "tratamientos": "tratamientos.geojson",
    "amenaza": "amenaza.geojson",
    "condicion_amenaza": "condicion_amenaza.geojson",
    "condicion_riesgo": "condicion_riesgo.geojson",
}


def load(name, column, target):
    frame = gpd.read_file(DATA / INPUTS[name]).to_crs(CRS)
    if column not in frame:
        raise ValueError(f"Falta {column} en {name}")
    if name == "amenaza":
        if "zacateg" not in frame:
            raise ValueError("La capa amenaza no contiene zacateg")
        # Fenómeno y nivel deben mantenerse como clases separadas.
        frame[target] = frame[column].astype(str) + "|" + frame["zacateg"].astype(str)
        frame = frame[[target, "geometry"]].copy()
    else:
        frame = frame[[column, "geometry"]].rename(columns={column: target}).copy()
    frame[target] = frame[target].astype(str)
    frame["geometry"] = frame.geometry.make_valid()
    frame = frame[~frame.geometry.is_empty & frame.geometry.notna()].copy()
    frame = frame.explode(index_parts=False, ignore_index=True)
    frame = frame[frame.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    # Disolver evita el doble conteo si varios features de la misma clase se traslapan.
    frame = frame.dissolve(by=target, as_index=False)
    frame["geometry"] = frame.geometry.make_valid()
    return frame


def intersect(left, right):
    out = gpd.overlay(left, right, how="intersection", keep_geom_type=True)
    return out[~out.geometry.is_empty & (out.geometry.area > 0)].copy()


def rows(frame, groups):
    if frame.empty:
        return []
    frame = frame.copy()
    frame["ha"] = frame.geometry.area / 10000.0
    out = frame.groupby(groups, dropna=False)["ha"].sum().reset_index()
    out["ha"] = out["ha"].round(4)
    return out.to_dict("records")


def main():
    micro = load("microzonas", "zona", "microzona")
    treats = load("tratamientos", "tutipo", "tratamiento")
    cross = intersect(micro, treats)
    result = {
        "caracter": "INTERSECCION_VECTORIAL_DE_GEOJSON_SIMPLIFICADOS_NO_OFICIAL",
        "crs": CRS,
        "fuentes": {
            key: {"archivo": val, "sha256": hashlib.sha256((DATA / val).read_bytes()).hexdigest()}
            for key, val in INPUTS.items()
        },
        "advertencia": (
            "Los GeoJSON del visor están simplificados y la delimitación sísmica "
            "es una digitalización aproximada. No usar para decisiones prediales, "
            "certificaciones, estudios de amenaza detallados o diseño sismorresistente."
        ),
        "microzonas_area_ha": rows(micro, ["microzona"]),
        "microzona_tratamiento_ha": rows(cross, ["microzona", "tratamiento"]),
        "capas": {},
    }
    for layer, col in [
        ("condicion_riesgo", "acrfenome"),
        ("condicion_amenaza", "acafenome"),
        ("amenaza", "zafenome"),
    ]:
        try:
            phenomenon = load(layer, col, "fenomeno")
        except ValueError as exc:
            # La capa de zonificación de amenaza puede tener campos diferentes;
            # detenerse y corregir explícitamente en vez de inventar equivalencias.
            result["capas"][layer] = {"error": str(exc)}
            continue
        zone_risk = intersect(micro, phenomenon)
        triple = intersect(cross, phenomenon)
        result["capas"][layer] = {
            "fenomenos_ha": rows(phenomenon, ["fenomeno"]),
            "microzona_fenomeno_ha": rows(zone_risk, ["microzona", "fenomeno"]),
            "microzona_tratamiento_fenomeno_ha": rows(
                triple, ["microzona", "tratamiento", "fenomeno"]
            ),
        }
    dest = DATA / "cruces_riesgo_microzonas_tratamientos_2026_VECTOR.json"
    dest.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Resultado generado: {dest}")


if __name__ == "__main__":
    main()
