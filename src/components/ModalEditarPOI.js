import { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, labelCategoria } from '../constants/tourism';

export default function ModalEditarPOI({ poi, visible, onCerrar }) {
  const { lang, editarPoi, eliminarPoi } = useApp();
  const t = useT(lang);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (poi) setForm({
      nombre:           poi.nombre ?? '',
      descripcion:      poi.descripcion ?? poi.descripcion_corta ?? '',
      categoria:        poi.categoria ?? 'Monumento',
      prioridad:        poi.prioridad ?? poi.relevancia ?? 2,
      tiempo_visita:    String(poi.tiempo_visita ?? 30),
      visitado:         poi.visitado ?? false,
    });
  }, [poi]);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function guardar() {
    editarPoi(poi.id, {
      ...form,
      prioridad:    parseInt(form.prioridad),
      tiempo_visita:parseInt(form.tiempo_visita) || 30,
    });
    onCerrar();
  }

  const relevanciaOpciones = [
    { v: 1, labelEs: `★ ${RELEVANCIA[1].label}`,   labelEn: `★ ${RELEVANCIA[1].labelEn}` },
    { v: 2, labelEs: `★★ ${RELEVANCIA[2].label}`,  labelEn: `★★ ${RELEVANCIA[2].labelEn}` },
    { v: 3, labelEs: `★★★ ${RELEVANCIA[3].label}`, labelEn: `★★★ ${RELEVANCIA[3].labelEn}` },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.cont}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.drag} />

            <View style={s.headerRow}>
              <Text style={s.titulo}>✦ {t.editarPunto}</Text>
              <TouchableOpacity onPress={onCerrar} style={s.cerrar}>
                <Text style={s.cerrarT}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>{t.nombre} *</Text>
            <TextInput style={s.input} value={form.nombre} onChangeText={v => set('nombre', v)} placeholder={lang === 'en' ? 'Place name...' : 'Nombre del lugar...'} placeholderTextColor="#bbb" />

            <Text style={[s.label, { marginTop: 12 }]}>{lang === 'en' ? 'Description' : 'Descripción'}</Text>
            <TextInput
              style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={form.descripcion}
              onChangeText={v => set('descripcion', v)}
              placeholder={lang === 'en' ? 'Write what you want to remember...' : 'Escribe lo que quieras recordar...'}
              placeholderTextColor="#bbb"
              multiline
            />

            <Text style={[s.label, { marginTop: 12 }]}>{t.categoria}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {Object.keys(CATEGORIAS).map(cat => (
                <TouchableOpacity key={cat} style={[s.chip, form.categoria === cat && s.chipActivo]} onPress={() => set('categoria', cat)}>
                  <Text style={[s.chipT, form.categoria === cat && s.chipTActivo]}>{CATEGORIAS[cat].emoji} {labelCategoria(cat, lang)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>{lang === 'en' ? 'Priority' : 'Prioridad'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {relevanciaOpciones.map(r => (
                <TouchableOpacity key={r.v} style={[s.chip, form.prioridad === r.v && s.chipActivo]} onPress={() => set('prioridad', r.v)}>
                  <Text style={[s.chipT, form.prioridad === r.v && s.chipTActivo]}>{lang === 'en' ? r.labelEn : r.labelEs}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>{lang === 'en' ? 'Visit time (min)' : 'Tiempo de visita (min)'}</Text>
            <TextInput style={[s.input, { marginBottom: 12 }]} value={form.tiempo_visita} onChangeText={v => set('tiempo_visita', v)} keyboardType="number-pad" placeholder="30" placeholderTextColor="#bbb" />

            <TouchableOpacity
              style={[s.toggleVisitado, form.visitado && s.toggleVisitadoActivo]}
              onPress={() => set('visitado', !form.visitado)}
            >
              <Text style={[s.toggleVisitadoT, form.visitado && s.toggleVisitadoTActivo]}>
                {form.visitado ? `✓ ${t.visitado}` : `○ ${t.marcarVisitado}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnGuardar} onPress={guardar}>
              <Text style={s.btnGuardarT}>{t.guardar}</Text>
            </TouchableOpacity>

            {poi && (
              <TouchableOpacity style={s.btnEliminar} onPress={() => { eliminarPoi(poi.id); onCerrar(); }}>
                <Text style={s.btnEliminarT}>🗑️ {lang === 'en' ? 'Delete this point' : 'Eliminar este punto'}</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  cont:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#2c1810' },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cerrarT:    { fontSize: 13, color: '#555' },
  label:      { fontSize: 11, fontWeight: '700', color: '#8a7e72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#f7f4f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#2c1810', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 4 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  chipActivo: { backgroundColor: '#5c1011', borderColor: '#5c1011' },
  chipT:      { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTActivo:{ color: '#f5e6c8' },
  
  toggleVisitado:{ backgroundColor: '#f7f4f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e8dfd5', marginBottom: 16 },
  toggleVisitadoActivo:{ backgroundColor: '#5c1011', borderColor: '#5c1011' },
  toggleVisitadoT:{ fontSize: 14, fontWeight: '600', color: '#5c1011' },
  toggleVisitadoTActivo:{ color: '#f5e6c8' },
  
  btnGuardar: { backgroundColor: '#5c1011', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnGuardarT:{ color: '#f5e6c8', fontSize: 15, fontWeight: '700' },
  btnEliminar: { backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#fecaca' },
  btnEliminarT: { color: '#b0453e', fontSize: 15, fontWeight: '700' },
});