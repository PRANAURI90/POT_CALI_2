# OBSERVATORIO POT CALI — V7.0 BETA · consolidación integral

**Fecha:** 19 de noviembre de 2026. **Estado:** versión local DE PRUEBA; no sustituye al sitio publicado.

## Resultados incorporados

1. **Mapa de áreas de actividad 2014:** capa `data/areas_actividad2014.geojson` reconstruida de `nur_areas_actividad`, con cinco categorías (residencial neta, residencial predominante, mixta, industrial y no aplica). Se incorpora a la lista de capas.
2. **Comparador de usos:** nueva opción 'Áreas de actividad · 2014/2026' con recorte del lado derecho y fondos independientes. **Pendiente prueba de Leaflet real en GitHub Pages**.
3. **Transiciones por barrio y distritales:** `data/transiciones_actividad_v7.json` con 28 categorías de transición y 342 barrios/sectores con cruces. Incluye texto de cautela para categorías 'No aplica' y solapamientos.
4. **Portada:** panel adicional con barras, cruces prioritarios e indicadores de cobertura común / sin cobertura. Mapas de clasificación ya son compactos desde V6.2.
5. **Comparación normativa de usos:** selector de transición y definición concreta según Acuerdo 0373/2014, arts. 287–292 y Proyecto de Acuerdo, arts. 360–362. **No** se atribuyen autorizaciones comerciales sin matrices de actividades específicas.
6. **Tratamientos:** 21 entradas de ficha con fuente de articulado, incluyendo distinción R1 2014 vs. R1 2026 y C4 propuesto. La vinculación por barrio es indicativa; requiere cotejo de condiciones especiales.
7. **Edificabilidad:** explicación normativa de ICB, ICT e ICA de 2014, fórmula ejemplificativa, y advertencia sobre archivo 2026 sin registros. Se cita Acuerdo 0373/2014 arts. 344–347.
8. **Gestión e incentivos:** módulo separado de derechos de aprovechamiento, aportes, cargas, instrumentos y moradores, como preguntas de control distributivo. **Pendiente auditoría exhaustiva artículo por artículo** antes de calificar incentivos específicos.
9. **Riesgo y hábitat:** capa de 10 microzonas recuperada de digitalización APROXIMADA del MZSC-RS2, mapa ilustrativo y cálculo de intersecciones para 339 barrios. Análisis TREQ–GEM (2022) identificado por fecha y contexto de su modelo.
10. **Separación conceptual:** prohibiciones de usos en Comparación normativa; cesiones e incentivos en Gestión e incentivos; amenaza, exposición, vulnerabilidad y construcción en Riesgo y hábitat.

## Control del análisis de áreas de actividad

- Geometrías fuente: 2014 = 21,037 polígonos; 2026 = 624 polígonos.
- Superficie común = 10,035.719 ha.
- 2026 fuera de cobertura de la capa 2014 = 4,937.454 ha.
- Suma bruta de intersecciones = 10,042.918 ha (exceso por posibles solapamientos = 7.199 ha).
- Geodatabase de 2014 incluye ajustes realizados hasta 2026; comparación temporal **no es una foto histórica original de 2014**.
- GeoJSON 2026 simplificado; para resultados oficiales reejecutar con GDB original 2026.
- Un cambio de categoría cartográfica no demuestra cambio a comercial ni aumento de aprovechamientos.

## Estado de pruebas

- [x] Sintaxis JavaScript `node --check`.
- [x] JSON y GeoJSON parseables: 34 archivos comprobados.
- [x] Composición de secciones en navegador Chromium 1440 px y 390 px mediante carga local en memoria; sin errores JS ni desbordamiento horizontal.
- [x] Estado barrio seleccionado simulado (Terrón Colorado) en normativas y riesgo; renderiza sin errores.
- [x] Verificación de cobertura de microzonas y porcentajes <=100 % (digitalización aproximada).
- [ ] Prueba real de Leaflet, teselas OSM y sincronización del comparador en GitHub Pages (bloqueo de navegación local).
- [ ] Verificación de todas las actividades concretas permitidas/prohibidas/condicionadas en matrices de ambos POT.
- [ ] Geometría original 2026 en análisis de transición y cartografía oficial vectorial de microzonas.
- [ ] Archivo válido con atributos de edificabilidad 2026.
- [ ] Verificación normativa y financiera exhaustiva de cada incentivo y obligaciones por instrumento, incluida protección a moradores.

## Instrucciones para prueba sin reemplazar el sitio público

1. Crear una **rama `v7-beta`** o repositorio GitHub Pages independiente; NO sustituir `main` del sitio actual.
2. Descomprimir este ZIP y subir **su contenido** a la raíz de la rama/sitio de prueba (incluye `index.html`, `assets/`, `data/`, y archivos `.md`).
3. Abrir `Mapa territorial` → seleccionar modo Comparar → tema `Áreas de actividad` → mover deslizador a 25, 50 y 75 %, comprobar que cada lado muestre solo su periodo y que zoom, recorte y etiquetas no se mezclen.
4. Cambiar entre tratamientos, clasificación y planes parciales; probar categorías, encuadre del barrio y escala en móvil.
5. Activar en el panel `Microzonas sísmicas (aproximadas)`; el resultado se debe identificar expresamente como orientativo.
6. Abrir `Comparación normativa`, elegir un barrio y cambiar el selector de transición; confirmar que las explicaciones y cifras se actualizan.
7. Volver a la versión pública vigente sin publicar esta beta si cualquiera de las pruebas anteriores falla.

## Archivos nuevos principales

- `data/areas_actividad2014.geojson`
- `data/transiciones_actividad_v7.json`
- `data/lectura_normativa_usos_v7.json`
- `data/lectura_tratamientos_v7.json`
- `data/microzonas_aproximadas.geojson`
- `data/microzonas_por_barrio_APROXIMADAS.json`
- `assets/microzonas_aproximadas_v7.png`
- Actualizaciones en `index.html`, `assets/app.js`, `assets/styles.css`.

### Fuentes

- Concejo de Cali, Acuerdo 0373 de 2014, arts. 287–292, 344–347 y otros tratamientos pertinentes.
- Proyecto de Acuerdo POT 2026, arts. 360–362 y 370 y siguientes (documento de 722 páginas compartido).
- Instituto Colombiano de Geología y Minería–DAGMA, mapa MZSC-RS2 (2005); Decreto municipal 411.0.20.0158 de 2014.
- Fundación GEM, TREQ, Evaluación del riesgo sísmico para Santiago de Cali, reporte D2.6.2 (junio 2022).
- GDB POT 2014 actualizada; GDB propuesta 2026; matrices geográficas previamente elaboradas en Fases 2B–3C.
