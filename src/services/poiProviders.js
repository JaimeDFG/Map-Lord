import { POI_SOURCE_CONFIG } from '../config/poiSources';
import { fetchJson } from './http';

function toQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function relevanceFromRate(rate) {
  if (rate >= 6) return 3;
  if (rate >= 3) return 2;
  return 1;
}

function categoryFromKinds(kinds = '') {
  const tokens = kinds.toLowerCase();

  if (tokens.includes('museums')) return 'Museo';
  if (tokens.includes('religion') || tokens.includes('churches')) return 'Iglesia';
  if (tokens.includes('palaces')) return 'Palacio';
  if (tokens.includes('fortifications') || tokens.includes('castles')) return 'Castillo';
  if (tokens.includes('gardens_and_parks') || tokens.includes('natural')) return 'Parque';
  if (tokens.includes('squares') || tokens.includes('urban_environment')) return 'Plaza';

  return 'Monumento';
}

function categoryFromOsmTags(tags = {}) {
  const tourism = tags.tourism;
  const historic = tags.historic;
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const building = tags.building;

  if (tourism === 'museum' || tourism === 'gallery') return 'Museo';
  if (amenity === 'place_of_worship' || ['church', 'cathedral', 'chapel'].includes(building)) return 'Iglesia';
  if (['palace'].includes(historic) || building === 'palace') return 'Palacio';
  if (['castle', 'fort', 'citywalls'].includes(historic) || building === 'castle') return 'Castillo';
  if (['park', 'garden'].includes(leisure)) return 'Parque';
  if (tags.place === 'square' || tourism === 'attraction') return 'Plaza';

  return 'Monumento';
}

function relevanceFromOsmTags(tags = {}) {
  if (tags.wikidata || tags.wikipedia) return 3;
  if (tags.tourism || tags.historic) return 2;
  return 1;
}

function visitTimeForCategory(category) {
  if (category === 'Museo') return 90;
  if (category === 'Parque') return 60;
  if (category === 'Palacio' || category === 'Castillo') return 70;
  if (category === 'Iglesia') return 40;
  return 35;
}

function textOrFallback(value, fallback) {
  const clean = typeof value === 'string' ? value.trim() : '';
  return clean || fallback;
}

function wikipediaTitleFromTag(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split(':');
  return parts.length > 1 ? parts.slice(1).join(':') : value;
}

function sourceLabel(fuentes = {}) {
  if (fuentes.wikipedia) return 'OpenStreetMap + Wikipedia';
  if (fuentes.wikidata) return 'OpenStreetMap + Wikidata';
  if (fuentes.osm) return 'OpenStreetMap';
  if (fuentes.openTripMap) return 'OpenTripMap';
  return 'Fuente abierta';
}

function detailsToPoi(details, listItem) {
  const point = details?.point || listItem?.point;
  const name = textOrFallback(details?.name || listItem?.name, null);

  if (!name || !point?.lat || !point?.lon) {
    return null;
  }

  const summary = details?.wikipedia_extracts?.text || details?.info?.descr || details?.kinds;
  const category = categoryFromKinds(details?.kinds || listItem?.kinds);
  const wikipediaUrl = details?.wikipedia;

  return {
    id: `otm:${details?.xid || listItem?.xid}`,
    nombre: name,
    coordenadas: {
      latitude: point.lat,
      longitude: point.lon,
    },
    categoria: category,
    relevancia: relevanceFromRate(details?.rate || listItem?.rate || 0),
    descripcion_corta: textOrFallback(details?.info?.descr, summary || 'Punto de interés cultural'),
    historia: textOrFallback(summary, 'Información pendiente de completar desde fuentes abiertas.'),
    arquitectura: textOrFallback(details?.kinds?.replaceAll(',', ', '), 'Datos arquitectónicos pendientes de completar.'),
    curiosidades: wikipediaUrl ? `Más información en Wikipedia: ${wikipediaUrl}` : 'Curiosidades pendientes de completar.',
    misterios: 'Sin información adicional contrastada por ahora.',
    tiempo_visita: visitTimeForCategory(category),
    fuentes: {
      openTripMap: details?.xid || listItem?.xid,
      wikidata: details?.wikidata,
      wikipedia: wikipediaUrl,
    },
  };
}

