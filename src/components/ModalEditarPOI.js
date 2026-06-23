import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { CATEGORIAS } from '../constants/tourism';

export default function ModalEditarPOI({ poi, visible, onCerrar }) {
  const { editarPoi, eliminarPoi } = useApp();
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.fondo}>
        <View style={s.cont}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.drag} />

            <View style={s.headerRow}>
              <Text style={s.titulo}>✏️ Editar punto</Text>
              <TouchableOpacity onPress={onCerrar} style={s.cerrar}>
                <Text style={s.cerrarT}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nombre *</Text>
            <TextInput style={s.input} value={form.nombre} onChangeText={v => set('nombre', v)} placeholder="Nombre del lugar..." placeholderTextColor="#bbb" />

            <Text style={[s.label, { marginTop: 12 }]}>Descripción corta</Text>
            <TextInput style={s.input} value={form.descripcion_corta} onChangeText={v => set('descripcion_corta', v)} placeholder="Una línea descriptiva..." placeholderTextColor="#bbb" />

            <Text style={[s.label, { marginTop: 12 }]}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {Object.keys(CATEGORIAS).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, form.categoria === cat && s.chipActivo]}
                  onPress={() => set('categoria', cat)}
                >
                  <Text style={[s.chipT, form.categoria === cat && s.chipTActivo]}>
                    {CATEGORIAS[cat].emoji} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Relevancia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {[
                { v: 1, label: '★ Opcional' },
                { v: 2, label: '★★ Recomendado' },
                { v: 3, label: '★★★ Imprescindible' },
              ].map(r => (
                <TouchableOpacity
                  key={r.v}
                  style={[s.chip, form.relevancia === r.v && s.chipActivo]}
                  onPress={() => set('relevancia', r.v)}
                >
                  <Text style={[s.chipT, form.relevancia === r.v && s.chipTActivo]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            </ScrollView>

            <Text style={s.label}>Tiempo de visita (min)</Text>
            <TextInput style={[s.input, { marginBottom: 12 }]} value={form.tiempo_visita} onChangeText={v => set('tiempo_visita', v)} keyboardType="number-pad" placeholder="30" placeholderTextColor="#bbb" />

            {['historia', 'arquitectura', 'curiosidades', 'misterios'].map(campo => (
              <View key={campo}>
                <Text style={[s.label, { marginTop: 8 }]}>
                  {campo.charAt(0).toUpperCase() + campo.slice(1)}
                  <Text style={{ color: '#bbb', fontWeight: '400' }}> (opcional)</Text>
                </Text>
                <TextInput
                  style={[s.input, { minHeight: 80, textAlignVertical: 'top', marginBottom: 4 }]}
                  value={form[campo]}
                  onChangeText={v => set(campo, v)}
                  placeholder={`Texto sobre ${campo}...`}
                  placeholderTextColor="#bbb"
                  multiline
                />
              </View>
            ))}

            <TouchableOpacity style={s.btnGuardar} onPress={guardar}>
              <Text style={s.btnGuardarT}>Guardar cambios</Text>
            </TouchableOpacity>

            {/* Solo mostrar eliminar en POIs añadidos por el usuario */}
            {poi && (
              <TouchableOpacity style={s.btnEliminar} onPress={() => { eliminarPoi(poi.id); onCerrar(); }}>
                <Text style={s.btnEliminarT}>🗑️ Eliminar este punto</Text>
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