import { UrlTile } from 'react-native-maps';

export default function OsmTileLayer() {
  return (
    <UrlTile
      urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      maximumZ={19}
      flipY={false}
      shouldReplaceMapContent
    />
  );
}