/*
  photos-config.js
  -----------------
  AQUI controlas las fotos de cada especie: la URL de la imagen, quien
  la tomo (credito) y el link a su fuente original (iNaturalist, Flickr,
  Wikimedia, el sitio del fotografo, etc).

  Este archivo es INDEPENDIENTE de data/mammals.json. Cuando actualices
  la lista de especies con convert_data.py, tus fotos NUNCA se borran,
  porque viven aca.

  COMO AGREGAR UNA FOTO:
  1. Busca el "id" de la especie. Es el nombre cientifico en minusculas
     con guiones. Ejemplo: "Panthera onca" -> "panthera-onca"
     (Si tienes dudas del id exacto de una especie, abre su ficha en la
     web: el id aparece en la URL, ej: ...#panthera-onca)
  2. Copia un bloque como el de ejemplo de abajo y pega tu informacion.
  3. Guarda el archivo, sube el cambio a GitHub (commit + push) y listo.

  CAMPOS:
  - url:        link directo a la imagen (debe terminar en .jpg, .png, etc,
                 o ser un link de un servicio que sirva la imagen directo)
  - credit:     texto del credito, ej: "Foto: Maria Perez" o "iNaturalist / CC BY-NC"
  - creditUrl:  a donde lleva el link del credito (perfil del autor,
                 pagina de la observacion, licencia, etc). Puede ir vacio: ""

  Si una especie NO esta en esta lista, la ficha muestra un silueta
  generica en vez de foto, sin que la pagina se rompa.
*/

window.PHOTOS = {

  "panthera-onca": {
    url: "https://commons.wikimedia.org/wiki/File:Jaguar_(Panthera_onca_palustris)_male_Rio_Negro_2.JPG",
    credit: "Foto: Charles J. Sharp / Wikimedia Commons",
    creditUrl: "https://www.inaturalist.org/taxa/41970-Panthera-onca/browse_photos?photo_license=cc0"
  },

  // Agrega tus especies aqui abajo, siguiendo el mismo formato:
  // "id-de-la-especie": {
  //   url: "",
  //   credit: "",
  //   creditUrl: ""
  // },

};
