// game.js
// GeoQuest: Mapping Our World
// Plain ES module. All processing client-side with Turf.js.

const state = {
  missionIndex: 0,
  score: 0,
  badges: [],
  selections: new Set(), // feature ids for POIs
  lastResultGeoJSON: null,
  stepsCompleted: {},
  vectorLayers: {},
  resultsLayer: null,
  ndvi: { layer: null, mode: "auto", threshold: 100 }, // 0..255
  drawnItems: null,
  draw: { mode: "none", lastPath: null, lastSelectPoly: null },
  boundaryPolygon: null,
  roadsFC: null,
  riversFC: null,
  poiFC: null,
  parcelsFC: null,
  lowNDVIMaskFC: null,
};

const missions = [
  {
    id: "m1",
    title: "Vector Scout",
    steps: [
      "Turn on Schools and Boundary layers.",
      "Select all schools inside the boundary."
    ],
    successCriteria: { selectedSchoolsInBoundaryAtLeast: 2 },
    onSuccessRewards: { points: 50, badge: "Vector Pro" }
  },
  {
    id: "m2",
    title: "Raster Ranger",
    steps: [
      "Enable NDVI raster.",
      "Plan a path avoiding low-NDVI cells."
    ],
    successCriteria: { pathAvoidsLowNDVI: true },
    onSuccessRewards: { points: 75, badge: "Raster Ready" }
  },
  {
    id: "m3",
    title: "Geoprocessing Guru",
    steps: [
      "Buffer rivers by 100 m.",
      "Clip buffer to boundary.",
      "Intersect result with roads."
    ],
    successCriteria: { intersectionsCountAtLeast: 1 },
    onSuccessRewards: { points: 100, badge: "Geo-Ops Master" }
  }
];

let map, base, colorFilteredBase;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    loadState();
    initMap();
    await loadLayers();   // if any fetch fails, we'll catch below
    initUI();
    renderLegend();
    startMission(state.missionIndex);
  } catch (err) {
    console.error(err);
    const box = document.getElementById("info");
    if (box) {
      box.innerHTML = `<p style="color:#ffb4b4"><strong>Load error:</strong> ${err.message}.<br/>
      Check that the <code>data/</code> folder exists and file names/paths match exactly.</p>`;
    }
    alert("Could not load data. Open DevTools → Console & Network tabs for details.");
  }
});

function initMap(){
  map = L.map("map", { zoomControl: true });
  base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    minZoom: 2,
    maxZoom: 19
  }).addTo(map);

  state.drawnItems = new L.FeatureGroup().addTo(map);

  // Draw controls
  const drawControl = new L.Control.Draw({
    position: "topright",
    draw: {
      marker: false,
      circle: false,
      circlemarker: false,
      rectangle: false,
      polyline: false,
      polygon: { allowIntersection: false, showArea: true }
    },
    edit: { featureGroup: state.drawnItems }
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    if (state.draw.mode === "select"){
      // polygon selection mode
      state.drawnItems.clearLayers();
      state.drawnItems.addLayer(layer);
      state.draw.lastSelectPoly = layer.toGeoJSON();
      handlePolygonSelection(state.draw.lastSelectPoly);
      setInfo("Selected features by polygon.");
    } else if (state.draw.mode === "path"){
      // path for raster mission
      state.drawnItems.clearLayers();
      layer.setStyle && layer.setStyle({ color: "#FFD166", weight: 4 });
      state.drawnItems.addLayer(layer);
      state.draw.lastPath = layer.toGeoJSON();
      setInfo("Path drawn. Validate against low NDVI.");
      markStepDone("m2", 1);
      checkMissionStep();
    }
  });

  // Start at boundary area after layers load
}