function osmElementToPoi(element) {
  const tags = element.tags || {};
  const latitude = element.lat || element.center?.lat;
  const longitude = element.lon || element.center?.lon;
  const name = tags['name:es'] || tags.name || tags['official_name:es'] || tags.official_name;

  if (!name || !latitude || !longitude) {
    return null;
  }

  const category = categoryFromOsmTags(tags);
  const description = tags['description:es'] || tags.description || tags.inscription || tags.wikipedia;

  return {
    id: `osm:${element.type}:${element.id}`,
    nombre: name,
    coordenadas: {
      latitude,
      longitude,
    },
    categoria: category,
    relevancia: relevanceFromOsmTags(tags),
    descripcion_corta: textOrFallback(description, `${category} registrado en OpenStreetMap`),
    historia: textOrFallback(description,
      tags.wikipedia
        ? `Este lugar está referenciado en Wikipedia (${tags.wikipedia}). Ábrelo para ver el artículo completo.`
        : 'Información histórica no disponible en fuentes abiertas para este lugar.'),
    arquitectura: textOrFallback(
      [tags.architect, tags.start_date ? `Construido en ${tags.start_date}` : null, tags.building, tags.historic]
        .filter(Boolean).join('. '),
      'Datos arquitectónicos no disponibles en fuentes abiertas para este lugar.'),
    curiosidades: tags.website
      ? `Web oficial: ${tags.website}`
      : 'No hay curiosidades documentadas en fuentes abiertas para este lugar.',
    misterios: 'No existen registros documentados de leyendas o misterios contrastados para este lugar.',
    tiempo_visita: visitTimeForCategory(category),
    fuentes: {
      osm: `${element.type}/${element.id}`,
      wikidata: tags.wikidata,
      wikipedia: tags.wikipedia,
      website: tags.website,
    },
  };
}

// ── Palabras clave para identificar párrafos de arquitectura dentro del artículo
const ARQU_KEYWORDS = [
  'construido', 'construida', 'construyó', 'edificio', 'arquitecto', 'arquitectura',
  'estilo', 'fachada', 'torre', 'cúpula', 'nave', 'planta', 'siglo', 'neoclás',
  'barroc', 'gótic', 'románic', 'diseñado', 'diseñada', 'obra de', 'altura',
  'metros', 'piedra', 'mármol', 'columna', 'arco',
];

// Divide el extracto de Wikipedia en párrafos y busca el más relevante para arquitectura
function extraerArquitectura(extract = '', fallback = '') {
  if (!extract) return fallback;
  const parrafos = extract.split('\n').map(p => p.trim()).filter(p => p.length > 60);
  // Buscar párrafo con más palabras clave de arquitectura
  let mejor = null;
  let mejorPuntos = 0;
  for (const p of parrafos) {
    const lower = p.toLowerCase();
    const puntos = ARQU_KEYWORDS.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (puntos > mejorPuntos) { mejorPuntos = puntos; mejor = p; }
  }
  // Necesitamos al menos 2 coincidencias para que valga la pena
  return mejorPuntos >= 2 ? mejor : fallback;
}

// Devuelve el segundo párrafo del extracto (suele contener datos concretos / curiosidades)
function extraerCuriosidades(extract = '', pageUrl = '', fallback = '') {
  const parrafos = extract.split('\n').map(p => p.trim()).filter(p => p.length > 60);
  const segundo = parrafos[1] || parrafos[0] || '';
  if (segundo && segundo.length > 60) return segundo;
  if (pageUrl) return `Puedes leer más sobre este lugar en Wikipedia: ${pageUrl}`;
  return fallback;
}

async function enrichPoiWithWikipedia(poi, lang = 'es') {
  const title = wikipediaTitleFromTag(poi?.fuentes?.wikipedia);
  if (!title) return poi;

  try {
    const summary = await fetchWikipediaSummary(title, lang);
    const extract  = summary?.extract?.trim() || '';
    const description = summary?.description?.trim() || '';
    const pageUrl  = summary?.content_urls?.desktop?.page || summary?.content_urls?.mobile?.page || '';

    if (!extract && !description && !pageUrl) return poi;

    // Primer párrafo → Historia
    const primerParrafo = extract.split('\n').map(p => p.trim()).find(p => p.length > 60) || extract;

    return {
      ...poi,
      _wikien: lang === 'en',
      descripcion_corta: description || poi.descripcion_corta,
      historia:      primerParrafo || poi.historia,
      arquitectura:  extraerArquitectura(extract, poi.arquitectura),
      curiosidades:  extraerCuriosidades(extract, pageUrl, poi.curiosidades),
      misterios:     lang === 'en'
        ? 'No documented legends or mysteries on record for this place.'
        : 'No existen registros documentados de leyendas o misterios contrastados para este lugar.',
      fuentes: {
        ...poi.fuentes,
        wikipediaUrl: pageUrl,
      },
    };
  } catch (error) {
    return poi;
  }
}

