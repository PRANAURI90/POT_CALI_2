# Metodología del comparador POT Cali 2014–2026 — Versión 6

## Fuentes cartográficas y jerarquía

1. **GDB POT 2014 vigente, actualizada:** `bcs_lim_perimetro_urbano`, `bcs_lim_perimetro_area_expansion`, `bcs_lim_perimetro_municipal`, `nur_tratamientos_urbanisticos`, `nur_areas_actividad`, `nur_planes_parciales`, `nur_edificabilidad_zonas`, `amb_ari_inundacion_fluvial`, `amb_ari_efectos_sismicos`.
2. **GDB propuesta 2026:** `not_clasificacionsuelo`, `not_cambio_perimetro_urbano`, `not_urb_tratamientourbanistico`, `not_urb_areasactividad`, `not_urb_planesparciales`, otras capas de amenaza, riesgos e instrumentos.
3. **Barrios y sectores de consulta:** `pdt_dpa_barrios_sectores` (342 unidades de la fuente cartográfica aportada).
4. **Normas:** Acuerdo 0373 de 2014, proyecto de Acuerdo 2026 y anexos disponibles. Una categoría cartográfica propuesta no es una disposición vigente.

## Mediciones

Las superficies distritales de clasificación y renovación se calcularon a partir de las **geometrías completas de las GDB originales**, transformadas a un único sistema métrico proyectado (MAGNA-SIRGAS 2018 / Origen Nacional, EPSG:9377). Las versiones GeoJSON para el navegador están simplificadas: **no deben utilizarse para recalcular las cifras distritales de referencia**.

### Resultados preliminares

| Indicador | Base POT 2014 vigente y actualizada | Propuesta 2026 | Diferencia neta |
|---|---:|---:|---:|
| Suelo urbano / perímetro urbano | 11.942,9 ha | 12.717,8 ha | +774,9 ha |
| Suelo de expansión | 1.636,6 ha | 2.259,6 ha | +622,9 ha |
| Suelo rural | 42.691,3 ha (inferido) | 41.416,9 ha | No directamente homologable |
| Áreas bajo familia nominal de tratamientos de renovación | 1.993,1 ha (R1/R2/R3) | 3.951,5 ha (R1/R2) | +1.958,5 ha (nominal, no equivalencia jurídica) |

El rural 2014 es un **residuo geométrico**, derivado como municipio 2014 menos la unión de urbano 2014 y expansión 2014. Las delimitaciones del municipio en ambas GDB difieren, por lo que no debe interpretarse la variación rural como una reclasificación neta exacta.

### Adiciones y exclusiones del perímetro urbano

La capa 2026 `not_cambio_perimetro_urbano` identifica:

- **49 polígonos adicionados**, 855,0 ha.
- **46 polígonos excluidos**, 80,1 ha.
- **1 polígono conservado**, 11.862,7 ha.

Los cambios de superficie pueden incluir ajustes de precisión y delimitación; requieren revisión normativa y geométrica cuando se interpretan por predio.

### Cambio nominal de tratamientos de renovación

Se comparó la unión de áreas R1/R2/R3 de la cartografía 2014 con R1/R2 de la propuesta 2026: aproximadamente **2.032,0 ha** aparecen dentro de la familia de renovación propuesta que no estaban en esa familia cartográfica 2014; **73,5 ha** dejan de aparecer; variación neta **+1.958,5 ha**. Esto NO significa que existan idénticas reglas de edificabilidad ni mayor renta por hectárea: códigos y modalidades cambiaron.

## Cruces por barrio

El denominador de cada porcentaje de barrio corresponde a la superficie de su polígono en la fuente de referencia. Las proporciones se calculan mediante intersección espacial de cada categoría sobre el mismo barrio; en clasificación 2014 y 2026 las categorías se presentan sin solapamiento.

Los gráficos de torta incluyen un segmento sin cobertura si corresponde. Se omiten o advierten cuando las categorías se superponen y no constituyen una partición; porcentajes de superficie **no equivalen a porcentajes de población, viviendas o beneficios**.

### Interpretación de los resultados

- Una modificación cartográfica puede o no modificar los derechos de desarrollo. Es indispensable cotejar artículo, ámbito territorial, vigencia y régimen de transición.
- Un mayor aprovechamiento potencial no demuestra ganancia económica ni reducción de cargas.
- La existencia de un plan parcial en una capa no acredita por sí sola la exigibilidad de formular otro ni la eliminación de una obligación.
- El POT no crea automáticamente exenciones tributarias: deben comprobarse en la normativa fiscal correspondiente.
- La zona de microzonificación sísmica **no puede establecerse aún** con la información de efectos sísmicos; se requiere la cartografía oficial georreferenciada del Decreto Municipal 411.0.20.0158 de 2014.
- La fuente denominada GDB del POT 2014 incluye revisiones posteriores a 2014 y la propuesta 2026 todavía no está adoptada.

**Fuentes primarias de Drive:**
- [POT 2014](https://drive.google.com/drive/folders/1SA5nS9Rf-7zp8-j0Vf7KuEQotfKeEqG4)
- [Propuesta 2026](https://drive.google.com/drive/folders/1Sydz1ahyHOcWgw5WrFsMjUJkDCQZ85Fr)