async function loadLayers(){
  const boundary = await fetchJSON("data/sample_boundary.geojson");
  const roads = await fetchJSON("data/roads.geojson");
  const rivers = await fetchJSON("data/rivers.geojson");
  const poi = await fetchJSON("data/points_of_interest.geojson");
  const sampleVectors = await fetchJSON("data/sample_vectors.geojson");

  state.boundaryPolygon = boundary;
  state.roadsFC = roads;
  state.riversFC = rivers;
  state.poiFC = poi;
  state.parcelsFC = {
    type: "FeatureCollection",
    features: sampleVectors.features.filter(f => f.properties.layer === "parcels")
  };
  state.lowNDVIMaskFC = {
    type: "FeatureCollection",
    features: sampleVectors.features.filter(f => f.properties.layer === "low_ndvi")
  };

  state.vectorLayers.boundary = L.geoJSON(boundary, {
    style: { color: "#98a2ff", weight: 2, fillColor: "#98a2ff", fillOpacity: 0.05 }
  }).addTo(map);

  state.vectorLayers.rivers = L.geoJSON(rivers, {
    style: { color: "#00B4D8", weight: 3 }
  }).addTo(map);

  state.vectorLayers.roads = L.geoJSON(roads, {
    style: { color: "#FF6B6B", weight: 3, dashArray: "6,4" }
  }).addTo(map);

  state.vectorLayers.poi = L.geoJSON(poi, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 7,
      color: f.properties.type === "school" ? "#66e3a4" : "#ffd166",
      weight: 2,
      fillOpacity: 0.9
    }),
    //onEachFeature: onEachPOI
  }).addTo(map);

  state.vectorLayers.parcels = L.geoJSON(state.parcelsFC, {
    style: { color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.08, weight: 1 }
  }).addTo(map);

  // Invisible low NDVI mask (used for validation)
  state.vectorLayers.low_ndvi_mask = L.geoJSON(state.lowNDVIMaskFC, {
    style: { color: "#222", fillColor: "#222", fillOpacity: 0.12, weight: 1 }
  });

  // Results layer group
  state.vectorLayers.results = L.layerGroup().addTo(map);
  state.resultsLayer = state.vectorLayers.results;

  // Fit to boundary
  try { map.fitBounds(state.vectorLayers.boundary.getBounds(), { padding: [20,20] }); }
  catch(e){ map.setView([-19.99,-43.98], 14); }
}

function onEachPOI(feature, layer){
  const { name, type } = feature.properties || {};
  const id = feature.properties.id || feature.id || Math.random().toString(36).slice(2);
  feature.properties._id = id;
  layer.bindTooltip(`${type === "school" ? "🎓" : "🏥"} ${name}`, { sticky: true });

  layer.on("click keypress", (e) => {
    if (e.type === "keypress" && e.originalEvent.key !== "Enter") return;
    toggleSelectPOI(feature, layer);
  });
  layer.getElement && layer.getElement().setAttribute("tabindex", "0");
}

function toggleSelectPOI(feature, layer){
  const id = feature.properties._id;
  if (state.selections.has(id)){
    state.selections.delete(id);
    layer.setStyle({ opacity: 1, fillOpacity: 0.9 });
  } else {
    state.selections.add(id);
    layer.setStyle({ opacity: 1, fillOpacity: 1 });
  }
  validateM1Selections();
}