async function enrichPoisWithWikipedia(pois, lang = 'es', limit = 14) {
  const enriched = [];

  for (const poi of pois) {
    if (enriched.length < limit) {
      enriched.push(await enrichPoiWithWikipedia(poi, lang));
    } else {
      enriched.push(poi);
    }
  }

  return enriched.map(poi => ({
    ...poi,
    fuenteResumen: sourceLabel(poi.fuentes),
  }));
}

function buildOverpassQuery({ center, limit, radius, timeout }) {
  const { latitude: lat, longitude: lon } = center;
  // Query simplificada y compatible con todos los servidores Overpass
  // Usamos union de nodos y ways con los tags más básicos
  return [
    `[out:json][timeout:${timeout}];`,
    `(`,
    `  node["tourism"~"attraction|museum|gallery|viewpoint"](around:${radius},${lat},${lon});`,
    `  node["historic"~"monument|memorial|castle|ruins|archaeological_site"](around:${radius},${lat},${lon});`,
    `  node["amenity"~"place_of_worship|theatre"](around:${radius},${lat},${lon})["name"];`,
    `  node["leisure"~"park|garden"](around:${radius},${lat},${lon})["name"];`,
    `  way["tourism"~"attraction|museum|gallery|viewpoint"](around:${radius},${lat},${lon});`,
    `  way["historic"~"monument|memorial|castle|ruins|archaeological_site"](around:${radius},${lat},${lon});`,
    `  way["building"~"church|cathedral|chapel|palace|castle"](around:${radius},${lat},${lon})["name"];`,
    `);`,
    `out center tags ${limit};`,
  ].join('\n');
}

function mergeByNameAndDistance(primaryPois, fallbackPois = []) {
  const result = [...primaryPois];

  for (const poi of fallbackPois) {
    const duplicate = result.some(existing => {
      const sameName = existing.nombre.toLowerCase() === poi.nombre.toLowerCase();
      const closeLat = Math.abs(existing.coordenadas.latitude - poi.coordenadas.latitude) < 0.0008;
      const closeLon = Math.abs(existing.coordenadas.longitude - poi.coordenadas.longitude) < 0.0008;
      return sameName || (closeLat && closeLon);
    });

    if (!duplicate) {
      result.push(poi);
    }
  }

  return result;
}

export function hasOpenTripMapApiKey() {
  return Boolean(POI_SOURCE_CONFIG.openTripMap.apiKey);
}

export async function fetchOpenTripMapPois({
  center,
  detailLimit = POI_SOURCE_CONFIG.openTripMap.detailLimit,
  limit = POI_SOURCE_CONFIG.openTripMap.limit,
  radius = POI_SOURCE_CONFIG.openTripMap.radius,
} = {}) {
  const apiKey = POI_SOURCE_CONFIG.openTripMap.apiKey;

  if (!apiKey) {
    const error = new Error('Falta EXPO_PUBLIC_OPENTRIPMAP_API_KEY');
    error.code = 'OPEN_TRIP_MAP_API_KEY_MISSING';
    throw error;
  }

  const language = POI_SOURCE_CONFIG.language;
  const listUrl = `${POI_SOURCE_CONFIG.openTripMap.baseUrl}/${language}/places/radius?${toQuery({
    apikey: apiKey,
    format: 'json',
    kinds: POI_SOURCE_CONFIG.openTripMap.kinds,
    lat: center.latitude,
    limit,
    lon: center.longitude,
    radius,
    rate: 2,
  })}`;

  const list = await fetchJson(listUrl);
  const candidates = list
    .filter(item => item?.xid && item?.name && item?.point)
    .slice(0, detailLimit);

  const pois = [];

  for (const item of candidates) {
    const detailUrl = `${POI_SOURCE_CONFIG.openTripMap.baseUrl}/${language}/places/xid/${encodeURIComponent(item.xid)}?${toQuery({
      apikey: apiKey,
    })}`;

    try {
      const details = await fetchJson(detailUrl);
      const poi = detailsToPoi(details, item);
      if (poi) pois.push(poi);
    } catch (error) {
      const poi = detailsToPoi(item, item);
      if (poi) pois.push(poi);
    }
  }

  return pois;
}

