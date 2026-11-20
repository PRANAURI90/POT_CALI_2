# Avance controlado — V6.2 de prueba (NO publicar sin revisión)

## Alcance ejecutado

- Se conserva como línea base el ZIP íntegro de V6.1 y se construye un directorio nuevo V6.2, sin cambiar la versión pública.
- Comparador: la vista 2026 recupera un fondo cartográfico propio y opaco, evitando ver 2014 por transparencia de los polígonos. Se conservan las dos vistas Leaflet sincronizadas, pero se requiere prueba presencial en GitHub Pages; no se declara resuelta la sincronía.
- Portada: comparador estático de perímetro/expansión más compacto, manteniendo escala y extensión comunes de los mapas.
- Portada: gráfico comparativo de familias de tratamientos 2014 y 2026, desagregación de áreas de actividad propuestas 2026 y tabla de transiciones cartográficas principales.
- Portada: los cuatro indicadores principales ahora incluyen renovación incorporada y suelo que deja de estar clasificado como renovación, reduciendo la redundancia del perímetro.
- Se documenta explícitamente la falta de información suficiente para calcular transiciones «residencial a comercial» y que una categoría de actividad no implica autorización automática de un uso.

## Limitaciones y restricciones de publicación

1. **Los gráficos nuevos de tratamientos son aproximaciones** calculadas sobre los GeoJSON simplificados para visualización. Sus áreas NO reemplazan las cifras de precisión de las GDB originales y están marcados como tales. La proporción graficada es respecto al total de categorías geométricas registradas en cada periodo, y puede incluir superficies superpuestas. Validar topología, categorías originales y superficies antes de usarlos como cifras oficiales.
2. El análisis de usos 2014 no dispone de una capa GeoJSON general en la V6.1, aunque sí constan registros en resúmenes por barrio. No se puede cuantificar el flujo «residencial a comercial» con esos agregados: requiere la intersección de los polígonos 2014 con 2026 y contrastar los artículos y tablas de usos.
3. El comparador todavía no fue probado integralmente en el navegador de GitHub Pages. El entorno local bloquea pruebas con HTTP local y Chromium. No declarar una reparación definitiva.
4. Se mantienen abiertos los 12 casos advertidos de sumas de porcentajes >101 %; no sumar categorías superpuestas como porciones de una torta.
5. Edificabilidad 2026 pendiente de archivo con registros. Microzonificación digitalizada aproximada pendiente de validación frente al Decreto 411.0.20.0158 de 2014 y mapa RS2.
6. El contraste normativo completo de usos/tratamientos y la sección Gestión e incentivos son fases posteriores; no atribuirles aprobación en esta entrega.

## Pruebas aplicadas

- `node --check assets/app.js` aprobado.
- Se confirmó que los JSON nuevos contienen las categorías y transiciones y que todos los archivos vinculados se encuentran en el paquete.
- Las pruebas visuales/interactivas con Chromium en HTTP local resultaron **bloqueadas por el entorno**. Deben realizarse en la vista de prueba publicada o en un entorno con acceso local.

## Criterios para continuar

1. Confirmar 2014/2026 visibles sin transparencia indeseada en el comparador y sin desplazamiento al arrastrar.
2. Auditar categorías y su geometría; reparar 12 alertas.
3. Calcular matriz de áreas de actividad 2014→2026 desde GDB originales con homologación normativa explícita.
4. Incorporar fichas artículo→interpretación por transición y separar los instrumentos de Gestión e incentivos.
5. Evaluar cartografía sísmica con los tres documentos nuevos, separando legalidad y precisión geográfica.
