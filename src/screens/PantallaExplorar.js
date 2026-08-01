import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile  } from 'react-native-maps';
import OsmTileLayer from '../components/OsmTileLayer';
import ModalRecomendaciones from '../components/ModalRecomendaciones';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, labelCategoria, labelRelevancia, nombrePaisEn } from '../constants/tourism';

export default function PantallaExplorar({ ciudad, pais, onAbrirPOI, onEditar, poiPrerellenado, onPoiPrerellenadoUsado }) {
  const { lang, rutaActiva, setRutaActiva, todosLosPois, añadirPoi, marcadorInicio } = useApp();
  const t = useT(lang);
  const insets = useSafeAreaInsets();

  const puntoVacio = {
    nombre: '', categoria: 'Monumento', prioridad: 2,
    latitude: '', longitude: '', descripcion: '', tiempo_visita: '30',
  };

  const [poiResumen, setPoiResumen]       = useState(null);
  const [modalNuevo, setModalNuevo]       = useState(false);
  const [modoPunto, setModoPunto]         = useState(false);
  const [nuevoPunto, setNuevoPunto]       = useState(puntoVacio);
  const [modalRecomendaciones, setModalRecomendaciones] = useState(false);
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState(new Set());
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [filtroEstado, setFiltroEstado]       = useState('todos');

  useEffect(() => {
    if (!poiPrerellenado) return;
    setNuevoPunto({
      ...puntoVacio,
      nombre:    poiPrerellenado.nombre ?? '',
      latitude:  String(poiPrerellenado.coordenadas?.latitude ?? ''),
      longitude: String(poiPrerellenado.coordenadas?.longitude ?? ''),
      prioridad: 3,
    });
    setModalNuevo(true);
    onPoiPrerellenadoUsado?.();
  }, [poiPrerellenado]);

  const nombreCiudad = ciudad?.nombre?.toLowerCase() ?? '';
  const poisLocales = todosLosPois.filter(p =>
    (p.ciudad ?? 'Madrid').toLowerCase() === nombreCiudad
  );

  // Aplicar filtros
  const poisFiltrados = poisLocales.filter(p => {
    if (filtroCategoria.size > 0 && !filtroCategoria.has(p.categoria)) return false;
    const prio = p.prioridad ?? p.relevancia ?? 2;
    if (filtroPrioridad !== 'todas' && String(prio) !== filtroPrioridad) return false;
    const visitado = p.visitado ?? false;
    if (filtroEstado === 'visitados' && !visitado) return false;
    if (filtroEstado === 'pendientes' && visitado) return false;
    return true;
  });

  const poisDelMapa = poisFiltrados;

  const centroPois = poisDelMapa.length > 0
    ? {
        latitude:  poisDelMapa.reduce((s, p) => s + p.coordenadas.latitude,  0) / poisDelMapa.length,
        longitude: poisDelMapa.reduce((s, p) => s + p.coordenadas.longitude, 0) / poisDelMapa.length,
      }
    : null;
  const centro = centroPois ?? ciudad?.coordenadas ?? { latitude: 40.4168, longitude: -3.7038 };

  const CIUDAD_DELTA = 0.12;
  const POI_DELTA    = 0.01;
  const MARGEN       = 1.3;

  let latDelta, lonDelta;
  if (poisDelMapa.length === 0) {
    latDelta = CIUDAD_DELTA;
    lonDelta = CIUDAD_DELTA;
  } else if (poisDelMapa.length === 1) {
    latDelta = POI_DELTA;
    lonDelta = POI_DELTA;
  } else {
    const lats = poisDelMapa.map(p => p.coordenadas.latitude);
    const lons = poisDelMapa.map(p => p.coordenadas.longitude);
    latDelta = Math.max((Math.max(...lats) - Math.min(...lats)) * MARGEN + 0.003, POI_DELTA);
    lonDelta = Math.max((Math.max(...lons) - Math.min(...lons)) * MARGEN + 0.003, POI_DELTA);
  }
  const region = { ...centro, latitudeDelta: latDelta, longitudeDelta: lonDelta };

  function handlePin(poi) {
    const enRuta = rutaActiva?.find(p => p.id === poi.id);
    if (rutaActiva && enRuta) setPoiResumen(poi);
    else onAbrirPOI(poi);
  }

  function handleMapaPress(e) {
    if (!modoPunto) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setNuevoPunto(prev => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setModoPunto(false);
    setModalNuevo(true);
  }

  function guardarNuevoPunto() {
    const lat = parseFloat(nuevoPunto.latitude);
    const lon = parseFloat(nuevoPunto.longitude);
    if (!nuevoPunto.nombre.trim() || isNaN(lat) || isNaN(lon)) return;

    añadirPoi({
      id: `poi_${Date.now()}`,
      ciudad: ciudad?.nombre ?? 'Madrid',
      nombre: nuevoPunto.nombre.trim(),
      coordenadas: { latitude: lat, longitude: lon },
      categoria: nuevoPunto.categoria,
      prioridad: parseInt(nuevoPunto.prioridad),
      descripcion: nuevoPunto.descripcion.trim(),
      tiempo_visita: parseInt(nuevoPunto.tiempo_visita) || 30,
      visitado: false,
    });

    setModalNuevo(false);
    setModoPunto(false);
    setNuevoPunto({ ...puntoVacio });
  }

  function toggleCategoria(cat) {
    setFiltroCategoria(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const numParada = poiResumen && rutaActiva ? rutaActiva.findIndex(p => p.id === poiResumen.id) + 1 : null;

  return (
    <View style={s.root}>
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitulo}>{ciudad?.nombre ?? 'Madrid'}</Text>
            <Text style={s.headerSub}>{nombrePaisEn(pais?.nombre ?? 'España', lang)} · {poisLocales.length} {t.lugares}</Text>
          </View>
          <View style={s.headerBotones}>
            {rutaActiva ? (
              <TouchableOpacity style={s.btnCancelar} onPress={() => setRutaActiva(null)}>
                <Text style={s.btnCancelarT}>{t.cancelarRuta}</Text>
              </TouchableOpacity>
              ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[s.btnAdd, { backgroundColor: '#5c1011', borderColor: '#d4a843' }]} onPress={() => setModalRecomendaciones(true)}>
                  <Text style={[s.btnAddT, { color: '#f5e6c8' }]}>✦ {lang === 'en' ? 'Discover' : 'Descubrir'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnAdd} onPress={() => { setModoPunto(true); setModalNuevo(false); }}>
                  <Text style={s.btnAddT}>{t.añadirPunto}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <MapView style={s.mapa} key={`${ciudad?.nombre ?? 'madrid'}_${poisDelMapa.length}`} initialRegion={region} showsUserLocation onPress={handleMapaPress}>
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />
        <OsmTileLayer />
        {rutaActiva && (
          <Polyline coordinates={rutaActiva.map(p => p.coordenadas)} strokeColor="#5c1011" strokeWidth={3} lineDashPattern={[8, 4]} />
        )}
        {rutaActiva && marcadorInicio && rutaActiva.length > 0 && (
          <Polyline coordinates={[marcadorInicio, rutaActiva[0].coordenadas]} strokeColor="#5c1011" strokeWidth={3} lineDashPattern={[8, 4]} />
        )}
        {marcadorInicio && rutaActiva && (
          <Marker coordinate={marcadorInicio}>
            <View style={s.pinInicio}><Text style={{ fontSize: 18 }}>🚩</Text></View>
          </Marker>
        )}
        {poisDelMapa
          .filter(poi => !rutaActiva || rutaActiva.findIndex(p => p.id === poi.id) < 0)
          .map(poi => {
            const cat = CATEGORIAS[poi.categoria] ?? { emoji: '✦', color: '#8a7e72' };
            const visitado = poi.visitado ?? false;
            return (
              <Marker key={poi.id} coordinate={poi.coordenadas} onPress={() => handlePin(poi)}>
                <View style={[s.pin, { backgroundColor: visitado ? '#c4bfb7' : cat.color, opacity: rutaActiva ? 0.35 : 1 }]}>
                  <Text style={s.pinEmoji}>{cat.emoji}</Text>
                </View>
              </Marker>
            );
          })
        }
        {rutaActiva && rutaActiva.map((poi, idx) => {
          return (
            <Marker key={`ruta_${poi.id}`} coordinate={poi.coordenadas} onPress={() => handlePin(poi)} zIndex={10 + idx}>
              <View style={s.pinRuta}><Text style={s.pinNum}>{idx + 1}</Text></View>
            </Marker>
          );
        })}
      </MapView>

      {modoPunto && (
        <View style={s.bannerModo}>
          <Text style={s.bannerModoT}>👆 {lang === 'en' ? 'Tap the map to place the point' : 'Toca el mapa para colocar el punto'}</Text>
          <TouchableOpacity onPress={() => setModoPunto(false)}><Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text></TouchableOpacity>
        </View>
      )}

      {rutaActiva && (
        <View style={s.bannerRuta}>
          <Text style={s.bannerRutaT}>✦ {rutaActiva.length} {t.paradas} · {rutaActiva.reduce((a, p) => a + p.tiempo_visita, 0)} {t.min}</Text>
        </View>
      )}

      {poiResumen && rutaActiva && (
        <View style={s.resumen}>
          <View style={{ flex: 1 }}>
            <Text style={s.resumenParada}>{t.parada} {numParada} {t.de} {rutaActiva.length}</Text>
            <Text style={s.resumenNombre}>{poiResumen.nombre}</Text>
            <Text style={s.resumenSub}>{poiResumen.descripcion || poiResumen.descripcion_corta} · ⏱ {poiResumen.tiempo_visita} {t.min}</Text>
          </View>
          <TouchableOpacity style={s.resumenBtn} onPress={() => { setPoiResumen(null); onAbrirPOI(poiResumen); }}>
            <Text style={s.resumenBtnT}>{t.verFicha}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.resumenClose} onPress={() => setPoiResumen(null)}><Text style={{ color: '#999' }}>✕</Text></TouchableOpacity>
        </View>
      )}

      {/* Filtros */}
      <View style={s.filtrosBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtrosScroll}>
          <TouchableOpacity style={[s.filtroChip, filtroEstado === 'todos' && s.filtroChipActivo]} onPress={() => setFiltroEstado('todos')}>
            <Text style={[s.filtroChipT, filtroEstado === 'todos' && s.filtroChipTActivo]}>{lang === 'en' ? 'All' : 'Todos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.filtroChip, filtroEstado === 'pendientes' && s.filtroChipActivo]} onPress={() => setFiltroEstado('pendientes')}>
            <Text style={[s.filtroChipT, filtroEstado === 'pendientes' && s.filtroChipTActivo]}>⏳ {lang === 'en' ? 'Pending' : 'Pendientes'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.filtroChip, filtroEstado === 'visitados' && s.filtroChipActivo]} onPress={() => setFiltroEstado('visitados')}>
            <Text style={[s.filtroChipT, filtroEstado === 'visitados' && s.filtroChipTActivo]}>✓ {lang === 'en' ? 'Visited' : 'Visitados'}</Text>
          </TouchableOpacity>
          <View style={s.filtroSep} />
          <TouchableOpacity style={[s.filtroChip, filtroPrioridad === 'todas' && s.filtroChipActivo]} onPress={() => setFiltroPrioridad('todas')}>
            <Text style={[s.filtroChipT, filtroPrioridad === 'todas' && s.filtroChipTActivo]}>{lang === 'en' ? 'All ★' : 'Todas ★'}</Text>
          </TouchableOpacity>
          {[3, 2, 1].map(p => (
            <TouchableOpacity key={p} style={[s.filtroChip, filtroPrioridad === String(p) && s.filtroChipActivo]} onPress={() => setFiltroPrioridad(String(p))}>
              <Text style={[s.filtroChipT, filtroPrioridad === String(p) && s.filtroChipTActivo]}>{'★'.repeat(p)}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.filtroSep} />
          <TouchableOpacity style={[s.filtroChip, filtroCategoria.size === 0 && s.filtroChipActivo]} onPress={() => setFiltroCategoria(new Set())}>
            <Text style={[s.filtroChipT, filtroCategoria.size === 0 && s.filtroChipTActivo]}>{lang === 'en' ? 'Categories' : 'Categ.'}</Text>
          </TouchableOpacity>
          {Object.keys(CATEGORIAS).map(cat => {
            const activa = filtroCategoria.has(cat);
            return (
              <TouchableOpacity key={cat} style={[s.filtroChip, activa && s.filtroChipActivo]} onPress={() => toggleCategoria(cat)}>
                <Text style={[s.filtroChipT, activa && s.filtroChipTActivo]}>{CATEGORIAS[cat].emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.lista}>
        <Text style={s.listaTitulo}>
          {rutaActiva ? `${t.rutaActiva} · ${rutaActiva.length} ${t.paradas}` : `${poisDelMapa.length} ${t.lugares}`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.listaScroll}>
          {(rutaActiva ? rutaActiva : poisDelMapa).map((poi, i) => {
            const cat = CATEGORIAS[poi.categoria] ?? { emoji: '✦', color: '#8a7e72' };
            const prio = poi.prioridad ?? poi.relevancia ?? 2;
            const rel = RELEVANCIA[prio];
            const visitado = poi.visitado ?? false;
            return (
              <TouchableOpacity key={poi.id} style={[s.tarjeta, rutaActiva && s.tarjetaRuta, visitado && !rutaActiva && s.tarjetaVisitada]} onPress={() => onAbrirPOI(poi)}>
                {rutaActiva && <View style={s.tarjetaBadge}><Text style={s.tarjetaBadgeT}>{i + 1}</Text></View>}
                <View style={[s.tarjetaIcono, { backgroundColor: cat.color + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                </View>
                <Text style={s.tarjetaNombre} numberOfLines={1}>{poi.nombre}</Text>
                <Text style={[s.tarjetaRel, { color: rel?.color }]}>{rel?.estrellas}</Text>
                {visitado && !rutaActiva && <Text style={s.tarjetaVisitado}>✓</Text>}
                <Text style={s.tarjetaTiempo}>⏱ {poi.tiempo_visita} {t.min}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>


      <ModalRecomendaciones
        visible={modalRecomendaciones}
        ciudad={ciudad?.nombre ?? 'Madrid'}
        pais={pais?.nombre ?? 'España'}
        lang={lang}
        onCerrar={() => setModalRecomendaciones(false)}
        poisExistentes={todosLosPois}
        onAñadir={(lugar) => {
          añadirPoi({
            id: `poi_${Date.now()}`,
            ciudad: ciudad?.nombre ?? 'Madrid',
            nombre: lugar.nombre,
            coordenadas: lugar.coordenadas,
            categoria: lugar.categoria,
            prioridad: lugar.prioridad,
            descripcion: '',
            tiempo_visita: lugar.tiempo_visita || 45,
            visitado: false,
          });
          setModalRecomendaciones(false);
        }}
      />


      {/* Modal nuevo punto */}
      <Modal visible={modalNuevo} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <ScrollView>
            <View style={s.modalCont}>
              <View style={s.drag} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={s.modalTitulo}>✦ {t.añadirPunto}</Text>
                <TouchableOpacity onPress={() => setModalNuevo(false)} style={s.cerrar}>
                  <Text style={{ color: '#555' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>{t.nombre} *</Text>
              <TextInput style={s.input} value={nuevoPunto.nombre} onChangeText={v => setNuevoPunto(p => ({ ...p, nombre: v }))} placeholder={lang === 'en' ? 'E.g. Park fountain...' : 'Ej. Fuente del parque...'} placeholderTextColor="#bbb" />

              <Text style={[s.label, { marginTop: 12 }]}>{t.categoria}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {Object.keys(CATEGORIAS).map(cat => (
                  <TouchableOpacity key={cat} style={[s.chip, nuevoPunto.categoria === cat && s.chipActivo]} onPress={() => setNuevoPunto(p => ({ ...p, categoria: cat }))}>
                    <Text style={[s.chipT, nuevoPunto.categoria === cat && s.chipTActivo]}>{labelCategoria(cat, lang)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>{lang === 'en' ? 'Priority' : 'Prioridad'}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3].map(r => (
                  <TouchableOpacity key={r} style={[s.chip, nuevoPunto.prioridad === r && s.chipActivo]} onPress={() => setNuevoPunto(p => ({ ...p, prioridad: r }))}>
                    <Text style={[s.chipT, nuevoPunto.prioridad === r && s.chipTActivo]}>{'★'.repeat(r)}{'☆'.repeat(3 - r)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{t.latitud} *</Text>
                  <TextInput style={s.input} value={nuevoPunto.latitude} onChangeText={v => setNuevoPunto(p => ({ ...p, latitude: v }))} keyboardType="decimal-pad" placeholder="40.4168" placeholderTextColor="#bbb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{t.longitud} *</Text>
                  <TextInput style={s.input} value={nuevoPunto.longitude} onChangeText={v => setNuevoPunto(p => ({ ...p, longitude: v }))} keyboardType="decimal-pad" placeholder="-3.7038" placeholderTextColor="#bbb" />
                </View>
              </View>
              <TouchableOpacity style={s.botonUbicar} onPress={() => { setModalNuevo(false); setModoPunto(true); }}>
                <Text style={s.botonUbicarT}>✦ {lang === 'en' ? 'Tap map to locate' : 'Tocar mapa para ubicar'}</Text>
              </TouchableOpacity>

              <Text style={[s.label, { marginTop: 12 }]}>{lang === 'en' ? 'Description' : 'Descripción'} <Text style={{ color: '#bbb', fontWeight: '400' }}>({t.opcional})</Text></Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={nuevoPunto.descripcion}
                onChangeText={v => setNuevoPunto(p => ({ ...p, descripcion: v }))}
                placeholder={lang === 'en' ? 'Write what you want to remember...' : 'Escribe lo que quieras recordar...'}
                placeholderTextColor="#bbb"
                multiline
              />

              <Text style={[s.label, { marginTop: 12 }]}>{lang === 'en' ? 'Visit time' : 'Tiempo de visita'} ({t.min})</Text>
              <TextInput style={s.input} value={nuevoPunto.tiempo_visita} onChangeText={v => setNuevoPunto(p => ({ ...p, tiempo_visita: v }))} keyboardType="number-pad" placeholder="30" placeholderTextColor="#bbb" />

              <TouchableOpacity style={[s.botonGuardar, { marginTop: 20 }]} onPress={guardarNuevoPunto}>
                <Text style={s.botonGuardarT}>{t.guardarPunto}</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f7f4f0' },
  safe:       { backgroundColor: '#fff' },
  header:     { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e8dfd5', flexDirection: 'row', alignItems: 'center' },
  headerLeft: { flex: 1 },
  headerTitulo:{ fontSize: 17, fontWeight: '700', color: '#2c1810' },
  headerSub:  { fontSize: 11, color: '#8a7e72', marginTop: 1 },
  headerBotones:{ flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnCancelar:{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  btnCancelarT:{ color: '#b0453e', fontSize: 12, fontWeight: '600' },
  btnAdd:     { backgroundColor: '#faf6f0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e8dfd5' },
  btnAddT:    { color: '#5c1011', fontSize: 12, fontWeight: '700' },
  mapa:       { flex: 1 },
  pin:        { width: 35, height: 35, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pinNum:     { fontSize: 13, fontWeight: '800', color: '#fff' },
  pinEmoji:   { fontSize: 18, textAlign: 'center' },
  pinInicio:  { backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  pinRuta:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#5c1011', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  bannerModo: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: 'rgba(92,16,17,0.94)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerModoT:{ color: '#f5e6c8', fontWeight: '700', fontSize: 13 },
  bannerRuta: { backgroundColor: '#5c1011', paddingVertical: 7, alignItems: 'center' },
  bannerRutaT:{ color: '#f5e6c8', fontSize: 12, fontWeight: '600' },
  resumen:    { position: 'absolute', bottom: 130, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5' },
  resumenParada:{ fontSize: 10, color: '#5c1011', fontWeight: '700', textTransform: 'uppercase' },
  resumenNombre:{ fontSize: 15, fontWeight: '700', color: '#2c1810', marginTop: 1 },
  resumenSub: { fontSize: 11, color: '#8a7e72' },
  resumenBtn: { backgroundColor: '#5c1011', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  resumenBtnT:{ color: '#f5e6c8', fontSize: 12, fontWeight: '700' },
  resumenClose:{ paddingLeft: 8 },
  filtrosBox: { backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e8dfd5' },
  filtrosScroll:{ paddingHorizontal: 12, gap: 6 },
  filtroChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#f7f4f0', borderWidth: 1, borderColor: '#e8dfd5', marginRight: 6 },
  filtroChipActivo:{ backgroundColor: '#5c1011', borderColor: '#5c1011' },
  filtroChipT:{ fontSize: 11, fontWeight: '500', color: '#555' },
  filtroChipTActivo:{ color: '#f5e6c8' },
  filtroSep:  { width: 1, backgroundColor: '#e8dfd5', marginHorizontal: 4 },
  lista:      { backgroundColor: '#fff', paddingTop: 10, paddingBottom: 8 },
  listaTitulo:{ fontSize: 11, fontWeight: '700', color: '#8a7e72', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  listaScroll:{ paddingHorizontal: 12 },
  tarjeta:    { width: 90, backgroundColor: '#fafafa', borderRadius: 12, padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  tarjetaRuta:{ borderColor: '#5c1011', backgroundColor: '#faf6f0' },
  tarjetaVisitada:{ borderColor: '#c4bfb7', opacity: 0.8 },
  tarjetaBadge:{ position: 'absolute', top: 5, right: 5, backgroundColor: '#5c1011', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  tarjetaBadgeT:{ color: '#fff', fontSize: 9, fontWeight: '800' },
  tarjetaIcono:{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tarjetaNombre:{ fontSize: 10, fontWeight: '600', color: '#2c1810', textAlign: 'center' },
  tarjetaRel: { fontSize: 9, marginTop: 1 },
  tarjetaVisitado:{ fontSize: 9, color: '#5c1011', marginTop: 1, fontWeight: '700' },
  tarjetaTiempo:{ fontSize: 9, color: '#aaa', marginTop: 1 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalCont:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:{ fontSize: 18, fontWeight: '700', color: '#2c1810' },
  label:      { fontSize: 11, fontWeight: '700', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#f7f4f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#2c1810', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 4 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  chipActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  chipT:      { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTActivo:{ color: '#f5e6c8' },
  botonUbicar:{ backgroundColor: '#faf6f0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 4 },
  botonUbicarT:{ color: '#5c1011', fontWeight: '700', fontSize: 13 },
  botonGuardar:{ backgroundColor: '#5c1011', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  botonGuardarT:{ color: '#f5e6c8', fontSize: 15, fontWeight: '700' },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});