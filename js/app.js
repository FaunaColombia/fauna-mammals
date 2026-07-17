/*
  app.js
  ------
  Logica de la pagina. No necesitas editar este archivo para uso normal:
  para cambiar fotos usa js/photos-config.js, y para el link de donaciones
  usa js/config.js.

  Que hace cada parte (buscalo por el titulo en mayusculas):
  - CARGA DE DATOS: trae data/mammals.json (las 6872 especies).
  - FILTROS: llena los menus desplegables (continente, pais, orden,
    familia, genero) y los mantiene "en cascada" (si eliges un Orden,
    el menu de Familia solo muestra las familias de ese orden).
  - RENDER DE TARJETAS: dibuja las tarjetas en pantalla, con paginacion
    (60 a la vez) para que la pagina no se ponga lenta con miles de
    especies.
  - FICHA (MODAL): arma la ficha completa de una especie al hacer click:
    foto + credito (leidos de photos-config.js), taxonomia, estado de
    conservacion UICN, distribucion y el mapa.
  - MAPA: usa Leaflet + un mapa mundial de paises (cargado desde una
    libreria externa) y resalta los paises donde vive la especie.
*/

const IUCN_LABELS = {
  EX: "Extinta", EW: "Extinta en estado silvestre", CR: "En peligro crítico",
  EN: "En peligro", VU: "Vulnerable", NT: "Casi amenazada",
  LC: "Preocupación menor", DD: "Datos insuficientes", NE: "No evaluada"
};
const IUCN_COLOR_VAR = {
  EX: "--iucn-ex", EW: "--iucn-ew", CR: "--iucn-cr", EN: "--iucn-en",
  VU: "--iucn-vu", NT: "--iucn-nt", LC: "--iucn-lc", DD: "--iucn-dd", NE: "--iucn-ne"
};

// Nombres del geojson mundial que no coinciden textualmente con el
// nombre de pais que usa la base de datos de mamiferos (MDD).
// clave = como aparece en MDD, valor = como aparece en el mapa.
const COUNTRY_NAME_MAP = {
  "United States": "United States of America",
  "Russia": "Russia",
  "Democratic Republic of the Congo": "Democratic Republic of the Congo",
  "Republic of Congo": "Republic of the Congo",
  "Ivory Coast": "Ivory Coast",
  "Czech Republic": "Czechia",
  "North Macedonia": "Macedonia",
  "Eswatini": "Swaziland",
  "Myanmar": "Myanmar",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "United Kingdom": "United Kingdom",
  "Timor-Leste": "East Timor",
  "Cabo Verde": "Cape Verde",
  "Micronesia": "Federated States of Micronesia"
};

let ALL_SPECIES = [];
let FILTERED = [];
let PAGE_SIZE = 60;
let shown = 0;

let worldGeoJson = null;
let leafletMap = null;
let countryLayer = null;

