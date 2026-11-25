# Ficha territorial ciudadana · plantilla de tres páginas (rama de validación)

Esta plantilla sustituye el PDF extenso anterior por la estructura compacta del piloto de Prados del Limonar (1722). **Los datos proceden de la selección actual del barrio**; no se trasladan al resto de la ciudad valores del piloto.

## 01 · Entiende el cambio
- Identificación de barrio, comuna y extensión geográfica.
- Transición mayoritaria entre tratamientos 2014 y propuesta 2026, hectáreas y porcentaje.
- Distribuciones de tratamientos 2014 y 2026.
- Precaución: un tratamiento diferente no equivale a más derechos edificatorios.

## 02 · Cómo se transforma
- Áreas de actividad 2014 y propuesta 2026.
- Instrumentos aplicables por familia de tratamientos presentes: renovación, desarrollo y consolidación; evitar declarar instrumentos aprobados o asignar beneficios automáticamente.
- Obligaciones y verificaciones: cesiones, redes, cargas, protección de moradores, condiciones normativas.

## 03 · Amenazas y características del suelo
- Inundación, movimientos en masa y avenidas torrenciales, con mapa independiente, niveles de amenaza, hectáreas, porcentajes y total por fenómeno disuelto geométricamente.
- Condición de riesgo como capa diferente.
- Microzonificación sísmica como respuesta local del suelo; zona predominante y participación en el barrio.
- Metodología exploratoria GeoJSON web simplificados, sin equiparar no intersección a no amenaza.

## Referentes recuperados
- `Piloto_1722_microzona_4D_explicada_amenaza_pendiente.pdf`: tres páginas, con títulos “Entiende el cambio”, “Cómo se transforma” y “Amenazas y características del suelo”.
- `Ficha_Territorial_Prados_del_Limonar_Observatorio_Analisis_Espacial_v3.pdf`: matriz de comparación más extensa (cinco páginas), usada como fuente de requisitos.
- Según la conversación de cierre del 25 de noviembre: `Piloto_1722_amenazas_cuantificadas_revision.pdf` es la revisión posterior; su PDF exacto no pudo abrirse desde el almacenamiento disponible, por lo que **no se afirma correspondencia visual píxel a píxel**.

## Controles pendientes
1. Comparación visual con la última revisión de tres páginas.
2. Prueba de descarga en navegador y revisión de desbordes de texto.
3. Recalcular áreas con GDB originales proyectadas y documentar solapamientos.
4. Evaluar barrios con tres fenómenos, múltiples clases, geometrías inválidas y cero coincidencias.
5. Verificar que la distribución de áreas de actividad, instrumentos e incentivos es correcta para cada sector.
6. Revisar la sección de gestión con articulado oficial: las descripciones del generador son orientativas, no certificaciones.
7. No fusionar a `main` hasta completar estas pruebas.

La ficha no incorpora “Tres preguntas para el debate ciudadano”.
