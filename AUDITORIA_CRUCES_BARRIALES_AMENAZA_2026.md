# Corrección de cruces territoriales por barrio — Amenaza y riesgo
Fecha: 2026-11-23

## Defecto corregido
La ficha «¿Qué se identifica en tu territorio?» mostraba un mensaje genérico indicando que no había cruce por barrio para zonificación de amenaza. La información por microzona ya existía en `microzonas_por_barrio_APROXIMADAS.json`, pero no estaba integrada a esta ficha.

## Comportamiento de esta implementación
1. Al seleccionar un barrio en «Amenaza y riesgo» → «Amenazas 2026», se cruza su geometría con `data/amenaza.geojson` por fenómeno y categoría:
   - Movimientos en masa: alta, media, baja u otra condición codificada 0.
   - Inundación: mismas categorías.
   - Avenidas torrenciales: mismas categorías.
2. Solo se generan mapas de los fenómenos que efectivamente intersectan el barrio. Los fenómenos sin intersección detectada se mencionan de manera explícita en un único texto.
3. Para cada fenómeno con resultados se indica superficie en ha y porcentaje sobre el área total del barrio seleccionado y se crea una representación SVG del contorno barrial con las áreas intersecadas y leyenda, exportable a JPG.
4. La microzonificación sísmica aparece en un mapa diferenciado. Sus áreas y porcentajes proceden del archivo `microzonas_por_barrio_APROXIMADAS.json` y se ilustran con la capa `microzonas_aproximadas.geojson`. No se confunden las clases sísmicas con niveles de amenaza.
5. Los temas «Condición de amenaza», «Condición de riesgo» y «Hábitat y asentamientos» también calculan intersecciones por barrio de sus categorías cartográficas.

## Método
- Intersección Turf.js 6.5.0, calculada en el navegador para el barrio elegido.
- Capa de amenazas: `zafenome|zacateg`; se disuelven los recortes que tienen la misma categoría para evitar doble conteo dentro de esa categoría.
- Denominador: área completa del polígono del barrio, expresada en ha y calculada sobre coordenadas WGS84 mediante Turf.
- Umbral de visualización: 100 m² (0,01 ha).
- Porcentajes de diferentes fenómenos pueden superponerse y **no deben sumarse**.
- El JPG es autónomo, sin teselas cartográficas externas, por compatibilidad con exportación desde Canvas.
- El mapa sísmico se reproduce usando una digitalización NO certificada; los porcentajes provienen de una intersección proyectada anterior y pueden diferir ligeramente de Turf debido a la proyección y simplificación.
- Si no es posible calcular o unir geometrías se reportan fallos y no se afirma ausencia de peligro.
- «Sin intersección» significa únicamente que no existe coincidencia detectable con la capa disponible y el umbral especificado, no ausencia real de amenaza.
- Estas capas web son simplificadas. El resultado es exploratorio, no instrumento normativo ni certificación para decisiones prediales.

## Control
- [x] Sintaxis de JavaScript.
- [x] Prueba sintética de generación SVG: título, geometría, colores y leyenda.
- [x] Tratamiento separado de los tres fenómenos y microzonificación.
- [x] Resultado explícito ante ausencia de intersección y ante fallo de cálculo.
- [x] Exportación JPG desarrollada por Canvas en el navegador.
- [ ] Prueba integral en navegador con las geometrías reales de Prados del Limonar y otros barrios.
- [ ] Contraste GIS con GDB no simplificada, geometrías oficiales de barrios y cartografía oficial de microzonificación.
