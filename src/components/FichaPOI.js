import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, SECCIONES } from '../constants/tourism';

export default function FichaPOI({ poi, visible, onCerrar, numeroParada, totalParadas, onEditar }) {
  const { lang, poisVisitados, togglePoiVisitado } = useApp();
  const t = useT(lang);
  const [tab, setTab] = useState('historia');

  const cat = poi ? CATEGORIAS[poi.categoria] : null;
  const rel = poi ? RELEVANCIA[poi.relevancia] : null;

  useEffect(() => { if (visible) setTab('historia'); }, [visible]);

  // Solo mostrar secciones que tengan contenido
  const seccionesVisibles = SECCIONES.filter(sec => poi?.[sec.key]?.trim?.());

  const labelSec = {
    historia:     t.historia,
    arquitectura: t.arquitectura,
    curiosidades: t.curiosidades,
    misterios:    t.misterios,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.contenido}>
          <View style={s.drag} />

          <View style={s.header}>
            <View style={[s.icono, { backgroundColor: (cat?.color ?? '#888') + '20' }]}>
              <Text style={{ fontSize: 28 }}>{cat?.emoji ?? '📍'}</Text>
            </View>
            <View style={s.headerTexto}>
              {numeroParada && (
                <Text style={s.paradaLabel}>{t.parada} {numeroParada} {t.de} {totalParadas}</Text>
              )}
              <Text style={s.titulo}>{poi?.nombre}</Text>
              <Text style={s.sub}>{poi?.descripcion_corta}</Text>
              <View style={s.badges}>
                <View style={[s.badge, { backgroundColor: cat?.color ?? '#888' }]}>
                  <Text style={s.badgeT}>{poi?.categoria}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: rel?.color ?? '#888' }]}>
                  <Text style={s.badgeT}>{rel?.estrellas} {t[rel?.label?.toLowerCase()] ?? rel?.label}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: '#444' }]}>
                  <Text style={s.badgeT}>⏱ {poi?.tiempo_visita} {t.min}</Text>
                </View>
                {poi && (
                  <TouchableOpacity
                    style={[s.badge, { backgroundColor: poisVisitados[poi.id] ? '#16a34a' : '#f3f4f6', borderWidth: 1, borderColor: poisVisitados[poi.id] ? '#16a34a' : '#e5e7eb' }]}
                    onPress={() => togglePoiVisitado(poi.id)}
                  >
                    <Text style={[s.badgeT, { color: poisVisitados[poi.id] ? '#fff' : '#888' }]}>
                      {poisVisitados[poi.id] ? '✓ Visitado' : '○ Marcar visitado'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={s.headerBotones}>
              {onEditar && (
                <TouchableOpacity onPress={() => { onCerrar(); onEditar(poi); }} style={s.botonEditar}>
                  <Text style={s.botonEditarT}>✏️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onCerrar} style={s.cerrar}>
                <Text style={s.cerrarT}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {seccionesVisibles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
              {seccionesVisibles.map(sec => (
                <TouchableOpacity
                  key={sec.key}
                  style={[s.tab, tab === sec.key && s.tabActivo]}
                  onPress={() => setTab(sec.key)}
                >
                  <Text style={[s.tabT, tab === sec.key && s.tabTActivo]}>
                    {sec.emoji} {labelSec[sec.key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ScrollView
            style={s.cuerpo}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingTop: 2, paddingBottom: 30, flexGrow: 1, justifyContent: 'flex-start' }}
          >
            <Text style={s.texto}>{poi?.[tab]}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  contenido:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, height: '80%' },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  icono:      { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTexto:{ flex: 1 },
  paradaLabel:{ fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: 2 },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  sub:        { fontSize: 13, color: '#888', marginTop: 2 },
  badges:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeT:     { color: '#fff', fontSize: 11, fontWeight: '600' },
  headerBotones: { flexDirection: 'column', gap: 6 },
  botonEditar:{ backgroundColor: '#fef9c3', borderRadius: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  botonEditarT:{ fontSize: 14 },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cerrarT:    { fontSize: 13, color: '#555' },
  tabs:       { marginBottom: 6, flexGrow: 0, flexShrink: 0, height: 38 },
  tab:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, alignSelf: 'flex-start' },
  tabActivo:  { backgroundColor: '#1a1a2e' },
  tabT:       { fontSize: 13, color: '#555' },
  tabTActivo: { color: '#fff', fontWeight: '600' },
  cuerpo:     { flex: 1 },
  texto:      { fontSize: 15, lineHeight: 24, color: '#333', marginTop: 0, textAlignVertical: 'top' },
});