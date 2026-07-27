import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { useT } from '../constants/i18n';
import { CATEGORIAS } from '../constants/tourism';
import PantallaExplorar from './PantallaExplorar';
import PantallaRutas from './PantallaRutas';
import PantallaLugares from './PantallaLugares';
import NavBarMapa from '../components/NavBarMapa';
import FichaPOI from '../components/FichaPOI';
import ModalEditarPOI from '../components/ModalEditarPOI';

export default function PantallaMapa({ ciudad, pais, onVolver }) {
  const { lang, rutaActiva } = useApp();
  const t = useT(lang);
  const [tab, setTab]                   = useState('explorar');
  const [poi, setPoi]                   = useState(null);
  const [modal, setModal]               = useState(false);
  const [resumenVisible, setResumenVisible] = useState(false);
  const [poiEditar, setPoiEditar]       = useState(null);

  function handleActivarRuta() {
    setTab('explorar');
    setResumenVisible(true);
  }

  return (
    <View style={s.root}>
      <View style={s.flex}>
        {tab === 'explorar' && (
          <PantallaExplorar
            ciudad={ciudad}
            pais={pais}
            onAbrirPOI={p => { setPoi(p); setModal(true); }}
            onEditar={p => setPoiEditar(p)}
          />
        )}
        {tab === 'lugares' && (
          <PantallaLugares
            ciudad={ciudad}
            onAbrirPOI={p => { setPoi(p); setModal(true); }}
          />
        )}
        {tab === 'rutas' && (
          <PantallaRutas
            ciudad={ciudad}
            onActivarRuta={handleActivarRuta}
          />
        )}
      </View>

      <NavBarMapa tab={tab} onChange={setTab} onVolver={onVolver} t={t} lang={lang} />

      <FichaPOI
        poi={poi}
        visible={modal}
        onCerrar={() => setModal(false)}
        onEditar={p => { setModal(false); setPoiEditar(p); }}
      />

      <ModalEditarPOI
        poi={poiEditar}
        visible={!!poiEditar}
        onCerrar={() => setPoiEditar(null)}
      />

      <Modal visible={resumenVisible} animationType="slide" transparent>
        <View style={s.modalFondo}>
          <View style={s.modalCont}>
            <View style={s.drag} />
            <Text style={s.modalTitulo}>✦ {t.rutaActiva}</Text>
            <Text style={s.modalSub}>
              {rutaActiva?.length} {t.paradas} · {rutaActiva?.reduce((acc, p) => acc + p.tiempo_visita, 0)} {t.min}
            </Text>
            <ScrollView style={s.paradas} nestedScrollEnabled>
              {rutaActiva?.map((p, i) => {
                const cat = CATEGORIAS[p.categoria] ?? { emoji: '✦', color: '#8a7e72' };
                return (
                  <View key={p.id} style={s.paradaFila}>
                    <View style={s.paradaNum}>
                      <Text style={s.paradaNumT}>{i + 1}</Text>
                    </View>
                    <Text style={s.paradaEmoji}>{cat.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.paradaNombre}>{p.nombre}</Text>
                      <Text style={s.paradaSub}>⏱ {p.tiempo_visita} {t.min}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={s.btnCerrar} onPress={() => setResumenVisible(false)}>
              <Text style={s.btnCerrarT}>{lang === 'en' ? 'Explore the map →' : 'Explorar el mapa →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f7f4f0' },
  flex:        { flex: 1 },
  modalFondo:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  modalCont:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  drag:        { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#2c1810', marginBottom: 4 },
  modalSub:    { fontSize: 13, color: '#8a7e72', marginBottom: 16 },
  paradas:     { maxHeight: 300, marginBottom: 16 },
  paradaFila:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0eeea', gap: 10 },
  paradaNum:   { width: 26, height: 26, borderRadius: 13, backgroundColor: '#5c1011', alignItems: 'center', justifyContent: 'center' },
  paradaNumT:  { color: '#f5e6c8', fontSize: 12, fontWeight: '700' },
  paradaEmoji: { fontSize: 20 },
  paradaNombre:{ fontSize: 14, fontWeight: '600', color: '#2c1810' },
  paradaSub:   { fontSize: 12, color: '#8a7e72' },
  btnCerrar:   { backgroundColor: '#5c1011', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCerrarT:  { color: '#f5e6c8', fontSize: 15, fontWeight: '700' },
});