function initUI(){
  const list = document.getElementById("mission-list");
  list.innerHTML = "";
  missions[state.missionIndex].steps.forEach((s, i) => {
    const li = document.createElement("li");
    li.id = `step-${i}`;
    li.textContent = s;
    list.appendChild(li);
  });
  document.getElementById("current-mission").textContent = `Mission: ${missions[state.missionIndex].title}`;
  document.getElementById("score").textContent = `Score: ${state.score}`;
  renderBadges();

  document.getElementById("btn-reset").addEventListener("click", resetState);
  document.getElementById("btn-prev-mission").addEventListener("click", () => startMission(Math.max(0, state.missionIndex - 1)));
  document.getElementById("btn-next-mission").addEventListener("click", () => startMission(Math.min(missions.length - 1, state.missionIndex + 1)));

  document.getElementById("btn-select-mode").addEventListener("click", () => {
    state.draw.mode = "select";
    setInfo("Draw a polygon to select features within.");
    new L.Draw.Polygon(map, { showArea: true }).enable();
  });
  document.getElementById("btn-draw-polygon").addEventListener("click", () => {
    state.draw.mode = "select";
    new L.Draw.Polygon(map, { showArea: true }).enable();
  });
  document.getElementById("btn-draw-path").addEventListener("click", () => {
    state.draw.mode = "path";
    new L.Draw.Polyline(map, { shapeOptions:{ color:"#FFD166", weight:4 } }).enable();
  });

  document.getElementById("btn-buffer").addEventListener("click", runBuffer);
  document.getElementById("btn-clip").addEventListener("click", runClip);
  document.getElementById("btn-intersect").addEventListener("click", runIntersect);

  document.getElementById("modal-close").addEventListener("click", closeModal);

  // Layer toggles
  document.querySelectorAll('#layer-toggles input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", (e) => {
      const key = e.target.dataset.layer;
      handleLayerToggle(key, e.target.checked);
    });
  });

  // NDVI toggle default off; when turned on, attempt load
}

function handleLayerToggle(key, on){
  if (key === "ndvi"){
    if (on) enableNDVI();
    else disableNDVI();
    return;
  }
  const layer = key === "results" ? state.vectorLayers.results : state.vectorLayers[key];
  if (!layer) return;
  if (on) map.addLayer(layer);
  else map.removeLayer(layer);

  if (key === "poi" || key === "boundary"){
    if (isMission("m1") && map.hasLayer(state.vectorLayers.poi) && map.hasLayer(state.vectorLayers.boundary)){
      markStepDone("m1", 0);
      checkMissionStep();
    }
  }
}

function renderLegend(){
  const el = document.getElementById("legend");
  el.innerHTML = "";
  el.appendChild(rowSwatch("#98a2ff", "Boundary (polygon)"));
  el.appendChild(rowLine("#00B4D8", "Rivers (line)"));
  el.appendChild(rowLine("#FF6B6B", "Roads (line)"));
  el.appendChild(rowPoint("#66e3a4", "Schools (point)"));
  el.appendChild(rowPoint("#ffd166", "Clinics (point)"));
  el.appendChild(rowSwatch("linear-gradient(90deg,#2b9348,#55a630,#d9ed92)", "NDVI (low→high)"));
}

function rowSwatch(color, label){
  const r = document.createElement("div"); r.className = "legend-row";
  const s = document.createElement("div"); s.className = "legend-swatch";
  if (color.startsWith("linear-gradient")) s.style.background = color; else { s.style.background = color; }
  r.appendChild(s); const t = document.createElement("span"); t.textContent = label; r.appendChild(t); return r;
}
function rowLine(color, label){
  const r = document.createElement("div"); r.className = "legend-row";
  const s = document.createElement("div"); s.className = "legend-line"; s.style.borderTopColor = color;
  r.appendChild(s); const t = document.createElement("span"); t.textContent = label; r.appendChild(t); return r;
}
function rowPoint(color, label){
  const r = document.createElement("div"); r.className = "legend-row";
  const s = document.createElement("div"); s.className = "legend-point"; s.style.background = color; s.style.borderColor="#000";
  r.appendChild(s); const t = document.createElement("span"); t.textContent = label; r.appendChild(t); return r;
}

// ===================== Raster (NDVI) =====================