const els = {
  grid: document.getElementById("grid"),
  empty: document.getElementById("emptyState"),
  loadMoreWrap: document.getElementById("loadMoreWrap"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  resultCount: document.getElementById("resultCount"),
  search: document.getElementById("searchInput"),
  fContinent: document.getElementById("fContinent"),
  fCountry: document.getElementById("fCountry"),
  fOrder: document.getElementById("fOrder"),
  fFamily: document.getElementById("fFamily"),
  fGenus: document.getElementById("fGenus"),
  clearBtn: document.getElementById("clearFilters"),
  emptyClear: document.getElementById("emptyClear"),
};

// ---------------- CARGA DE DATOS ----------------
fetch("data/mammals.json")
  .then(r => r.json())
  .then(data => {
    ALL_SPECIES = data;
    setupDonationButton();
    buildFilterOptions(ALL_SPECIES, { continent: true, country: true, order: true, family: true, genus: true });
    applyFilters();
  })
  .catch(err => {
    els.grid.innerHTML = `<p style="color:var(--paper-dim)">No se pudo cargar data/mammals.json. Verifica que el archivo exista en la carpeta /data.</p>`;
    console.error(err);
  });

function setupDonationButton(){
  const cfg = window.SITE_CONFIG || {};
  const btn = document.getElementById("donationBtn");
  if (!cfg.showDonationButton) { btn.style.display = "none"; return; }
  btn.href = cfg.donationUrl || "#";
  document.getElementById("donationLabel").textContent = cfg.donationLabel || "Apoyar el proyecto";
  document.title = cfg.siteName || document.title;
}

// ---------------- FILTROS ----------------
function currentFilters(){
  return {
    continent: els.fContinent.value,
    country: els.fCountry.value,
    order: els.fOrder.value,
    family: els.fFamily.value,
    genus: els.fGenus.value,
    q: els.search.value.trim().toLowerCase()
  };
}

function matchesSpecies(sp, f){
  if (f.continent && !sp.continents.includes(f.continent)) return false;
  if (f.country && !sp.countries.includes(f.country)) return false;
  if (f.order && sp.order !== f.order) return false;
  if (f.family && sp.family !== f.family) return false;
  if (f.genus && sp.genus !== f.genus) return false;
  if (f.q){
    const hay = (sp.commonName + " " + sp.sciName).toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function fillSelect(select, values, placeholder){
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    select.appendChild(opt);
  });
  if (values.includes(current)) select.value = current;
}

function buildFilterOptions(pool){
  const continents = new Set(), countries = new Set(), orders = new Set(), families = new Set(), genera = new Set();
  pool.forEach(sp => {
    sp.continents.forEach(c => continents.add(c));
    sp.countries.forEach(c => countries.add(c));
    if (sp.order) orders.add(sp.order);
    if (sp.family) families.add(sp.family);
    if (sp.genus) genera.add(sp.genus);
  });
  fillSelect(els.fContinent, [...continents].sort(), "Todos");
  fillSelect(els.fCountry, [...countries].sort(), "Todos");
  fillSelect(els.fOrder, [...orders].sort(), "Todos");
  fillSelect(els.fFamily, [...families].sort(), "Todas");
  fillSelect(els.fGenus, [...genera].sort(), "Todos");
}

// Cascada: los sub-filtros (pais dentro de continente, familia dentro
// de orden, genero dentro de familia) se recalculan segun lo ya elegido.
function refreshCascadingOptions(){
  const f = currentFilters();

  const poolForCountry = ALL_SPECIES.filter(sp => !f.continent || sp.continents.includes(f.continent));
  fillSelect(els.fCountry, [...new Set(poolForCountry.flatMap(sp => sp.countries))].sort(), "Todos");

  const poolForFamily = ALL_SPECIES.filter(sp => !f.order || sp.order === f.order);
  fillSelect(els.fFamily, [...new Set(poolForFamily.map(sp => sp.family).filter(Boolean))].sort(), "Todas");

  const poolForGenus = ALL_SPECIES.filter(sp =>
    (!f.order || sp.order === f.order) && (!f.family || sp.family === f.family)
  );
  fillSelect(els.fGenus, [...new Set(poolForGenus.map(sp => sp.genus).filter(Boolean))].sort(), "Todos");
}

function applyFilters(){
  refreshCascadingOptions();
  const f = currentFilters();
  FILTERED = ALL_SPECIES.filter(sp => matchesSpecies(sp, f));
  shown = 0;
  els.grid.innerHTML = "";
  renderNextPage();
  els.resultCount.textContent = `${FILTERED.length.toLocaleString("es")} especie${FILTERED.length===1?"":"s"}`;
  els.empty.hidden = FILTERED.length !== 0;
}

[els.fContinent, els.fCountry, els.fOrder, els.fFamily, els.fGenus].forEach(sel => {
  sel.addEventListener("change", applyFilters);
});
let searchDebounce;
els.search.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(applyFilters, 200);
});
function clearAll(){
  [els.fContinent, els.fCountry, els.fOrder, els.fFamily, els.fGenus].forEach(s => s.value = "");
  els.search.value = "";
  applyFilters();
}
els.clearBtn.addEventListener("click", clearAll);
els.emptyClear.addEventListener("click", clearAll);

// ---------------- RENDER DE TARJETAS ----------------
function renderNextPage(){
  const slice = FILTERED.slice(shown, shown + PAGE_SIZE);
  slice.forEach(sp => els.grid.appendChild(buildCard(sp)));
  shown += slice.length;
  els.loadMoreWrap.hidden = shown >= FILTERED.length;
}
els.loadMoreBtn.addEventListener("click", renderNextPage);

function buildCard(sp){
  const card = document.createElement("button");
  card.className = "card";
  card.setAttribute("aria-label", `Ver ficha de ${sp.commonName || sp.sciName}`);

  const photo = window.PHOTOS && window.PHOTOS[sp.id];
  const media = document.createElement("div");
  media.className = "card-media";
  if (photo && photo.url){
    const img = document.createElement("img");
    img.src = photo.url; img.alt = sp.commonName || sp.sciName; img.loading = "lazy";
    media.appendChild(img);
  } else {
    media.innerHTML = `<svg viewBox="0 0 48 48" width="34" height="34"><path d="M6 30 Q4 18 14 12 Q22 7 30 12 Q40 17 42 28 Q43 34 38 36 Q34 24 26 21 Q29 30 24 36 Q18 42 10 38 Q5 35 6 30 Z" fill="currentColor"/></svg>`;
  }

  const body = document.createElement("div");
  body.className = "card-body";
  const iucn = normalizeIucn(sp.iucnStatus);
  body.innerHTML = `
    <span class="card-common">${sp.commonName || "(sin nombre común)"}</span>
    <span class="card-sci">${sp.sciName}</span>
    <span class="card-order">${sp.order}</span>
    <span class="iucn-chip" style="background:var(${IUCN_COLOR_VAR[iucn] || "--iucn-ne"})">${iucn}</span>
  `;

  card.appendChild(media);
  card.appendChild(body);
  card.addEventListener("click", () => openModal(sp));
  return card;
}

