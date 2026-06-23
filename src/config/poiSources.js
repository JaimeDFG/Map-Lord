export const MADRID_CENTER = {
  latitude: 40.4168,
  longitude: -3.7038,
};

export const POI_CACHE_KEY = 'maplord_external_pois_v2';
export const POI_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export const POI_SOURCE_CONFIG = {
  language: 'es',
  openTripMap: {
    apiKey: process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY,
    baseUrl: 'https://api.opentripmap.com/0.1',
    detailLimit: 28,
    kinds: [
      'architecture',
      'cultural',
      'historic',
      'interesting_places',
      'museums',
      'natural',
      'religion',
      'urban_environment',
    ].join(','),
    limit: 48,
    radius: 4200,
  },
  overpass: {
    endpoint: 'https://overpass-api.de/api/interpreter',
    limit: 60,
    radius: 4200,
    timeout: 25,
  },
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    email: process.env.EXPO_PUBLIC_NOMINATIM_EMAIL,
  },
  wikidata: {
    endpoint: 'https://query.wikidata.org/sparql',
  },
  wikipedia: {
    baseUrl: 'https://es.wikipedia.org/w/rest.php/v1',
  },
};

export const SOURCE_DOCS = {
  openTripMap: 'https://dev.opentripmap.org/product',
  overpass: 'https://wiki.openstreetmap.org/wiki/Overpass_API',
  wikidata: 'https://www.wikidata.org/wiki/Help:Data_access',
  wikipedia: 'https://www.mediawiki.org/wiki/API:REST_API',
  nominatimPolicy: 'https://operations.osmfoundation.org/policies/nominatim/',
};
