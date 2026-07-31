import { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import OsmTileLayer from '../components/OsmTileLayer';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { nombrePaisEn, nombreContinenteEn } from '../constants/tourism';
import { buscarCoordenadasCiudad } from '../services/poiSearch';
import PAISES from '../data/paises.json';

const CAPITALES = {
  AD:{lat:42.5063,lng:1.5218}, AL:{lat:41.3317,lng:19.8319}, AT:{lat:48.2082,lng:16.3738},
  BA:{lat:43.8476,lng:18.3564}, BE:{lat:50.8503,lng:4.3517}, BG:{lat:42.6977,lng:23.3219},
  BY:{lat:53.9045,lng:27.5615}, CH:{lat:46.9481,lng:7.4474}, CY:{lat:35.1856,lng:33.3823},
  CZ:{lat:50.0755,lng:14.4378}, DE:{lat:52.52,lng:13.405}, DK:{lat:55.6761,lng:12.5683},
  EE:{lat:59.437,lng:24.7536}, ES:{lat:40.4168,lng:-3.7038}, FI:{lat:60.1699,lng:24.9384},
  FR:{lat:48.8566,lng:2.3522}, GB:{lat:51.5074,lng:-0.1278}, GR:{lat:37.9838,lng:23.7275},
  HR:{lat:45.815,lng:15.9819}, HU:{lat:47.4979,lng:19.0402}, IE:{lat:53.3498,lng:-6.2603},
  IS:{lat:64.1355,lng:-21.8954}, IT:{lat:41.9028,lng:12.4964}, LI:{lat:47.141,lng:9.5215},
  LT:{lat:54.6872,lng:25.2797}, LU:{lat:49.6116,lng:6.1319}, LV:{lat:56.946,lng:24.1059},
  MC:{lat:43.7384,lng:7.4246}, MD:{lat:47.0105,lng:28.8638}, ME:{lat:42.4304,lng:19.2594},
  MK:{lat:41.9981,lng:21.4254}, MT:{lat:35.8997,lng:14.5148}, NL:{lat:52.3676,lng:4.9041},
  NO:{lat:59.9139,lng:10.7522}, PL:{lat:52.2297,lng:21.0122}, PT:{lat:38.7169,lng:-9.1395},
  RO:{lat:44.4268,lng:26.1025}, RS:{lat:44.8176,lng:20.4569}, RU:{lat:55.7558,lng:37.6173},
  SE:{lat:59.3293,lng:18.0686}, SI:{lat:46.0569,lng:14.5058}, SK:{lat:48.1486,lng:17.1077},
  SM:{lat:43.9424,lng:12.4578}, TR:{lat:39.9334,lng:32.8597}, UA:{lat:50.4501,lng:30.5234},
  VA:{lat:41.9029,lng:12.4534}, XK:{lat:42.6629,lng:21.1655}, AG:{lat:17.1274,lng:-61.8468},
  BB:{lat:13.0975,lng:-59.6167}, BL:{lat:17.8983,lng:-62.8514}, BZ:{lat:17.2534,lng:-88.7713},
  CA:{lat:45.4215,lng:-75.6972}, CR:{lat:9.9281,lng:-84.0907}, CU:{lat:23.1136,lng:-82.3666},
  DM:{lat:15.3017,lng:-61.3881}, DO:{lat:18.4861,lng:-69.9312}, GD:{lat:12.0564,lng:-61.7485},
  GT:{lat:14.6349,lng:-90.5069}, HN:{lat:14.0818,lng:-87.2068}, HT:{lat:18.5944,lng:-72.3074},
  JM:{lat:17.997,lng:-76.7936}, KN:{lat:17.3026,lng:-62.7177}, LC:{lat:14.0101,lng:-60.9875},
  MX:{lat:19.4326,lng:-99.1332}, NI:{lat:12.1364,lng:-86.2514}, PA:{lat:8.9936,lng:-79.5197},
  PR:{lat:18.4655,lng:-66.1057}, SV:{lat:13.6929,lng:-89.2182}, TT:{lat:10.6918,lng:-61.2225},
  US:{lat:38.8951,lng:-77.0364}, VC:{lat:13.16,lng:-61.2248}, AR:{lat:-34.6037,lng:-58.3816},
  BO:{lat:-16.5,lng:-68.15}, BR:{lat:-15.7801,lng:-47.9292}, CL:{lat:-33.4569,lng:-70.6483},
  CO:{lat:4.711,lng:-74.0721}, EC:{lat:-0.2299,lng:-78.5249}, GY:{lat:6.8013,lng:-58.1551},
  PE:{lat:-12.0464,lng:-77.0428}, PY:{lat:-25.2867,lng:-57.647}, SR:{lat:5.852,lng:-55.2038},
  UY:{lat:-34.9011,lng:-56.1645}, VE:{lat:10.488,lng:-66.8792}, AE:{lat:24.4539,lng:54.3773},
  AF:{lat:34.5553,lng:69.2075}, AM:{lat:40.1792,lng:44.4991}, AZ:{lat:40.4093,lng:49.8671},
  BD:{lat:23.8103,lng:90.4125}, BH:{lat:26.2235,lng:50.5876}, BN:{lat:4.9031,lng:114.9398},
  BT:{lat:27.4728,lng:89.639}, CN:{lat:39.9042,lng:116.4074}, GE:{lat:41.6938,lng:44.8015},
  ID:{lat:-6.2088,lng:106.8456}, IL:{lat:31.7683,lng:35.2137}, IN:{lat:28.6139,lng:77.209},
  IQ:{lat:33.3406,lng:44.4009}, IR:{lat:35.6892,lng:51.389}, JO:{lat:31.9566,lng:35.9457},
  JP:{lat:35.6762,lng:139.6503}, KG:{lat:42.8746,lng:74.5698}, KH:{lat:11.5625,lng:104.916},
  KP:{lat:39.0392,lng:125.7625}, KR:{lat:37.5665,lng:126.978}, KW:{lat:29.3759,lng:47.9774},
  KZ:{lat:51.1801,lng:71.446}, LA:{lat:17.9757,lng:102.6331}, LB:{lat:33.8938,lng:35.5018},
  LK:{lat:6.9271,lng:79.8612}, MM:{lat:16.8661,lng:96.1951}, MN:{lat:47.8864,lng:106.9057},
  MY:{lat:3.139,lng:101.6869}, NP:{lat:27.7172,lng:85.324}, OM:{lat:23.588,lng:58.3829},
  PH:{lat:14.5995,lng:120.9842}, PK:{lat:33.7294,lng:73.0931}, PS:{lat:31.9522,lng:35.2332},
  QA:{lat:25.2854,lng:51.531}, SA:{lat:24.6877,lng:46.7219}, SG:{lat:1.3521,lng:103.8198},
  SY:{lat:33.5102,lng:36.2913}, TH:{lat:13.7563,lng:100.5018}, TJ:{lat:38.5598,lng:68.787},
  TL:{lat:-8.5569,lng:125.5789}, TM:{lat:37.9601,lng:58.3261}, TW:{lat:25.033,lng:121.5654},
  UZ:{lat:41.2995,lng:69.2401}, VN:{lat:21.0285,lng:105.8542}, YE:{lat:15.5527,lng:48.5164},
  AO:{lat:-8.839,lng:13.2894}, BF:{lat:12.3647,lng:-1.5333}, BI:{lat:-3.3731,lng:29.9189},
  BJ:{lat:6.3703,lng:2.3912}, BW:{lat:-24.6282,lng:25.9231}, CD:{lat:-4.3317,lng:15.3139},
  CF:{lat:4.3947,lng:18.5582}, CG:{lat:-4.2634,lng:15.2429}, CI:{lat:6.8276,lng:-5.2893},
  CM:{lat:3.848,lng:11.5021}, CV:{lat:14.933,lng:-23.5133}, DJ:{lat:11.572,lng:43.1456},
  DZ:{lat:36.7372,lng:3.0865}, EG:{lat:30.0444,lng:31.2357}, ER:{lat:15.3229,lng:38.9251},
  ET:{lat:9.025,lng:38.7469}, GA:{lat:0.4162,lng:9.4673}, GH:{lat:5.56,lng:-0.2057},
  GM:{lat:13.4531,lng:-16.5775}, GN:{lat:9.6412,lng:-13.5784}, GQ:{lat:3.7523,lng:8.7741},
  GW:{lat:11.8636,lng:-15.5977}, KE:{lat:-1.2921,lng:36.8219}, KM:{lat:-11.7022,lng:43.2551},
  LR:{lat:6.3156,lng:-10.8074}, LS:{lat:-29.3167,lng:27.4833}, LY:{lat:32.901,lng:13.1805},
  MA:{lat:34.0209,lng:-6.8416}, MG:{lat:-18.9137,lng:47.5361}, ML:{lat:12.6392,lng:-8.0029},
  MR:{lat:18.0858,lng:-15.9785}, MU:{lat:-20.1654,lng:57.4989}, MW:{lat:-13.9669,lng:33.7873},
  MZ:{lat:-25.9692,lng:32.5732}, NA:{lat:-22.5597,lng:17.0832}, NE:{lat:13.5137,lng:2.1098},
  NG:{lat:9.0579,lng:7.4951}, RW:{lat:-1.9441,lng:30.0619}, SC:{lat:-4.6191,lng:55.4513},
  SD:{lat:15.5518,lng:32.5324}, SL:{lat:8.4657,lng:-13.2317}, SN:{lat:14.6928,lng:-17.4467},
  SO:{lat:2.0469,lng:45.3182}, SS:{lat:4.8594,lng:31.5713}, ST:{lat:0.3365,lng:6.7273},
  SZ:{lat:-26.5225,lng:31.1368}, TD:{lat:12.1048,lng:15.0445}, TG:{lat:6.1375,lng:1.2123},
  TN:{lat:36.819,lng:10.1658}, TZ:{lat:-6.173,lng:35.7382}, UG:{lat:0.3476,lng:32.5825},
  ZA:{lat:-25.7479,lng:28.2293}, ZM:{lat:-15.4167,lng:28.2833}, ZW:{lat:-17.8292,lng:31.0522},
  AU:{lat:-35.2809,lng:149.13}, FJ:{lat:-18.1416,lng:178.4419}, FM:{lat:6.9248,lng:158.161},
  KI:{lat:-1.329,lng:173.0237}, MH:{lat:7.1315,lng:171.1845}, NR:{lat:-0.5477,lng:166.9209},
  NZ:{lat:-41.2865,lng:174.7762}, PG:{lat:-9.4438,lng:147.1803}, PW:{lat:7.5,lng:134.624},
  SB:{lat:-9.4456,lng:160.0117}, TO:{lat:-21.1393,lng:-175.2049}, TV:{lat:-8.52,lng:179.1983},
  VU:{lat:-17.7334,lng:168.321}, WS:{lat:-13.8314,lng:-171.7667},
};

const CONTINENTES = [
  { key: 'Europa', emoji: '🌍' },
  { key: 'América del Norte', emoji: '🌎' },
  { key: 'América del Sur', emoji: '🌎' },
  { key: 'Asia', emoji: '🌏' },
  { key: 'África', emoji: '🌍' },
  { key: 'Oceanía', emoji: '🌏' },
];

function coordValida(c) {
  return c && typeof c.latitude === 'number' && typeof c.longitude === 'number'
    && !isNaN(c.latitude) && !isNaN(c.longitude);
}

export default function PantallaPasaporte({ onCerrar }) {
  const { lang, viajes, togglePaisVisitado, añadirCiudadViaje, borrarCiudadViaje, datosPais, poisUsuario } = useApp();
  const t = useT(lang);
  const insets = useSafeAreaInsets();

  const [vista, setVista] = useState('lista');
  const [continente, setContinente] = useState('Europa');
  const [modalPais, setModalPais] = useState(null);
  const [ciudad, setCiudad] = useState('');
  const [modalLista, setModalLista] = useState(null); // 'paises' | 'ciudades' | 'continentes'

  // ESTADÍSTICAS
  const totalPaises = Object.values(viajes).filter(p => p?.visitado).length;
  const totalCiudades = Object.values(viajes).reduce((s, p) => s + (p?.ciudades?.length ?? 0), 0);
  const pct = Math.round((totalPaises / PAISES.length) * 100);

  // Continentes visitados
  const continentesVisitados = useMemo(() => {
    const set = new Set();
    for (const p of PAISES) {
      if (datosPais(p.id).visitado) set.add(p.continente);
    }
    return set.size;
  }, [viajes]);

  const continenteMasVisitado = useMemo(() => {
    const conts = {};
    for (const p of PAISES) {
      if (datosPais(p.id).visitado) {
        conts[p.continente] = (conts[p.continente] ?? 0) + 1;
      }
    }
    const entries = Object.entries(conts);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [viajes]);

  const paisMasCiudades = useMemo(() => {
    let max = 0, paisMax = null;
    for (const p of PAISES) {
      const num = datosPais(p.id).ciudades?.length ?? 0;
      if (num > max) { max = num; paisMax = p; }
    }
    return paisMax;
  }, [viajes]);

  // Todas las ciudades visitadas
  const todasLasCiudades = useMemo(() => {
    const lista = [];
    for (const p of PAISES) {
      const datos = datosPais(p.id);
      if (!datos.ciudades) continue;
      for (const c of datos.ciudades) {
        const nombre = typeof c === 'string' ? c : c.nombre;
        const coords = typeof c === 'string' ? null : c.coordenadas;
        lista.push({ nombre, coords, paisId: p.id, paisNombre: nombrePaisEn(p.nombre, lang), paisEmoji: p.emoji });
      }
    }
    return lista.sort((a, b) => a.paisNombre.localeCompare(b.paisNombre, lang === 'en' ? 'en' : 'es'));
  }, [viajes, lang]);

  const filtrados = PAISES.filter(p => p.continente === continente).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const visitadosCont = filtrados.filter(p => datosPais(p.id).visitado).length;
  const paisesVisitadosConCoords = PAISES.filter(p => datosPais(p.id).visitado && CAPITALES[p.id]);

  async function añadir() {
    if (!ciudad.trim() || !modalPais) return;
    const coords = await buscarCoordenadasCiudad(ciudad.trim(), modalPais.nombre);
    añadirCiudadViaje(modalPais.id, ciudad.trim(), coords);
    setCiudad('');
  }

  // Componente reutilizable: listado de ciudades
  function CiudadesListado() {
    if (todasLasCiudades.length === 0) return null;
    return (
      <View style={s.ciudadesSection}>
        <Text style={s.ciudadesSectionTitulo}>🏙️ {lang === 'en' ? 'Cities visited' : 'Ciudades visitadas'} ({todasLasCiudades.length})</Text>
        {todasLasCiudades.map((c, i) => (
          <View key={`${c.paisId}-${c.nombre}-${i}`} style={s.ciudadRow}>
            <Text style={s.ciudadRowEmoji}>{c.paisEmoji}</Text>
            <View style={s.ciudadRowInfo}>
              <Text style={s.ciudadRowNombre}>{c.nombre}</Text>
              <Text style={s.ciudadRowPais}>{c.paisNombre}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  function StatsContent() {
    return (
      <View style={{ padding: 16 }}>
        <View style={s.statsGrid}>
          <TouchableOpacity style={s.statCardGrid} onPress={() => setModalLista('paises')}>
            <Text style={s.statEmoji}>🌍</Text>
            <Text style={s.statNumGrid}>{totalPaises}</Text>
            <Text style={s.statLabelGrid}>{t.paises}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.statCardGrid} onPress={() => setModalLista('ciudades')}>
            <Text style={s.statEmoji}>🏙️</Text>
            <Text style={s.statNumGrid}>{totalCiudades}</Text>
            <Text style={s.statLabelGrid}>{t.ciudades}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.statCardGrid} onPress={() => setModalLista('continentes')}>
            <Text style={s.statEmoji}>🌐</Text>
            <Text style={s.statNumGrid}>{continentesVisitados}</Text>
            <Text style={s.statLabelGrid}>{lang === 'en' ? 'Continents' : 'Continentes'}</Text>
          </TouchableOpacity>

          <View style={s.statCardGrid}>
            <Text style={s.statEmoji}>📊</Text>
            <Text style={s.statNumGrid}>{`${pct}%`}</Text>
            <Text style={s.statLabelGrid}>{t.delMundo}</Text>
          </View>

          <View style={s.statCardGrid}>
            <Text style={s.statEmoji}>🎯</Text>
            <Text style={s.statNumGrid}>{`${totalPaises}/${PAISES.length}`}</Text>
            <Text style={s.statLabelGrid}>{lang === 'en' ? 'Progress' : 'Progreso'}</Text>
          </View>
        </View>

        <View style={s.progressBox}>
          <View style={s.progressBg}><View style={[s.progressFill, { width: `${pct}%` }]} /></View>
          <Text style={s.progressT}>{totalPaises} {t.de} {PAISES.length} {t.paisesVisitados}</Text>
        </View>

        <View style={s.extraStatsGrid}>
          {continenteMasVisitado && (
            <View style={s.extraStatGrid}>
              <Text style={s.extraStatEmoji}>🌍</Text>
              <Text style={s.extraStatLabel}>{lang === 'en' ? 'Top continent' : 'Top continente'}</Text>
              <Text style={s.extraStatValue}>{nombreContinenteEn(continenteMasVisitado, lang)}</Text>
            </View>
          )}
          {paisMasCiudades && (
            <View style={s.extraStatGrid}>
              <Text style={s.extraStatEmoji}>{paisMasCiudades.emoji}</Text>
              <Text style={s.extraStatLabel}>{lang === 'en' ? 'Most cities' : 'Más ciudades'}</Text>
              <Text style={s.extraStatValue}>{nombrePaisEn(paisMasCiudades.nombre, lang)}</Text>
            </View>
          )}
        </View>

        <CiudadesListado />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={[s.safe, { paddingTop: insets.top, backgroundColor: '#5c1011' }]} />
      <View style={s.header}>
        <Text style={s.titulo}> {t.misViajes}</Text>
        <View style={s.headerBotones}>
          <TouchableOpacity style={[s.vistaBtn, vista === 'lista' && s.vistaBtnActivo]} onPress={() => setVista('lista')}>
            <Text style={[s.vistaBtnT, vista === 'lista' && s.vistaBtnTActivo]}>{lang === 'en' ? 'List' : 'Lista'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.vistaBtn, vista === 'mapa' && s.vistaBtnActivo]} onPress={() => setVista('mapa')}>
            <Text style={[s.vistaBtnT, vista === 'mapa' && s.vistaBtnTActivo]}>{lang === 'en' ? 'Map' : 'Mapa'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.vistaBtn, vista === 'stats' && s.vistaBtnActivo]} onPress={() => setVista('stats')}>
            <Text style={[s.vistaBtnT, vista === 'stats' && s.vistaBtnTActivo]}>{lang === 'en' ? 'Stats' : 'Datos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCerrar} style={s.cerrar}><Text style={s.cerrarT}>✕</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 20 }}>

        {vista === 'stats' && <StatsContent />}

        {vista === 'mapa' && (
          <>
            <View style={s.mapaBoxFull}>
              <MapView
                style={s.mapaFull}
                initialRegion={{ latitude: 20, longitude: 0, latitudeDelta: 120, longitudeDelta: 120 }}
                mapType="none"
                key={`mapa-${Date.now()}`}
              >
                <OsmTileLayer />
                {paisesVisitadosConCoords.map(pais => (
                  <Marker
                    key={pais.id}
                    coordinate={{ latitude: CAPITALES[pais.id].lat, longitude: CAPITALES[pais.id].lng }}
                    onPress={() => { setModalPais(pais); setCiudad(''); }}
                  >
                    <View style={s.paisPin}><Text style={{ fontSize: 20 }}>{pais.emoji}</Text></View>
                  </Marker>
                ))}
              </MapView>
              {paisesVisitadosConCoords.length === 0 && (
                <View style={s.mapaVacio}><Text style={s.mapaVacioT}>{t.marcaPaises}</Text></View>
              )}
            </View>
            <CiudadesListado />
          </>
        )}

        {vista === 'lista' && (
          <>
            {/* Grid 2x3 de continentes */}
            <View style={s.contGrid}>
              {CONTINENTES.map(c => {
                const visitadosEnCont = PAISES.filter(p => p.continente === c.key && datosPais(p.id).visitado).length;
                const totalEnCont = PAISES.filter(p => p.continente === c.key).length;
                const activo = continente === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[s.contCard, activo && s.contCardActivo]}
                    onPress={() => setContinente(c.key)}
                  >
                    <Text style={s.contCardEmoji}>{c.emoji}</Text>
                    <Text style={[s.contCardNombre, activo && s.contCardNombreActivo]}>{nombreContinenteEn(c.key, lang)}</Text>
                    <Text style={[s.contCardCount, activo && s.contCardCountActivo]}>{visitadosEnCont}/{totalEnCont}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.contResumen}>{visitadosCont} {t.de} {filtrados.length} {t.paisesEn} {nombreContinenteEn(continente, lang)}</Text>
            <View style={s.grid}>
              {filtrados.map(pais => {
                const d = datosPais(pais.id);
                return (
                  <TouchableOpacity key={pais.id} style={[s.paisCard, d.visitado && s.paisCardV]} onPress={() => { setModalPais(pais); setCiudad(''); }}>
                    <Text style={s.paisEmoji}>{pais.emoji}</Text>
                    <Text style={[s.paisNombre, d.visitado && s.paisNombreV]}>{nombrePaisEn(pais.nombre, lang)}</Text>
                    {d.visitado && <View style={s.dot} />}
                    {d.ciudades.length > 0 && <Text style={s.ciudadesCount}>{d.ciudades.length}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.ayuda}>{t.tocaPais}</Text>
          </>
        )}

      </ScrollView>

      <Modal visible={!!modalPais} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <TouchableOpacity onPress={() => setModalPais(null)} style={s.modalCerrarX}>
              <Text style={s.modalCerrarXT}>✕</Text>
            </TouchableOpacity>

            <View style={s.drag} />
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitulo}>{modalPais?.emoji} {nombrePaisEn(modalPais?.nombre, lang)}</Text>
                <Text style={s.modalSub}>{nombreContinenteEn(modalPais?.continente, lang)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.toggleBtn, datosPais(modalPais?.id ?? '').visitado && s.toggleBtnActivo]}
              onPress={() => { if (modalPais) togglePaisVisitado(modalPais.id); }}
            >
              <Text style={[s.toggleBtnT, { color: datosPais(modalPais?.id ?? '').visitado ? '#f5e6c8' : '#5c1011' }]}>
                {datosPais(modalPais?.id ?? '').visitado
                  ? t.visitado + (lang === 'en' ? ' — tap to unmark' : ' — toca para desmarcar')
                  : t.marcarVisitado}
              </Text>
            </TouchableOpacity>

            <Text style={[s.secLabel, { marginTop: 16, marginBottom: 8 }]}>{t.añadirCiudad}</Text>
            <View style={s.addRow}>
              <TextInput
                style={s.input}
                placeholder={t.nombreCiudadPasaporte}
                placeholderTextColor="#bbb"
                value={ciudad}
                onChangeText={setCiudad}
                onSubmitEditing={añadir}
              />
              <TouchableOpacity style={s.addBtn} onPress={añadir}><Text style={s.addBtnT}>+</Text></TouchableOpacity>
            </View>

            {datosPais(modalPais?.id ?? '').ciudades.map((c, idx) => {
              const nombre = typeof c === 'string' ? c : c.nombre;
              return (
                <View key={`${nombre}-${idx}`} style={s.ciudadFila}>
                  <Text style={s.ciudadT}>📍 {nombre}</Text>
                  <TouchableOpacity onPress={() => borrarCiudadViaje(modalPais.id, nombre)}>
                    <Text style={s.ciudadDel}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {datosPais(modalPais?.id ?? '').ciudades.length === 0 && (
              <Text style={{ fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 12 }}>{t.sinCiudades}</Text>
            )}
          </View>
        </View>
      </Modal>

            {/* Modal de lista (stats clicables) */}
      <Modal visible={!!modalLista} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <TouchableOpacity onPress={() => setModalLista(null)} style={s.modalCerrarX}>
              <Text style={s.modalCerrarXT}>✕</Text>
            </TouchableOpacity>
            <View style={s.drag} />

            {modalLista === 'paises' && (
              <>
                <Text style={s.modalTitulo}>🌍 {lang === 'en' ? 'Countries visited' : 'Países visitados'} ({totalPaises})</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {PAISES.filter(p => datosPais(p.id).visitado).sort((a,b) => nombrePaisEn(a.nombre, lang).localeCompare(nombrePaisEn(b.nombre, lang), lang === 'en' ? 'en' : 'es')).map(p => (
                    <View key={p.id} style={s.listaFila}>
                      <Text style={{ fontSize: 18, marginRight: 10 }}>{p.emoji}</Text>
                      <Text style={s.listaFilaT}>{nombrePaisEn(p.nombre, lang)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {modalLista === 'ciudades' && (
              <>
                <Text style={s.modalTitulo}>🏙️ {lang === 'en' ? 'Cities visited' : 'Ciudades visitadas'} ({totalCiudades})</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {todasLasCiudades.map((c, i) => (
                    <View key={`${c.paisId}-${c.nombre}-${i}`} style={s.listaFila}>
                      <Text style={{ fontSize: 18, marginRight: 10 }}>{c.paisEmoji}</Text>
                      <View>
                        <Text style={s.listaFilaT}>{c.nombre}</Text>
                        <Text style={{ fontSize: 11, color: '#8a7e72' }}>{c.paisNombre}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {modalLista === 'continentes' && (
              <>
                <Text style={s.modalTitulo}>🌐 {lang === 'en' ? 'Continents visited' : 'Continentes visitados'} ({continentesVisitados})</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {Array.from(new Set(PAISES.filter(p => datosPais(p.id).visitado).map(p => p.continente))).sort().map(cont => (
                    <View key={cont} style={s.listaFila}>
                      <Text style={{ fontSize: 18, marginRight: 10 }}>🌍</Text>
                      <Text style={s.listaFilaT}>{nombreContinenteEn(cont, lang)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f4f0' },
  flex: { flex: 1 },
  safe: { backgroundColor: '#5c1011' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  titulo: { flex: 1, fontSize: 18, fontWeight: '600', color: '#d4a843' },
  headerBotones: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // BOTONES: inactivo = borde dorado + texto granate. Activo = fondo dorado + texto granate
  vistaBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: '#d4a843', backgroundColor: 'transparent' },
  vistaBtnActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },  // ← fondo ROJO activo
  vistaBtnT: { fontSize: 12, fontWeight: '700', color: '#d4a843' },
  vistaBtnTActivo: { color: '#f5e6c8' },  // ← mismo color crema, NO cambia
  cerrar: { borderWidth: 1.5, borderColor: '#d4a843', borderRadius: 10, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  cerrarT: { fontSize: 14, color: '#d4a843', fontWeight: '700' },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCardGrid: { width: '31%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNumGrid: { fontSize: 18, fontWeight: '700', color: '#5c1011' },
  statLabelGrid: { fontSize: 10, color: '#8a7e72', marginTop: 2, textAlign: 'center' },
  progressBox: { marginBottom: 16 },
  progressBg: { height: 6, backgroundColor: '#e5e2dd', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#d4a843', borderRadius: 3 },
  progressT: { fontSize: 11, color: '#8a7e72', marginTop: 6, textAlign: 'center' },
  extraStatsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  extraStatGrid: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  extraStatEmoji: { fontSize: 22, marginBottom: 4 },
  extraStatLabel: { fontSize: 10, color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5 },
  extraStatValue: { fontSize: 13, fontWeight: '600', color: '#5c1011', marginTop: 2, textAlign: 'center' },
  // Mapa
  listaFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0eeea' },
  listaFilaT: { fontSize: 15, fontWeight: '500', color: '#2c1810' },
  mapaBoxFull: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', height: 420 },
  mapaFull: { flex: 1 },
  mapaVacio: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'rgba(92,16,17,0.85)', borderRadius: 12, padding: 16, alignItems: 'center' },
  mapaVacioT: { color: '#f5e6c8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  paisPin: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  // Lista - Grid continentes 2x3
  contGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, paddingTop: 16, paddingBottom: 8 },
  contCard: { width: '31%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  contCardActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  contCardEmoji: { fontSize: 24, marginBottom: 4 },
  contCardNombre: { fontSize: 10, fontWeight: '600', color: '#555', textAlign: 'center' },
  contCardNombreActivo: { color: '#f5e6c8' },
  contCardCount: { fontSize: 11, color: '#8a7e72', marginTop: 2 },
  contCardCountActivo: { color: '#d4a843' },
  contResumen: { paddingHorizontal: 16, marginBottom: 10, fontSize: 12, color: '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  paisCard: { width: '30%', backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  paisCardV: { borderColor: '#5c1011', backgroundColor: '#faf6f0' },
  paisEmoji: { fontSize: 22, marginBottom: 3 },
  paisNombre: { fontSize: 10, fontWeight: '500', color: '#555', textAlign: 'center' },
  paisNombreV: { color: '#2c1810', fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d4a843', marginTop: 4 },
  ciudadesCount: { fontSize: 10, color: '#5c1011', marginTop: 2, fontWeight: '500' },
  ayuda: { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14, paddingHorizontal: 20, paddingBottom: 8 },
  // Ciudades listado
  ciudadesSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e8dfd5' },
  ciudadesSectionTitulo: { fontSize: 14, fontWeight: '700', color: '#5c1011', marginBottom: 12 },
  ciudadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0eeea' },
  ciudadRowEmoji: { fontSize: 18, marginRight: 10 },
  ciudadRowInfo: { flex: 1 },
  ciudadRowNombre: { fontSize: 14, fontWeight: '600', color: '#2c1810' },
  ciudadRowPais: { fontSize: 11, color: '#8a7e72', marginTop: 1 },
  // Modal
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  modalCont: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, position: 'relative' },
  modalCerrarX: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#f0eeea', borderRadius: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalCerrarXT: { fontSize: 14, color: '#555' },
  drag: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { marginBottom: 16 },
  modalTitulo: { fontSize: 17, fontWeight: '600', color: '#2c1810', marginBottom: 18 },
  modalSub: { fontSize: 13, color: '#8a7e72' },
  toggleBtn: { backgroundColor: '#faf6f0', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  toggleBtnActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  toggleBtnT: { fontWeight: '600', fontSize: 13 },
  secLabel: { fontSize: 11, fontWeight: '600', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#f7f4f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#2c1810', borderWidth: 1, borderColor: '#e8dfd5' },
  addBtn: { backgroundColor: '#5c1011', borderRadius: 10, width: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnT: { color: '#f5e6c8', fontWeight: '700', fontSize: 20 },
  ciudadFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0eeea' },
  ciudadT: { fontSize: 14, color: '#333' },
  ciudadDel: { fontSize: 14, color: '#ccc', paddingHorizontal: 6 },
});