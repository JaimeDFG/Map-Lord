import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavBarMapa({ tab, onChange, onVolver, t, lang }) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: 'explorar', label: t.explorar, emoji: '✦' },
    { id: 'lugares',  label: t.lugares,  emoji: '✦' },
    { id: 'rutas',    label: t.rutas,    emoji: '✦' },
  ];

  return (
    <View style={[s.safe, { paddingBottom: insets.bottom }]}>
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
                <Text style={[s.tabEmoji, activo && s.tabEmojiActivo]}>{tb.emoji}</Text>
                <Text style={[s.tabLabel, activo && s.tabLabelActivo]}>{tb.label}</Text>
                {activo && <View style={s.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:         { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e8dfd5' },
  bar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 0 : 10, paddingHorizontal: 8 },
  volverBtn:    { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  volverEmoji:  { fontSize: 16, color: '#5c1011', fontWeight: '700' },
  volverT:      { fontSize: 10, color: '#5c1011', marginTop: 1, fontWeight: '600' },
  tabs:         { flex: 1, flexDirection: 'row' },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  tabActivo:    {},
  tabEmoji:     { fontSize: 16, color: '#c4bfb7' },
  tabEmojiActivo:{ color: '#d4a843' },
  tabLabel:     { fontSize: 10, color: '#aaa', marginTop: 2, fontWeight: '500' },
  tabLabelActivo: { color: '#5c1011', fontWeight: '700' },
  dot:          { position: 'absolute', bottom: 0, width: 4, height: 4, backgroundColor: '#5c1011', borderRadius: 2 },
});