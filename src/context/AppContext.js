import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VIAJES = 'maplord_viajes_v1';
const STORAGE_MAPAS = 'maplord_mapas_v1';
const STORAGE_POIS = 'maplord_custom_pois_v1';
const STORAGE_RUTAS = 'maplord_rutas_guardadas_v1';
const STORAGE_LANG = 'maplord_lang_v1';
const STORAGE_VISITADOS = 'maplord_visitados_v1';

const Ctx = createContext(null);

export function AppProvider({ children }) {

  const [lang, setLangState] = useState('es');
  const [viajes, setViajes] = useState({});
  const [viajesCargados, setVC] = useState(false);
  const [mapas, setMapas] = useState({});
  const [poisUsuario, setPoisUsuario] = useState([]);
  const [poisVisitados, setPoisVisitados] = useState({});
  const [rutasGuardadas, setRutasGuardadas] = useState([]);
  const [rutaActiva, setRutaActiva] = useState(null);
  const [marcadorInicio, setMarcadorInicio] = useState(null);
  const [ciudadActiva, setCiudadActiva] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [rv, rm, rp, rr, rl, rvis] = await Promise.all([
          AsyncStorage.getItem(STORAGE_VIAJES),
          AsyncStorage.getItem(STORAGE_MAPAS),
          AsyncStorage.getItem(STORAGE_POIS),
          AsyncStorage.getItem(STORAGE_RUTAS),
          AsyncStorage.getItem(STORAGE_LANG),
          AsyncStorage.getItem(STORAGE_VISITADOS),
        ]);
        if (rv) setViajes(JSON.parse(rv));
        if (rm) setMapas(JSON.parse(rm));
        if (rp) setPoisUsuario(JSON.parse(rp));
        if (rr) setRutasGuardadas(JSON.parse(rr));
        if (rl) setLangState(rl);
        if (rvis) setPoisVisitados(JSON.parse(rvis));
      } catch (e) {}
      setVC(true);
    })();
  }, []);

  useEffect(() => {
    if (!viajesCargados) return;
    AsyncStorage.setItem(STORAGE_VIAJES, JSON.stringify(viajes)).catch(() => {});
  }, [viajes, viajesCargados]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_MAPAS, JSON.stringify(mapas)).catch(() => {});
  }, [mapas]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_POIS, JSON.stringify(poisUsuario)).catch(() => {});
  }, [poisUsuario]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_RUTAS, JSON.stringify(rutasGuardadas)).catch(() => {});
  }, [rutasGuardadas]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_VISITADOS, JSON.stringify(poisVisitados)).catch(() => {});
  }, [poisVisitados]);

  function setLang(l) {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_LANG, l).catch(() => {});
  }

  function togglePaisVisitado(id) {
    setViajes(prev => {
      const a = prev[id] ?? { visitado: false, ciudades: [] };
      return { ...prev, [id]: { ...a, visitado: !a.visitado } };
    });
  }

  // AHORA: marca país como visitado automáticamente si añades una ciudad
  // Y convierte coordenadas a formato {latitude, longitude} para react-native-maps
  function añadirCiudadViaje(paisId, ciudad, coordenadasRaw = null) {
    setViajes(prev => {
      const a = prev[paisId] ?? { visitado: false, ciudades: [] };
      // Normalizamos ciudades existentes
      const ciudadesNorm = a.ciudades.map(c => typeof c === 'string' ? { nombre: c, coordenadas: null } : c);
      if (ciudadesNorm.find(c => c.nombre === ciudad)) return prev;

      // Convertimos coordenadas al formato de react-native-maps
      let coords = null;
      if (coordenadasRaw) {
        coords = {
          latitude: coordenadasRaw.lat ?? coordenadasRaw.latitude ?? 0,
          longitude: coordenadasRaw.lon ?? coordenadasRaw.longitude ?? 0,
        };
      }

      return {
        ...prev,
        [paisId]: {
          ...a,
          visitado: true, // ← AUTO-MARCAR país como visitado
          ciudades: [...ciudadesNorm, { nombre: ciudad, coordenadas: coords }]
        }
      };
    });
  }

  function borrarCiudadViaje(paisId, ciudad) {
    setViajes(prev => {
      const a = prev[paisId];
      if (!a) return prev;
      return { ...prev, [paisId]: { ...a, ciudades: a.ciudades.filter(c => {
        const nombre = typeof c === 'string' ? c : c.nombre;
        return nombre !== ciudad;
      }) } };
    });
  }

  function datosPais(id) {
    return viajes[id] ?? { visitado: false, ciudades: [] };
  }

  function renombrarMapa(paisId, nombreAntiguo, nombreNuevo) {
    setMapas(prev => {
      const lista = prev[paisId] ?? [];
      return { ...prev, [paisId]: lista.map(c => c === nombreAntiguo ? nombreNuevo : c) };
    });
    setPoisUsuario(prev => prev.map(p =>
      (p.ciudad ?? '').toLowerCase() === nombreAntiguo.toLowerCase()
        ? { ...p, ciudad: nombreNuevo }
        : p
    ));
  }
  function añadirMapa(paisId, nombreCiudad) {
    setMapas(prev => {
      const lista = prev[paisId] ?? [];
      if (lista.includes(nombreCiudad)) return prev;
      return { ...prev, [paisId]: [...lista, nombreCiudad] };
    });
  }
  function borrarMapa(paisId, nombreCiudad) {
    setMapas(prev => {
      const lista = prev[paisId] ?? [];
      return { ...prev, [paisId]: lista.filter(c => c !== nombreCiudad) };
    });
    setPoisUsuario(prev => prev.filter(p => (p.ciudad ?? '').toLowerCase() !== nombreCiudad.toLowerCase()));
  }
  function ciudadesConMapa(paisId) {
    return mapas[paisId] ?? [];
  }

  function añadirPoi(poi) {
    const poiConDefaults = {
      ...poi,
      visitado: poi.visitado ?? false,
      descripcion: poi.descripcion ?? '',
      prioridad: poi.prioridad ?? poi.relevancia ?? 2,
    };
    setPoisUsuario(prev => [...prev, poiConDefaults]);
  }
  function editarPoi(id, cambios) {
    setPoisUsuario(prev => prev.map(p => p.id === id ? { ...p, ...cambios } : p));
  }
  function eliminarPoi(id) {
    setPoisUsuario(prev => prev.filter(p => p.id !== id));
  }

  function guardarRuta(nombre, paradas, ciudad) {
    const nueva = {
      id: `ruta_${Date.now()}`,
      nombre,
      paradas,
      ciudad: ciudad ?? '',
      fecha: new Date().toLocaleDateString('es-ES'),
    };
    setRutasGuardadas(prev => [nueva, ...prev]);
    return nueva;
  }
  function borrarRuta(id) {
    setRutasGuardadas(prev => prev.filter(r => r.id !== id));
  }

  function togglePoiVisitado(id) {
    setPoisVisitados(prev => ({ ...prev, [id]: !prev[id] }));
    setPoisUsuario(prev => prev.map(p =>
      p.id === id ? { ...p, visitado: !(p.visitado ?? false) } : p
    ));
  }

  const value = {
    lang, setLang,
    viajes, togglePaisVisitado, añadirCiudadViaje, borrarCiudadViaje, datosPais,
    mapas, añadirMapa, borrarMapa, ciudadesConMapa, renombrarMapa,
    poisUsuario, todosLosPois: poisUsuario, añadirPoi, editarPoi, eliminarPoi,
    rutasGuardadas, guardarRuta, borrarRuta,
    rutaActiva, setRutaActiva,
    ciudadActiva, setCiudadActiva,
    marcadorInicio, setMarcadorInicio,
    poisVisitados, togglePoiVisitado,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);