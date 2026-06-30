import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Modal, Alert, Platform, StatusBar,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { nombrePaisEn } from '../constants/tourism';
import PAISES from '../data/paises.json';

function buscarPaises(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return PAISES.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.capital?.toLowerCase().includes(q)
  ).slice(0, 6);
}

export default function PantallaInicio({ onAbrirMapa, onAbrirPasaporte, vistaInicial = 'inicio' }) {
  const { lang, setLang, mapas, añadirMapa, borrarMapa, renombrarMapa } = useApp();
  const t = useT(lang);

  const [vista, setVista] = useState(vistaInicial);
  const [modalCrear, setModalCrear] = useState(false);
  const [nombreCiudad, setNombreCiudad] = useState('');
  const [paisQuery, setPaisQuery] = useState('');
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [modalEditar, setModalEditar] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  const todosLosMapas = Object.entries(mapas).flatMap(([paisId, ciudades]) => {
    const pais = PAISES.find(p => p.id === paisId);
    return (ciudades || []).map(ciudad => ({ paisId, ciudad, pais }));
  });

  const numMapas = todosLosMapas.length;

  function handlePaisQuery(text) {
    setPaisQuery(text);
    setPaisSeleccionado(null);
    setSugerencias(buscarPaises(text));
  }

  function seleccionarPais(pais) {
    setPaisSeleccionado(pais);
    setPaisQuery(lang === 'en' ? (nombrePaisEn(pais.nombre, 'en') || pais.nombre) : pais.nombre);
    setSugerencias([]);
  }

  function crearMapa() {
    if (!nombreCiudad.trim() || !paisSeleccionado) return;
    añadirMapa(paisSeleccionado.id, nombreCiudad.trim());
    onAbrirMapa({ paisId: paisSeleccionado.id, ciudad: nombreCiudad.trim(), pais: paisSeleccionado });
    resetModal();
  }

  function resetModal() {
    setModalCrear(false);
    setNombreCiudad('');
    setPaisQuery('');
    setPaisSeleccionado(null);
    setSugerencias([]);
  }

  function confirmarBorrar(paisId, ciudad) {
    Alert.alert(
      lang === 'en' ? 'Delete map' : 'Borrar mapa',
      lang === 'en'
        ? `Delete "${ciudad}"? All custom points will also be deleted.`
        : `¿Borrar "${ciudad}"? Se eliminarán también todos los puntos personalizados.`,
      [
        { text: t.cancelar, style: 'cancel' },
        { text: t.borrar, style: 'destructive', onPress: () => borrarMapa(paisId, ciudad) },
      ]
    );
  }

  function abrirEditar(paisId, ciudad) {
    setModalEditar({ paisId, ciudad });
    setNuevoNombre(ciudad);
  }

  function guardarNombre() {
    if (!nuevoNombre.trim() || !modalEditar) return;
    renombrarMapa(modalEditar.paisId, modalEditar.ciudad, nuevoNombre.trim());
    setModalEditar(null);
  }

  // ── Pantalla de inicio (hub) ─────────────────────────────────────────────
  if (vista === 'inicio') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header con idioma */}
        <View style={s.headerHub}>
          <Text style={s.logo}>🗺️ Map Lord</Text>
          <TouchableOpacity
            style={s.btnLang}
            onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
          >
            <Text style={s.btnLangT}>{lang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}</Text>
          </TouchableOpacity>
        </View>

        {/* Botones principales */}
        <View style={s.hubCont}>
          {/* Mis mapas */}
          <TouchableOpacity style={s.hubCard} onPress={() => setVista('mapas')}>
            <Text style={s.hubEmoji}>🗺️</Text>
            <Text style={s.hubTitulo}>{lang === 'en' ? 'My Maps' : 'Mis Mapas'}</Text>
            <Text style={s.hubSub}>
              {numMapas === 0
                ? (lang === 'en' ? 'No maps yet' : 'Sin mapas aún')
                : `${numMapas} ${lang === 'en' ? (numMapas === 1 ? 'map' : 'maps') : (numMapas === 1 ? 'mapa' : 'mapas')}`}
            </Text>
          </TouchableOpacity>

          {/* Pasaporte */}
          <TouchableOpacity style={[s.hubCard, s.hubCardPasaporte]} onPress={onAbrirPasaporte}>
            <Text style={s.hubEmoji}>📕</Text>
            <Text style={[s.hubTitulo, { color: '#fff' }]}>{t.pasaporte}</Text>
            <Text style={[s.hubSub, { color: 'rgba(255,255,255,0.8)' }]}>
              {lang === 'en' ? 'Visited countries' : 'Países visitados'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Vista de mapas ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('inicio')} style={s.btnBack}>
          <Text style={s.btnBackT}>← {lang === 'en' ? 'Home' : 'Inicio'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{lang === 'en' ? 'My Maps' : 'Mis Mapas'}</Text>
        <TouchableOpacity
          style={s.btnLang}
          onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
        >
          <Text style={s.btnLangT}>{lang === 'es' ? '🇬🇧' : '🇪🇸'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <ScrollView contentContainerStyle={s.lista} showsVerticalScrollIndicator={false}>
        {todosLosMapas.length === 0 ? (
          <View style={s.vacio}>
            <Text style={s.vacioEmoji}>🗺️</Text>
            <Text style={s.vacioT}>{lang === 'en' ? 'No maps yet' : 'Aún no tienes mapas'}</Text>
            <Text style={s.vacioSub}>
              {lang === 'en'
                ? 'Tap the button below to create your first map'
                : 'Pulsa el botón de abajo para crear tu primer mapa'}
            </Text>
          </View>
        ) : (
          todosLosMapas.map(({ paisId, ciudad, pais }) => (
            <View key={`${paisId}_${ciudad}`} style={s.card}>
              <TouchableOpacity
                style={s.cardMain}
                onPress={() => onAbrirMapa({ paisId, ciudad, pais })}
              >
                <Text style={s.cardEmoji}>🗺️</Text>
                <View style={s.cardTexto}>
                  <Text style={s.cardNombre}>{ciudad}</Text>
                  <Text style={s.cardPais}>
                    {pais?.emoji} {lang === 'en' ? nombrePaisEn(pais?.nombre, 'en') : pais?.nombre}
                  </Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </TouchableOpacity>
              <View style={s.cardAcciones}>
                <TouchableOpacity style={s.btnAccion} onPress={() => abrirEditar(paisId, ciudad)}>
                  <Text style={s.btnAccionT}>✏️ {lang === 'en' ? 'Rename' : 'Renombrar'}</Text>
                </TouchableOpacity>
                <View style={s.separador} />
                <TouchableOpacity style={s.btnAccion} onPress={() => confirmarBorrar(paisId, ciudad)}>
                  <Text style={[s.btnAccionT, { color: '#ef4444' }]}>🗑️ {lang === 'en' ? 'Delete' : 'Borrar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <View style={s.fab}>
        <TouchableOpacity style={s.fabBtn} onPress={() => setModalCrear(true)}>
          <Text style={s.fabT}>+ {lang === 'en' ? 'New map' : 'Nuevo mapa'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal crear */}
      <Modal visible={modalCrear} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{lang === 'en' ? '🗺️ New map' : '🗺️ Nuevo mapa'}</Text>

            <Text style={s.label}>{lang === 'en' ? 'City or place name' : 'Nombre de la ciudad o lugar'}</Text>
            <TextInput
              style={s.input}
              value={nombreCiudad}
              onChangeText={setNombreCiudad}
              placeholder={lang === 'en' ? 'E.g. Rome, Kyoto, Buenos Aires...' : 'Ej. Roma, Kioto, Buenos Aires...'}
              placeholderTextColor="#bbb"
              autoFocus
            />

            <Text style={[s.label, { marginTop: 14 }]}>{lang === 'en' ? 'Country' : 'País'}</Text>
            <TextInput
              style={s.input}
              value={paisQuery}
              onChangeText={handlePaisQuery}
              placeholder={lang === 'en' ? 'Type to search...' : 'Escribe para buscar...'}
              placeholderTextColor="#bbb"
            />

            {sugerencias.length > 0 && (
              <View style={s.sugerencias}>
                {sugerencias.map(p => (
                  <TouchableOpacity key={p.id} style={s.sugerencia} onPress={() => seleccionarPais(p)}>
                    <Text style={s.sugerenciaT}>
                      {p.emoji} {lang === 'en' ? nombrePaisEn(p.nombre, 'en') : p.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {paisSeleccionado && (
              <View style={s.paisOk}>
                <Text style={s.paisOkT}>
                  ✓ {paisSeleccionado.emoji} {lang === 'en' ? nombrePaisEn(paisSeleccionado.nombre, 'en') : paisSeleccionado.nombre}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btnCrear, (!nombreCiudad.trim() || !paisSeleccionado) && s.btnCrearDis]}
              onPress={crearMapa}
              disabled={!nombreCiudad.trim() || !paisSeleccionado}
            >
              <Text style={s.btnCrearT}>{lang === 'en' ? 'Create map' : 'Crear mapa'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnCancelar} onPress={resetModal}>
              <Text style={s.btnCancelarT}>{t.cancelar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal renombrar */}
      <Modal visible={!!modalEditar} animationType="fade" transparent>
        <View style={s.modalFondo}>
          <View style={[s.modalCont, { paddingBottom: 40 }]}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{lang === 'en' ? '✏️ Rename map' : '✏️ Renombrar mapa'}</Text>
            <TextInput
              style={s.input}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity style={s.btnCrear} onPress={guardarNombre}>
              <Text style={s.btnCrearT}>{t.guardar}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCancelar} onPress={() => setModalEditar(null)}>
              <Text style={s.btnCancelarT}>{t.cancelar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f8f9fa' },

  // Hub
  headerHub:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  logo:             { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  hubCont:          { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  hubCard:          { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  hubCardPasaporte: { backgroundColor: '#2563eb' },
  hubEmoji:         { fontSize: 48, marginBottom: 12 },
  hubTitulo:        { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  hubSub:           { fontSize: 14, color: '#888' },

  // Header lista mapas
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 10, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  btnBack:          { paddingRight: 12 },
  btnBackT:         { fontSize: 15, color: '#2563eb', fontWeight: '600' },
  headerTitulo:     { flex: 1, fontSize: 18, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },
  btnLang:          { backgroundColor: '#f0f4ff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  btnLangT:         { fontSize: 13, fontWeight: '700', color: '#2563eb' },

  // Cards
  lista:            { padding: 16 },
  vacio:            { alignItems: 'center', paddingTop: 60 },
  vacioEmoji:       { fontSize: 56, marginBottom: 16 },
  vacioT:           { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  vacioSub:         { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  card:             { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardMain:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardEmoji:        { fontSize: 28, marginRight: 14 },
  cardTexto:        { flex: 1 },
  cardNombre:       { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  cardPais:         { fontSize: 13, color: '#888', marginTop: 2 },
  cardArrow:        { fontSize: 22, color: '#ccc' },
  cardAcciones:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  btnAccion:        { flex: 1, alignItems: 'center', paddingVertical: 11 },
  btnAccionT:       { fontSize: 13, fontWeight: '600', color: '#555' },
  separador:        { width: 1, backgroundColor: '#f0f0f0' },

  // FAB
  fab:              { position: 'absolute', bottom: Platform.OS === 'android' ? 16 : 24, left: 20, right: 20 },
  fabBtn:           { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabT:             { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Modal
  modalFondo:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCont:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  drag:             { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitulo:      { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },
  label:            { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:            { backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 },
  sugerencias:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8, overflow: 'hidden' },
  sugerencia:       { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sugerenciaT:      { fontSize: 15, color: '#1a1a1a' },
  paisOk:           { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  paisOkT:          { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  btnCrear:         { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnCrearDis:      { backgroundColor: '#93c5fd' },
  btnCrearT:        { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnCancelar:      { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnCancelarT:     { color: '#888', fontSize: 14, fontWeight: '600' },
});