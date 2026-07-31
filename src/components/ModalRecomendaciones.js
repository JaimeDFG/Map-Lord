import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { CATEGORIAS } from '../constants/tourism';
import { buscarCoordenadasCiudad, buscarLugaresDestacados } from '../services/poiSearch';

export default function ModalRecomendaciones({ visible, ciudad, pais, lang, onCerrar, onAñadir, poisExistentes = [] }) {
  const [cargando, setCargando] = useState(false);
  const [lugares, setLugares] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function buscar() {
    if (cargando) return;
    setCargando(true);
    setBuscado(true);
    setLugares([]);
    setErrorMsg('');

    const coords = await buscarCoordenadasCiudad(ciudad, pais);

    if (!coords) {
      setErrorMsg(lang === 'en' ? 'Could not locate the city.' : 'No se pudo localizar la ciudad.');
      setCargando(false);
      return;
    }

    const resultados = await buscarLugaresDestacados(coords.lat, coords.lon, 12000, 5, ciudad);

    // ELIMINAR DUPLICADOS: quitamos los que el usuario YA tiene
    const nombresExistentes = new Set(
      poisExistentes
        .filter(p => (p.ciudad ?? '').toLowerCase() === (ciudad ?? '').toLowerCase())
        .map(p => p.nombre.toLowerCase().trim())
    );
    const filtrados = resultados.filter(r => !nombresExistentes.has(r.nombre.toLowerCase().trim()));

    if (filtrados.length === 0) {
      setErrorMsg(lang === 'en' ? 'No new places found — you may already have them all.' : 'No hay lugares nuevos — quizás ya los tienes todos.');
    }

    setLugares(filtrados);
    setCargando(false);
  }

  function cerrar() {
    setLugares([]);
    setBuscado(false);
    setErrorMsg('');
    setCargando(false);
    onCerrar();
  }

  const yaTienesAlgunos = poisExistentes.filter(p => (p.ciudad ?? '').toLowerCase() === (ciudad ?? '').toLowerCase()).length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.cont}>
          <View style={s.drag} />
          <View style={s.headerRow}>
            <Text style={s.titulo}>✦ {lang === 'en' ? 'Discover' : 'Descubre'} {ciudad}</Text>
            <TouchableOpacity style={s.cerrar} onPress={cerrar}><Text style={s.cerrarT}>✕</Text></TouchableOpacity>
          </View>

          {!buscado && (
            <View style={s.centro}>
              <Text style={s.emoji}>✦</Text>
              <Text style={s.sub}>{lang === 'en' ? `Find interesting places in ${ciudad}` : `Encuentra lugares interesantes en ${ciudad}`}</Text>
              <TouchableOpacity style={s.btnBuscar} onPress={buscar}>
                <Text style={s.btnBuscarT}>{lang === 'en' ? 'Search places' : 'Buscar lugares'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {cargando && (
            <View style={s.centro}>
              <ActivityIndicator color="#5c1011" />
              <Text style={s.cargandoT}>{lang === 'en' ? 'Searching in OpenStreetMap...' : 'Buscando en OpenStreetMap...'}</Text>
            </View>
          )}

          {buscado && !cargando && lugares.length === 0 && (
            <View style={s.centro}>
              <Text style={s.emoji}>✦</Text>
              <Text style={s.sub}>
                {yaTienesAlgunos
                  ? (lang === 'en' ? `You already have all the recommended places for ${ciudad}.` : `Ya tienes todos los lugares recomendados para ${ciudad}.`)
                  : (lang === 'en' ? `We don't have recommendations for ${ciudad} yet.` : `Aún no tenemos recomendaciones para ${ciudad}.`)
                }
              </Text>
              {!yaTienesAlgunos && (
                <Text style={s.hint}>
                  {lang === 'en'
                    ? 'Try: Madrid, Paris, Rome, London, Barcelona, New York, Tokyo, Lisbon, Amsterdam, Berlin, Vienna, Florence, Venice, Athens, Prague, Istanbul, Buenos Aires, Mexico City, Rio de Janeiro, Kyoto.'
                    : 'Prueba: Madrid, París, Roma, Londres, Barcelona, Nueva York, Tokio, Lisboa, Ámsterdam, Berlín, Viena, Florencia, Venecia, Atenas, Praga, Estambul, Buenos Aires, Ciudad de México, Río de Janeiro, Kioto.'
                  }
                </Text>
              )}
            </View>
          )}

          {lugares.length > 0 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.resultadosLabel}>{lugares.length} {lang === 'en' ? 'places found' : 'lugares encontrados'}</Text>
              {lugares.map((lugar, i) => {
                const cat = CATEGORIAS[lugar.categoria] ?? { emoji: '✦', color: '#8a7e72' };
                const estrellas = '★'.repeat(lugar.prioridad) + '☆'.repeat(3 - lugar.prioridad);
                return (
                  <View key={i} style={s.lugarCard}>
                    <View style={[s.lugarIcono, { backgroundColor: cat.color + '20' }]}>
                      <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                    </View>
                    <View style={s.lugarInfo}>
                      <Text style={s.lugarNombre}>{lugar.nombre}</Text>
                      <Text style={s.lugarSub}>{cat.labelEs} · {estrellas}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.btnAñadir}
                      onPress={() => {
                        onAñadir({
                          ...lugar,
                          ciudad: ciudad,
                          tiempo_visita: 45,
                          visitado: false,
                        });
                      }}
                    >
                      <Text style={s.btnAñadirT}>+</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  cont: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  drag: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#2c1810' },
  cerrar: { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cerrarT: { fontSize: 13, color: '#555' },
  centro: { alignItems: 'center', paddingVertical: 40 },
  emoji: { fontSize: 40, marginBottom: 12, color: '#d4a843' },
  sub: { fontSize: 14, color: '#8a7e72', textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 },
  hint: { fontSize: 12, color: '#bbb', textAlign: 'center', paddingHorizontal: 30, marginTop: 8 },
  btnBuscar: { backgroundColor: '#5c1011', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  btnBuscarT: { color: '#f5e6c8', fontSize: 15, fontWeight: '700' },
  cargandoT: { marginTop: 16, fontSize: 13, color: '#8a7e72' },
  resultadosLabel: { fontSize: 11, fontWeight: '700', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  lugarCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  lugarIcono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lugarInfo: { flex: 1 },
  lugarNombre: { fontSize: 15, fontWeight: '600', color: '#2c1810' },
  lugarSub: { fontSize: 12, color: '#8a7e72', marginTop: 2 },
  btnAñadir: { backgroundColor: '#5c1011', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  btnAñadirT: { color: '#f5e6c8', fontSize: 20, fontWeight: '700' },
});