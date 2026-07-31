// Lugares reales de las ciudades más turísticas
// Cuando tengas un backend, esto se sustituye por llamadas a la API

const LUGARES_DEMO = {
  'madrid': [
    { nombre: 'Palacio Real', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 40.418, longitude: -3.714 }, tiempo_visita: 90 },
    { nombre: 'Museo del Prado', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 40.4138, longitude: -3.6921 }, tiempo_visita: 120 },
    { nombre: 'Puerta del Sol', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 40.4169, longitude: -3.7035 }, tiempo_visita: 30 },
    { nombre: 'Parque del Retiro', categoria: 'Parque', prioridad: 2, coordenadas: { latitude: 40.4153, longitude: -3.6844 }, tiempo_visita: 60 },
    { nombre: 'Gran Vía', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 40.4203, longitude: -3.7058 }, tiempo_visita: 45 },
  ],
  'paris': [
    { nombre: 'Torre Eiffel', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 48.8584, longitude: 2.2945 }, tiempo_visita: 120 },
    { nombre: 'Museo del Louvre', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 48.8606, longitude: 2.3376 }, tiempo_visita: 180 },
    { nombre: 'Catedral de Notre Dame', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 48.853, longitude: 2.3499 }, tiempo_visita: 60 },
    { nombre: 'Arco del Triunfo', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 48.8738, longitude: 2.295 }, tiempo_visita: 45 },
    { nombre: 'Basílica del Sacré-Cœur', categoria: 'Iglesia', prioridad: 2, coordenadas: { latitude: 48.8867, longitude: 2.3431 }, tiempo_visita: 45 },
  ],
  'roma': [
    { nombre: 'Coliseo', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 41.8902, longitude: 12.4922 }, tiempo_visita: 90 },
    { nombre: 'Fontana di Trevi', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 41.9009, longitude: 12.4833 }, tiempo_visita: 30 },
    { nombre: 'Vaticano y San Pedro', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 41.9022, longitude: 12.4539 }, tiempo_visita: 180 },
    { nombre: 'Panteón de Roma', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 41.8986, longitude: 12.4768 }, tiempo_visita: 45 },
    { nombre: 'Plaza de España', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 41.9058, longitude: 12.4823 }, tiempo_visita: 30 },
  ],
  'londres': [
    { nombre: 'Big Ben', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 51.5007, longitude: -0.1246 }, tiempo_visita: 30 },
    { nombre: 'Tower Bridge', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 51.5055, longitude: -0.0754 }, tiempo_visita: 45 },
    { nombre: 'British Museum', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 51.5194, longitude: -0.127 }, tiempo_visita: 120 },
    { nombre: 'Buckingham Palace', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 51.5014, longitude: -0.1419 }, tiempo_visita: 60 },
    { nombre: 'London Eye', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 51.5033, longitude: -0.1195 }, tiempo_visita: 45 },
  ],
  'barcelona': [
    { nombre: 'Sagrada Familia', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 41.4036, longitude: 2.1744 }, tiempo_visita: 90 },
    { nombre: 'Park Güell', categoria: 'Parque', prioridad: 3, coordenadas: { latitude: 41.4145, longitude: 2.1527 }, tiempo_visita: 90 },
    { nombre: 'Casa Batlló', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 41.3916, longitude: 2.1649 }, tiempo_visita: 60 },
    { nombre: 'Las Ramblas', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 41.3809, longitude: 2.1734 }, tiempo_visita: 60 },
    { nombre: 'Barrio Gótico', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 41.3825, longitude: 2.1769 }, tiempo_visita: 90 },
  ],
  'nueva york': [
    { nombre: 'Estatua de la Libertad', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 40.6892, longitude: -74.0445 }, tiempo_visita: 180 },
    { nombre: 'Central Park', categoria: 'Parque', prioridad: 3, coordenadas: { latitude: 40.7851, longitude: -73.9683 }, tiempo_visita: 120 },
    { nombre: 'Empire State', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 40.7484, longitude: -73.9857 }, tiempo_visita: 90 },
    { nombre: 'Times Square', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 40.758, longitude: -73.9855 }, tiempo_visita: 45 },
    { nombre: 'Puente de Brooklyn', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 40.7061, longitude: -73.9969 }, tiempo_visita: 60 },
  ],
  'tokio': [
    { nombre: 'Senso-ji', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 35.7148, longitude: 139.7967 }, tiempo_visita: 60 },
    { nombre: 'Torre de Tokio', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 35.6586, longitude: 139.7454 }, tiempo_visita: 60 },
    { nombre: 'Cruce de Shibuya', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 35.6595, longitude: 139.7004 }, tiempo_visita: 30 },
    { nombre: 'Santuario Meiji', categoria: 'Iglesia', prioridad: 2, coordenadas: { latitude: 35.6764, longitude: 139.6993 }, tiempo_visita: 45 },
    { nombre: 'Palacio Imperial', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 35.6852, longitude: 139.7528 }, tiempo_visita: 60 },
  ],
  'lisboa': [
    { nombre: 'Torre de Belém', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 38.6916, longitude: -9.216 }, tiempo_visita: 60 },
    { nombre: 'Alfama', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 38.7127, longitude: -9.1303 }, tiempo_visita: 120 },
    { nombre: 'Baixa Pombalina', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 38.7072, longitude: -9.1366 }, tiempo_visita: 90 },
    { nombre: 'Castillo de San Jorge', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 38.7139, longitude: -9.1336 }, tiempo_visita: 90 },
    { nombre: 'Oceanário', categoria: 'Museo', prioridad: 2, coordenadas: { latitude: 38.7636, longitude: -9.0937 }, tiempo_visita: 120 },
  ],
  'amsterdam': [
    { nombre: 'Casa de Ana Frank', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 52.3752, longitude: 4.8839 }, tiempo_visita: 90 },
    { nombre: 'Rijksmuseum', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 52.36, longitude: 4.8852 }, tiempo_visita: 120 },
    { nombre: 'Museo Van Gogh', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 52.3584, longitude: 4.8811 }, tiempo_visita: 90 },
    { nombre: 'Canales de Ámsterdam', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 52.3676, longitude: 4.9041 }, tiempo_visita: 60 },
    { nombre: 'Plaza Dam', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 52.3731, longitude: 4.8933 }, tiempo_visita: 30 },
  ],
  'berlin': [
    { nombre: 'Puerta de Brandeburgo', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 52.5163, longitude: 13.3777 }, tiempo_visita: 45 },
    { nombre: 'Muro de Berlín', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 52.535, longitude: 13.3903 }, tiempo_visita: 60 },
    { nombre: 'Reichstag', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 52.5186, longitude: 13.3761 }, tiempo_visita: 60 },
    { nombre: 'Isla de los Museos', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 52.5169, longitude: 13.4016 }, tiempo_visita: 180 },
    { nombre: 'Alexanderplatz', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 52.5219, longitude: 13.4132 }, tiempo_visita: 45 },
  ],
  'viena': [
    { nombre: 'Palacio Schönbrunn', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 48.1858, longitude: 16.3128 }, tiempo_visita: 120 },
    { nombre: 'Hofburg', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 48.2064, longitude: 16.3659 }, tiempo_visita: 90 },
    { nombre: 'Catedral de San Esteban', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 48.2085, longitude: 16.3731 }, tiempo_visita: 60 },
    { nombre: 'Ópera Estatal', categoria: 'Ocio', prioridad: 3, coordenadas: { latitude: 48.2031, longitude: 16.3689 }, tiempo_visita: 120 },
    { nombre: 'Prater', categoria: 'Parque', prioridad: 2, coordenadas: { latitude: 48.2168, longitude: 16.3958 }, tiempo_visita: 60 },
  ],
  'florencia': [
    { nombre: 'Duomo de Florencia', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 43.7731, longitude: 11.256 }, tiempo_visita: 90 },
    { nombre: 'Galería Uffizi', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 43.7678, longitude: 11.2553 }, tiempo_visita: 120 },
    { nombre: 'Ponte Vecchio', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 43.7681, longitude: 11.2532 }, tiempo_visita: 30 },
    { nombre: 'David de Miguel Ángel', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 43.7768, longitude: 11.2587 }, tiempo_visita: 60 },
    { nombre: 'Piazza della Signoria', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 43.7696, longitude: 11.2558 }, tiempo_visita: 45 },
  ],
  'venecia': [
    { nombre: 'Plaza San Marcos', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 45.4341, longitude: 12.3388 }, tiempo_visita: 60 },
    { nombre: 'Puente de Rialto', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 45.4381, longitude: 12.3359 }, tiempo_visita: 30 },
    { nombre: 'Gran Canal', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 45.4408, longitude: 12.3155 }, tiempo_visita: 60 },
    { nombre: 'Palacio Ducal', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 45.4336, longitude: 12.3402 }, tiempo_visita: 90 },
    { nombre: 'Puente de los Suspiros', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 45.434, longitude: 12.3409 }, tiempo_visita: 15 },
  ],
  'atenas': [
    { nombre: 'Acrópolis', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 37.9715, longitude: 23.7257 }, tiempo_visita: 120 },
    { nombre: 'Partenón', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 37.9716, longitude: 23.7266 }, tiempo_visita: 60 },
    { nombre: 'Ágora Antigua', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 37.9746, longitude: 23.7239 }, tiempo_visita: 60 },
    { nombre: 'Plaka', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 37.9733, longitude: 23.7303 }, tiempo_visita: 90 },
    { nombre: 'Estadio Olímpico', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 37.9682, longitude: 23.7413 }, tiempo_visita: 30 },
  ],
  'praga': [
    { nombre: 'Puente de Carlos', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 50.0865, longitude: 14.4116 }, tiempo_visita: 45 },
    { nombre: 'Reloj Astronómico', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 50.087, longitude: 14.4208 }, tiempo_visita: 30 },
    { nombre: 'Castillo de Praga', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 50.0911, longitude: 14.4016 }, tiempo_visita: 120 },
    { nombre: 'Plaza de la Ciudad Vieja', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 50.0875, longitude: 14.4213 }, tiempo_visita: 45 },
    { nombre: 'Barrio Judío', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 50.0903, longitude: 14.4189 }, tiempo_visita: 60 },
  ],
  'estambul': [
    { nombre: 'Santa Sofía', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 41.0086, longitude: 28.98 }, tiempo_visita: 90 },
    { nombre: 'Mezquita Azul', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 41.0054, longitude: 28.9768 }, tiempo_visita: 60 },
    { nombre: 'Gran Bazar', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 41.0107, longitude: 28.9681 }, tiempo_visita: 120 },
    { nombre: 'Palacio Topkapi', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 41.0115, longitude: 28.9833 }, tiempo_visita: 120 },
    { nombre: 'Estrecho del Bósforo', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 41.1197, longitude: 29.0789 }, tiempo_visita: 60 },
  ],
  'buenos aires': [
    { nombre: 'Obelisco', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: -34.6037, longitude: -58.3816 }, tiempo_visita: 15 },
    { nombre: 'Caminito', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: -34.6345, longitude: -58.3634 }, tiempo_visita: 60 },
    { nombre: 'Casa Rosada', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: -34.6081, longitude: -58.3703 }, tiempo_visita: 30 },
    { nombre: 'Teatro Colón', categoria: 'Ocio', prioridad: 3, coordenadas: { latitude: -34.6011, longitude: -58.3831 }, tiempo_visita: 60 },
    { nombre: 'Cementerio Recoleta', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: -34.5883, longitude: -58.393 }, tiempo_visita: 45 },
  ],
  'ciudad de mexico': [
    { nombre: 'Zócalo', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 19.4326, longitude: -99.1332 }, tiempo_visita: 45 },
    { nombre: 'Chapultepec', categoria: 'Parque', prioridad: 3, coordenadas: { latitude: 19.4204, longitude: -99.1815 }, tiempo_visita: 120 },
    { nombre: 'Museo Frida Kahlo', categoria: 'Museo', prioridad: 3, coordenadas: { latitude: 19.3553, longitude: -99.1622 }, tiempo_visita: 60 },
    { nombre: 'Palacio Bellas Artes', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: 19.4357, longitude: -99.1413 }, tiempo_visita: 60 },
    { nombre: 'Xochimilco', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 19.2902, longitude: -99.1016 }, tiempo_visita: 180 },
  ],
  'rio de janeiro': [
    { nombre: 'Cristo Redentor', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: -22.9519, longitude: -43.2105 }, tiempo_visita: 120 },
    { nombre: 'Pan de Azúcar', categoria: 'Monumento', prioridad: 3, coordenadas: { latitude: -22.9497, longitude: -43.1546 }, tiempo_visita: 120 },
    { nombre: 'Copacabana', categoria: 'Parque', prioridad: 2, coordenadas: { latitude: -22.9719, longitude: -43.1856 }, tiempo_visita: 120 },
    { nombre: 'Escalera Selarón', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: -22.9154, longitude: -43.1793 }, tiempo_visita: 30 },
    { nombre: 'Maracaná', categoria: 'Ocio', prioridad: 2, coordenadas: { latitude: -22.9122, longitude: -43.2302 }, tiempo_visita: 60 },
  ],
  'kioto': [
    { nombre: 'Fushimi Inari', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 34.9671, longitude: 135.7727 }, tiempo_visita: 120 },
    { nombre: 'Kinkaku-ji', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 35.0394, longitude: 135.7292 }, tiempo_visita: 60 },
    { nombre: 'Bambú Arashiyama', categoria: 'Parque', prioridad: 2, coordenadas: { latitude: 35.017, longitude: 135.671 }, tiempo_visita: 60 },
    { nombre: 'Gion', categoria: 'Monumento', prioridad: 2, coordenadas: { latitude: 35.0037, longitude: 135.7786 }, tiempo_visita: 90 },
    { nombre: 'Kiyomizu-dera', categoria: 'Iglesia', prioridad: 3, coordenadas: { latitude: 34.9949, longitude: 135.785 }, tiempo_visita: 90 },
  ],
};

export function buscarLugaresDemo(ciudad) {
    const clave = ciudad?.toLowerCase().trim();
    if (!clave) return null;
  // Buscar coincidencia exacta o parcial
  for (const [key, lugares] of Object.entries(LUGARES_DEMO)) {
    if (clave.includes(key) || key.includes(clave)) {
      return lugares;
    }
  }
  return null;
}

export default LUGARES_DEMO;