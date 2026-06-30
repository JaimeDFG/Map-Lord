import { UrlTile } from 'react-native-maps';

// Capa de teselas basada en datos de OpenStreetMap, servida por CARTO.
// CARTO permite uso gratuito en apps sin API key ni registro, a diferencia
// del servidor de voluntarios tile.openstreetmap.org (pensado solo para
// pruebas puntuales y que bloquea apps que no cumplan su política estricta
// de uso: https://operations.osmfoundation.org/policies/tiles/).
//
// Uso:
//   <MapView mapType="none" ...>
//     <OsmTileLayer />
//     <Marker ... />
//   </MapView>
export default function OsmTileLayer() {
  return (
    <UrlTile
      urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      maximumZ={19}
      flipY={false}
      shouldReplaceMapContent
    />
  );
}