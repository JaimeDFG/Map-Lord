import { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import OsmTileLayer from '../components/OsmTileLayer';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, OPCIONES_TIEMPO, labelCategoria, labelRelevancia } from '../constants/tourism';
import FichaPOI from '../components/FichaPOI';

function distancia(c1, c2) {
  const R = 6371000, dLat = (c2.latitude - c1.latitude) * Math.PI / 180, dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1.latitude * Math.PI / 180) * Math.cos(c2.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generarRuta(minutos, coordInicio, pois) {
  let restante = minutos;
  const sel = [];
  let cands = [...pois];
  let pos = coordInicio;

  while (restante > 15 && cands.length) {
    const distancias = cands.map(p => distancia(pos, p.coordenadas));
    const dmax = Math.max(...distancias, 1);
    const dmin = Math.min(...distancias);
    const scored = cands.map((p, idx) => {
      const d = distancias[idx];
      const normDist = dmax === dmin ? 1 : 1 - ((d - dmin) / (dmax - dmin));
      const normRel = (p.prioridad ?? p.relevancia ?? 2) / 3;
      const penalizacionDist = d > 2000 ? 0.3 : (d > 1000 ? 0.7 : 1);
      return { ...p, score: (normDist * 0.5 + normRel * 0.5) * penalizacionDist };
    });
    scored.sort((a, b) => b.score - a.score);
    const next = scored.find(p => p.tiempo_visita + 10 <= restante);
    if (!next) break;
    sel.push(next);
    restante -= next.tiempo_visita + 10;
    pos = next.coordenadas;
    cands = cands.filter(p => p.id !== next.id);
  }
  return optimizarRuta(sel);
}

function optimizarRuta(pois) {
  if (pois.length <= 1) return pois;

  const visitado = new Set();
  const orden = [];
  let actual = pois[0];
  visitado.add(actual.id);
  orden.push(actual);

  while (orden.length < pois.length) {
    let mejorDist = Infinity, mejor = null;
    for (const p of pois) {
      if (visitado.has(p.id)) continue;
      const d = distancia(actual.coordenadas, p.coordenadas);
      if (d < mejorDist) { mejorDist = d; mejor = p; }
    }
    if (!mejor) break;
    visitado.add(mejor.id);
    orden.push(mejor);
    actual = mejor;
  }

  function calcularLongitud(ruta) {
    let total = 0;
    for (let i = 0; i < ruta.length - 1; i++) {
      total += distancia(ruta[i].coordenadas, ruta[i + 1].coordenadas);
    }
    return total;
  }

  let mejorada = true;
  let maxIter = 50;
  while (mejorada && maxIter-- > 0) {
    mejorada = false;
    for (let i = 0; i < orden.length - 1; i++) {
      for (let k = i + 2; k < orden.length; k++) {
        const dAntes = distancia(orden[i].coordenadas, orden[i + 1].coordenadas) +
          distancia(orden[k].coordenadas, orden[k + 1]?.coordenadas ?? orden[k].coordenadas);
        const dDespues = distancia(orden[i].coordenadas, orden[k].coordenadas) +
          distancia(orden[i + 1].coordenadas, orden[k + 1]?.coordenadas ?? orden[i + 1].coordenadas);

        if (dDespues < dAntes) {
          const tramo = orden.slice(i + 1, k + 1).reverse();
          orden.splice(i + 1, k - i, ...tramo);
          mejorada = true;
        }
      }
    }
  }

  return orden;
}

function aplicarFiltros(pois, filtroCat, filtroRel, filtroVisitado) {
  return pois.filter(p => {
    if (filtroCat.size > 0 && !filtroCat.has(p.categoria)) return false;
    const prio = p.prioridad ?? p.relevancia ?? 2;
    if (filtroRel.size > 0 && !filtroRel.has(String(prio))) return false;
    const visitado = p.visitado ?? false;
    if (filtroVisitado === 'visitados' && !visitado) return false;
    if (filtroVisitado === 'pendientes' && visitado) return false;
    return true;
  });
}

export default function PantallaRutas({ ciudad, onActivarRuta }) {
  const { lang, rutasGuardadas, guardarRuta, borrarRuta, setRutaActiva, setMarcadorInicio, poisUsuario } = useApp();
  const t = useT(lang);
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState('crear');
  const [tiempo, setTiempo] = useState(null);
  const [ruta, setRuta] = useState(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [marcador, setMarcador] = useState(null);
  const [poiFicha, setPoiFicha] = useState(null);
  const [modalGuardar, setModalGuardar] = useState(false);
  const [nombreRuta, setNombreRuta] = useState('');
  const [seleccion, setSeleccion] = useState(new Set());
  const [rutaManual, setRutaManual] = useState(null);

  // Filtros para pestaña CREAR RUTA
  const [filtroCatRuta, setFiltroCatRuta] = useState(new Set());
  const [filtroRelRuta, setFiltroRelRuta] = useState(new Set());
  const [filtroVisitadoRuta, setFiltroVisitadoRuta] = useState('todos');

  // Filtros para pestaña RUTA MANUAL (independientes)
  const [filtroCatManual, setFiltroCatManual] = useState(new Set());
  const [filtroRelManual, setFiltroRelManual] = useState(new Set());
  const [filtroVisitadoManual, setFiltroVisitadoManual] = useState('todos');

  const nombreCiudad = ciudad?.nombre?.toLowerCase() ?? 'madrid';

  // POIs base de esta ciudad (sin filtros de categoría/estrellas)
  const poisDeCiudad = useMemo(() => {
    return poisUsuario.filter(p => (p.ciudad ?? 'Madrid').toLowerCase() === nombreCiudad);
  }, [poisUsuario, nombreCiudad]);

  // POIs filtrados para CREAR RUTA
  const todosLosPois = aplicarFiltros(poisDeCiudad, filtroCatRuta, filtroRelRuta, filtroVisitadoRuta);

  // POIs filtrados para RUTA MANUAL
  const todosLosPoisManual = aplicarFiltros(poisDeCiudad, filtroCatManual, filtroRelManual, filtroVisitadoManual);

  // Categorías que REALMENTE existen en esta ciudad (para mostrar solo esas en los filtros)
  const catsDisponibles = useMemo(() => {
    const set = new Set();
    for (const p of poisDeCiudad) set.add(p.categoria);
    return Array.from(set).sort();
  }, [poisDeCiudad]);

  // Relevancias que REALMENTE existen en esta ciudad
  const relsDisponibles = useMemo(() => {
    const set = new Set();
    for (const p of poisDeCiudad) set.add(String(p.prioridad ?? p.relevancia ?? 2));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [poisDeCiudad]);

  const centro = ciudad?.coordenadas ?? { latitude: 40.4168, longitude: -3.7038 };
  const region = { ...centro, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  const rutasDeCiudad = rutasGuardadas.filter(r =>
    (r.ciudad ?? '').toLowerCase() === nombreCiudad
  );

  function selTiempo(op) {
    setTiempo(op); setRuta(null); setMarcador(null); setEligiendo(true);
  }
  function tocarMapa(e) {
    if (!eligiendo) return;
    const c = e.nativeEvent.coordinate;
    setMarcador(c); setEligiendo(false);
    setRuta(generarRuta(tiempo.minutos, c, todosLosPois));
  }
  function reiniciar() {
    setTiempo(null); setRuta(null); setMarcador(null); setEligiendo(false);
    setFiltroCatRuta(new Set());
    setFiltroRelRuta(new Set());
    setFiltroVisitadoRuta('todos');
  }

  function handleGuardarRuta() {
    const rutaAGuardar = rutaManual ?? ruta;
    if (!rutaAGuardar || !nombreRuta.trim()) return;
    guardarRuta(nombreRuta.trim(), rutaAGuardar, ciudad?.nombre ?? '');
    setModalGuardar(false);
    setNombreRuta('');
  }

  const tiempoTotal = ruta ? ruta.reduce((a, p) => a + p.tiempo_visita, 0) : 0;

  // Componente reutilizable para los filtros
  function FiltrosBlock({
    filtroCat, setFiltroCat,
    filtroRel, setFiltroRel,
    filtroVisitado, setFiltroVisitado,
    contador, onLimpiar,
  }) {
    return (
      <View style={s.filtrosBox}>
        <View style={s.filtrosHeader}>
          <Text style={s.filtrosEmoji}>🔍</Text>
          <Text style={s.filtrosTitulo}>{lang === 'en' ? 'Filter places' : 'Filtrar lugares'}</Text>
          {(filtroCat.size > 0 || filtroRel.size > 0 || filtroVisitado !== 'todos') && (
            <TouchableOpacity onPress={onLimpiar}>
              <Text style={s.filtrosLimpiar}>{lang === 'en' ? 'Clear' : 'Limpiar'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.filtrosWrap}>
          {[
            { key: 'todos', label: lang === 'en' ? 'All' : 'Todos' },
            { key: 'pendientes', label: '⏳ ' + (lang === 'en' ? 'Pending' : 'Pendientes') },
            { key: 'visitados', label: '✓ ' + (lang === 'en' ? 'Visited' : 'Visitados') },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.filtroChip, filtroVisitado === f.key && s.filtroChipActivo]}
              onPress={() => setFiltroVisitado(f.key)}
            >
              <Text style={[s.filtroChipT, filtroVisitado === f.key && s.filtroChipTActivo]}>{f.label}</Text>
            </TouchableOpacity>
          ))}

          {relsDisponibles.map(r => {
            const activo = filtroRel.has(String(r));
            return (
              <TouchableOpacity
                key={r}
                style={[s.filtroChip, activo && s.filtroChipActivo]}
                onPress={() => {
                  setFiltroRel(prev => {
                    const next = new Set(prev);
                    activo ? next.delete(String(r)) : next.add(String(r));
                    return next;
                  });
                }}
              >
                <Text style={[s.filtroChipT, activo && s.filtroChipTActivo]}>{'★'.repeat(Number(r))}</Text>
              </TouchableOpacity>
            );
          })}

          {catsDisponibles.map(cat => {
            const activo = filtroCat.has(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[s.filtroChip, activo && s.filtroChipActivo]}
                onPress={() => {
                  setFiltroCat(prev => {
                    const next = new Set(prev);
                    activo ? next.delete(cat) : next.add(cat);
                    return next;
                  });
                }}
              >
                <Text style={[s.filtroChipT, activo && s.filtroChipTActivo]}>{CATEGORIAS[cat]?.emoji ?? '✦'} {labelCategoria(cat, lang)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.filtrosContador}>
          {contador} {lang === 'en' ? 'places match your filters' : 'lugares coinciden con tus filtros'}
          {contador === 0 && ' — ' + (lang === 'en' ? 'Try changing filters' : 'Prueba a cambiar los filtros')}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={[s.safe, { paddingTop: insets.top }]} />
      <View style={s.header}>
        <Text style={s.headerTitulo}>🧭 {t.rutas}</Text>
        <View style={s.tabsHeader}>
          <TouchableOpacity style={[s.tabH, tab === 'crear' && s.tabHActivo]} onPress={() => setTab('crear')}>
            <Text style={[s.tabHT, tab === 'crear' && s.tabHTActivo]}>{t.crearRuta}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabH, tab === 'manual' && s.tabHActivo]} onPress={() => setTab('manual')}>
            <Text style={[s.tabHT, tab === 'manual' && s.tabHTActivo]}>{t.rutaManual}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabH, tab === 'guardadas' && s.tabHActivo]} onPress={() => setTab('guardadas')}>
            <Text style={[s.tabHT, tab === 'guardadas' && s.tabHTActivo]}>{t.rutasGuardadas} {rutasDeCiudad.length > 0 ? `(${rutasDeCiudad.length})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={{ padding: 16 }}>

        {/* ========== CREAR RUTA ========== */}
        {tab === 'crear' && (
          <>
            <View style={s.seccionRow}>
              <Text style={s.secLabel}>{t.tiempoDisp}</Text>
              {tiempo && <TouchableOpacity style={s.btnReset} onPress={reiniciar}><Text style={s.btnResetT}>{t.reiniciar}</Text></TouchableOpacity>}
            </View>

            <View style={s.opciones}>
              {OPCIONES_TIEMPO.map(op => (
                <TouchableOpacity key={op.minutos} style={[s.opcion, tiempo?.minutos === op.minutos && s.opcionActiva]} onPress={() => selTiempo(op)}>
                  <Text style={s.opcionEmoji}>{op.emoji}</Text>
                  <Text style={[s.opcionLabel, tiempo?.minutos === op.minutos && s.opcionLabelActiva]}>{lang === 'en' ? op.labelEn : op.labelEs}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ===== FILTROS CREAR RUTA ===== */}
            {tiempo && (
              <FiltrosBlock
                filtroCat={filtroCatRuta}
                setFiltroCat={setFiltroCatRuta}
                filtroRel={filtroRelRuta}
                setFiltroRel={setFiltroRelRuta}
                filtroVisitado={filtroVisitadoRuta}
                setFiltroVisitado={setFiltroVisitadoRuta}
                contador={todosLosPois.length}
                onLimpiar={() => {
                  setFiltroCatRuta(new Set());
                  setFiltroRelRuta(new Set());
                  setFiltroVisitadoRuta('todos');
                  setRuta(null);
                  setMarcador(null);
                  setEligiendo(true);
                }}
              />
            )}

            {/* ===== MAPA ===== */}
            {tiempo && (
              <View style={s.mapaBox}>
                {eligiendo && (
                  <View style={[s.mapaOverlay, { backgroundColor: 'rgba(37,99,235,0.92)' }]}>
                    <Text style={s.mapaOverlayT}>👆 {t.tocaMapa}</Text>
                  </View>
                )}
                {!eligiendo && !marcador && (
                  <View style={[s.mapaOverlay, { backgroundColor: 'rgba(220,38,38,0.92)' }]}>
                    <Text style={s.mapaOverlayT}>📍 {lang === 'en' ? 'Tap the map to choose a starting point' : 'Toca el mapa para elegir un punto de inicio'}</Text>
                  </View>
                )}

                <MapView style={s.mapa} region={region} onPress={tocarMapa}>
                  <OsmTileLayer />
                  {marcador && (
                    <Marker coordinate={marcador}>
                      <View style={s.pinInicio}><Text>📍</Text></View>
                    </Marker>
                  )}
                  {ruta && ruta.map((poi, i) => {
                    const cat = CATEGORIAS[poi.categoria] ?? { color: '#555' };
                    return (
                      <Marker key={poi.id} coordinate={poi.coordenadas}>
                        <View style={[s.pinNum, { backgroundColor: cat.color }]}><Text style={s.pinNumT}>{i + 1}</Text></View>
                      </Marker>
                    );
                  })}
                  {ruta && marcador && (
                    <Polyline coordinates={[marcador, ...ruta.map(p => p.coordenadas)]} strokeColor="#5c1011" strokeWidth={3} lineDashPattern={[8, 4]} />
                  )}
                </MapView>

                {!eligiendo && marcador && (
                  <TouchableOpacity style={s.cambiarInicio} onPress={() => { setEligiendo(true); setRuta(null); setMarcador(null); }}>
                    <Text style={s.cambiarInicioT}>{t.cambiarInicio}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ===== RESULTADO RUTA ===== */}
            {ruta && (
              <View style={s.rutaCard}>
                <Text style={s.rutaTitulo}>{t.tuRuta} · {ruta.length} {t.lugares}</Text>
                <Text style={s.rutaSub}>⏱ {tiempoTotal} {t.min}</Text>
                {ruta.map((poi, i) => {
                  const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#555' };
                  const rel = RELEVANCIA[poi.relevancia ?? poi.prioridad ?? 2];
                  return (
                    <TouchableOpacity key={poi.id} style={s.paso} onPress={() => setPoiFicha(poi)}>
                      <View style={s.pasoIzq}>
                        <View style={s.pasoNum}><Text style={s.pasoNumT}>{i + 1}</Text></View>
                        {i < ruta.length - 1 && <View style={s.pasoLinea} />}
                      </View>
                      <View style={[s.pasoIcono, { backgroundColor: cat.color + '20' }]}><Text style={{ fontSize: 20 }}>{cat.emoji}</Text></View>
                      <View style={s.pasoInfo}>
                        <Text style={s.pasoNombre}>{poi.nombre}</Text>
                        <Text style={s.pasoDetalle}>{labelCategoria(poi.categoria, lang)} · {poi.tiempo_visita} {t.min}</Text>
                        <Text style={s.pasoRel}>{rel?.estrellas} {t[rel?.label?.toLowerCase()] ?? rel?.label}</Text>
                      </View>
                      <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={s.botonesFinal}>
                  <TouchableOpacity style={s.btnGuardarRuta} onPress={() => setModalGuardar(true)}>
                    <Text style={s.btnGuardarRutaT}>💾 {t.guardarRuta}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnActivar} onPress={() => { setRutaActiva(ruta); setMarcadorInicio(marcador); onActivarRuta && onActivarRuta(); }}>
                    <Text style={s.btnActivarT}>🗺️ {t.activarRuta}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ========== RUTA MANUAL ========== */}
        {tab === 'manual' && (
          <>
            <Text style={s.secLabel}>{t.seleccionaLugares}</Text>

            {/* ===== FILTROS RUTA MANUAL (independientes) ===== */}
            <FiltrosBlock
              filtroCat={filtroCatManual}
              setFiltroCat={setFiltroCatManual}
              filtroRel={filtroRelManual}
              setFiltroRel={setFiltroRelManual}
              filtroVisitado={filtroVisitadoManual}
              setFiltroVisitado={setFiltroVisitadoManual}
              contador={todosLosPoisManual.length}
              onLimpiar={() => {
                setFiltroCatManual(new Set());
                setFiltroRelManual(new Set());
                setFiltroVisitadoManual('todos');
                setSeleccion(new Set());
                setRutaManual(null);
              }}
            />

            <Text style={s.filtrosContador}>{seleccion.size} {t.lugaresSeleccionados}</Text>

            {todosLosPoisManual.map(poi => {
              const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#888' };
              const sel = seleccion.has(poi.id);
              return (
                <TouchableOpacity
                  key={poi.id}
                  style={[s.poiSelRow, sel && s.poiSelRowActivo]}
                  onPress={() => {
                    setSeleccion(prev => {
                      const next = new Set(prev);
                      sel ? next.delete(poi.id) : next.add(poi.id);
                      return next;
                    });
                    setRutaManual(null);
                  }}
                >
                  <View style={[s.poiSelCheck, sel && s.poiSelCheckActivo]}>{sel && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}</View>
                  <View style={[s.poiSelIcono, { backgroundColor: cat.color + '20' }]}><Text style={{ fontSize: 20 }}>{cat.emoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.poiSelNombre}>{poi.nombre}</Text>
                    <Text style={s.poiSelSub}>{labelCategoria(poi.categoria, lang)} · {poi.tiempo_visita} {t.min}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {seleccion.size >= 2 && !rutaManual && (
              <TouchableOpacity style={s.btnActivar} onPress={() => {
                const pois = todosLosPoisManual.filter(p => seleccion.has(p.id));
                setRutaManual(optimizarRuta(pois));
              }}>
                <Text style={s.btnActivarT}>🧭 {t.ordenarRuta}</Text>
              </TouchableOpacity>
            )}

            {rutaManual && (
              <View style={s.rutaCard}>
                <Text style={s.rutaTitulo}>{t.tuRuta} · {rutaManual.length} {t.lugares}</Text>
                <Text style={s.rutaSub}>⏱ {t.tiempoTotal}: {rutaManual.reduce((a, p) => a + p.tiempo_visita, 0)} {t.min}</Text>
                {rutaManual.map((poi, i) => {
                  const cat = CATEGORIAS[poi.categoria] ?? { emoji: '📍', color: '#555' };
                  const rel = RELEVANCIA[poi.relevancia ?? poi.prioridad ?? 2];
                  return (
                    <TouchableOpacity key={poi.id} style={s.paso} onPress={() => setPoiFicha(poi)}>
                      <View style={s.pasoIzq}>
                        <View style={s.pasoNum}><Text style={s.pasoNumT}>{i + 1}</Text></View>
                        {i < rutaManual.length - 1 && <View style={s.pasoLinea} />}
                      </View>
                      <View style={[s.pasoIcono, { backgroundColor: cat.color + '20' }]}><Text style={{ fontSize: 20 }}>{cat.emoji}</Text></View>
                      <View style={s.pasoInfo}>
                        <Text style={s.pasoNombre}>{poi.nombre}</Text>
                        <Text style={s.pasoDetalle}>{labelCategoria(poi.categoria, lang)} · {poi.tiempo_visita} {t.min}</Text>
                        <Text style={s.pasoRel}>{rel?.estrellas} {t[rel?.label?.toLowerCase()] ?? rel?.label}</Text>
                      </View>
                      <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={s.botonesFinal}>
                  <TouchableOpacity style={s.btnGuardarRuta} onPress={() => setModalGuardar(true)}>
                    <Text style={s.btnGuardarRutaT}>💾 {t.guardarRuta}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnActivar} onPress={() => { setRutaActiva(rutaManual); setMarcadorInicio(null); onActivarRuta && onActivarRuta(); }}>
                    <Text style={s.btnActivarT}>🗺️ {t.activarRuta}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ========== RUTAS GUARDADAS ========== */}
        {tab === 'guardadas' && (
          <>
            {rutasDeCiudad.length === 0 && (
              <Text style={s.vacio}>{t.aunNoRutas}</Text>
            )}
            {rutasDeCiudad.map(r => (
              <View key={r.id} style={s.rutaGuardadaCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rutaGuardadaNombre}>{r.nombre}</Text>
                  <Text style={s.rutaGuardadaSub}>{r.paradas?.length ?? 0} {t.paradas} · {r.fecha}</Text>
                </View>
                <TouchableOpacity style={s.btnActivarPeq} onPress={() => { setRutaActiva(r.paradas); setMarcadorInicio(null); onActivarRuta && onActivarRuta(); }}>
                  <Text style={s.btnActivarPeqT}>🗺️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnBorrar} onPress={() => borrarRuta(r.id)}>
                  <Text style={s.btnBorrarT}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

      </ScrollView>

      {/* Modal guardar ruta */}
      <Modal visible={modalGuardar} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{t.guardarRuta}</Text>
            <TextInput
              style={s.input}
              placeholder={t.nombreRuta}
              placeholderTextColor="#bbb"
              value={nombreRuta}
              onChangeText={setNombreRuta}
            />
            <View style={s.modalBotones}>
              <TouchableOpacity style={s.btnCancelar} onPress={() => setModalGuardar(false)}>
                <Text style={s.btnCancelarT}>{t.cancelar}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGuardar} onPress={handleGuardarRuta}>
                <Text style={s.btnGuardarT}>{t.guardar}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FichaPOI
        poi={poiFicha}
        visible={!!poiFicha}
        onCerrar={() => setPoiFicha(null)}
        numeroParada={poiFicha && ruta ? ruta.findIndex(p => p.id === poiFicha.id) + 1 : null}
        totalParadas={ruta?.length}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f4f0' },
  flex: { flex: 1 },
  safe: { backgroundColor: '#fff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  tabsHeader: { flexDirection: 'row', gap: 8 },
  tabH: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabHActivo: { backgroundColor: '#5c1011' },
  tabHT: { fontSize: 12, fontWeight: '600', color: '#555' },
  tabHTActivo: { color: '#fff' },
  scroll: { padding: 16 },
  seccionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  btnReset: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  btnResetT: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  opcion: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#eee', elevation: 2 },
  opcionActiva: { borderColor: '#5c1011', backgroundColor: '#faf6f0' },
  opcionEmoji: { fontSize: 24, marginBottom: 4 },
  opcionLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
  opcionLabelActiva: { color: '#5c1011' },
  mapaBox: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, height: 240 },
  mapa: { flex: 1 },
  mapaOverlay: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  mapaOverlayT: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pinInicio: { backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  pinNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pinNumT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cambiarInicio: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  cambiarInicioT: { color: '#5c1011', fontWeight: '700', fontSize: 13 },
  rutaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3, marginBottom: 20 },
  rutaTitulo: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  rutaSub: { fontSize: 13, color: '#888', marginBottom: 14 },
  paso: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  pasoIzq: { alignItems: 'center', width: 26 },
  pasoNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#5c1011', alignItems: 'center', justifyContent: 'center' },
  pasoNumT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pasoLinea: { width: 2, flex: 1, minHeight: 18, backgroundColor: '#dce8ff', marginTop: 2 },
  pasoIcono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pasoInfo: { flex: 1 },
  pasoNombre: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  pasoDetalle: { fontSize: 12, color: '#888' },
  pasoRel: { fontSize: 11, marginTop: 1 },
  arrow: { fontSize: 20, color: '#ccc', alignSelf: 'center' },
  botonesFinal: { gap: 10, marginTop: 16 },
  btnGuardarRuta: { backgroundColor: '#faf6f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#d4a843' },
  btnGuardarRutaT: { color: '#5c1011', fontWeight: '700', fontSize: 15 },
  btnActivar: { backgroundColor: '#5c1011', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 0 },
  btnActivarT: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rutaGuardadaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  rutaGuardadaNombre: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  rutaGuardadaSub: { fontSize: 12, color: '#888', marginTop: 2 },
  btnActivarPeq: { backgroundColor: '#faf6f0', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  btnActivarPeqT: { fontSize: 18 },
  btnBorrar: { backgroundColor: '#fee2e2', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  btnBorrarT: { color: '#dc2626', fontWeight: '700' },
  vacio: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCont: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  drag: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  safeRoot: { flex: 1, backgroundColor: '#f7f4f0' },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnCancelar: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnCancelarT: { fontSize: 14, fontWeight: '600', color: '#555' },
  btnGuardar: { flex: 1, backgroundColor: '#5c1011', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  poiSelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  poiSelRowActivo: { borderColor: '#5c1011', backgroundColor: '#faf6f0' },
  poiSelCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  poiSelCheckActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  poiSelIcono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  poiSelNombre: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  poiSelSub: { fontSize: 12, color: '#888', marginTop: 1 },
  btnGuardarT: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // FILTROS
  filtrosBox: { backgroundColor: '#faf6f0', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e8dfd5' },
  filtrosHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  filtrosEmoji: { fontSize: 16 },
  filtrosTitulo: { flex: 1, fontSize: 13, fontWeight: '700', color: '#5c1011', textTransform: 'uppercase', letterSpacing: 0.5 },
  filtrosLimpiar: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  filtrosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtrosContador: { fontSize: 11, color: '#8a7e72', marginTop: 10 },
  filtroChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8dfd5' },
  filtroChipActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  filtroChipT: { fontSize: 11, fontWeight: '500', color: '#555' },
  filtroChipTActivo: { color: '#f5e6c8' },
});