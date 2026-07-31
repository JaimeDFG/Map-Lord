const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// Esta función busca las coordenadas de una ciudad (ya la tenías, la dejamos)
export async function buscarCoordenadasCiudad(ciudad, paisNombre) {
  try {
    const q = encodeURIComponent(`${ciudad}, ${paisNombre}`);
    const res = await fetch(`${NOMINATIM_URL}/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'MapLord-App/1.0' }
    });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) {
    return null;
  }
}

// NUEVO: Esta función busca lugares turísticos reales en cualquier ciudad del mundo
export async function buscarLugaresDestacados(lat, lon, radioMetros = 8000, limite = 5, ciudad = '') {
  try {
    // Primero intentamos datos demo (para ciudades conocidas, más rápido)
    const { buscarLugaresDemo } = await import('../data/lugaresDemo');
    const demo = buscarLugaresDemo(ciudad);
    if (demo && demo.length > 0) {
      console.log('Usando datos demo para:', ciudad);
      return demo;
    }

    // Si no hay demo, buscamos en OpenStreetMap en tiempo real
    console.log('Buscando en OpenStreetMap para:', ciudad);
    
    const query = `
      [out:json][timeout:15];
      (
        node["tourism"~"museum|attraction|monument|viewpoint|artwork|gallery|zoo|aquarium|theme_park"](around:${radioMetros},${lat},${lon});
        way["tourism"~"museum|attraction|monument|viewpoint|artwork|gallery|zoo|aquarium|theme_park"](around:${radioMetros},${lat},${lon});
        node["historic"~"castle|ruins|archaeological_site|memorial|monument|fort|palace|church|cathedral|mosque|synagogue|temple|shrine|monastery|abbey|amphitheatre|theatre|amphitheater"](around:${radioMetros},${lat},${lon});
        way["historic"~"castle|ruins|archaeological_site|memorial|monument|fort|palace|church|cathedral|mosque|synagogue|temple|shrine|monastery|abbey|amphitheatre|theatre|amphitheater"](around:${radioMetros},${lat},${lon});
        node["amenity"~"theatre|cinema|arts_centre|community_centre|conference_centre|events_venue|exhibition_centre|planetarium"](around:${radioMetros},${lat},${lon});
        way["amenity"~"theatre|cinema|arts_centre|community_centre|conference_centre|events_venue|exhibition_centre|planetarium"](around:${radioMetros},${lat},${lon});
        node["leisure"~"park|garden|nature_reserve|stadium|sports_centre|water_park|beach_resort|marina|track|pitch|golf_course|miniature_golf"](around:${radioMetros},${lat},${lon});
        way["leisure"~"park|garden|nature_reserve|stadium|sports_centre|water_park|beach_resort|marina|track|pitch|golf_course|miniature_golf"](around:${radioMetros},${lat},${lon});
        node["natural"~"beach|cliff|peak|volcano|cave_entrance|geyser|hot_spring|waterfall|glacier|reef|spring|wood"](around:${radioMetros},${lat},${lon});
        way["natural"~"beach|cliff|peak|volcano|cave_entrance|geyser|hot_spring|waterfall|glacier|reef|spring|wood"](around:${radioMetros},${lat},${lon});
        node["shop"~"mall|department_store"](around:${radioMetros},${lat},${lon});
        way["shop"~"mall|department_store"](around:${radioMetros},${lat},${lon});
        node["building"~"cathedral|church|mosque|synagogue|temple|castle|palace|stadium|arena|theatre|museum|university|library|townhall|parliament|courthouse|hotel|hospital|station|airport_terminal"](around:${radioMetros},${lat},${lon});
        way["building"~"cathedral|church|mosque|synagogue|temple|castle|palace|stadium|arena|theatre|museum|university|library|townhall|parliament|courthouse|hotel|hospital|station|airport_terminal"](around:${radioMetros},${lat},${lon});
        node["man_made"~"lighthouse|tower|obelisk|monument|cross|flagpole|observatory|watermill|windmill|pier|breakwater|groyne|jetty|quay|dam|reservoir_covered|storage_tank|water_tower|wastewater_plant|water_works|monitoring_station|surveillance"](around:${radioMetros},${lat},${lon});
        way["man_made"~"lighthouse|tower|obelisk|monument|cross|flagpole|observatory|watermill|windmill|pier|breakwater|groyne|jetty|quay|dam|reservoir_covered|storage_tank|water_tower|wastewater_plant|water_works|monitoring_station|surveillance"](around:${radioMetros},${lat},${lon});
        node["place"~"square"](around:${radioMetros},${lat},${lon});
        way["place"~"square"](around:${radioMetros},${lat},${lon});
        node["highway"~"pedestrian"](around:${radioMetros},${lat},${lon});
        way["highway"~"pedestrian"](around:${radioMetros},${lat},${lon});
      );
      out center ${limite};
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    });
    
    const data = await res.json();
    
    if (!data.elements || data.elements.length === 0) {
      return [];
    }

    // Convertimos los resultados de OSM al formato de nuestra app
    const lugares = data.elements
      .filter(el => el.tags && el.tags.name)
      .map(el => {
        const tags = el.tags;
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        
        // Determinamos la categoría según los tags de OSM
        let categoria = 'Otros';
        let prioridad = 1;
        
        if (tags.tourism === 'museum' || tags.building === 'museum') {
          categoria = 'Museo';
          prioridad = 3;
        } else if (tags.historic === 'castle' || tags.building === 'castle') {
          categoria = 'Castillo';
          prioridad = 3;
        } else if (tags.historic === 'palace' || tags.building === 'palace') {
          categoria = 'Palacio';
          prioridad = 3;
        } else if (tags.building === 'cathedral' || tags.building === 'church' || tags.building === 'mosque' || tags.building === 'synagogue' || tags.building === 'temple') {
          categoria = 'Iglesia';
          prioridad = 3;
        } else if (tags.historic === 'monument' || tags.man_made === 'monument' || tags.man_made === 'obelisk') {
          categoria = 'Monumento';
          prioridad = 3;
        } else if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint' || tags.natural === 'peak' || tags.natural === 'volcano' || tags.natural === 'cliff' || tags.natural === 'cave_entrance') {
          categoria = 'Mirador';
          prioridad = 2;
        } else if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.natural === 'wood') {
          categoria = 'Parque';
          prioridad = 2;
        } else if (tags.tourism === 'theme_park' || tags.tourism === 'zoo' || tags.tourism === 'aquarium' || tags.leisure === 'water_park') {
          categoria = 'Parque';
          prioridad = 3;
        } else if (tags.historic === 'ruins' || tags.historic === 'archaeological_site' || tags.historic === 'amphitheatre' || tags.historic === 'amphitheater' || tags.historic === 'theatre' || tags.historic === 'fort') {
          categoria = 'Monumento';
          prioridad = 3;
        } else if (tags.amenity === 'theatre' || tags.amenity === 'cinema' || tags.amenity === 'arts_centre' || tags.building === 'theatre' || tags.building === 'arena') {
          categoria = 'Teatro';
          prioridad = 2;
        } else if (tags.leisure === 'stadium' || tags.leisure === 'sports_centre' || tags.building === 'stadium') {
          categoria = 'Estadio';
          prioridad = 1;
        } else if (tags.natural === 'beach' || tags.leisure === 'beach_resort') {
          categoria = 'Playa';
          prioridad = 2;
        } else if (tags.natural === 'waterfall' || tags.natural === 'geyser' || tags.natural === 'hot_spring' || tags.natural === 'spring') {
          categoria = 'Fuente';
          prioridad = 2;
        } else if (tags.shop === 'mall' || tags.shop === 'department_store') {
          categoria = 'Mercado';
          prioridad = 1;
        } else if (tags.place === 'square' || tags.highway === 'pedestrian') {
          categoria = 'Plaza';
          prioridad = 2;
        } else if (tags.man_made === 'lighthouse' || tags.man_made === 'tower' || tags.man_made === 'observatory' || tags.man_made === 'windmill' || tags.man_made === 'watermill') {
          categoria = 'Monumento';
          prioridad = 2;
        } else if (tags.building === 'university' || tags.building === 'library' || tags.building === 'townhall' || tags.building === 'parliament' || tags.building === 'courthouse') {
          categoria = 'Monumento';
          prioridad = 2;
        } else if (tags.building === 'hotel' || tags.building === 'hospital' || tags.building === 'station' || tags.building === 'airport_terminal') {
          categoria = 'Otros';
          prioridad = 1;
        } else if (tags.tourism === 'gallery' || tags.tourism === 'artwork') {
          categoria = 'Museo';
          prioridad = 2;
        }

        // Wikipedia link = más famoso = más prioridad
        if (tags.wikipedia) prioridad = Math.min(prioridad + 1, 3);
        if (tags.wikidata) prioridad = Math.min(prioridad + 1, 3);

        return {
          nombre: tags.name,
          categoria,
          prioridad,
          coordenadas: { latitude: lat, longitude: lon },
          tiempo_visita: prioridad === 3 ? 60 : (prioridad === 2 ? 45 : 30),
        };
      })
      .filter(l => l.coordenadas.latitude && l.coordenadas.longitude);

    // Eliminamos duplicados por nombre
    const vistos = new Set();
    const unicos = [];
    for (const l of lugares) {
      const key = l.nombre.toLowerCase().trim();
      if (!vistos.has(key)) {
        vistos.add(key);
        unicos.push(l);
      }
    }

    return unicos.slice(0, limite);
  } catch (e) {
    console.log('Error buscando lugares:', e);
    return [];
  }
}