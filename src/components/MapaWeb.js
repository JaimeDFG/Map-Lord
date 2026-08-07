import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapaWeb({
  style,
  initialRegion,
  region,
  onPress,
  onMarkerPress,
  markers = [],
  polylines = [],
  mapKey,
}) {
  const webViewRef = useRef(null);
  
  const center = region || initialRegion || { latitude: 40.4168, longitude: -3.7038, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  const lat = center.latitude;
  const lng = center.longitude;
  
  const zoom = Math.max(1, Math.min(18, Math.round(Math.log2(360 / (center.latitudeDelta || 0.1))) - 1));

  // Forzar recarga del WebView cuando cambien datos esenciales
  const dataKey = useMemo(() => {
    const mk = mapKey || 'default';
    return `${mk}_${lat.toFixed(4)}_${lng.toFixed(4)}_${zoom}_${markers.length}_${polylines.length}`;
  }, [lat, lng, zoom, markers, polylines, mapKey]);

  const html = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const polylinesJson = JSON.stringify(polylines);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
    #map { height: 100%; width: 100%; }
    .custom-pin {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      line-height: 1 !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
        subdomains: 'abc'
      }).addTo(map);

      var markers = ${markersJson};
      
      markers.forEach(function(m) {
        var size = m.size || 36;
        var half = size / 2;
        var html = '<div class="custom-pin" style="' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'background-color:' + (m.color || '#555') + ';' +
          'color:' + (m.textColor || '#fff') + ';' +
          'border-radius:' + (m.borderRadius || 50) + '%;' +
          'opacity:' + (m.opacity !== undefined ? m.opacity : 1) + ';' +
          'border:' + (m.borderWidth || 0) + 'px solid ' + (m.borderColor || 'transparent') + ';' +
          'font-size:' + (m.fontSize || 16) + 'px;' +
          'font-weight:700;' +
          '">' + (m.number !== undefined ? m.number : (m.emoji || '')) + '</div>';
        
        var icon = L.divIcon({
          html: html,
          className: '',
          iconSize: [size, size],
          iconAnchor: [half, half]
        });
        
        var marker = L.marker([m.latitude, m.longitude], { icon: icon, zIndexOffset: (m.zIndex || 0) });
        
        if (m.onPressId) {
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.onPressId }));
          });
        }
        
        marker.addTo(map);
      });

      var polylines = ${polylinesJson};
      polylines.forEach(function(p) {
        var latlngs = p.coordinates.map(function(c) { return [c.latitude, c.longitude]; });
        var opts = {
          color: p.strokeColor || '#3388ff',
          weight: p.strokeWidth || 3,
          opacity: 0.8
        };
        if (p.dashArray) {
          opts.dashArray = Array.isArray(p.dashArray) ? p.dashArray.join(',') : p.dashArray;
        }
        L.polyline(latlngs, opts).addTo(map);
      });

      map.on('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapPress',
          coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng }
        }));
      });
    })();
  </script>
</body>
</html>
    `;
  }, [lat, lng, zoom, markers, polylines]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapPress' && onPress) {
        onPress(data.coordinate);
      }
      if (data.type === 'marker' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch (e) {}
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        key={dataKey}
        originWhitelist={['*']}
        source={{ html }}
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
  container: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
  },
});