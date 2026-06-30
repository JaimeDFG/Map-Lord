import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';

const CACHE_PREFIX = 'maplord_destacados_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días, estos datos cambian poco

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'MapLordApp/1.0 (travel map app; contact@maplord.app)';

const TIPOS_EXCLUIDOS = [
  'Q1248784', // aeropuerto
  'Q644371',  // aeropuerto doméstico
  'Q12236342',// aeropuerto internacional
  'Q55488',   // estación de tren
  'Q928830',  // estación de metro
  'Q1567913', // estación de autobús
  'Q4663385', // estación ferroviaria
  'Q18615527',// estación de cercanías
  'Q1339195', // terminal de aeropuerto
].map(t => `wd:${t}`).join(' ');

const TIPOS_VISITABLES = [
  'Q570116','Q33506','Q16970','Q44613','Q748514','Q23413',
  'Q12280','Q16560','Q207694','Q4989906','Q860861','Q1329623',
  'Q39715','Q41176','Q1081138',
].map(t => `wd:${t}`).join(' ');

async function fetchDestacados(coordenadas, lang = 'es') {
  const { latitude: lat, longitude: lon } = coordenadas;
  const labelLang = lang === 'en' ? 'en' : 'es';

  // Fórmula de Haversine para calcular distancia en metros entre dos puntos
  function distanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const query = `
    SELECT DISTINCT ?lugar ?labelEs ?labelEn ?lat ?lon ?sitelinks WHERE {
      SERVICE wikibase:around {
        ?lugar wdt:P625 ?coord .
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
        bd:serviceParam wikibase:radius "10" .
      }
      ?lugar wdt:P31 ?tipoDirecto .
      ?tipoDirecto wdt:P279? ?tipo .
      VALUES ?tipo { ${TIPOS_VISITABLES} }
      FILTER NOT EXISTS { ?lugar wdt:P31 ?tipoExcl . VALUES ?tipoExcl { ${TIPOS_EXCLUIDOS} } }
      ?lugar wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 5)
      OPTIONAL { ?lugar rdfs:label ?labelEs FILTER(LANG(?labelEs) = "es") }
      OPTIONAL { ?lugar rdfs:label ?labelEn FILTER(LANG(?labelEn) = "en") }
      BIND(geof:latitude(?coord) AS ?lat)
      BIND(geof:longitude(?coord) AS ?lon)
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 8
  `;

  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

  console.log('[Destacados] Llamando a Wikidata SPARQL');
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/sparql-results+json',
    },
  });
  console.log('[Destacados] Status:', res.status);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const bindings = data?.results?.bindings ?? [];
  console.log('[Destacados] Resultados brutos:', bindings.length);

  const resultados = bindings
    .map(b => ({
      id:     b.lugar?.value ?? '',
      nombre: (labelLang === 'en' ? b.labelEn?.value : b.labelEs?.value)
              ?? b.labelEs?.value ?? b.labelEn?.value ?? '?',
      lat:    parseFloat(b.lat?.value ?? '0'),
      lon:    parseFloat(b.lon?.value ?? '0'),
      sitelinks: parseInt(b.sitelinks?.value ?? '0'),
    }))
    .filter(p => p.nombre !== '?' && p.lat !== 0)
    .map(p => ({ ...p, dist: distanciaMetros(lat, lon, p.lat, p.lon) }))
    .filter((p, idx, arr) =>
      arr.findIndex(q =>
        Math.abs(q.lat - p.lat) < 0.0005 && Math.abs(q.lon - p.lon) < 0.0005
      ) === idx
    )
    .slice(0, 5);

  console.log('[Destacados] Top lugares:', resultados.map(r => r.nombre));
  return resultados;
}

