# Revisión del módulo «Riesgo y hábitat» — propuesta 2026 y microzonificación sísmica

## Cambios
- El panel cartográfico principal muestra solamente los cuatro temas de la propuesta de POT 2026: zonificación de amenazas, condición de amenaza, condición de riesgo y asentamientos. Se retiran las opciones de riesgo 2014 de este módulo, **sin borrar las capas 2014 del repositorio ni alterar los otros comparadores**.
- Subcapítulo permanente «Microzonificación sísmica y tratamientos urbanísticos propuestos», con selección de diez zonas, descripción geotécnica basada en MZSC-RS2, mapa interactivo, imagen de referencia y cruce por zona con los tratamientos propuestos de 2026.
- Estadísticas exploratorias en `data/microzonas_tratamientos_2026_EXPLORATORIO.json`. Se utilizó la digitalización `microzonas_aproximadas.geojson` y `tratamientos.geojson`.
- Se incorpora advertencia visible sobre límites y superficie aproximados. Las zonas de respuesta sísmica **no son niveles de riesgo**.

## Método y limitaciones de los indicadores de intersección
- Muestreo determinístico en malla de 100 × 100 m. Cada celda con centro en microzona y tratamiento aporta aproximadamente 1 ha.
- Se utilizó una proyección equirectangular local de referencia para estimar centros de celda, no un overlay exacto.
- Las zonas sísmicas son una digitalización aproximada de una lámina; la capa de tratamientos es simplificada para la web.
- La diferencia de área entre polígono real y celda, los polígonos angostos y las posibles superposiciones provocan error. **No deben citarse estas hectáreas como cifras oficiales**.
- No se clasifica riesgo de edificios ni predios, ni se determinan valores de diseño sismorresistente.
- Para un indicador técnico validado se debe rehacer la intersección entre la cartografía oficial vectorial de microzonificación y la GDB original de tratamientos 2026, en sistema métrico, con auditoría topológica, metadatos y comparación de áreas.

## Fuentes
- INGEOMINAS–DAGMA, Proyecto de Microzonificación Sísmica de Cali (MZSC), Subproyecto de Respuesta Sísmica, tabla 8.1: https://web1.cali.gov.co/publico2/documentos/dagma/estudios_ambientales/CONTRATO022002/TOMO6CONVENIO022002.pdf
- Decreto 411.0.20.0158 del 18 de marzo de 2014: https://aivalle.com/pdf/Decreto_Marzo_del_2014_-_Adopta_la_MZS_Cali.pdf
- GeoJSON de referencia y propuesta en la carpeta `data/`.

## Pruebas
- [x] Sintaxis JavaScript correcta.
- [x] Archivo de 10 zonas y tratamientos legible, disponible en la rama.
- [x] La vista de riesgo principal no renderiza panel 2014.
- [x] CSS y rutas de archivos incorporados.
- [ ] Prueba de Leaflet, recarga de teselas, zoom, paneles y selección de zona en navegador real.
- [ ] Verificación geoespacial de hectáreas mediante intersección vectorial exacta.
- [ ] Revisión editorial de las descripciones por especialistas geotécnicos y con el mapa oficial de respuesta sísmica.

**Estado:** rama de revisión, no sustituye todavía al sitio público.
## Segunda revisión — cruces riesgo/amenaza y depuración histórica

- Se eliminó `inundacion_fluvial2014` del panel de Riesgo y de las capas seleccionables del explorador territorial. También se retiró la antigua capa ilustrativa `efectos_sismicos2014` del menú; se conservan sus archivos por trazabilidad histórica, sin utilizarlos en los indicadores de este módulo.
- El módulo de Riesgo muestra únicamente cartografía 2026 de amenaza, condición de amenaza, condición de riesgo y asentamientos. El apartado de microzonificación sísmica usa un estudio histórico de referencia, con límites digitalizados aproximados, cruzado con tratamientos propuestos para 2026.
- Se creó `data/cruces_riesgo_microzonas_tratamientos_2026_EXPLORATORIO.json`, que cruza:
  * Microzona digitalizada × condición de riesgo 2026 × tratamiento 2026.
  * Microzona digitalizada × condición de amenaza 2026 × tratamiento 2026.
  * Desagregación por fenómeno: 1 movimientos en masa, 2 avenidas torrenciales, 3 inundación.
- Método de los nuevos cruces: muestreo de centros de celda 50 × 50 m, equivalente a 0,25 ha/celda; se deduplican las celdas para el total de cada capa, pero los registros de fenómenos y tratamientos pueden superponerse. **No equivale a medición SIG vectorial exacta**.
- Resultados exploratorios de superficie única de las condiciones: condición de riesgo ~1.000,5 ha; condición de amenaza ~283 ha. Son resultados del muestreo de las capas web simplificadas; no deben confundirse con cifras oficiales ni certificadas.
- Se incorporó un selector de la capa a cruzar dentro del subcapítulo sísmico, junto a la tabla de tratamientos, fenómenos y hectáreas muestreadas por microzona.
- Se incorporó el script reproducible `scripts/cruzar_riesgo_microzonas_2026.py` para generar **intersecciones vectoriales** con las geometrías GeoJSON disponibles. Este script está preparado, pero **sus resultados no se han ejecutado ni incorporado**. Aunque se ejecute, no sustituye la validación con GDB oficiales y microzonificación vectorial certificada.

## Control de interpretación

- Las zonas 1–6, con subzonas 4A–4E, son clases de respuesta sísmica del suelo; no rangos ordinales de riesgo.
- La microzonificación no tiene fecha 2026: es una fuente técnica histórica de referencia. Su cruce con tratamientos propuestos no convierte la fuente sísmica en cartografía del POT 2026.
- En los cruces, la denominación **condición de riesgo** no acredita, por sí sola, nivel de riesgo alto ni carácter no mitigable. El mapa de **zonificación de amenaza** de 2026 sigue siendo una capa distinta de **condición de amenaza**.
- Las hectáreas estimadas por fenómeno no deben sumarse como categorías disjuntas cuando puedan coexistir varios fenómenos.
- Las fuentes originales de amenaza y riesgo no se alteraron ni se corrigieron en el repositorio.

## Pruebas pendientes para publicación
- Prueba funcional real en GitHub Pages: mapa, selector de zona, selector de cruces, redimensionamiento, leyendas y filtros en celular.
- Reprocesamiento vectorial con GDB original 2026, control topológico y cartografía oficial de microzonificación.
- Revisión experta de las descripciones geotécnicas y corroboración de zonas contra el mapa normativo.