export async function fetchOverpassPois({
  center,
  limit = POI_SOURCE_CONFIG.overpass.limit,
  radius = POI_SOURCE_CONFIG.overpass.radius,
  timeout = POI_SOURCE_CONFIG.overpass.timeout,
} = {}) {
  const query = buildOverpassQuery({ center, limit, radius, timeout });

  const OVERPASS_SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  let lastError;
  for (const server of OVERPASS_SERVERS) {
    try {
      const result = await fetchJson(server, {
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        timeoutMs: (timeout + 10) * 1000,
      });

      const pois = (result.elements || [])
        .map(osmElementToPoi)
        .filter(Boolean)
        .slice(0, limit);

      console.log(`[Overpass] ${server} OK: ${pois.length} POIs`);
      return pois;
    } catch (e) {
      console.log(`[Overpass] Servidor ${server} falló:`, e?.message);
      lastError = e;
    }
  }
  throw lastError;
}

export async function fetchWikipediaSummary(title, lang = 'es') {
  const base = lang === 'en'
    ? 'https://en.wikipedia.org/w/rest.php/v1'
    : POI_SOURCE_CONFIG.wikipedia.baseUrl;
  const url = `${base}/page/summary/${encodeURIComponent(title)}`;
  return fetchJson(url);
}

export async function searchWikipediaTitle(query, lang = 'es') {
  const wiki = lang === 'en' ? 'en.wikipedia.org' : 'es.wikipedia.org';
  const url = `https://${wiki}/w/api.php?${toQuery({
    action: 'query',
    format: 'json',
    list: 'search',
    origin: '*',
    srlimit: 1,
    srsearch: query,
  })}`;
  const result = await fetchJson(url);
  return result?.query?.search?.[0]?.title || null;
}

async function fetchBestWikipediaSummary(poi, lang = 'es') {
  const directTitle = wikipediaTitleFromTag(poi?.fuentes?.wikipedia) || poi?.nombre;

  try {
    return await fetchWikipediaSummary(directTitle, lang);
  } catch (error) {
    const foundTitle = await searchWikipediaTitle(poi?.nombre, lang);
    if (!foundTitle) throw error;
    return fetchWikipediaSummary(foundTitle, lang);
  }
}

export async function fetchPoiDetails(poi, lang = 'es') {
  let summary;
  try {
    summary = await fetchBestWikipediaSummary(poi, lang);
  } catch (_) {
    // Si Wikipedia no responde, devolvemos el POI con textos neutros
    return {
      ...poi,
      historia:     poi.historia?.length > 40 ? poi.historia : 'Wikipedia no dispone de información para este lugar.',
      arquitectura: poi.arquitectura?.length > 40 ? poi.arquitectura : 'No hay datos arquitectónicos disponibles en fuentes abiertas.',
      curiosidades: poi.curiosidades?.length > 40 ? poi.curiosidades : 'No hay curiosidades documentadas en fuentes abiertas.',
      misterios:    'No existen registros documentados de leyendas o misterios contrastados para este lugar.',
      fuenteResumen: sourceLabel(poi.fuentes),
    };
  }

  const extract     = summary?.extract?.trim() || '';
  const description = summary?.description?.trim() || '';
  const pageUrl     = summary?.content_urls?.desktop?.page || summary?.content_urls?.mobile?.page || '';

  // Primer párrafo con contenido → Historia
  const parrafos = extract.split('\n').map(p => p.trim()).filter(p => p.length > 60);
  const primerParrafo = parrafos[0] || extract;

  return {
    ...poi,
    descripcion_corta: description || poi.descripcion_corta || poi.categoria || 'Punto de interés',
    historia:     primerParrafo || 'Wikipedia no ofrece un resumen para este punto de interés.',
    arquitectura: extraerArquitectura(extract,
      poi.arquitectura?.length > 40
        ? poi.arquitectura
        : 'No hay datos arquitectónicos específicos disponibles en fuentes abiertas para este lugar.'),
    curiosidades: extraerCuriosidades(extract, pageUrl,
      poi.curiosidades?.length > 40
        ? poi.curiosidades
        : 'No hay curiosidades documentadas en fuentes abiertas para este lugar.'),
    misterios:    'No existen registros documentados de leyendas o misterios contrastados para este lugar.',
    fuenteResumen: pageUrl ? 'Wikipedia API' : sourceLabel(poi.fuentes),
    fuentes: {
      ...poi.fuentes,
      wikipediaUrl: pageUrl,
    },
  };
}

