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