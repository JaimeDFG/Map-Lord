import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS, RELEVANCIA, SECCIONES, labelCategoria } from '../constants/tourism';

export default function ModalEditarPOI({ poi, visible, onCerrar }) {
  const { lang, editarPoi, eliminarPoi } = useApp();
  const t = useT(lang);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (poi) setForm({
      nombre:           poi.nombre ?? '',
      descripcion_corta:poi.descripcion_corta ?? '',
      categoria:        poi.categoria ?? 'Monumento',
      relevancia:       poi.relevancia ?? 2,
      tiempo_visita:    String(poi.tiempo_visita ?? 30),
      historia:         poi.historia ?? '',
      arquitectura:     poi.arquitectura ?? '',
      curiosidades:     poi.curiosidades ?? '',
      misterios:        poi.misterios ?? '',
    });
  }, [poi]);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function guardar() {
    editarPoi(poi.id, {
      ...form,
      relevancia:   parseInt(form.relevancia),
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
              <Text style={s.titulo}>✏️ {t.editarPunto}</Text>
              <TouchableOpacity onPress={onCerrar} style={s.cerrar}>
                <Text style={s.cerrarT}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>{t.nombre} *</Text>
            <TextInput
              style={s.input}
              value={form.nombre}
              onChangeText={v => set('nombre', v)}
              placeholder={lang === 'en' ? 'Place name...' : 'Nombre del lugar...'}
              placeholderTextColor="#bbb"
            />

            <Text style={[s.label, { marginTop: 12 }]}>{lang === 'en' ? 'Short description' : 'Descripción corta'}</Text>
            <TextInput
              style={s.input}
              value={form.descripcion_corta}
              onChangeText={v => set('descripcion_corta', v)}
              placeholder={lang === 'en' ? 'One descriptive line...' : 'Una línea descriptiva...'}
              placeholderTextColor="#bbb"
            />

            <Text style={[s.label, { marginTop: 12 }]}>{t.categoria}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {Object.keys(CATEGORIAS).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, form.categoria === cat && s.chipActivo]}
                  onPress={() => set('categoria', cat)}
                >
                  <Text style={[s.chipT, form.categoria === cat && s.chipTActivo]}>
                    {CATEGORIAS[cat].emoji} {labelCategoria(cat, lang)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>{lang === 'en' ? 'Relevance' : 'Relevancia'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {relevanciaOpciones.map(r => (
                  <TouchableOpacity
                    key={r.v}
                    style={[s.chip, form.relevancia === r.v && s.chipActivo]}
                    onPress={() => set('relevancia', r.v)}
                  >
                    <Text style={[s.chipT, form.relevancia === r.v && s.chipTActivo]}>
                      {lang === 'en' ? r.labelEn : r.labelEs}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.label}>{lang === 'en' ? 'Visit time (min)' : 'Tiempo de visita (min)'}</Text>
            <TextInput
              style={[s.input, { marginBottom: 12 }]}
              value={form.tiempo_visita}
              onChangeText={v => set('tiempo_visita', v)}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor="#bbb"
            />

            {SECCIONES.map(sec => (
              <View key={sec.key}>
                <Text style={[s.label, { marginTop: 8 }]}>
                  {lang === 'en' ? sec.labelEn : sec.labelEs}
                  <Text style={{ color: '#bbb', fontWeight: '400' }}> ({t.opcional})</Text>
                </Text>
                <TextInput
                  style={[s.input, { minHeight: 80, textAlignVertical: 'top', marginBottom: 4 }]}
                  value={form[sec.key]}
                  onChangeText={v => set(sec.key, v)}
                  placeholder={`${lang === 'en' ? 'Text about' : 'Texto sobre'} ${lang === 'en' ? sec.labelEn.toLowerCase() : sec.labelEs.toLowerCase()}...`}
                  placeholderTextColor="#bbb"
                  multiline
                />
              </View>
            ))}

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
  fondo:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  cont:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  cerrar:     { backgroundColor: '#f0f0f0', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cerrarT:    { fontSize: 13, color: '#555' },
  label:      { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  chipActivo: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipT:      { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTActivo:{ color: '#fff' },
  btnGuardar: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnGuardarT:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  btnEliminar: { backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#fecaca' },
  btnEliminarT: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});