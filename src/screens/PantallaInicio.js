import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import PAISES from '../data/paises.json';

const CONTINENTES = [
  { id: 'Europa',            emoji: '🏰', color: '#3b5bdb' },
  { id: 'América del Norte', emoji: '🗽', color: '#2f9e44' },
  { id: 'América del Sur',   emoji: '🦙', color: '#1a7a4a' },
  { id: 'Asia',              emoji: '🏯', color: '#e67700' },
  { id: 'África',            emoji: '🦁', color: '#c2255c' },
  { id: 'Oceanía',           emoji: '🦘', color: '#0c8599' },
];

export default function PantallaInicio({ onSeleccionarContinente, onAbrirPasaporte }) {
  const { lang, setLang } = useApp();
  const t = useT(lang);

  // Conteo real desde los datos
  function contarPaises(continenteId) {
    return PAISES.filter(p => p.continente === continenteId).length;
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <SafeAreaView style={s.safe}>

        <View style={s.header}>
          <TouchableOpacity style={s.botonPasaporte} onPress={onAbrirPasaporte}>
            <Text style={s.botonPasaporteEmoji}>📕</Text>
            <Text style={s.botonPasaporteT}>Pasaporte</Text>
          </TouchableOpacity>

          <Text style={s.logo}>Map Lord</Text>

          <TouchableOpacity style={s.botonLang} onPress={() => setLang(lang === 'es' ? 'en' : 'es')}>
            <Text style={s.botonLangEmoji}>{lang === 'es' ? '🇪🇸' : '🇬🇧'}</Text>
            <Text style={s.botonLangT}>{lang === 'es' ? 'ES' : 'EN'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sub}>{t.seleccionaCont}</Text>

        <View style={s.grid}>
          {CONTINENTES.map(cont => {
            const total = contarPaises(cont.id);
            return (
              <TouchableOpacity
                key={cont.id}
                style={[s.card, { backgroundColor: cont.color }]}
                onPress={() => onSeleccionarContinente(cont.id)}
                activeOpacity={0.85}
              >
                <Text style={s.cardEmoji}>{cont.emoji}</Text>
                <Text style={s.cardNombre}>{cont.id}</Text>
                <Text style={s.cardSub}>{total} países</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#0f172a' },
  safe:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  botonPasaporte:    { alignItems: 'center', minWidth: 60 },
  botonPasaporteEmoji: { fontSize: 26 },
  botonPasaporteT:   { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  logo:              { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  botonLang:         { alignItems: 'center', minWidth: 60 },
  botonLangEmoji:    { fontSize: 26 },
  botonLangT:        { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  sub:               { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  grid:              { flex: 1, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, alignContent: 'center' },
  card:              { width: '47%', aspectRatio: 1.1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  cardEmoji:         { fontSize: 40, marginBottom: 8 },
  cardNombre:        { fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center', paddingHorizontal: 4 },
  cardSub:           { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
});