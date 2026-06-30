import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { nombrePaisEn } from '../constants/tourism';

export default function PantallaMapasCiudad({ pais, onVolver, onAbrirMapa, onAñadirMapa }) {
  const { lang, ciudadesConMapa, borrarMapa } = useApp();
  const t = useT(lang);

  const ciudades = ciudadesConMapa(pais.id);

  function confirmarBorrar(ciudad) {
    Alert.alert(
      t.borrarMapa,
      `¿${t.borrarMapa} "${ciudad}"? ${t.borrarMapaConfirm}`,
      [
        { text: t.cancelar, style: 'cancel' },
        {
          text: t.borrar,
          style: 'destructive',
          onPress: () => borrarMapa(pais.id, ciudad),
        },
      ]
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onVolver} style={s.back}>
            <Text style={s.backT}>← </Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>{pais.emoji} {nombrePaisEn(pais.nombre, lang)}</Text>
            <Text style={s.sub}>{t.mapasDisp}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.cont}>
        {ciudades.map((ciudad, i) => (
          <View key={i} style={s.mapaRow}>
            <TouchableOpacity style={s.mapaCard} onPress={() => onAbrirMapa(ciudad, pais)}>
              <View style={s.mapaIcono}>
                <Text style={{ fontSize: 28 }}>🗺️</Text>
              </View>
              <View style={s.mapaInfo}>
                <Text style={s.mapaNombre}>{ciudad}</Text>
                <Text style={s.mapaSub}>{nombrePaisEn(pais.nombre, lang)}</Text>
              </View>
              <Text style={s.mapaArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnBorrar} onPress={() => confirmarBorrar(ciudad)}>
              <Text style={s.btnBorrarT}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Botón añadir mapa */}
        <TouchableOpacity style={s.añadirCard} onPress={onAñadirMapa}>
          <Text style={s.añadirT}>{t.añadirMapa}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f8fafc' },
  safe:       { backgroundColor: '#fff' },
  header:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  back:       { paddingRight: 4 },
  backT:      { fontSize: 18, color: '#2563eb', fontWeight: '700' },
  titulo:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  sub:        { fontSize: 11, color: '#888' },
  cont:       { padding: 16, gap: 12 },
  mapaRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapaCard:   { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  mapaIcono:  { width: 52, height: 52, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  mapaInfo:   { flex: 1 },
  mapaNombre: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  mapaSub:    { fontSize: 12, color: '#888', marginTop: 2 },
  mapaArrow:  { fontSize: 22, color: '#ccc' },
  btnBorrar:  { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  btnBorrarT: { fontSize: 18 },
  añadirCard: { backgroundColor: '#2563eb', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 4 },
  añadirT:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});