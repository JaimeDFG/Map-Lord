import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PUNTOS_DE_INTERES from '../data/puntosInteres.json';

const STORAGE_VIAJES  = 'maplord_viajes_v1';
const STORAGE_MAPAS   = 'maplord_mapas_v1';       // ← mapas separados del pasaporte
const STORAGE_POIS    = 'maplord_custom_pois_v1';
const STORAGE_RUTAS   = 'maplord_rutas_guardadas_v1';
const STORAGE_LANG    = 'maplord_lang_v1';
const STORAGE_VISITADOS = 'maplord_visitados_v1';

const Ctx = createContext(null);

export function AppProvider({ children }) {

  // ── Idioma
  const [lang, setLangState]            = useState('es');

  // ── Viajes (pasaporte — solo lo que el usuario marca manualmente)
  const [viajes, setViajes]             = useState({});
  const [viajesCargados, setVC]         = useState(false);

  // ── Mapas (ciudades con mapa creado — independiente del pasaporte)
  // Estructura: { [paisId]: [nombreCiudad, ...] }
  const [mapas, setMapas]               = useState({});

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
  // Si el idioma es inglés, usa los campos _en del JSON
  function aplicarIdioma(p) {
    if (lang !== 'en') return p;
    return {
      ...p,
      nombre:           p.nombre_en           ?? p.nombre,
      ciudad:           p.ciudad_en           ?? p.ciudad,
      pais:             p.pais_en             ?? p.pais,
      descripcion_corta:p.descripcion_corta_en ?? p.descripcion_corta,
      historia:         p.historia_en         ?? p.historia,
      arquitectura:     p.arquitectura_en     ?? p.arquitectura,
      curiosidades:     p.curiosidades_en     ?? p.curiosidades,
      misterios:        p.misterios_en        ?? p.misterios,
    };
  }

  const todosLosPois = [
    ...PUNTOS_DE_INTERES.map(p => {
      const base = poisEditados[p.id] ? { ...p, ...poisEditados[p.id] } : p;
      return aplicarIdioma(base);
    }),
    ...poisUsuario,
  ];
  // ── Carga inicial
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
        if (rv)  setViajes(JSON.parse(rv));
        if (rm)  setMapas(JSON.parse(rm));
        if (rp)  setPoisUsuario(JSON.parse(rp));
        if (rr)  setRutasGuardadas(JSON.parse(rr));
        if (rl)  setLangState(rl);
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

  // ── Helpers viajes
  // ── Helpers pasaporte (solo lo que el usuario marca manualmente)
  function togglePaisVisitado(id) {
    setViajes(prev => {
      const a = prev[id] ?? { visitado: false, ciudades: [] };
      return { ...prev, [id]: { ...a, visitado: !a.visitado } };
    });
  }
  function añadirCiudadViaje(paisId, ciudad) {
    // Solo pasaporte: NO toca mapas ni marca el país como visitado automáticamente
    setViajes(prev => {
      const a = prev[paisId] ?? { visitado: false, ciudades: [] };
      if (a.ciudades.includes(ciudad)) return prev;
      return { ...prev, [paisId]: { ...a, ciudades: [...a.ciudades, ciudad] } };
    });
  }
  function borrarCiudadViaje(paisId, ciudad) {
    setViajes(prev => {
      const a = prev[paisId];
      if (!a) return prev;
      return { ...prev, [paisId]: { ...a, ciudades: a.ciudades.filter(c => c !== ciudad) } };
    });
  }
  function datosPais(id) {
    return viajes[id] ?? { visitado: false, ciudades: [] };
  }

  // ── Helpers mapas (independientes del pasaporte)
  function renombrarMapa(paisId, nombreAntiguo, nombreNuevo) {
    setMapas(prev => {
      const lista = prev[paisId] ?? [];
      return { ...prev, [paisId]: lista.map(c => c === nombreAntiguo ? nombreNuevo : c) };
    });
    // Reasignar POIs de la ciudad antigua al nuevo nombre
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
    // Eliminar también los POIs personalizados de esa ciudad
    setPoisUsuario(prev => prev.filter(p => (p.ciudad ?? '').toLowerCase() !== nombreCiudad.toLowerCase()));
  }
  function ciudadesConMapa(paisId) {
    return mapas[paisId] ?? [];
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
    viajes, togglePaisVisitado, añadirCiudadViaje, borrarCiudadViaje, datosPais,
    mapas, añadirMapa, borrarMapa, ciudadesConMapa, renombrarMapa,
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