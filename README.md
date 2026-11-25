# Cali: ¿Qué cambia en mi territorio? — Versión 6

Observatorio ciudadano estático y gratuito para comparar las capas cartográficas del **POT 2014 vigente (Acuerdo 0373 de 2014)** y la **propuesta de POT 2026**, aún no aprobada.

## Funciones

- **Inicio:** estadísticas derivadas de ambas geodatabases (urbano, expansión, incorporación y exclusión del perímetro), dos **mapas cartográficos comparativos 2014/2026** con idéntica proyección, extensión y escala, y preguntas sobre el modelo territorial. En móvil, los mapas se apilan verticalmente para conservar legibilidad.
- **Mapa:** 342 barrios y sectores con búsqueda, barrio seleccionado resaltado, categorías coloreadas y filtros por capa. Comparación de clasificación del suelo, tratamientos o planes parciales mediante ventana corrediza.
- **Comparación normativa:** fichas amplias por barrio para clasificación, tratamientos, áreas de actividad, edificabilidad y planes parciales; porcentajes y diagramas de torta. Se diferencian cambios espaciales de efectos normativos pendientes de validar.
- **Gestión e incentivos:** condiciones generales verificadas de planes parciales, actuaciones, cargas, incentivos y preguntas sobre protección a moradores. No se calculan rentabilidades.
- **Riesgo y hábitat:** condiciones de riesgo cartografiadas, inundación y sísmica; la zona de microzonificación sísmica de cada barrio permanece sin asignar hasta incorporar el mapa vectorial oficial del Decreto 411.0.20.0158 de 2014.

## Medidas para evitar solapamientos y errores de mapa

- Los mapas de la portada son **imágenes locales independientes de Leaflet**, confinadas a tarjetas con dimensiones responsivas; no utilizan teselas ni capas flotantes.
- Los mapas 2014 y 2026 se trazaron en MAGNA-SIRGAS / Origen Nacional y comparten extensión y escala; los cambios pueden compararse sin desplazamiento entre fuentes.
- El mapa interactivo tiene contenedor propio, con recorte (`overflow:hidden`), aislamiento de apilamiento y controles internos. Las referencias se muestran fuera del lienzo y no lo atraviesan.
- El barrio seleccionado conserva relleno dorado, borde destacado y `fitBounds` con límite de zoom. La ventana corrediza sincroniza posición y zoom del lado 2014 y 2026.
- Se verificó de manera estática la ausencia de desplazamiento horizontal y solapamiento entre columnas en anchos de **390, 1.024 y 1.440 píxeles**. La validación completa del mapa real de Leaflet requiere abrir la página publicada porque el navegador de pruebas de este entorno bloquea las páginas locales.

## Publicación gratuita en GitHub Pages

1. Descarga y descomprime el ZIP. Abre la carpeta extraída y **selecciona todos sus archivos y subcarpetas**.
2. En tu repositorio público GitHub, en **Code**, selecciona **Add file → Upload files**. Sube todos los archivos y confirma **Commit changes**. `index.html` debe quedar en la raíz, no en una carpeta extra.
3. En **Settings → Pages**, selecciona **Deploy from a branch**, rama `main`, carpeta `/ (root)` y pulsa **Save** (solo si aún no está activado).
4. Abre la URL de GitHub Pages. Fuerza la recarga con `Ctrl + Shift + R`.

El sitio no requiere compilación, cuenta de nube, backend, base de datos de servidor ni suscripción. Leaflet se distribuye desde un CDN y las teselas de fondo se cargan desde OpenStreetMap, por lo que la visualización del mapa base **sí requiere conexión a internet y disponibilidad de esos servicios externos**. Los datos geográficos y normativos del análisis residen en `data/` del propio sitio.

> **Condiciones de publicación de datos:** confirma los derechos de redistribución de las geodatabases y datos geográficos antes de publicar el repositorio. La disponibilidad en Drive no acredita, por sí sola, una licencia abierta.

## Datos incluidos

- `data/clasificacion2014.geojson`: límites urbano y expansión 2014 derivados directamente de la GDB vigente; suelo rural obtenido por diferencia con el límite municipal 2014 (documentado como inferencia geométrica).
- `data/clasificacion.geojson`: propuesta 2026; `data/cambio_perimetro2026.geojson`: 96 polígonos de incorporación, exclusión y conservación del perímetro urbano.
- `data/comparacion_suelo_2014_2026.json`: indicadores territoriales calculados a partir de **geometrías originales**, no simplificadas.
- `data/resumen_barrios.json`: cruces cartográficos por 342 barrios para 2014 y 2026, incluidos tratamientos, áreas de actividad y clasificación del suelo.
- Otras capas GeoJSON en `data/`, y matrices verificadas `MATRIZ_REGLAS_GESTION.csv`, `MATRIZ_HOMOLOGACION_TRATAMIENTOS.csv`.

## Actualización de indicadores

Los scripts en `scripts/` documentan cómo procesar los datos. Para reproducir la clasificación se requiere disponer **en el computador** de las GDB originales y tener `geopandas`, `pyproj` y `shapely` instalados; especifica sus rutas mediante las variables de entorno `POT2014_GDB` y `POT2026_GDB`. **Las geodatabases completas no forman parte del ZIP**, para mantenerlo ligero y respetar sus condiciones de distribución.

## Alcance y limitaciones

- La GDB denominada POT 2014 disponible en este proyecto incluye actualizaciones cartográficas posteriores a 2014. No representa necesariamente una copia inmutable de diciembre de 2014.
- El POT 2026 está en estudio: **no se deben presentar sus disposiciones como normas vigentes**.
- El archivo de edificabilidad aportado para 2026 contenía 0 registros; por tanto, no se atribuyen incrementos de índices a barrios.
- La cartografía de microzonificación sísmica adoptada por el Decreto 411.0.20.0158 de 2014 todavía no está incorporada; la capa genérica de efectos sísmicos **no permite asignar zonas de respuesta sísmica por barrio**.
- Los cruces cartográficos no prueban automáticamente la eliminación de la obligación de un plan parcial, ni el derecho a un incentivo o una exención tributaria. Deben consultarse articulados, procedimientos, regímenes transitorios y normas tributarias.
- No se identifican propietarios particulares, ganancias económicas o valores de plusvalía.

Para las fuentes y cautelas de medición: [Metodología](METODOLOGIA_COMPARACION.md).


### Versión 6.1
Corrección de la ventana corrediza, inventario categorizado y filtros individuales; instrucciones en `INSTRUCCIONES_ACTUALIZACION_V6_1.md`.


### Fichas barriales, versión 4.0 (25 de noviembre de 2026)
El generador de PDF usa cuatro páginas para cada uno de los barrios y sectores: tratamientos comparados, áreas de actividad e instrumentos por tratamiento, amenazas cuantificadas, y condición de riesgo y microzonificación aproximada. Las 342 descargas se verificaron mediante GitHub Actions. Los cruces SIG no constituyen certificaciones prediales.