async function enableNDVI(){
  if (state.ndvi.layer){
    map.addLayer(state.ndvi.layer);
    setInfo("NDVI raster enabled. Low values appear darker.");
    return;
  }
  // Try local GeoTIFF first
  try {
    state.ndvi.layer = L.leafletGeotiff("data/rasters/ndvi.tif", {
      band: 0,
      renderer: L.LeafletGeotiff.plotty({ colorScale: "viridis", clampLow: true, clampHigh: true }),
      opacity: 0.75
    });
    state.ndvi.layer.on("load", () => setInfo("Loaded local NDVI.tif (GeoTIFF)."));
    state.ndvi.layer.addTo(map);
    // Optionally dim the base
    if (!map.hasLayer(colorFilteredBase)) colorFilteredBase.addTo(map);
    return;
  } catch (e) {
    console.warn("Local ndvi.tif unavailable, falling back to synthetic tiles.", e);
  }
  // Fallback synthetic raster via Canvas tiles (procedural NDVI-like)
  state.ndvi.layer = syntheticNDVITiles();
  state.ndvi.layer.addTo(map);
  if (!map.hasLayer(colorFilteredBase)) colorFilteredBase.addTo(map);
  setInfo("NDVI (synthetic) shown. See README to swap with a real GeoTIFF or tiles.");
}

function disableNDVI(){
  if (state.ndvi.layer) map.removeLayer(state.ndvi.layer);
  if (map.hasLayer(colorFilteredBase)) map.removeLayer(colorFilteredBase);
}

function syntheticNDVITiles(){
  // Canvas tiles that compute pseudo-NDVI [0..255] from lat/lng for demo.
  const tile = L.GridLayer.extend({
    createTile: function(coords){
      const tile = document.createElement("canvas");
      const size = this.getTileSize();
      tile.width = size.x; tile.height = size.y;
      const ctx = tile.getContext("2d");
      const img = ctx.createImageData(size.x, size.y);
      for (let y=0; y<size.y; y++){
        for (let x=0; x<size.x; x++){
          const lng = coords.x*256 + x; const lat = coords.y*256 + y;
          const v = pseudoNDVI(lng, lat); // 0..255
          const i = (y*size.x + x) * 4;
          // Color ramp: low->dark purple, mid->yellow, high->green
          const c = ndviColor(v);
          img.data[i+0]=c[0]; img.data[i+1]=c[1]; img.data[i+2]=c[2]; img.data[i+3]=180;
        }
      }
      ctx.putImageData(img,0,0);
      return tile;
    }
  });
  return new tile();
}

function pseudoNDVI(lng, lat){
  // Deterministic pattern; interpret inputs to generate gradient/noise
  const s = Math.sin(lng*0.005) * Math.cos(lat*0.003);
  const n = (s + 1) / 2; // 0..1
  return Math.floor(n*255);
}
function ndviColor(v){
  // Simple ramp: 0..255 -> purple(50,30,100) to yellow(240,230,90) to green(30,200,90)
  if (v < 85){
    const t = v/85;
    return [
      lerp(50, 240, t*0.6),
      lerp(30, 230, t*0.6),
      lerp(100, 90, t*0.6)
    ].map(x=>Math.max(0,Math.min(255,Math.floor(x))));
  } else if (v < 170){
    const t = (v-85)/85;
    return [
      lerp(240, 180, t),
      lerp(230, 210, t),
      lerp(90, 120, t)
    ].map(x=>Math.floor(x));
  } else {
    const t = (v-170)/85;
    return [
      lerp(180, 30, t),
      lerp(210, 200, t),
      lerp(120, 90, t)
    ].map(x=>Math.floor(x));
  }
}
function lerp(a,b,t){ return a + (b-a)*t; }

// Sample value retrieval for path validation
async function sampleNDVIAlongLine(geojsonLine){
  // If using real GeoTIFF + plotty renderer, try to sample values
  if (state.ndvi.layer && state.ndvi.layer.getValueAtLatLng){
    const coords = geojsonLine.geometry.coordinates;
    for (let i=0;i<coords.length;i++){
      const [lng,lat] = coords[i];
      const v = state.ndvi.layer.getValueAtLatLng(lat, lng);
      if (v !== null && v !== undefined && v < state.ndvi.threshold) return false; // touches low NDVI
    }
    return true; // avoids
  }
  // Otherwise use the procedural pseudoNDVI
  const coords = geojsonLine.geometry.coordinates;
  for (let i=0;i<coords.length;i++){
    const [lng,lat] = coords[i];
    const v = pseudoNDVI(lng, lat);
    if (v < state.ndvi.threshold) return false;
  }
  return true;
}

