import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import OsmTileLayer from '../components/OsmTileLayer';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import FichaPOI from '../components/FichaPOI';
import { CATEGORIAS, RELEVANCIA, labelCategoria, labelRelevancia } from '../constants/tourism';

export default function PantallaLugares({ ciudad, onAbrirPOI }) {
  const { lang, todosLosPois, poisVisitados, togglePoiVisitado } = useApp();
  const t = useT(lang);
  const insets = useSafeAreaInsets();

  const [poiEnMapa, setPoiEnMapa]   = useState(null);
  const [fichaMapaVisible, setFichaMapaVisible] = useState(false);

  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [relevancisFiltro, setRelevanciaFiltro] = useState(null);
  const [soloNoVisitados, setSoloNoVisitados] = useState(false);
  const [modalMapa, setModalMapa] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const centro = ciudad?.coordenadas ?? { latitude: 40.4168, longitude: -3.7038 };
  const region = { ...centro, latitudeDelta: 0.04, longitudeDelta: 0.04 };

// POIs filtrados por ciudad usando el campo ciudad del JSON
  const nombreCiudad = ciudad?.nombre?.toLowerCase() ?? 'madrid';
  const poisDeLaCiudad = todosLosPois.filter(p =>
    (p.ciudad ?? 'Madrid').toLowerCase() === nombreCiudad
  );

  // Filtrar POIs de la ciudad según los filtros activos
  const poisFiltrados = poisDeLaCiudad.filter(poi => {
    if (categoriaFiltro && poi.categoria !== categoriaFiltro) return false;
    if (relevancisFiltro && poi.relevancia !== relevancisFiltro) return false;
    if (soloNoVisitados && poisVisitados[poi.id]) return false;
    if (busqueda.trim() && !poi.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const totalVisitados = poisDeLaCiudad.filter(p => poisVisitados[p.id]).length;

  const categoriasUsadas = [...new Set(poisDeLaCiudad.map(p => p.categoria))];

  function limpiarFiltros() {
    setCategoriaFiltro(null);
    setRelevanciaFiltro(null);
    setSoloNoVisitados(false);
    setBusqueda('');
  }

  const hayFiltros = categoriaFiltro || relevancisFiltro || soloNoVisitados || busqueda.trim();

  return (
    <View style={s.root}>
        <View style={[s.safe, { paddingTop: insets.top }]}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.titulo}>📋 {t.lugares}</Text>
              <Text style={s.sub}>
                {totalVisitados}/{poisDeLaCiudad.length} {t.visitados2} · {t.mostrando} {poisFiltrados.length}
              </Text>
            </View>
            {hayFiltros && (
              <TouchableOpacity style={s.btnLimpiar} onPress={limpiarFiltros}>
                <Text style={s.btnLimpiarT}>✕ {lang === 'en' ? 'Clear' : 'Limpiar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      {/* Barra de búsqueda */}
      <View style={s.buscadorBox}>
        <TextInput
          style={s.buscador}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={t.buscarLugar}
          placeholderTextColor="#bbb"
        />
      </View>

      <View style={s.leyenda}>
      <View style={s.leyendaItem}>
        <View style={[s.leyendaDot, { backgroundColor: '#16a34a' }]}/>
        <Text style={s.leyendaT}>{t.visitado}</Text>
      </View>
      <View style={s.leyendaItem}>
        <View style={[s.leyendaDot, { backgroundColor: '#e5e7eb' }]}/>
        <Text style={s.leyendaT}>{t.sinVisitar}</Text>
      </View>
      <Text style={s.leyendaHint}>{t.tocaParaMarcar}</Text>
    </View>

      {/* Filtros categoría */}
      <View style={s.filtrosScroll}>
        {categoriasUsadas.map(cat => {
          const info = CATEGORIAS[cat] ?? { emoji: '📍', color: '#888' };
          const activo = categoriaFiltro === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.filtroChip, activo && { backgroundColor: info.color, borderColor: info.color }]}
              onPress={() => setCategoriaFiltro(activo ? null : cat)}
            >
              <Text style={s.filtroChipEmoji}>{info.emoji}</Text>
              <Text style={[s.filtroChipT, activo && s.filtroChipTActivo]}>{labelCategoria(cat, lang)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filtros relevancia */}
      <View style={s.relevanciaRow}>
        {[3, 2, 1].map(r => {
          const rel = RELEVANCIA[r];
          const activo = relevancisFiltro === r;
          return (
            <TouchableOpacity
              key={r}
              style={[s.relChip, activo && { backgroundColor: rel.color, borderColor: rel.color }]}
              onPress={() => setRelevanciaFiltro(activo ? null : r)}
            >
              <Text style={[s.relChipT, activo && { color: '#fff' }]}>{rel.estrellas}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[s.relChip, soloNoVisitados && s.relChipActivo]}
          onPress={() => setSoloNoVisitados(!soloNoVisitados)}
        >
          <Text style={[s.relChipT, soloNoVisitados && { color: '#fff' }]}>{t.sinVisitar}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <ScrollView style={s.flex} contentContainerStyle={s.lista}>
        {poisFiltrados.length === 0 && (
          <Text style={s.vacio}>{t.sinLugares}</Text>
        )}
        {poisFiltrados.map(poi => {
          const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#888' };
          const rel = RELEVANCIA[poi.relevancia];
          const visitado = poisVisitados[poi.id];
          return (
            <TouchableOpacity
              key={poi.id}
              style={[s.card, visitado && s.cardVisitado]}
              onPress={() => onAbrirPOI(poi)}
            >
              <View style={[s.cardIcono, { backgroundColor: cat.color + '20' }]}>
                <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                {visitado && (
                  <View style={s.checkBadge}>
                    <Text style={s.checkBadgeT}>✓</Text>
                  </View>
                )}
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardNombre}>{poi.nombre}</Text>
                <Text style={s.cardSub}>{poi.categoria} · ⏱ {poi.tiempo_visita} min</Text>
                <Text style={[s.cardRel, { color: rel?.color }]}>{rel?.estrellas} {rel?.label}</Text>
              </View>
              <TouchableOpacity
                style={[s.btnVisitar, visitado && s.btnVisitarActivo]}
                onPress={() => togglePoiVisitado(poi.id)}
              >
                <Text style={s.btnVisitarT}>{visitado ? '✓' : '○'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botón flotante ver en mapa */}
      <TouchableOpacity style={s.btnMapa} onPress={() => setModalMapa(true)}>
        <Text style={s.btnMapaT}>🗺️ {t.verEnMapa} ({poisFiltrados.length})</Text>
      </TouchableOpacity>

      {/* Modal mapa con filtro */}
      <Modal visible={modalMapa} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: '#1a1a2e', paddingTop: insets.top }}>
            <View style={s.modalMapaHeader}>
              <Text style={s.modalMapaTitulo}>
                {labelCategoria(categoriaFiltro, lang) ?? t.todosLosLugares} · {poisFiltrados.length}
              </Text>
              <TouchableOpacity onPress={() => setModalMapa(false)} style={s.modalMapaCerrar}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <MapView style={{ flex: 1 }} initialRegion={region} mapType="none">
            <OsmTileLayer />
            {/* Pins atenuados: los que NO están en el filtro */}
            {poisDeLaCiudad
              .filter(p => !poisFiltrados.find(f => f.id === p.id))
              .map(poi => {
                const cat = CATEGORIAS[poi.categoria] ?? { color: '#888', emoji: '📍' };
                return (
                  <Marker key={poi.id} coordinate={poi.coordenadas}>
                    <View style={[s.pinAtenuado, { backgroundColor: cat.color }]}>
                      <Text style={{ fontSize: 10 }}>{cat.emoji}</Text>
                    </View>
                  </Marker>
                );
              })}
            {/* Pins destacados: los que SÍ están en el filtro */}
            {poisFiltrados.map(poi => {
              const cat = CATEGORIAS[poi.categoria] ?? { color: '#888', emoji: '📍' };
              const visitado = poisVisitados[poi.id];
              return (
                <Marker
                  key={poi.id}
                  coordinate={poi.coordenadas}
                  onPress={() => setPoiEnMapa(poi)}
                >
                  <View style={[s.pinDestacado, { backgroundColor: cat.color }]}>
                    <Text style={{ fontSize: 16 }}>{visitado ? '✓' : cat.emoji}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
          {/* Ficha rápida dentro del mapa filtrado */}
          {poiEnMapa && (
            <View style={s.fichaEnMapa}>
              <View style={{ flex: 1 }}>
                <Text style={s.fichaEnMapaNombre}>{poiEnMapa.nombre}</Text>
                <Text style={s.fichaEnMapaSub}>{labelCategoria(poiEnMapa.categoria, lang)} · ⏱ {poiEnMapa.tiempo_visita} {t.min}</Text>
              </View>
              <TouchableOpacity
                style={s.fichaEnMapaBtn}
                onPress={() => setFichaMapaVisible(true)}
              >
                <Text style={s.fichaEnMapaBtnT}>{t.verFicha}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.fichaEnMapaCerrar}
                onPress={() => setPoiEnMapa(null)}
              >
                <Text style={{ color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FichaPOI dentro del mapa: al cerrar el usuario permanece en el mapa */}
          <FichaPOI
            poi={poiEnMapa}
            visible={fichaMapaVisible}
            onCerrar={() => setFichaMapaVisible(false)}
          />

        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc' },
  flex:           { flex: 1 },
  safe:           { backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  titulo:         { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  sub:            { fontSize: 11, color: '#888', marginTop: 1 },
  btnLimpiar:     { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  btnLimpiarT:    { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  buscadorBox:    { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  buscador:       { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  filtroChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', gap: 5, marginBottom: 2 },  filtroChipEmoji:{ fontSize: 13 },
  filtroChipT:    { fontSize: 12, fontWeight: '600', color: '#555' },
  filtroChipTActivo: { color: '#fff' },
  relChip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  relChipActivo:  { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  relChipT:       { fontSize: 12, fontWeight: '600', color: '#555' },
  lista:          { paddingHorizontal: 16, paddingTop: 8 },
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardVisitado:   { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  cardIcono:      { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  checkBadge:     { position: 'absolute', top: -4, right: -4, backgroundColor: '#16a34a', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  checkBadgeT:    { color: '#fff', fontSize: 9, fontWeight: '800' },
  cardInfo:       { flex: 1 },
  cardNombre:     { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  cardSub:        { fontSize: 12, color: '#888', marginTop: 2 },
  cardRel:        { fontSize: 11, marginTop: 2 },
  btnVisitar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  btnVisitarActivo: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  btnVisitarT:    { fontSize: 16, fontWeight: '800', color: '#888' },
  safeRoot: { flex: 1, backgroundColor: '#f8fafc' },
  vacio:          { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
  btnMapa:        { position: 'absolute', bottom: 16, left: 40, right: 40, backgroundColor: '#1a1a2e', borderRadius: 28, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  btnMapaT:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalMapaHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  modalMapaTitulo:{ fontSize: 16, fontWeight: '700', color: '#fff' },
  modalMapaCerrar:{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  filtrosScroll:  { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4, gap: 6, flexWrap: 'wrap', flexDirection: 'row' },
  relevanciaRow:  { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 2, paddingBottom: 2, gap: 6 },
  leyenda:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4, gap: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaDot:  { width: 12, height: 12, borderRadius: 6 },
  leyendaT:    { fontSize: 11, color: '#555', fontWeight: '600' },
  leyendaHint: { marginLeft: 'auto', fontSize: 11, color: '#aaa' },
  fichaEnMapa:       { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, gap: 10 },
  fichaEnMapaNombre: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  fichaEnMapaSub:    { fontSize: 12, color: '#888', marginTop: 2 },
  fichaEnMapaBtn:    { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  fichaEnMapaBtnT:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  fichaEnMapaCerrar: { paddingLeft: 4 },
  fichaEnMapa:       { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, gap: 10 },
  fichaEnMapaNombre: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  fichaEnMapaSub:    { fontSize: 12, color: '#888', marginTop: 2 },
  fichaEnMapaBtn:    { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  fichaEnMapaBtnT:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  fichaEnMapaCerrar: { paddingLeft: 4 },
  pinAtenuado:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: 0.3, overflow: 'visible' },
  pinDestacado: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', overflow: 'visible', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, elevation: 10 },
});