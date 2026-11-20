# Informe de ejecución — Fase 2B · POT Cali

**Versión:** V6.3 de prueba, derivada de `POT_CALI_V6_2_PRUEBA_RAIZ_GITHUB.zip`.  
**Estado:** avance técnico verificable; **no publicar todavía como versión definitiva**.  
**Alcance:** ajustes controlados del comparador, leyendas y representación de solapamientos, sin reescribir los articulados ni sustituir GDB originales.

## Correcciones efectuadas

1. **Separación entre 2014 y 2026 en comparación:** se corrigieron reglas CSS posteriores que imponían fondo transparente al mapa de 2026, anulando el fondo opaco configurado desde JavaScript. La derecha ahora mantiene fondo opaco aun cuando las capas tienen rellenos parcialmente transparentes. Ambos mapas siguen sincronizados por centro y zoom y están contenidos dentro del mismo marco. La navegación usa el mapa izquierdo como control del movimiento.
2. **Controles comparativos por periodo:** durante el modo comparación solo se muestran las dos leyendas correspondientes a la temática elegida. Los filtros por categoría se mantienen independientes para cada periodo; las casillas de activación general quedan deshabilitadas en comparación para evitar que den la falsa impresión de poder alternar capas no comparables. Se conserva el estado de categorías después de reconstruir las leyendas.
3. **Etiquetas del divisor:** etiquetas de periodo se ocultan si no caben en la mitad asignada; controles se mantienen dentro del encuadre.
4. **Gráficos con datos superpuestos:** los efectos sísmicos 2014 se representan mediante hectáreas y porcentajes separados, **no con tortas excluyentes**. Para los tratamientos 2014 que registren nodos de equipamientos se aplica el mismo criterio de precaución. No se alteraron valores originales para forzar sumas a 100 %.
5. **Validación de leyendas:** se revisaron las 20 capas GeoJSON, su número de registros, las categorías y frecuencias frente a `leyendas.json`. Las 20 coincidieron. El inventario está en `AUDITORIA_CATEGORIAS_20_CAPAS.csv`.
6. **Verificación geométrica:** las 12 alertas de la Fase 1 muestran superposiciones reales en las geometrías del paquete (11 efectos sísmicos y 1 tratamientos históricos). El archivo `ALERTAS_SOLAPAMIENTOS_VERIFICADOS.csv` informa área de intersecciones, unión y superposición por barrio.

## Hallazgo geométrico representativo

- **Fepicol:** la categoría nodo de equipamientos está mayoritariamente dentro del polígono de consolidación C2; la superficie común mide aproximadamente **1,75 ha** según GeoJSON del paquete. No es admisible asignar las dos superficies a sectores disjuntos en un gráfico de torta.
- **Urbanización Calimio:** el área común entre susceptibilidad a licuación y corrimiento lateral es aproximadamente **8,12 ha**; pueden coexistir ambos fenómenos.

## Validaciones practicadas

- Sintaxis de `assets/app.js`: **correcta** (`node --check`).
- Categorías y frecuencias de 20 capas: **20/20 coinciden** con el archivo de leyendas.
- Las 12 alertas: **12/12 explicadas por superposición geométrica**, sin suprimir superficies.
- Diseño de encuadre en navegador Chromium, **solo HTML/CSS sin Leaflet activo**, a 1440 px y 390 px: **sin desplazamiento horizontal**, contenedor recortado, fondo 2026 opaco. Capturas locales `TEST_LAYOUT_1440.png`, `TEST_LAYOUT_390.png`.
- Pruebas de lógica DOM en Chromium (sin motor geográfico): 20 leyendas presentes; `Solo` mantiene una categoría, `Todas` restaura las 12, `Ninguna` deja cero; selector de índice adicional muestra **27 categorías**; controles en comparación limitados al par de años; divisor cambia a `25 %` y `75 %`; avisos por superposición funcionan. Resultados en `PRUEBAS_LOGICA_NAVEGADOR.json`.

## Restricciones y pendientes de aceptación

- **No se pudo efectuar la prueba interactiva real con Leaflet ni descargar teselas en el navegador automatizado:** el entorno bloquea el acceso a páginas locales y la descarga de los recursos remotos. Por lo tanto, el divisor, zoom, filtros en vivo y selección de barrio requieren prueba en la URL publicada o entorno donde Leaflet pueda cargarse. No se declaran *aprobados* hasta entonces.
- **Áreas de actividad 2014:** están resumidas por barrio, pero falta la geometría independiente en el paquete para realizar el cruce completo con 2026. No se calculó ni se publicó una cifra de "residencial → comercial".
- **Homologación normativa:** el paquete no equipara automáticamente tratamientos, áreas de actividad ni sus beneficios jurídicos. Las explicaciones artículo por artículo quedan para las Fases 3 y 4.
- **Edificabilidad 2026:** continúa sin datos geométricos válidos.
- **Microzonificación sísmica:** será tratada en la Fase 5 tras cotejar geometrías aproximadas con mapa y decreto.

## Pruebas de aceptación a ejecutar en navegador real

1. Abrir **Mapa territorial → Comparar 2014 / 2026 → Clasificación del suelo**; mover el deslizador 25 %, 50 % y 75 %. Ambas mitades deben permanecer en la misma coordenada y la mitad derecha no debe dejar ver ningún polígono del periodo izquierdo.
2. Cambiar a **Tratamientos**, verificar la presencia de todas las categorías diferenciadas y el funcionamiento de *Solo*, *Ninguna*, *Todas*, tanto para 2014 como para 2026, sin que cambie el encuadre.
3. Cambiar a **Planes parciales** y verificar igualmente ambos periodos, teniendo presente que los estados de ambos instrumentos no son jurídicamente equivalentes.
4. Seleccionar un barrio, realizar zoom, arrastrar el mapa, cambiar de temática y regresar a **Explorar capas**. La selección dorada debe permanecer alineada.
5. En móvil, comprobar que el mapa no tape leyendas y que no aparezca desplazamiento horizontal.
6. En la ficha de Fepicol, confirmar que la gráfica de tratamientos 2014 se sustituye por la explicación y lista de áreas superpuestas.

**Decisión:** versión disponible para pruebas y revisión, **no autoriza aún reemplazar el sitio público**.
