import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Modal, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

export default function PantallaInicio({
  onAbrirMapa, onAbrirPasaporte, onAbrirMisMapas, onVolverInicio,
  vistaInicial = 'inicio',
}) {
  const { lang, setLang, mapas, añadirMapa, borrarMapa, renombrarMapa } = useApp();
  const t = useT(lang);
  const insets = useSafeAreaInsets();

  const vista = vistaInicial;
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

  if (vista === 'inicio') {
    return (
      <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" />

        {/* Header granate con logo dorado */}
        <View style={s.headerHub}>
          <Text style={s.logo}>Map Lord</Text>
          <TouchableOpacity
            style={s.btnLang}
            onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
          >
            <Text style={s.btnLangT}>{lang === 'es' ? 'EN' : 'ES'}</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjetas grandes que ocupan todo el espacio */}
        <View style={s.hubCont}>
          {/* Mis mapas — tarjeta clara */}
          <TouchableOpacity style={s.hubCard} onPress={onAbrirMisMapas}>
            <View style={s.cardTop}>
              <Text style={s.cardIcon}>✦</Text>
              <Text style={s.cardNum}>{numMapas}</Text>
            </View>
            <Text style={s.hubTitulo}>{lang === 'en' ? 'My Maps' : 'Mis Mapas'}</Text>
            <Text style={s.hubSub}>
              {numMapas === 0
                ? (lang === 'en' ? 'Create your first travel map' : 'Crea tu primer mapa de viaje')
                : (lang === 'en' ? 'Maps created' : 'Mapas creados')}
            </Text>
            <View style={s.cardLine} />
          </TouchableOpacity>

          {/* Pasaporte — tarjeta granate */}
          <TouchableOpacity style={[s.hubCard, s.hubCardPasaporte]} onPress={onAbrirPasaporte}>
            <View style={s.cardTop}>
              <Text style={[s.cardIcon, { color: '#d4a843' }]}>✦</Text>
              <Text style={[s.cardNum, { color: '#f5e6c8' }]}>✦</Text>
            </View>
            <Text style={[s.hubTitulo, { color: '#f5e6c8' }]}>{t.pasaporte}</Text>
            <Text style={[s.hubSub, { color: 'rgba(245,230,200,0.7)' }]}>
              {lang === 'en' ? 'Track your journey' : 'Registra tu viaje'}
            </Text>
            <View style={[s.cardLine, { backgroundColor: 'rgba(212,168,67,0.4)' }]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={s.header}>
        <TouchableOpacity onPress={onVolverInicio} style={s.btnBack}>
          <Text style={s.btnBackT}>← {lang === 'en' ? 'Home' : 'Inicio'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{lang === 'en' ? 'My Maps' : 'Mis Mapas'}</Text>
        <TouchableOpacity
          style={s.btnLang}
          onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
        >
          <Text style={s.btnLangT}>{lang === 'es' ? 'EN' : 'ES'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.lista} showsVerticalScrollIndicator={false}>
        {todosLosMapas.length === 0 ? (
          <View style={s.vacio}>
            <Text style={s.vacioEmoji}>✦</Text>
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
                <Text style={s.cardEmoji}>✦</Text>
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
                  <Text style={s.btnAccionT}>{lang === 'en' ? 'Rename' : 'Renombrar'}</Text>
                </TouchableOpacity>
                <View style={s.separador} />
                <TouchableOpacity style={s.btnAccion} onPress={() => confirmarBorrar(paisId, ciudad)}>
                  <Text style={[s.btnAccionT, { color: '#b0453e' }]}>{lang === 'en' ? 'Delete' : 'Borrar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[s.fab, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={s.fabBtn} onPress={() => setModalCrear(true)}>
          <Text style={s.fabT}>+ {lang === 'en' ? 'New map' : 'Nuevo mapa'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalCrear} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={[s.modalCont, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{lang === 'en' ? 'New map' : 'Nuevo mapa'}</Text>

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
                  {paisSeleccionado.emoji} {lang === 'en' ? nombrePaisEn(paisSeleccionado.nombre, 'en') : paisSeleccionado.nombre}
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

      <Modal visible={!!modalEditar} animationType="fade" transparent>
        <View style={s.modalFondo}>
          <View style={[s.modalCont, { paddingBottom: insets.bottom + 40 }]}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{lang === 'en' ? 'Rename map' : 'Renombrar mapa'}</Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f7f4f0' },

  // Header granate con logo dorado
  headerHub:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: '#5c1011' },
  logo:             { fontSize: 22, fontWeight: '700', color: '#d4a843', letterSpacing: 1 },
  btnLang:          { backgroundColor: 'rgba(212,168,67,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' },
  btnLangT:         { fontSize: 12, fontWeight: '600', color: '#d4a843' },

  // Tarjetas grandes
  hubCont:          { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  hubCard:          { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 28, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#e8dfd5', maxHeight: 280 },
  hubCardPasaporte: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardIcon:         { fontSize: 28, color: '#d4a843' },
  cardNum:          { fontSize: 36, fontWeight: '300', color: '#5c1011' },
  hubTitulo:        { fontSize: 22, fontWeight: '600', color: '#2c1810', marginBottom: 6, letterSpacing: -0.3 },
  hubSub:           { fontSize: 14, color: '#8a7e72' },
  cardLine:         { width: 40, height: 3, backgroundColor: '#d4a843', borderRadius: 2, marginTop: 16 },

  // Header lista mapas
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8dfd5' },
  btnBack:          { paddingRight: 12 },
  btnBackT:         { fontSize: 14, color: '#5c1011', fontWeight: '500' },
  headerTitulo:     { flex: 1, fontSize: 17, fontWeight: '600', color: '#2c1810', textAlign: 'center' },
  
  // Cards
  lista:            { padding: 16 },
  vacio:            { alignItems: 'center', paddingTop: 60 },
  vacioEmoji:       { fontSize: 32, marginBottom: 14, color: '#d4a843' },
  vacioT:           { fontSize: 17, fontWeight: '600', color: '#2c1810', marginBottom: 6 },
  vacioSub:         { fontSize: 13, color: '#8a7e72', textAlign: 'center', paddingHorizontal: 32 },
  card:             { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e8dfd5' },
  cardMain:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardEmoji:        { fontSize: 16, marginRight: 12, color: '#d4a843' },
  cardTexto:        { flex: 1 },
  cardNombre:       { fontSize: 16, fontWeight: '600', color: '#2c1810' },
  cardPais:         { fontSize: 12, color: '#8a7e72', marginTop: 2 },
  cardArrow:        { fontSize: 18, color: '#c4bfb7' },
  cardAcciones:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0eeea' },
  btnAccion:        { flex: 1, alignItems: 'center', paddingVertical: 11 },
  btnAccionT:       { fontSize: 12, fontWeight: '500', color: '#555' },
  separador:        { width: 1, backgroundColor: '#f0eeea' },

  // FAB
  fab:              { position: 'absolute', left: 20, right: 20 },
  fabBtn:           { backgroundColor: '#5c1011', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#d4a843' },
  fabT:             { color: '#f5e6c8', fontSize: 15, fontWeight: '600' },

  // Modal
  modalFondo:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  modalCont:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  drag:             { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitulo:      { fontSize: 18, fontWeight: '600', color: '#2c1810', marginBottom: 20 },
  label:            { fontSize: 11, fontWeight: '600', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:            { backgroundColor: '#f7f4f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2c1810', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 4 },
  sugerencias:      { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 8, overflow: 'hidden' },
  sugerencia:       { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0eeea' },
  sugerenciaT:      { fontSize: 15, color: '#2c1810' },
  paisOk:           { backgroundColor: '#faf6f0', borderRadius: 8, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#e8dfd5' },
  paisOkT:          { color: '#5c1011', fontWeight: '600', fontSize: 14 },
  btnCrear:         { backgroundColor: '#5c1011', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnCrearDis:      { backgroundColor: '#c4a8aa' },
  btnCrearT:        { color: '#f5e6c8', fontSize: 15, fontWeight: '600' },
  btnCancelar:      { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnCancelarT:     { color: '#8a7e72', fontSize: 14, fontWeight: '500' },
});