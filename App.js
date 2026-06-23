import { useState } from 'react';
import { View, StyleSheet, Modal, TextInput, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { useT } from './src/constants/i18n';
import PantallaInicio from './src/screens/PantallaInicio';
import PantallaPaises from './src/screens/PantallaPaises';
import PantallaMapasCiudad from './src/screens/PantallaMapasCiudad';
import PantallaMapa from './src/screens/PantallaMapa';
import PantallaPasaporte from './src/screens/PantallaPasaporte';
import { buscarCoordenadas } from './src/data/ciudades';



function Navegador() {
  const { lang, añadirCiudadViaje } = useApp();
  const t = useT(lang);

  // Pila de navegación
  const [pila, setPila] = useState([{ id: 'inicio' }]);
  const pantalla = pila[pila.length - 1];

  // Pasaporte (modal global)
  const [pasaporteVisible, setPasaporteVisible] = useState(false);

  // Modal añadir mapa (nueva ciudad)
  const [modalCiudad, setModalCiudad] = useState(false);
  const [paisPendiente, setPaisPendiente] = useState(null);
  const [nombreCiudad, setNombreCiudad] = useState('');
  const [buscandoCoords, setBuscandoCoords] = useState(false);

  function navegar(nueva) { setPila(prev => [...prev, nueva]); }
  function volver()       { setPila(prev => prev.length > 1 ? prev.slice(0, -1) : prev); }

  function handleAñadirMapa(pais) {
    setPaisPendiente(pais);
    setNombreCiudad('');
    setModalCiudad(true);
  }

  async function confirmarCiudad() {
    if (!nombreCiudad.trim() || !paisPendiente) return;
    añadirCiudadViaje(paisPendiente.id, nombreCiudad.trim());
    // 1. Buscar en diccionario local (instantáneo)
    let coordenadas = buscarCoordenadas(nombreCiudad.trim(), paisPendiente?.id);

    // 2. Si no está en el diccionario, intentar Nominatim
    if (!coordenadas) {
      setBuscandoCoords(true);
      try {
        const query = encodeURIComponent(`${nombreCiudad.trim()}, ${paisPendiente.nombre}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
          coordenadas = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
      } catch (e) {}
      setBuscandoCoords(false);
    }

    // 3. Último recurso: capital del país
    if (!coordenadas) {
      coordenadas = buscarCoordenadas(paisPendiente.capital ?? paisPendiente.nombre, paisPendiente?.id)
                 ?? buscarCoordenadas(paisPendiente.nombre, paisPendiente?.id);
    }
    setModalCiudad(false);
    navegar({
      id: 'mapa',
      ciudad: { nombre: nombreCiudad.trim(), coordenadas },
      pais: paisPendiente,
    });
  }

  return (
    <View style={s.root}>
      {pantalla.id === 'inicio' && (
        <PantallaInicio
          onSeleccionarContinente={cont => navegar({ id: 'paises', continente: cont })}
          onAbrirPasaporte={() => setPasaporteVisible(true)}
        />
      )}

      {pantalla.id === 'paises' && (
        <PantallaPaises
          continente={pantalla.continente}
          onVolver={volver}
          onSeleccionarPais={pais => navegar({ id: 'mapas', pais })}
        />
      )}

      {pantalla.id === 'mapas' && (
        <PantallaMapasCiudad
          pais={pantalla.pais}
          onVolver={volver}
          onAbrirMapa={async (nombreCiudad, pais) => {
            // 1. Diccionario local
            let coordenadas = buscarCoordenadas(nombreCiudad, pais?.id);
            // 2. Fallback Nominatim
            if (!coordenadas) {
              try {
                const query = encodeURIComponent(`${nombreCiudad}, ${pais.nombre}`);
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
                const data = await res.json();
                if (data.length > 0) {
                  coordenadas = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
                }
              } catch (e) {}
            }
            // 3. Último recurso: capital del país
            if (!coordenadas) {
              coordenadas = buscarCoordenadas(pais.capital ?? pais.nombre, pais?.id)
                         ?? buscarCoordenadas(pais.nombre, pais?.id);
            }
            navegar({ id: 'mapa', ciudad: { nombre: nombreCiudad, coordenadas }, pais });
          }}
          onAñadirMapa={() => handleAñadirMapa(pantalla.pais)}
        />
      )}

      {pantalla.id === 'mapa' && (
        <PantallaMapa
          ciudad={pantalla.ciudad}
          pais={pantalla.pais}
          onVolver={volver}
        />
      )}

      {/* Pasaporte (modal full screen) */}
      <Modal visible={pasaporteVisible} animationType="slide">
        <PantallaPasaporte onCerrar={() => setPasaporteVisible(false)} />
      </Modal>

      {/* Modal nueva ciudad */}
      <Modal visible={modalCiudad} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>🗺️ {t.añadirMapa}</Text>
            <Text style={s.modalSub}>{paisPendiente?.emoji} {paisPendiente?.nombre}</Text>
            <TextInput
              style={s.input}
              value={nombreCiudad}
              onChangeText={setNombreCiudad}
              placeholder={t.nombreCiudad}
              placeholderTextColor="#bbb"
              autoFocus
              onSubmitEditing={confirmarCiudad}
            />
            <View style={s.botones}>
              <TouchableOpacity style={s.btnCancelar} onPress={() => setModalCiudad(false)}>
                <Text style={s.btnCancelarT}>{t.cancelar}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnConfirmar, buscandoCoords && {opacity:0.6}]} onPress={confirmarCiudad} disabled={buscandoCoords}>
                <Text style={s.btnConfirmarT}>{buscandoCoords ? '🔍...' : t.abrirMapa}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Navegador />
    </AppProvider>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCont:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitulo:{ fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  modalSub:   { fontSize: 14, color: '#888', marginBottom: 16 },
  input:      { backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  botones:    { flexDirection: 'row', gap: 10 },
  btnCancelar:{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelarT:{ fontSize: 14, fontWeight: '600', color: '#555' },
  btnConfirmar:{ flex: 2, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnConfirmarT:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});