import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import PantallaInicio from './src/screens/PantallaInicio';
import PantallaMapa from './src/screens/PantallaMapa';
import PantallaPasaporte from './src/screens/PantallaPasaporte';
import { buscarCoordenadas } from './src/data/ciudades';

function Navegador() {
  const [pantalla, setPantalla] = useState('inicio'); // 'inicio' | 'mapas' | 'mapa' | 'pasaporte'
  const [mapaActivo, setMapaActivo] = useState(null);

  function abrirMapa({ paisId, ciudad, pais }) {
    const coordenadas = buscarCoordenadas(ciudad) ?? buscarCoordenadas(pais?.capital ?? '') ?? null;
    setMapaActivo({ paisId, ciudad, pais, coordenadas });
    setPantalla('mapa');
  }

  if (pantalla === 'pasaporte') {
    return <PantallaPasaporte onCerrar={() => setPantalla('inicio')} />;
  }

  if (pantalla === 'mapa' && mapaActivo) {
    return (
      <PantallaMapa
        pais={mapaActivo.pais}
        ciudad={{ nombre: mapaActivo.ciudad, coordenadas: mapaActivo.coordenadas }}
        onVolver={() => setPantalla('mapas')}
      />
    );
  }

  return (
    <PantallaInicio
      vistaInicial={pantalla === 'mapas' ? 'mapas' : 'inicio'}
      onAbrirMapa={abrirMapa}
      onAbrirPasaporte={() => setPantalla('pasaporte')}
    />
  );
}

export default function App() {
  return (
    <AppProvider>
      <View style={s.root}>
        <Navegador />
      </View>
    </AppProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});