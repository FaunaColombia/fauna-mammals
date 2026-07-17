# Fauna — Catálogo Mundial de Mamíferos

Sitio estático (para GitHub Pages) que muestra las **6,872 especies de
mamíferos del mundo**, con filtros por continente, país y taxonomía
(orden, familia, género), ficha individual por especie y mapa de
distribución.

## Estructura del proyecto — qué es cada cosa

```
fauna-mammals/
├── index.html              → La página. Estructura de todo: encabezado,
│                              filtros, grilla de tarjetas y la ficha
│                              (modal) que aparece al hacer click.
├── css/
│   └── style.css           → Toda la apariencia visual (colores,
│                              tipografías, tamaños). No tiene lógica.
├── js/
│   ├── config.js            → AQUÍ EDITAS: el link de tu botón de
│   │                           donaciones y el nombre del sitio.
│   ├── photos-config.js     → AQUÍ EDITAS: las fotos de cada especie
│   │                           (url, crédito, link del crédito).
│   └── app.js                → La lógica: carga los datos, arma los
│                                filtros, dibuja las tarjetas, abre la
│                                ficha y dibuja el mapa. No necesitas
│                                tocarlo para el uso normal.
├── data/
│   └── mammals.json          → Los datos de las 6,872 especies, ya
│                                procesados y listos para la web.
│                                NO se edita a mano.
└── scripts/
    └── convert_data.py       → Script en Python que genera
                                 data/mammals.json a partir de tu Excel
                                 (MDD). Lo vuelves a correr solo cuando
                                 tengas una versión nueva del Excel.
```

## Cómo hacer cada tarea que pediste

### Agregar o cambiar una foto de una especie
Edita `js/photos-config.js`. Cada especie tiene un "id" (nombre
científico en minúsculas con guiones, ej. `panthera-onca`). Ahí pones:
- `url`: el link directo a la imagen
- `credit`: el texto del crédito (ej. "Foto: Juan Pérez")
- `creditUrl`: a dónde lleva el crédito (perfil del fotógrafo, la
  fuente original, la licencia, etc.)

Si una especie no tiene foto ahí, la ficha muestra una silueta
genérica — la página nunca se rompe por falta de una foto.

### Actualizar la lista de especies (si sale una versión nueva del Excel)
1. Pon el Excel nuevo dentro de la carpeta `scripts/`
2. Corre: `python3 convert_data.py nombre_del_archivo.xlsx`
3. Esto reescribe `data/mammals.json`. Tus fotos en
   `photos-config.js` **no se pierden**, porque viven en un archivo
   aparte.

### Cambiar el botón de donaciones
Edita `js/config.js` → cambia `donationUrl` por tu link real (PayPal.me,
Ko-fi, etc.) y `donationLabel` si quieres otro texto en el botón.

### Filtros
Ya funcionan solos, se generan automáticamente desde los datos:
**Continente, País, Orden, Familia, Género**, más un buscador de texto
libre (nombre común o científico). Los filtros están "en cascada": si
eliges un Orden, el menú de Familia solo muestra las familias de ese
orden.

### Ficha de cada especie
Al hacer click en una tarjeta se abre con: nombre común, nombre
científico (en cursiva, como manda la convención taxonómica), autor y
año de descripción, taxonomía completa (orden/familia/género/especie),
estado de conservación UICN con su color, lista de países y
continentes de distribución, y el mapa.

### Mapa
Usa una librería externa (Leaflet) y un mapa mundial de países que se
cargan directamente en el navegador de quien visite la página — no
necesitas subir ningún archivo de mapas tú. Resalta en color los
países donde vive cada especie, según el dato de distribución del
Excel. Es aproximado (no son los límites exactos del área de la
especie, sino los países completos donde se ha registrado).

## Publicarlo en GitHub Pages

1. Abre **GitHub Desktop** → **File → New Repository**
2. Nombre: el que quieras (ej. `fauna-mammals`), y elige como ubicación
   una carpeta vacía
3. Copia **todo el contenido** de esta carpeta dentro de la carpeta que
   creó GitHub Desktop
4. En GitHub Desktop: escribe un mensaje de commit (ej. "Primera
   versión") → **Commit to main** → **Publish repository** (verifica
   que NO esté marcado "Keep this code private")
5. En GitHub.com, dentro del repositorio: **Settings → Pages → Source:
   Deploy from a branch → Branch: main / (root) → Save**
6. Espera 1-2 minutos y tu sitio va a estar en:
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`

## Notas
- Los datos taxonómicos vienen de la Mammal Diversity Database (MDD).
- El archivo `data/mammals.json` pesa ~2.7 MB — es normal, GitHub
  Pages lo sirve sin problema.
