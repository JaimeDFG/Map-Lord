import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;
const DEFAULT_REGION = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function zoomFromRegion(region) {
  const longitudeDelta = region?.longitudeDelta || DEFAULT_REGION.longitudeDelta;
  return clamp(Math.round(Math.log2(360 / longitudeDelta)) + 1, 12, 17);
}

function latLonToWorldPixel({ latitude, longitude }, zoom) {
  const sinLat = Math.sin(latitude * Math.PI / 180);
  const scale = TILE_SIZE * (2 ** zoom);

  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function worldPixelToLatLon({ x, y }, zoom) {
  const scale = TILE_SIZE * (2 ** zoom);
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { latitude, longitude };
}

function getViewport(region, layout) {
  const zoom = zoomFromRegion(region);
  const center = latLonToWorldPixel(region, zoom);

  return {
    center,
    topLeft: {
      x: center.x - (layout.width / 2),
      y: center.y - (layout.height / 2),
    },
    zoom,
  };
}

function coordinateToPoint(coordinate, region, layout) {
  if (!layout.width || !layout.height || !coordinate) {
    return { x: layout.width / 2, y: layout.height / 2 };
  }

  const viewport = getViewport(region, layout);
  const point = latLonToWorldPixel(coordinate, viewport.zoom);

  return {
    x: point.x - viewport.topLeft.x,
    y: point.y - viewport.topLeft.y,
  };
}

function markerPosition(coordinate, region, layout) {
  const point = coordinateToPoint(coordinate, region, layout);

  return {
    left: point.x,
    top: point.y,
  };
}

function coordinateFromPress(event, region, layout) {
  const locationX = event?.nativeEvent?.locationX;
  const locationY = event?.nativeEvent?.locationY;

  if (!layout.width || !layout.height || typeof locationX !== 'number' || typeof locationY !== 'number') {
    return {
      latitude: region.latitude,
      longitude: region.longitude,
    };
  }

  const viewport = getViewport(region, layout);
  return worldPixelToLatLon({
    x: viewport.topLeft.x + locationX,
    y: viewport.topLeft.y + locationY,
  }, viewport.zoom);
}

function buildTiles(region, layout) {
  if (!layout.width || !layout.height) return [];

  const viewport = getViewport(region, layout);
  const minTileX = Math.floor(viewport.topLeft.x / TILE_SIZE);
  const minTileY = Math.floor(viewport.topLeft.y / TILE_SIZE);
  const maxTileX = Math.floor((viewport.topLeft.x + layout.width) / TILE_SIZE);
  const maxTileY = Math.floor((viewport.topLeft.y + layout.height) / TILE_SIZE);
  const maxIndex = (2 ** viewport.zoom) - 1;
  const tiles = [];

  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      if (y < 0 || y > maxIndex) continue;
      const wrappedX = ((x % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
      tiles.push({
        key: `${viewport.zoom}-${wrappedX}-${y}`,
        left: (x * TILE_SIZE) - viewport.topLeft.x,
        top: (y * TILE_SIZE) - viewport.topLeft.y,
        url: `https://tile.openstreetmap.org/${viewport.zoom}/${wrappedX}/${y}.png`,
      });
    }
  }

  return tiles;
}

export default function MapView({ children, initialRegion, onPress, style }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [region, setRegion] = useState(initialRegion || DEFAULT_REGION);
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 });
  const tiles = useMemo(() => buildTiles(region, layout), [region, layout]);

  useEffect(() => {
    setRegion(initialRegion || DEFAULT_REGION);
  }, [initialRegion]);

  const mappedChildren = useMemo(() => Children.map(children, child => {
    if (!isValidElement(child)) {
      return child;
    }
    return cloneElement(child, { __webLayout: layout, __webRegion: region });
  }), [children, layout, region]);

  function handlePress(event) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }

    onPress?.({
      nativeEvent: {
        coordinate: coordinateFromPress(event, region, layout),
      },
    });
  }

  function zoomBy(factor) {
    setRegion(current => ({
      ...current,
      latitudeDelta: clamp(current.latitudeDelta * factor, 0.003, 0.18),
      longitudeDelta: clamp(current.longitudeDelta * factor, 0.003, 0.18),
    }));
  }

  function handleWheel(event) {
    event?.preventDefault?.();
    zoomBy(event?.deltaY > 0 ? 1.28 : 0.78);
  }

  function handleResponderGrant(event) {
    const nativeEvent = event.nativeEvent || {};
    dragRef.current = {
      active: true,
      moved: false,
      x: nativeEvent.pageX ?? nativeEvent.locationX ?? 0,
      y: nativeEvent.pageY ?? nativeEvent.locationY ?? 0,
    };
  }

  function handleResponderMove(event) {
    const nativeEvent = event.nativeEvent || {};
    const x = nativeEvent.pageX ?? nativeEvent.locationX ?? 0;
    const y = nativeEvent.pageY ?? nativeEvent.locationY ?? 0;
    const dx = x - dragRef.current.x;
    const dy = y - dragRef.current.y;

    if (Math.abs(dx) + Math.abs(dy) < 2 || !layout.width || !layout.height) return;

    dragRef.current = { active: true, moved: true, x, y };

    setRegion(current => {
      const viewport = getViewport(current, layout);
      const nextCenter = worldPixelToLatLon({
        x: viewport.center.x - dx,
        y: viewport.center.y - dy,
      }, viewport.zoom);

      return {
        ...current,
        latitude: nextCenter.latitude,
        longitude: nextCenter.longitude,
      };
    });
  }

  function handleResponderRelease() {
    dragRef.current.active = false;
  }

  return (
    <Pressable
      style={[styles.map, style]}
      onLayout={event => setLayout(event.nativeEvent.layout)}
      onPress={handlePress}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}
      onStartShouldSetResponder={() => true}
      onWheel={handleWheel}
    >
      <View style={styles.tileLayer}>
        {tiles.map(tile => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={[styles.tile, { left: tile.left, top: tile.top }]}
          />
        ))}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeTitle}>Madrid centro</Text>
        <Text style={styles.badgeText}>OpenStreetMap · zoom {zoomFromRegion(region)}</Text>
      </View>
      <View style={styles.zoomControls}>
        <Pressable style={styles.zoomButton} onPress={() => zoomBy(0.55)}>
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Pressable style={styles.zoomButton} onPress={() => zoomBy(1.82)}>
          <Text style={styles.zoomText}>-</Text>
        </Pressable>
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
      {mappedChildren}
    </Pressable>
  );
}