// ===================== Selection & Missions =====================

function handlePolygonSelection(polygon){
  // Select POIs within polygon and inside boundary (for M1)
  const poly = polygon;
  let countInside = 0;
  state.vectorLayers.poi.eachLayer(layer => {
    const f = layer.feature;
    const pt = f.geometry;
    const insideSel = turf.booleanPointInPolygon(pt, poly);
    const insideBoundary = turf.booleanPointInPolygon(pt, state.boundaryPolygon.features[0]);
    if (insideSel && insideBoundary){
      state.selections.add(f.properties._id);
      layer.setStyle({ fillOpacity: 1 });
      countInside++;
    }
  });
  if (countInside > 0) setInfo(`Selected ${countInside} POIs inside selection polygon.`);
  validateM1Selections();
}

function validateM1Selections(){
  if (!isMission("m1")) return;
  // Count schools within boundary among selected
  let count = 0;
  state.vectorLayers.poi.eachLayer(layer => {
    const f = layer.feature;
    if (!state.selections.has(f.properties._id)) return;
    const insideBoundary = turf.booleanPointInPolygon(f, state.boundaryPolygon.features[0]);
    if (insideBoundary && f.properties.type === "school") count++;
  });
  if (count >= missions[0].successCriteria.selectedSchoolsInBoundaryAtLeast){
    markStepDone("m1", 1);
  }
  checkMissionStep();
}

function isMission(id){
  return missions[state.missionIndex].id === id;
}

function startMission(index){
  state.missionIndex = index;
  state.stepsCompleted = {};
  saveState();

  const m = missions[index];
  // Update UI
  const list = document.getElementById("mission-list");
  list.innerHTML = "";
  m.steps.forEach((s,i)=>{
    const li = document.createElement("li");
    li.id = `step-${i}`;
    li.textContent = s;
    list.appendChild(li);
  });
  document.getElementById("current-mission").textContent = `Mission: ${m.title}`;
  setInfo(`Mission loaded: ${m.title}`);
  // Small reset for mission context
  state.selections.clear();
  if (state.resultsLayer) state.resultsLayer.clearLayers();
  if (!map.hasLayer(state.vectorLayers.boundary)) map.addLayer(state.vectorLayers.boundary);
  saveState();
}

function markStepDone(missionId, stepIndex){
  if (missions[state.missionIndex].id !== missionId) return;
  state.stepsCompleted[stepIndex] = true;
  const li = document.getElementById(`step-${stepIndex}`);
  if (li){ li.innerHTML = "✅ " + li.textContent; }
  saveState();
}

async function checkMissionStep(){
  const m = missions[state.missionIndex];
  if (m.id === "m2" && state.draw.lastPath){
    const ok = await sampleNDVIAlongLine(state.draw.lastPath);
    if (ok){
      completeMission(m);
      return;
    } else {
      setInfo("Your path crosses low NDVI areas. Try drawing a different route.");
    }
  }
  if (m.id === "m3"){
    // completion is validated in runIntersect after result created
    return;
  }
  // For m1, after markStepDone in validateM1Selections, check all steps
  const allDone = m.steps.every((_,i)=> !!state.stepsCompleted[i]);
  if (allDone && m.id === "m1"){
    completeMission(m);
  }
}

function completeMission(m){
  const { points, badge } = m.onSuccessRewards;
  state.score += points;
  if (!state.badges.includes(badge)) state.badges.push(badge);
  saveState();
  document.getElementById("score").textContent = `Score: ${state.score}`;
  renderBadges();
  showModal(`🎉 ${m.title} complete!`, `You earned ${points} points and badge: ${badge}.`);
}

