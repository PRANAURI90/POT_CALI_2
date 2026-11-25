# Integración del piloto 1722 — Prados del Limonar

**Estado:** rama de trabajo creada; integración de cifras y mapas pendiente de recibir y verificar los tres archivos del piloto. No se publica como resultado validado.

## Insumos que deben incorporarse

1. `Piloto_1722_amenazas_cuantificadas_pagina3.png` — imagen de referencia para la página 3.
2. `Verificacion_exploratoria_amenaza_1722.json` — valores y metadatos de la verificación exploratoria.
3. `Piloto_1722_amenazas_cuantificadas_revision.pdf` — ficha revisada para comparación visual y editorial.

Los nombres fueron indicados para esta integración, pero sus contenidos no están disponibles todavía en el espacio de trabajo. **No se deben completar cifras a partir de los nombres.**

## Componentes existentes a intervenir

- `assets/fichas-barriales.js`: generador dinámico de PDF para todos los barrios, incluida la cartografía de amenazas. Mantener la generación bajo demanda.
- `assets/app.js`: selección territorial y presentación de los cruces de amenaza.
- `index.html`: botón de descarga PDF ya existente; no duplicar ni sustituir la descarga.
- `data/`: capas y resúmenes utilizados por los cruces cartográficos.

## Criterios de aceptación

- Leer las tres fuentes y verificar que el JSON corresponde a código barrial **1722**, así como su fecha, unidad, denominador y método de cálculo.
- Conciliar los totales en hectáreas y porcentajes con la geometría oficial disponible, documentando diferencias por simplificación, proyección y redondeo.
- Distinguir tres fenómenos: **inundación, movimientos en masa y avenidas torrenciales**; separar cada nivel de amenaza y no confundir amenaza con condición de riesgo.
- Reproducir fielmente la nueva página 3 del piloto, sin perder la comparación normativa y el resto de páginas.
- Evitar que los datos particulares de Prados del Limonar se filtren a otras fichas barriales.
- Señalar explícitamente los resultados **exploratorios** y las limitaciones de los cruces con GeoJSON web simplificados.
- Probar la selección por mapa y por buscador, la descarga PDF y el caso de barrios sin intersecciones registradas.
- Generar y verificar un PDF de control para 1722 antes de proponer fusión a `main`.

## Política editorial

La propuesta POT 2026 no está adoptada. Una intersección cartográfica no es una certificación predial ni demuestra ausencia de amenaza. Los resultados por barrio no reemplazan estudios detallados o conceptos de autoridad competente.
