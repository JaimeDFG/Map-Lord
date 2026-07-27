import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, labelCategoria, labelRelevancia } from '../constants/tourism';

export default function FichaPOI({ poi, visible, onCerrar, numeroParada, totalParadas, onEditar }) {
  const { lang, togglePoiVisitado, poisUsuario } = useApp();
  const t = useT(lang);

  // Buscar el POI actualizado en el contexto para que el estado de visitado cambie al instante
  const poiActual = poi ? poisUsuario.find(p => p.id === poi.id) : null;
  const poiDatos = poiActual ?? poi;

  const cat = poiDatos ? CATEGORIAS[poiDatos.categoria] : null;
  const prio = poiDatos ? (poiDatos.prioridad ?? poiDatos.relevancia ?? 2) : 2;
  const rel = RELEVANCIA[prio];
  const visitado = poiDatos ? (poiDatos.visitado ?? false) : false;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.contenido}>
          <View style={s.drag} />

          <View style={s.header}>
            <View style={[s.icono, { backgroundColor: (cat?.color ?? '#8a7e72') + '20' }]}>
              <Text style={{ fontSize: 28 }}>{cat?.emoji ?? '✦'}</Text>
            </View>
            <View style={s.headerTexto}>
              {numeroParada && (
                <Text style={s.paradaLabel}>{t.parada} {numeroParada} {t.de} {totalParadas}</Text>
              )}
              <Text style={s.titulo}>{poiDatos?.nombre}</Text>
              <Text style={s.sub}>{poiDatos?.descripcion || poiDatos?.descripcion_corta || ''}</Text>
              <View style={s.badges}>
                <View style={[s.badge, { backgroundColor: cat?.color ?? '#8a7e72' }]}>
                  <Text style={s.badgeT}>{labelCategoria(poiDatos?.categoria, lang)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: rel?.color ?? '#8a7e72' }]}>
                  <Text style={s.badgeT}>{rel?.estrellas} {lang === 'en' ? (rel?.labelEn ?? rel?.label) : rel?.label}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: '#444' }]}>
                  <Text style={s.badgeT}>⏱ {poiDatos?.tiempo_visita} {t.min}</Text>
                </View>
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

          <TouchableOpacity
            style={[s.toggleVisitado, visitado && s.toggleVisitadoActivo]}
            onPress={() => poiDatos && togglePoiVisitado(poiDatos.id)}
          >
            <Text style={[s.toggleVisitadoT, visitado && s.toggleVisitadoTActivo]}>
              {visitado ? `✓ ${t.visitado}` : `○ ${t.marcarVisitado}`}
            </Text>
          </TouchableOpacity>

          <ScrollView style={s.cuerpo} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <Text style={s.descLabel}>{lang === 'en' ? 'Description' : 'Descripción'}</Text>
            <Text style={s.texto}>
              {poiDatos?.descripcion?.trim()
                ? poiDatos.descripcion
                : (poiDatos?.descripcion_corta?.trim()
                  ? poiDatos.descripcion_corta
                  : (lang === 'en' ? 'No description added yet.' : 'Aún no se ha añadido descripción.'))}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  contenido:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, height: '80%' },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  icono:      { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTexto:{ flex: 1 },
  paradaLabel:{ fontSize: 11, fontWeight: '700', color: '#5c1011', textTransform: 'uppercase', marginBottom: 2 },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#2c1810' },
  sub:        { fontSize: 13, color: '#8a7e72', marginTop: 2 },
  badges:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeT:     { color: '#fff', fontSize: 11, fontWeight: '600' },
  headerBotones: { flexDirection: 'column', gap: 6 },
  botonEditar:{ backgroundColor: '#fef9c3', borderRadius: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  botonEditarT:{ fontSize: 14 },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cerrarT:    { fontSize: 13, color: '#555' },
  toggleVisitado:{ backgroundColor: '#f7f4f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 12 },
  toggleVisitadoActivo:{ backgroundColor: '#5c1011', borderColor: '#5c1011' },
  toggleVisitadoT:{ fontSize: 14, fontWeight: '600', color: '#5c1011' },
  toggleVisitadoTActivo:{ color: '#f5e6c8' },
  cuerpo:     { flex: 1 },
  descLabel:  { fontSize: 11, fontWeight: '700', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  texto:      { fontSize: 15, lineHeight: 24, color: '#333' },
});