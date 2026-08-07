import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapaWeb({
  style,
  initialRegion,
  markers = [],
  polylines = [],
  onPress,
  onMarkerPress,
}) {
  const webViewRef = useRef(null);

  const lat = initialRegion?.latitude ?? 40.4168;
  const lng = initialRegion?.longitude ?? -3.7038;
  const latDelta = initialRegion?.latitudeDelta ?? 0.1;

  let zoom = Math.round(Math.log2(360 / latDelta)) - 1;
  if (zoom < 1) zoom = 1;
  if (zoom > 19) zoom = 19;

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
    #map { height: 100%; width: 100%; }
    .leaflet-div-icon { background: transparent; border: none; }
    .pin-emoji { font-size: 22px; line-height: 1; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
    .pin-custom {
      width: 35px; height: 35px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 16px;
    }
    .pin-ruta {
      width: 38px; height: 38px; border-radius: 50%;
      background: #5c1011; border: 2.5px solid white;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      color: white; font-size: 13px; font-weight: 800;
    }
    .pin-inicio {
      background: white; border-radius: 50%; padding: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 18px;
    }
    .pin-atenuado {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      opacity: 0.35; font-size: 10px;
    }
    .pin-destacado {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      font-size: 16px;
    }
    .pin-pais {
      background: rgba(255,255,255,0.92); border-radius: 20px;
      padding: 4px 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      font-size: 20px;
    }
    .pin-numero {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 12px; font-weight: 700;
      border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19,
    }).addTo(map);

    var markersData = ${JSON.stringify(markers)};
    markersData.forEach(function(m) {
      var html = '';
      if (m.type === 'emoji') {
        html = '<div class="pin-emoji">' + (m.emoji || '') + '</div>';
      } else if (m.type === 'ruta') {
        html = '<div class="pin-ruta">' + (m.numero || '') + '</div>';
      } else if (m.type === 'inicio') {
        html = '<div class="pin-inicio">🚩</div>';
      } else if (m.type === 'inicio2') {
        html = '<div class="pin-inicio">📍</div>';
      } else if (m.type === 'atenuado') {
        html = '<div class="pin-atenuado" style="background:' + (m.color || '#888') + ';">' + (m.emoji || '') + '</div>';
      } else if (m.type === 'destacado') {
        html = '<div class="pin-destacado" style="background:' + (m.color || '#888') + ';">' + (m.emoji || '') + '</div>';
      } else if (m.type === 'pais') {
        html = '<div class="pin-pais">' + (m.emoji || '') + '</div>';
      } else if (m.type === 'numero') {
        html = '<div class="pin-numero" style="background:' + (m.color || '#5c1011') + ';">' + (m.numero || '') + '</div>';
      } else {
        html = '<div class="pin-custom" style="background:' + (m.color || '#8a7e72') + '; opacity:' + (m.opacity ?? 1) + ';">' + (m.emoji || '') + '</div>';
      }
      
      var icon = L.divIcon({ html: html, className: 'leaflet-div-icon', iconSize: [40, 40], iconAnchor: [20, 20] });
      var marker = L.marker([m.latitude, m.longitude], { icon: icon });
      if (m.onPress) {
        marker.on('click', function(e) {
          e.originalEvent.stopPropagation();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.id }));
        });
      }
      marker.addTo(map);
    });

    var polylinesData = ${JSON.stringify(polylines)};
    polylinesData.forEach(function(p) {
      if (p.coordinates && p.coordinates.length > 1) {
        var latlngs = p.coordinates.map(function(c) { return [c.latitude, c.longitude]; });
        L.polyline(latlngs, {
          color: p.color || '#5c1011',
          weight: p.width || 3,
          dashArray: p.dashArray || null,
          opacity: 0.9
        }).addTo(map);
      }
    });

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'press',
        coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng }
      }));
    });
  </script>
</body>
</html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'press' && onPress) {
        onPress({ nativeEvent: { coordinate: data.coordinate } });
      } else if (data.type === 'marker' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch (e) {}
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});