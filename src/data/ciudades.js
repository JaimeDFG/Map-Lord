import CIUDADES from './ciudades.json';

// Elimina tildes y pasa a minúsculas para comparar
function norm(s) {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Busca coordenadas dado un nombre de ciudad y opcionalmente el ID de país.
// Devuelve {latitude, longitude} o null.
export function buscarCoordenadas(nombreCiudad, paisId) {
  if (!nombreCiudad) return null;
  const clave = norm(nombreCiudad);

  // Primero buscar en el país indicado (evita confusión Córdoba ES vs AR)
  if (paisId) {
    const enPais = CIUDADES.filter(c => c.id === paisId);
    for (const c of enPais) {
      if (norm(c.n) === clave) return { latitude: c.lat, longitude: c.lng };
      if (c.alt?.some(a => norm(a) === clave)) return { latitude: c.lat, longitude: c.lng };
    }
  }

  // Búsqueda global
  for (const c of CIUDADES) {
    if (norm(c.n) === clave) return { latitude: c.lat, longitude: c.lng };
    if (c.alt?.some(a => norm(a) === clave)) return { latitude: c.lat, longitude: c.lng };
  }

  return null;
}

// Devuelve los nombres canónicos de las ciudades de un país
export function ciudadesDePais(paisId) {
  return CIUDADES.filter(c => c.id === paisId).map(c => c.n);
}

export default CIUDADES;