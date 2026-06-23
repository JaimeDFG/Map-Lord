import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PUNTOS_DE_INTERES from '../data/puntosInteres.json';

const STORAGE_VIAJES = 'maplord_viajes_v1';
const STORAGE_POIS   = 'maplord_custom_pois_v1';
const STORAGE_RUTAS  = 'maplord_rutas_guardadas_v1';
const STORAGE_LANG   = 'maplord_lang_v1';
const STORAGE_VISITADOS = 'maplord_visitados_v1';

const Ctx = createContext(null);

export function AppProvider({ children }) {

  // ── Idioma
  const [lang, setLangState]            = useState('es');

  // ── Viajes
  const [viajes, setViajes]             = useState({});
  const [viajesCargados, setVC]         = useState(false);

  // ── POIs usuario y ediciones
  const [poisUsuario, setPoisUsuario]   = useState([]);
  const [poisEditados, setPoisEditados] = useState({});
  const [poisVisitados, setPoisVisitados] = useState({});

  // ── Rutas guardadas
  const [rutasGuardadas, setRutasGuardadas] = useState([]);

  // ── Ruta activa
  const [rutaActiva, setRutaActiva]     = useState(null);
  const [marcadorInicio, setMarcadorInicio] = useState(null);

  // ── Ciudad activa
  const [ciudadActiva, setCiudadActiva] = useState(null);

  // ── todosLosPois se calcula aquí, después de declarar poisUsuario y poisEditados
  const todosLosPois = [
    ...PUNTOS_DE_INTERES.map(p => poisEditados[p.id] ? { ...p, ...poisEditados[p.id] } : p),
    ...poisUsuario,
  ];
  // ── Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const [rv, rp, rr, rl, rvis] = await Promise.all([
          AsyncStorage.getItem(STORAGE_VIAJES),
          AsyncStorage.getItem(STORAGE_POIS),
          AsyncStorage.getItem(STORAGE_RUTAS),
          AsyncStorage.getItem(STORAGE_LANG),
          AsyncStorage.getItem(STORAGE_VISITADOS),
        ]);
        if (rv) setViajes(JSON.parse(rv));
        if (rp) setPoisUsuario(JSON.parse(rp));
        if (rr) setRutasGuardadas(JSON.parse(rr));
        if (rl) setLangState(rl);
        if (rvis) setPoisVisitados(JSON.parse(rvis));
      } catch (e) {}
      setVC(true);
    })();
  }, []);

  // ── Persistencia
  useEffect(() => {
    if (!viajesCargados) return;
    AsyncStorage.setItem(STORAGE_VIAJES, JSON.stringify(viajes)).catch(() => {});
  }, [viajes, viajesCargados]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_POIS, JSON.stringify(poisUsuario)).catch(() => {});
  }, [poisUsuario]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_RUTAS, JSON.stringify(rutasGuardadas)).catch(() => {});
  }, [rutasGuardadas]);

  useEffect(() => {
  AsyncStorage.setItem(STORAGE_VISITADOS, JSON.stringify(poisVisitados)).catch(() => {});
  }, [poisVisitados]);

  // ── Helpers viajes
  function togglePaisVisitado(id) {
    setViajes(prev => {
      const a = prev[id] ?? { visitado: false, ciudades: [] };
      return { ...prev, [id]: { ...a, visitado: !a.visitado } };
    });
  }
  function añadirCiudadViaje(paisId, ciudad) {
    setViajes(prev => {
      const a = prev[paisId] ?? { visitado: true, ciudades: [] };
      if (a.ciudades.includes(ciudad)) return prev;
      return { ...prev, [paisId]: { ...a, visitado: true, ciudades: [...a.ciudades, ciudad] } };
    });
  }
  function borrarCiudadViaje(paisId, ciudad) {
    setViajes(prev => {
      const a = prev[paisId];
      if (!a) return prev;
      return { ...prev, [paisId]: { ...a, ciudades: a.ciudades.filter(c => c !== ciudad) } };
    });
  }
  function borrarMapa(paisId, nombreCiudad) {
    // Eliminar ciudad de la lista de viajes
    setViajes(prev => {
      const a = prev[paisId];
      if (!a) return prev;
      return { ...prev, [paisId]: { ...a, ciudades: a.ciudades.filter(c => c !== nombreCiudad) } };
    });
    // Eliminar todos los POIs personalizados de esa ciudad
    setPoisUsuario(prev => prev.filter(p => (p.ciudad ?? '').toLowerCase() !== nombreCiudad.toLowerCase()));
  }
  function datosPais(id) {
    return viajes[id] ?? { visitado: false, ciudades: [] };
  }

  // ── Helpers POIs
  function añadirPoi(poi) {
    setPoisUsuario(prev => [...prev, poi]);
  }
  function editarPoi(id, cambios) {
    if (poisUsuario.find(p => p.id === id)) {
      setPoisUsuario(prev => prev.map(p => p.id === id ? { ...p, ...cambios } : p));
    } else {
      setPoisEditados(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...cambios } }));
    }
  }
  function eliminarPoi(id) {
    setPoisUsuario(prev => prev.filter(p => p.id !== id));
  }

  // ── Helpers rutas
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

  // ── Idioma
  function setLang(l) {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_LANG, l).catch(() => {});
  }

  function togglePoiVisitado(id) {
  setPoisVisitados(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Valor del contexto
  const value = {
    lang, setLang,
    viajes, togglePaisVisitado, añadirCiudadViaje, borrarCiudadViaje, borrarMapa, datosPais,
    poisUsuario, todosLosPois, añadirPoi, editarPoi, eliminarPoi,
    rutasGuardadas, guardarRuta, borrarRuta,
    rutaActiva, setRutaActiva,
    ciudadActiva, setCiudadActiva,
    marcadorInicio, setMarcadorInicio,
    poisVisitados, togglePoiVisitado,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);