function normalizeIucn(status){
  if (!status) return "NE";
  const code = status.split(" ")[0].trim();
  return IUCN_LABELS[code] ? code : "NE";
}

// ---------------- FICHA (MODAL) ----------------
const overlay = document.getElementById("modalOverlay");
document.getElementById("modalClose").addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !overlay.hidden) closeModal(); });

function openModal(sp){
  document.getElementById("modalCommonName").textContent = sp.commonName || "(sin nombre común)";
  document.getElementById("modalSciName").textContent = sp.sciName;
  const authorYear = [sp.author, sp.year].filter(Boolean).join(", ");
  document.getElementById("modalAuthorYear").textContent = authorYear ? `Descrita por ${authorYear}` : "";

  document.getElementById("modalBreadcrumb").innerHTML =
    [sp.order, sp.family, sp.genus, sp.species].filter(Boolean)
      .map(t => `<span>${t}</span>`).join(`<span class="sep">/</span>`);

  const iucn = normalizeIucn(sp.iucnStatus);
  const iucnEl = document.getElementById("modalIucn");
  iucnEl.textContent = `${iucn} · ${IUCN_LABELS[iucn]}`;
  iucnEl.style.background = `var(${IUCN_COLOR_VAR[iucn] || "--iucn-ne"})`;

  document.getElementById("modalExtinct").hidden = !sp.extinct;
  document.getElementById("modalDomestic").hidden = !sp.domestic;

  document.getElementById("modalContinents").innerHTML =
    sp.continents.map(c => `<span class="chip">${c}</span>`).join("") || `<span class="chip">Sin datos</span>`;
  document.getElementById("modalCountries").innerHTML =
    sp.countries.map(c => `<span class="chip">${c}</span>`).join("");

  // Foto
  const photo = window.PHOTOS && window.PHOTOS[sp.id];
  const img = document.getElementById("modalPhoto");
  const noPhoto = document.getElementById("modalNoPhoto");
  const creditEl = document.getElementById("modalCredit");
  if (photo && photo.url){
    img.src = photo.url; img.alt = sp.commonName || sp.sciName; img.hidden = false; noPhoto.hidden = true;
    creditEl.innerHTML = photo.creditUrl
      ? `<a href="${photo.creditUrl}" target="_blank" rel="noopener">${photo.credit || "Ver fuente"}</a>`
      : (photo.credit || "");
  } else {
    img.hidden = true; noPhoto.hidden = false; creditEl.innerHTML = "";
  }

  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  initMap(sp);
}

function closeModal(){
  overlay.hidden = true;
  document.body.style.overflow = "";
}

// ---------------- MAPA ----------------
function initMap(sp){
  if (!leafletMap){
    leafletMap = L.map("modalMap", { zoomControl:true, attributionControl:false, scrollWheelZoom:false })
      .setView([10, 0], 1);
  }
  setTimeout(() => leafletMap.invalidateSize(), 50);

  if (worldGeoJson){
    drawCountries(sp);
  } else {
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
      .then(r => r.json())
      .then(gj => { worldGeoJson = gj; drawCountries(sp); })
      .catch(() => {
        document.getElementById("modalMap").innerHTML =
          `<p style="padding:14px;color:var(--paper-dim);font-size:.8rem">No se pudo cargar el mapa (sin conexión al proveedor externo). La lista de países arriba sigue siendo válida.</p>`;
      });
  }
}

function drawCountries(sp){
  if (countryLayer) leafletMap.removeLayer(countryLayer);

  const targetNames = new Set(sp.countries.map(c => (COUNTRY_NAME_MAP[c] || c).toLowerCase()));

  countryLayer = L.geoJSON(worldGeoJson, {
    filter: feat => targetNames.has((feat.properties.name || "").toLowerCase()),
    style: { color: "#c98a3e", weight: 1.5, fillColor: "#c98a3e", fillOpacity: .45 }
  }).addTo(leafletMap);

  if (countryLayer.getLayers().length){
    leafletMap.fitBounds(countryLayer.getBounds(), { padding:[16,16], maxZoom:5 });
  } else {
    leafletMap.setView([10,0], 1);
  }
}
