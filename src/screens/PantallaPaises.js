import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { nombrePaisEn, nombreContinenteEn } from '../constants/tourism';
import PAISES from '../data/paises.json';

const EMOJIS_CUSTOM = ['🌍','🗺️','📍','🏔️','🌊','🏜️','🌋','🏝️','🧭','⛰️','🌿','❄️'];

export default function PantallaPaises({ continente, onVolver, onSeleccionarPais }) {
  const { lang } = useApp();
  const t = useT(lang);
  const [modalAñadir, setModalAñadir] = useState(false);
  const [nuevoPaisNombre, setNuevoPaisNombre] = useState('');
  const [nuevoPaisEmoji, setNuevoPaisEmoji] = useState('🌍');
  const [paisesCustom, setPaisesCustom] = useState([]);

  const paisesFiltrados = [
    ...PAISES.filter(p => p.continente === continente),
    ...paisesCustom.filter(p => p.continente === continente),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  function añadirPaisCustom() {
    if (!nuevoPaisNombre.trim()) return;
    setPaisesCustom(prev => [...prev, {
      id: `custom_${Date.now()}`,
      nombre: nuevoPaisNombre.trim(),
      emoji: nuevoPaisEmoji,
      continente,
    }]);
    setNuevoPaisNombre('');
    setNuevoPaisEmoji('🌍');
    setModalAñadir(false);
  }

  return (
    <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity onPress={onVolver} style={s.back}>
              <Text style={s.backT}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.titulo}>{nombreContinenteEn(continente, lang)}</Text>
              <Text style={s.sub}>{paisesFiltrados.length} {t.paises.toLowerCase()}</Text>
            </View>
            <TouchableOpacity style={s.botonAdd} onPress={() => setModalAñadir(true)}>
              <Text style={s.botonAddT}>+</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

      <ScrollView contentContainerStyle={s.lista}>
        {paisesFiltrados.map(pais => (
          <TouchableOpacity key={pais.id} style={s.fila} onPress={() => onSeleccionarPais(pais)}>
            <Text style={s.filaEmoji}>{pais.emoji}</Text>
            <Text style={s.filaNombre}>{nombrePaisEn(pais.nombre, lang)}</Text>
            <Text style={s.filaArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalAñadir} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>{t.añadirPais}</Text>

            <Text style={s.label}>{t.nombre}</Text>
            <TextInput
              style={s.input}
              value={nuevoPaisNombre}
              onChangeText={setNuevoPaisNombre}
              placeholder="Ej. Palestina, Taiwán..."
              placeholderTextColor="#bbb"
            />

            <Text style={[s.label, { marginTop: 12 }]}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {EMOJIS_CUSTOM.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiChip, nuevoPaisEmoji === e && s.emojiChipActivo]}
                  onPress={() => setNuevoPaisEmoji(e)}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.modalBotones}>
              <TouchableOpacity style={s.btnCancelar} onPress={() => setModalAñadir(false)}>
                <Text style={s.btnCancelarT}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGuardar} onPress={añadirPaisCustom}>
                <Text style={s.btnGuardarT}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f8fafc' },
  safe:       { backgroundColor: '#fff' },
  header:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  back:       { paddingRight: 8, paddingVertical: 4 },
  backT:      { fontSize: 22, color: '#2563eb', fontWeight: '700' },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  sub:        { fontSize: 11, color: '#888' },
  botonAdd:   { backgroundColor: '#2563eb', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  botonAddT:  { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 30 },
  lista:      { paddingVertical: 8 },
  fila:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  filaEmoji:  { fontSize: 28, marginRight: 14 },
  filaNombre: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  filaArrow:  { fontSize: 20, color: '#ccc' },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCont:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  drag:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitulo:{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  label:      { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input:      { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 },
  emojiChip:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  emojiChipActivo: { backgroundColor: '#dbeafe', borderWidth: 2, borderColor: '#2563eb' },
  safeRoot: { flex: 1, backgroundColor: '#f8fafc' },
  modalBotones:{ flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancelar:{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelarT:{ fontSize: 14, fontWeight: '600', color: '#555' },
  btnGuardar: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnGuardarT:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});