export function Marker({ children, coordinate, onPress, __webLayout, __webRegion }) {
  function handlePress(event) {
    event?.stopPropagation?.();
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.marker, markerPosition(coordinate, __webRegion, __webLayout)]}
    >
      {children}
    </Pressable>
  );
}

export function Polyline({ coordinates = [], strokeColor = '#2563eb', strokeWidth = 3, __webLayout, __webRegion }) {
  if (!__webLayout?.width || !__webLayout?.height || coordinates.length < 2) {
    return null;
  }

  return coordinates.slice(1).map((coordinate, index) => {
    const start = coordinateToPoint(coordinates[index], __webRegion, __webLayout);
    const end = coordinateToPoint(coordinate, __webRegion, __webLayout);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt((dx * dx) + (dy * dy));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    return (
      <View
        key={`${index}-${coordinate.latitude}-${coordinate.longitude}`}
        style={[
          styles.routeLine,
          {
            backgroundColor: strokeColor,
            height: strokeWidth,
            left: start.x,
            top: start.y,
            transform: [{ rotate: `${angle}deg` }],
            width: length,
          },
        ]}
      />
    );
  });
}

export function UrlTile() {
  return null;
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: '#d7e3ef',
    overflow: 'hidden',
    position: 'relative',
  },
  tileLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: '#1f2937',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  badgeTitle: {
    color: '#1e3a2f',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 6,
    color: '#4b5563',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    top: 12,
    zIndex: 5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  zoomButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  zoomText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  marker: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 4,
  },
  routeLine: {
    position: 'absolute',
    borderRadius: 6,
    opacity: 0.88,
    transformOrigin: '0px 50%',
    zIndex: 3,
  },
});
