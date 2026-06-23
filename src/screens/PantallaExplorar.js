import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Modal, TextInput,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA } from '../constants/tourism';

export default function PantallaExplorar({ ciudad, pais, onAbrirPOI, onEditar }) {
  const { lang, rutaActiva, setRutaActiva, todosLosPois, añadirPoi, marcadorInicio, poisUsuario } = useApp();
  const t = useT(lang);

  const [poiResumen, setPoiResumen]       = useState(null);
  const [modalNuevo, setModalNuevo]       = useState(false);
  const [agregando, setAgregando]         = useState(false);
  const [modoPunto, setModoPunto]         = useState(false); // modo toca mapa para ubicar
  const [nuevoPunto, setNuevoPunto]       = useState({
    nombre: '', categoria: 'Monumento', relevancia: 2,
    latitude: '', longitude: '',
    descripcion_corta: '', historia: '', arquitectura: '',
    curiosidades: '', misterios: '', tiempo_visita: '30',
  });

  const poisEnRuta = rutaActiva ? rutaActiva.map(p => p.id) : [];

  // POIs filtrados por ciudad
  const nombreCiudad = ciudad?.nombre?.toLowerCase() ?? 'madrid';
  const poisDelMapa = todosLosPois.filter(p =>
    (p.ciudad ?? 'Madrid').toLowerCase() === nombreCiudad
  );

  // Centro del mapa por orden de prioridad:
  // 1) Media de los POIs del mapa (si hay alguno, es lo más relevante)
  // 2) Coordenadas guardadas al crear el mapa (capital o ciudad buscada)
  // 3) Madrid como último recurso
  const centroPois = poisDelMapa.length > 0
    ? {
        latitude:  poisDelMapa.reduce((s, p) => s + p.coordenadas.latitude,  0) / poisDelMapa.length,
        longitude: poisDelMapa.reduce((s, p) => s + p.coordenadas.longitude, 0) / poisDelMapa.length,
      }
    : null;
  const centro = centroPois ?? ciudad?.coordenadas ?? { latitude: 40.4168, longitude: -3.7038 };

  // Delta: ajustar zoom según la dispersión real de los puntos
  const latDelta = poisDelMapa.length > 1
    ? (Math.max(...poisDelMapa.map(p => p.coordenadas.latitude))  - Math.min(...poisDelMapa.map(p => p.coordenadas.latitude)))  * 1.5 + 0.008
    : 0.012;
  const lonDelta = poisDelMapa.length > 1
    ? (Math.max(...poisDelMapa.map(p => p.coordenadas.longitude)) - Math.min(...poisDelMapa.map(p => p.coordenadas.longitude))) * 1.5 + 0.008
    : 0.012;
  const region = { ...centro, latitudeDelta: Math.max(latDelta, 0.008), longitudeDelta: Math.max(lonDelta, 0.008) };

  function handlePin(poi) {
    if (rutaActiva && poisEnRuta.includes(poi.id)) setPoiResumen(poi);
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
      id: `custom_${Date.now()}`,
      ciudad: ciudad?.nombre ?? 'Madrid',
      nombre: nuevoPunto.nombre.trim(),
      coordenadas: { latitude: lat, longitude: lon },
      categoria: nuevoPunto.categoria,
      relevancia: nuevoPunto.relevancia,
      descripcion_corta: nuevoPunto.descripcion_corta || 'Punto personalizado',
      historia:      nuevoPunto.historia,
      arquitectura:  nuevoPunto.arquitectura,
      curiosidades:  nuevoPunto.curiosidades,
      misterios:     nuevoPunto.misterios,
      tiempo_visita: parseInt(nuevoPunto.tiempo_visita) || 30,
    });

    setModalNuevo(false);
    setModoPunto(false);
    setNuevoPunto({ nombre:'', categoria:'Monumento', relevancia:2, latitude:'', longitude:'',
      descripcion_corta:'', historia:'', arquitectura:'', curiosidades:'', misterios:'', tiempo_visita:'30' });
  }

  const numParada = poiResumen && rutaActiva ? rutaActiva.findIndex(p => p.id === poiResumen.id) + 1 : null;

  return (
    <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.headerTitulo}>{ciudad?.nombre ?? 'Madrid'}</Text>
              <Text style={s.headerSub}>{pais?.nombre ?? 'España'} · {poisDelMapa.length} {t.lugares}</Text>
            </View>
            <View style={s.headerBotones}>
              {rutaActiva ? (
                <TouchableOpacity style={s.btnCancelar} onPress={() => setRutaActiva(null)}>
                  <Text style={s.btnCancelarT}>{t.cancelarRuta}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={s.btnAdd}
                  onPress={() => { setModoPunto(true); setModalNuevo(false); }}
                >
                  <Text style={s.btnAddT}>{t.añadirPunto}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      
      <MapView style={s.mapa} key={`${ciudad?.nombre ?? 'madrid'}_${poisDelMapa.length > 0}`} initialRegion={region} showsUserLocation onPress={handleMapaPress}>
        {rutaActiva && (
          <Polyline
          coordinates={rutaActiva.map(p => p.coordenadas)}
          strokeColor="#2563eb"
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />
      )}

      {/* Línea desde punto de inicio hasta primera parada */}
      {rutaActiva && marcadorInicio && rutaActiva.length > 0 && (
        <Polyline
          coordinates={[marcadorInicio, rutaActiva[0].coordenadas]}
          strokeColor="#2563eb"
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />
      )}
      
        {marcadorInicio && rutaActiva && (
          <Marker coordinate={marcadorInicio}>
            <View style={s.pinInicio}>
              <Text style={{ fontSize: 18 }}>🚩</Text>
            </View>
          </Marker>
        )}
        {/* Primero los que NO están en ruta (quedan debajo) */}
        {poisDelMapa
          .filter(poi => !rutaActiva || rutaActiva.findIndex(p => p.id === poi.id) < 0)
          .map(poi => {
            const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#888' };
            return (
              <Marker key={poi.id} coordinate={poi.coordenadas} onPress={() => handlePin(poi)}>
                <View style={[s.pin, { backgroundColor: cat.color, opacity: rutaActiva ? 0.35 : 1 }]}>
                  <Text style={s.pinEmoji}>{cat.emoji}</Text>
                </View>
              </Marker>
            );
          })
        }

        {/* Luego los que SÍ están en ruta (se superponen) */}
        {rutaActiva && rutaActiva.map((poi, idx) => {
          const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#888' };
          return (
            <Marker key={`ruta_${poi.id}`} coordinate={poi.coordenadas} onPress={() => handlePin(poi)} zIndex={10 + idx}>
              <View style={[s.pinRuta]}>
                <Text style={s.pinNum}>{idx + 1}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {modoPunto && (
        <View style={s.bannerModo}>
          <Text style={s.bannerModoT}>👆 Toca el mapa para colocar el punto</Text>
          <TouchableOpacity onPress={() => setModoPunto(false)}><Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text></TouchableOpacity>
        </View>
      )}

      {rutaActiva && (
        <View style={s.bannerRuta}>
          <Text style={s.bannerRutaT}>🧭 {rutaActiva.length} {t.paradas} · {rutaActiva.reduce((a, p) => a + p.tiempo_visita, 0)} {t.min}</Text>
        </View>
      )}

      {poiResumen && rutaActiva && (
        <View style={s.resumen}>
          <View style={{ flex: 1 }}>
            <Text style={s.resumenParada}>{t.parada} {numParada} {t.de} {rutaActiva.length}</Text>
            <Text style={s.resumenNombre}>{poiResumen.nombre}</Text>
            <Text style={s.resumenSub}>{poiResumen.descripcion_corta} · ⏱ {poiResumen.tiempo_visita} {t.min}</Text>
          </View>
          <TouchableOpacity style={s.resumenBtn} onPress={() => { setPoiResumen(null); onAbrirPOI(poiResumen); }}>
            <Text style={s.resumenBtnT}>{t.verFicha}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.resumenClose} onPress={() => setPoiResumen(null)}>
            <Text style={{ color: '#999' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.lista}>
        <Text style={s.listaTitulo}>{rutaActiva ? `${t.rutaActiva} · ${rutaActiva.length} ${t.paradas}` : t.explorar}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.listaScroll}>
          {(rutaActiva ? rutaActiva : poisDelMapa).map((poi, i) => {
            const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#888' };
            const rel = RELEVANCIA[poi.relevancia];
            return (
              <TouchableOpacity key={poi.id} style={[s.tarjeta, rutaActiva && s.tarjetaRuta]} onPress={() => onAbrirPOI(poi)}>
                {rutaActiva && <View style={s.tarjetaBadge}><Text style={s.tarjetaBadgeT}>{i + 1}</Text></View>}
                <View style={[s.tarjetaIcono, { backgroundColor: cat.color + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                </View>
                <Text style={s.tarjetaNombre} numberOfLines={1}>{poi.nombre}</Text>
                <Text style={[s.tarjetaRel, { color: rel?.color }]}>{rel?.estrellas}</Text>
                <Text style={s.tarjetaTiempo}>⏱ {poi.tiempo_visita} {t.min}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Modal nuevo punto */}
      <Modal visible={modalNuevo} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <ScrollView>
            <View style={s.modalCont}>
              <View style={s.drag} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={s.modalTitulo}>📍 {t.añadirPunto}</Text>
                <TouchableOpacity onPress={() => setModalNuevo(false)} style={s.cerrar}>
                  <Text style={{ color: '#555' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>{t.nombre} *</Text>
              <TextInput style={s.input} value={nuevoPunto.nombre} onChangeText={v => setNuevoPunto(p => ({ ...p, nombre: v }))} placeholder="Ej. Fuente del parque..." placeholderTextColor="#bbb" />

              <Text style={[s.label, { marginTop: 12 }]}>{t.categoria}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {Object.keys(CATEGORIAS).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.chip, nuevoPunto.categoria === cat && s.chipActivo]}
                    onPress={() => setNuevoPunto(p => ({ ...p, categoria: cat }))}
                  >
                    <Text style={[s.chipT, nuevoPunto.categoria === cat && s.chipTActivo]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>Relevancia</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3].map(r => (
                  <TouchableOpacity key={r} style={[s.chip, nuevoPunto.relevancia === r && s.chipActivo]} onPress={() => setNuevoPunto(p => ({ ...p, relevancia: r }))}>
                    <Text style={[s.chipT, nuevoPunto.relevancia === r && s.chipTActivo]}>{'★'.repeat(r)}{'☆'.repeat(3 - r)}</Text>
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
                <Text style={s.botonUbicarT}>📍 Tocar mapa para ubicar</Text>
              </TouchableOpacity>

              <Text style={[s.label, { marginTop: 12 }]}>Descripción corta</Text>
              <TextInput style={s.input} value={nuevoPunto.descripcion_corta} onChangeText={v => setNuevoPunto(p => ({ ...p, descripcion_corta: v }))} placeholder="Una línea descriptiva..." placeholderTextColor="#bbb" />

              {['historia', 'arquitectura', 'curiosidades', 'misterios'].map(campo => (
                <View key={campo}>
                  <Text style={[s.label, { marginTop: 12 }]}>{t[campo]} <Text style={{ color: '#bbb', fontWeight: '400' }}>{t.opcional}</Text></Text>
                  <TextInput
                    style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]}
                    value={nuevoPunto[campo]}
                    onChangeText={v => setNuevoPunto(p => ({ ...p, [campo]: v }))}
                    placeholder={`Información sobre ${campo}...`}
                    placeholderTextColor="#bbb"
                    multiline
                  />
                </View>
              ))}

              <Text style={[s.label, { marginTop: 12 }]}>Tiempo de visita ({t.min})</Text>
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
  root:       { flex: 1, backgroundColor: '#f5f5f5' },
  safe:       { backgroundColor: '#fff' },
  header:     { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' },
  headerLeft: { flex: 1 },
  headerTitulo:{ fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  headerSub:  { fontSize: 11, color: '#888', marginTop: 1 },
  headerBotones:{ flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnCancelar:{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  btnCancelarT:{ color: '#dc2626', fontSize: 12, fontWeight: '600' },
  btnAdd:     { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  btnAddT:    { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  mapa:       { flex: 1 },
  pin:        { width: 35, height: 35, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'transparent' },  pinNum:     { fontSize: 13, fontWeight: '800', color: '#fff' },
  pinEmoji:   { fontSize: 18, textAlign: 'center' },
  pinInicio:  { backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  pinRuta:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, elevation: 10 },
  bannerModo: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: 'rgba(15,118,110,0.94)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerModoT:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  bannerRuta: { backgroundColor: '#2563eb', paddingVertical: 7, alignItems: 'center' },
  bannerRutaT:{ color: '#fff', fontSize: 12, fontWeight: '600' },
  resumen:    { position: 'absolute', bottom: 130, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  resumenParada:{ fontSize: 10, color: '#2563eb', fontWeight: '700', textTransform: 'uppercase' },
  resumenNombre:{ fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginTop: 1 },
  resumenSub: { fontSize: 11, color: '#888' },
  resumenBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  resumenBtnT:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  resumenClose:{ paddingLeft: 8 },
  lista:      { backgroundColor: '#fff', paddingTop: 10, paddingBottom: 8 },
  listaTitulo:{ fontSize: 11, fontWeight: '700', color: '#888', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  listaScroll:{ paddingHorizontal: 12 },
  tarjeta:    { width: 90, backgroundColor: '#fafafa', borderRadius: 12, padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  tarjetaRuta:{ borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  tarjetaBadge:{ position: 'absolute', top: 5, right: 5, backgroundColor: '#2563eb', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  tarjetaBadgeT:{ color: '#fff', fontSize: 9, fontWeight: '800' },
  tarjetaIcono:{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tarjetaNombre:{ fontSize: 10, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' },
  tarjetaRel: { fontSize: 9, marginTop: 1 },
  tarjetaTiempo:{ fontSize: 9, color: '#aaa', marginTop: 1 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCont:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  label:      { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  chipActivo: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipT:      { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTActivo:{ color: '#fff' },
  botonUbicar:{ backgroundColor: '#f0fdf4', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 4 },
  botonUbicarT:{ color: '#15803d', fontWeight: '700', fontSize: 13 },
  botonGuardar:{ backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  botonGuardarT:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  safeRoot: { flex: 1, backgroundColor: '#f8fafc' },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});