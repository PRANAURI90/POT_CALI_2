# Actualización a versión 5

## Opción fácil: subir el ZIP completo extraído

1. Descargar el ZIP y descomprimirlo.
2. Abrir en GitHub el repositorio del observatorio.
3. Subir **todo el contenido** de la carpeta descomprimida, sin incluir la carpeta externa ni el ZIP.
4. Confirmar con **Commit changes**.
5. Abrir GitHub Pages y presionar **Ctrl + Shift + R**.

## Opción rápida: solo los archivos que cambiaron

- `index.html` (raíz).
- `assets/app.js` (dentro de `assets`).
- `assets/styles.css` (dentro de `assets`).

En GitHub, si no permite sobrescribir el archivo desde *Upload files*, abrir el archivo existente, elegir editar o eliminar y luego subir el nuevo a la **misma ruta**. Mantener intacta la carpeta `data/`.

## Qué debes comprobar

- No se superponen los paneles.
- La franja horizontal de fuente ya no atraviesa la vista.
- El mapa inicia centrado en la ciudad de Cali.
- Al buscar un barrio o hacer clic, el mapa centra y acerca ese barrio.
- El barrio destaca con relleno dorado y borde oscuro.
- Existe pestaña de comparación 2014/2026 con datos intactos.
- En el panel izquierdo aparecen grupos desplegables separados por año y tema.
- Se pueden ocultar los límites de barrios para seleccionar un polígono normativo debajo.
