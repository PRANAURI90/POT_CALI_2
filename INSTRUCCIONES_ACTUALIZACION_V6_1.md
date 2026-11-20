# Versión 6.1 — corrección comparador y leyendas

## Qué cambia

- Se despliegan categorías para todas las capas cartográficas de 2014 y 2026, con colores específicos, filtros individuales, selector «Solo», «Todas» y «Ninguna».
- La edificabilidad de 2014 permite escoger ICB o ICA. La capa 2026 de edificabilidad continúa pendiente.
- El comparador funciona con **un solo mapa base** y dos conjuntos normativos (2014 izquierda, 2026 derecha); el segundo mapa técnico es transparente e inerte, sin teselas ni captura de gestos.
- El control de posición ahora recorta solo la cartografía de 2026; la de 2014 permanece visible debajo.
- El cambio de tema cancela cargas anteriores que aún estuvieran pendientes.
- No se ha modificado la geometría ni el cálculo de porcentajes por barrio.

## Publicar en GitHub Pages

Sube a tu repositorio y confirma: `index.html`, `assets/app.js`, `assets/styles.css` y **el archivo nuevo** `data/leyendas.json`. Mantén sin cambios el resto de la carpeta `data`.

En GitHub Pages, recarga con `Ctrl+Shift+R` y comprueba: clasificación 2014/2026, tratamientos 2014/2026, planes parciales 2014/2026; en cada opción, mueve el deslizador y el mapa con el ratón.

## Precisión

Los filtros corresponden a **categorías cartográficas disponibles en los datos**. No se ha inferido ninguna equivalencia jurídica entre códigos ni que un instrumento sea automáticamente exigible o esté exonerado. Las categorías que solo vienen codificadas se muestran con su código y quedan pendientes de homologación.
