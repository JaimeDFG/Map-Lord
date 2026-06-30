import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import PantallaInicio from './src/screens/PantallaInicio';
import PantallaMapa from './src/screens/PantallaMapa';
import PantallaPasaporte from './src/screens/PantallaPasaporte';
import { buscarCoordenadas } from './src/data/ciudades';

function Navegador() {
  // Historial de pantallas como una pila: el último elemento es la pantalla actual
  const [pila, setPila] = useState([{ id: 'inicio' }]);
  const pantalla = pila[pila.length - 1];

  function ir(nuevaPantalla) {
    setPila(prev => [...prev, nuevaPantalla]);
  }

  function volver() {
    setPila(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  // Botón físico "atrás" de Android: si hay más de 1 pantalla en la pila, retrocede
  // dentro de la app; si estamos en la pantalla raíz, dejamos que el sistema
  // operativo gestione el cierre de la app de forma normal.
  useEffect(() => {
    const onBackPress = () => {
      if (pila.length > 1) {
        volver();
        return true; // evento consumido, no cierra la app
      }
      return false; // en la raíz, comportamiento por defecto del sistema
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [pila.length]);

  function abrirMapa({ paisId, ciudad, pais }) {
    const coordenadas = buscarCoordenadas(ciudad) ?? buscarCoordenadas(pais?.capital ?? '') ?? null;
    ir({ id: 'mapa', paisId, ciudad, pais, coordenadas });
  }

  if (pantalla.id === 'pasaporte') {
    return <PantallaPasaporte onCerrar={volver} />;
  }

  if (pantalla.id === 'mapa') {
    return (
      <PantallaMapa
        pais={pantalla.pais}
        ciudad={{ nombre: pantalla.ciudad, coordenadas: pantalla.coordenadas }}
        onVolver={volver}
      />
    );
  }

  if (pantalla.id === 'mapas') {
    return (
      <PantallaInicio
        vistaInicial="mapas"
        onVolverInicio={volver}
        onAbrirMapa={abrirMapa}
        onAbrirPasaporte={() => ir({ id: 'pasaporte' })}
      />
    );
  }

  return (
    <PantallaInicio
      vistaInicial="inicio"
      onAbrirMisMapas={() => ir({ id: 'mapas' })}
      onAbrirMapa={abrirMapa}
      onAbrirPasaporte={() => ir({ id: 'pasaporte' })}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={s.root}>
          <Navegador />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});