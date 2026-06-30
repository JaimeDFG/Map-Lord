import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';

export default function NavBarMapa({ tab, onChange, onVolver, t, lang }) {
  const tabs = [
    { id: 'explorar',    label: t.explorar,                          emoji: '🗺️' },
    { id: 'lugares',     label: t.lugares,                           emoji: '📋' },
    { id: 'destacados',  label: lang === 'en' ? 'Top' : 'Top',      emoji: '⭐' },
    { id: 'rutas',       label: t.rutas,                             emoji: '🧭' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.bar}>
        <TouchableOpacity style={s.volverBtn} onPress={onVolver}>
          <Text style={s.volverEmoji}>←</Text>
          <Text style={s.volverT}>{lang === 'en' ? 'Home' : 'Inicio'}</Text>
        </TouchableOpacity>
        <View style={s.tabs}>
          {tabs.map(tb => {
            const activo = tab === tb.id;
            return (
              <TouchableOpacity
                key={tb.id}
                style={[s.tab, activo && s.tabActivo]}
                onPress={() => onChange(tb.id)}
              >
                <Text style={s.tabEmoji}>{tb.emoji}</Text>
                <Text style={[s.tabLabel, activo && s.tabLabelActivo]}>{tb.label}</Text>
                {activo && <View style={s.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  bar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 0 : 10, paddingHorizontal: 8 },
  volverBtn:    { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  volverEmoji:  { fontSize: 18, color: '#2563eb', fontWeight: '700' },
  volverT:      { fontSize: 10, color: '#2563eb', marginTop: 1, fontWeight: '600' },
  tabs:         { flex: 1, flexDirection: 'row' },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  tabActivo:    {},
  tabEmoji:     { fontSize: 22 },
  tabLabel:     { fontSize: 10, color: '#aaa', marginTop: 2, fontWeight: '500' },
  tabLabelActivo: { color: '#2563eb', fontWeight: '700' },
  dot:          { position: 'absolute', bottom: 0, width: 4, height: 4, backgroundColor: '#2563eb', borderRadius: 2 },
});