export default function PantallaDestacados({ ciudad, onAñadirPOI }) {
  const { lang, todosLosPois } = useApp();
  const t = useT(lang);

  // Nombres normalizados de los POIs que el usuario ya tiene en este mapa
  const nombreCiudadLower = (ciudad?.nombre ?? '').toLowerCase();
  const poisDeEstaCiudad = todosLosPois.filter(
    p => (p.ciudad ?? '').toLowerCase() === nombreCiudadLower
  );
  function yaAñadido(lugar) {
    return poisDeEstaCiudad.some(p => {
      const mismoNombre = p.nombre?.toLowerCase().trim() === lugar.nombre?.toLowerCase().trim();
      const cerca =
        Math.abs((p.coordenadas?.latitude ?? 999) - lugar.lat) < 0.0008 &&
        Math.abs((p.coordenadas?.longitude ?? 999) - lugar.lon) < 0.0008;
      return mismoNombre || cerca;
    });
  }

  const [destacados, setDestacados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ciudad?.coordenadas?.latitude) return;
    let cancelado = false;

    async function cargar() {
      const cacheKey = `${CACHE_PREFIX}${lang}_${(ciudad?.nombre ?? '').toLowerCase().replace(/\s+/g, '_')}`;

      // 1. Intentar caché primero (datos casi instantáneos)
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const { ts, data } = JSON.parse(raw);
          if (Date.now() - ts < CACHE_TTL_MS && data.length > 0) {
            if (!cancelado) setDestacados(data);
            return;
          }
        }
      } catch (_) {}

      // 2. Si no hay caché válida, consultar Wikidata
      setCargando(true);
      setError(null);
      try {
        const data = await fetchDestacados(ciudad.coordenadas, lang);
        if (cancelado) return;
        if (data.length === 0) {
          setError('no_results');
        } else {
          setDestacados(data);
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
        }
      } catch (e) {
        if (!cancelado) setError('network');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    setDestacados([]);
    cargar();

    return () => { cancelado = true; };
  }, [ciudad?.nombre, lang]);

  const textos = {
    titulo:      lang === 'en' ? '⭐ Highlights' : '⭐ Destacados',
    subtitulo:   lang === 'en'
      ? `Top places in ${ciudad?.nombre ?? ''} according to Wikipedia`
      : `Lugares más destacados de ${ciudad?.nombre ?? ''} según Wikipedia`,
    instruccion: lang === 'en'
      ? 'Tap a place to add it to your map'
      : 'Pulsa un lugar para añadirlo a tu mapa',
    añadir:      lang === 'en' ? '+ Add to map' : '+ Añadir al mapa',
    cargando:    lang === 'en' ? 'Loading highlights…' : 'Cargando destacados…',
    sinCoords:   lang === 'en'
      ? 'No coordinates available for this map.'
      : 'No hay coordenadas disponibles para este mapa.',
    sinResultados: lang === 'en'
      ? 'No results found. Try adding POIs manually.'
      : 'No se encontraron resultados. Prueba añadiendo puntos manualmente.',
    errorRed:    lang === 'en'
      ? 'Connection error. Check your internet connection.'
      : 'Error de conexión. Comprueba tu acceso a internet.',
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.titulo}>{textos.titulo}</Text>
        <Text style={s.subtitulo}>{textos.subtitulo}</Text>
      </View>

      <ScrollView contentContainerStyle={s.lista} showsVerticalScrollIndicator={false}>
        {/* Estado: sin coordenadas */}
        {!ciudad?.coordenadas?.latitude && (
          <View style={s.estado}>
            <Text style={s.estadoEmoji}>📍</Text>
            <Text style={s.estadoT}>{textos.sinCoords}</Text>
          </View>
        )}

        {/* Estado: cargando */}
        {cargando && (
          <View style={s.estado}>
            <ActivityIndicator size="large" color="#2563eb" style={{ marginBottom: 12 }} />
            <Text style={s.estadoT}>{textos.cargando}</Text>
          </View>
        )}

        {/* Estado: error */}
        {!cargando && error === 'network' && (
          <View style={s.estado}>
            <Text style={s.estadoEmoji}>📡</Text>
            <Text style={s.estadoT}>{textos.errorRed}</Text>
          </View>
        )}

        {/* Estado: sin resultados */}
        {!cargando && error === 'no_results' && (
          <View style={s.estado}>
            <Text style={s.estadoEmoji}>🔍</Text>
            <Text style={s.estadoT}>{textos.sinResultados}</Text>
          </View>
        )}

        {/* Lista de destacados */}
        {!cargando && !error && destacados.length > 0 && (
          <>
            <Text style={s.instruccion}>{textos.instruccion}</Text>
            {destacados.map((lugar, i) => {
              const añadido = yaAñadido(lugar);
              return (
                <TouchableOpacity
                  key={lugar.id || `${lugar.lat}_${lugar.lon}`}
                  style={[s.card, añadido && s.cardAñadida]}
                  onPress={() => !añadido && onAñadirPOI({
                    nombre: lugar.nombre,
                    coordenadas: { latitude: lugar.lat, longitude: lugar.lon },
                  })}
                  disabled={añadido}
                >
                  <View style={[s.cardNum, añadido && s.cardNumAñadido]}>
                    <Text style={s.cardNumT}>{añadido ? '✓' : i + 1}</Text>
                  </View>
                  <View style={s.cardTexto}>
                    <Text style={s.cardNombre}>{lugar.nombre}</Text>
                    <Text style={s.cardDist}>
                      {lugar.dist < 1000
                        ? `${Math.round(lugar.dist)} m`
                        : `${(lugar.dist / 1000).toFixed(1)} km`}
                      {lang === 'en' ? ' from centre' : ' del centro'}
                    </Text>
                  </View>
                  <Text style={[s.cardAdd, añadido && s.cardAddAñadido]}>
                    {añadido
                      ? (lang === 'en' ? 'Added ✓' : 'Añadido ✓')
                      : textos.añadir}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f8f9fa' },
  header:     { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  titulo:     { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  subtitulo:  { fontSize: 13, color: '#888', marginTop: 3 },
  lista:      { padding: 16 },
  instruccion:{ fontSize: 13, color: '#2563eb', fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardAñadida:{ backgroundColor: '#f8faf8', opacity: 0.7 },
  cardNum:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  cardNumAñadido: { backgroundColor: '#16a34a' },
  cardNumT:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  cardTexto:  { flex: 1 },
  cardNombre: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardDist:   { fontSize: 12, color: '#888', marginTop: 2 },
  cardAdd:    { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  cardAddAñadido: { color: '#16a34a' },
  estado:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  estadoEmoji:{ fontSize: 48, marginBottom: 12 },
  estadoT:    { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
});