export async function fetchWikidataAround({ center, radius = 2500, limit = 30 } = {}) {
  const query = `
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>
    SELECT ?item ?itemLabel ?coord WHERE {
      SERVICE wikibase:around {
        ?item wdt:P625 ?coord.
        bd:serviceParam wikibase:center "Point(${center.longitude} ${center.latitude})"geo:wktLiteral.
        bd:serviceParam wikibase:radius "${radius / 1000}".
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    LIMIT ${limit}
  `;
  const url = `${POI_SOURCE_CONFIG.wikidata.endpoint}?${toQuery({ query, format: 'json' })}`;
  return fetchJson(url, {
    headers: {
      Accept: 'application/sparql-results+json',
    },
  });
}

export async function geocodeCityWithNominatim(query, { limit = 1 } = {}) {
  const params = {
    addressdetails: 1,
    email: POI_SOURCE_CONFIG.nominatim.email,
    format: 'jsonv2',
    limit,
    q: query,
  };
  const url = `${POI_SOURCE_CONFIG.nominatim.baseUrl}/search?${toQuery(params)}`;
  return fetchJson(url);
}

// ── LibreTranslate: traducción gratuita sin registro ────────────────────────
// Usamos instancias públicas con fallback entre ellas
const LIBRETRANSLATE_SERVERS = [
  'https://translate.argosopentech.com',
  'https://libretranslate.de',
  'https://translate.terraprint.co',
];

// Caché en memoria para esta sesión (se persiste en AsyncStorage)
const _translateCache = {};
const TRANSLATE_CACHE_KEY = 'maplord_translate_cache_v1';
let _cacheCargado = false;

async function cargarCacheTraduccion() {
  if (_cacheCargado) return;
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(TRANSLATE_CACHE_KEY);
    if (raw) Object.assign(_translateCache, JSON.parse(raw));
  } catch (_) {}
  _cacheCargado = true;
}

async function guardarCacheTraduccion() {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(TRANSLATE_CACHE_KEY, JSON.stringify(_translateCache));
  } catch (_) {}
}

async function traducirTexto(texto, desde = 'es', hasta = 'en') {
  if (!texto || hasta === desde) return texto;
  const clave = `${desde}|${hasta}|${texto}`;
  await cargarCacheTraduccion();

  // Si ya está en caché lo devolvemos directamente
  if (_translateCache[clave]) return _translateCache[clave];

  // Intentar con cada servidor hasta que uno funcione
  for (const server of LIBRETRANSLATE_SERVERS) {
    try {
      const res = await fetch(`${server}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texto, source: desde, target: hasta, format: 'text' }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const traduccion = data?.translatedText;
      if (traduccion) {
        _translateCache[clave] = traduccion;
        guardarCacheTraduccion(); // async, no bloqueamos
        return traduccion;
      }
    } catch (_) {
      // Próximo servidor
    }
  }
  // Si todos fallan devolvemos el texto original
  return texto;
}

// Traduce los campos de texto de un POI externo al idioma pedido
async function traducirPoi(poi, lang) {
  if (lang !== 'en') return poi;

  // Si el POI ya viene de Wikipedia en inglés (fetchPoiDetails con lang=en) no hace falta
  if (poi._wikien) return poi;

  // Traducimos en paralelo los campos más importantes
  const [nombre, descripcion_corta, historia, arquitectura, curiosidades, misterios] =
    await Promise.all([
      traducirTexto(poi.nombre, 'es', 'en'),
      traducirTexto(poi.descripcion_corta, 'es', 'en'),
      traducirTexto(poi.historia, 'es', 'en'),
      traducirTexto(poi.arquitectura, 'es', 'en'),
      traducirTexto(poi.curiosidades, 'es', 'en'),
      traducirTexto(poi.misterios, 'es', 'en'),
    ]);

  return { ...poi, nombre, descripcion_corta, historia, arquitectura, curiosidades, misterios };
}

export { traducirTexto, traducirPoi };

export async function loadExternalPois({ center, localPois, lang = 'es' }) {
  const sources = [];
  const overpassPois = await fetchOverpassPois({ center });

  // Enriquecer con Wikipedia en el idioma correcto
  const enriquecidos = await enrichPoisWithWikipedia(overpassPois, lang);

  // Si el idioma es inglés, los que no tenían Wikipedia los traducimos con LibreTranslate
  if (lang === 'en') {
    const traducidos = await Promise.all(
      enriquecidos.map(p => traducirPoi(p, 'en'))
    );
    sources.push(...traducidos);
  } else {
    sources.push(...enriquecidos);
  }

  if (hasOpenTripMapApiKey()) {
    try {
      const openTripMapPois = await fetchOpenTripMapPois({ center });
      sources.push(...openTripMapPois);
    } catch (error) {
      // OpenTripMap is optional
    }
  }

  return mergeByNameAndDistance(sources, localPois);
}