// ===================== Geoprocessing =====================

function runBuffer(){
  try {
    const buffered = turf.buffer(state.riversFC, 0.1, { units: "kilometers" }); // 100 m = 0.1 km
    state.lastResultGeoJSON = buffered;
    drawResult(buffered, { color: "#55DDE0", fillColor:"#55DDE0", fillOpacity:0.3, weight:2 });
    setInfo("Buffered rivers by 100 m.");
    if (isMission("m3")) markStepDone("m3", 0);
  } catch (e){
    alert("Buffer failed: " + e.message);
  }
}

function runClip(){
  if (!state.lastResultGeoJSON){
    alert("Run Buffer first.");
    return;
  }
  try {
    const boundaryPoly = state.boundaryPolygon.features[0];
    const clipped = turf.intersect(boundaryPoly, state.lastResultGeoJSON);
    if (!clipped){
      alert("Clip produced no overlap; try again.");
      return;
    }
    state.lastResultGeoJSON = clipped;
    drawResult(clipped, { color: "#80ED99", fillColor:"#80ED99", fillOpacity:0.35, weight:2 });
    setInfo("Clipped to boundary.");
    if (isMission("m3")) markStepDone("m3", 1);
  } catch (e){
    alert("Clip failed: " + e.message);
  }
}

function runIntersect(){
  if (!state.lastResultGeoJSON){
    alert("Run Buffer and Clip first.");
    return;
  }
  try {
    // Intersect clipped river buffer with roads (find crossings needing bridges)
    const intersections = [];
    for (const road of state.roadsFC.features){
      const inter = turf.intersect(state.lastResultGeoJSON, road);
      if (inter){
        // inter can be LineString/Polygon/Multi..; count feature
        intersections.push(inter);
      }
    }
    if (intersections.length === 0){
      alert("No intersections found. Try again.");
      return;
    }
    const fc = { type:"FeatureCollection", features: intersections };
    drawResult(fc, { color: "#F94144", weight: 4, dashArray: "4,4" });
    setInfo(`Found ${intersections.length} road crossings within buffered rivers.`);
    if (isMission("m3")){
      const needed = missions[state.missionIndex].successCriteria.intersectionsCountAtLeast;
      if (intersections.length >= needed){
        markStepDone("m3", 2);
        completeMission(missions[state.missionIndex]);
      }
    }
  } catch (e){
    alert("Intersect failed: " + e.message);
  }
}

function drawResult(geojson, style={}){
  state.resultsLayer.clearLayers();
  const lyr = L.geoJSON(geojson, {
    style: () => style
  });
  state.resultsLayer.addLayer(lyr);
  map.fitBounds(lyr.getBounds(), { padding: [20,20] });
}

// ===================== HUD helpers =====================

function renderBadges(){
  const box = document.getElementById("badges");
  box.innerHTML = "";
  state.badges.forEach(b => {
    const span = document.createElement("span");
    span.className = "badge";
    span.textContent = b;
    box.appendChild(span);
  });
}

function setInfo(msg){
  const el = document.getElementById("info");
  el.innerHTML = `<p>${msg}</p>`;
}

function showModal(title, body){
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").textContent = body;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal(){
  document.getElementById("modal").classList.add("hidden");
}

// ===================== Persistence =====================

function saveState(){
  const s = {
    missionIndex: state.missionIndex,
    score: state.score,
    badges: state.badges,
  };
  localStorage.setItem("geoquest_state", JSON.stringify(s));
}
function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem("geoquest_state"));
    if (s){
      state.missionIndex = s.missionIndex || 0;
      state.score = s.score || 0;
      state.badges = s.badges || [];
    }
  }catch(e){}
}
function resetState(){
  if (!confirm("Reset your progress?")) return;
  localStorage.removeItem("geoquest_state");
  location.reload();
}

// ===================== Utils =====================

async function fetchJSON(path){
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}
