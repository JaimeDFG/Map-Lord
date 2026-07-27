import { buscarLugaresDemo } from '../data/lugaresDemo';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

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

export async function buscarLugaresDestacados(lat, lon, radioMetros = 10000, limite = 5, ciudad = '') {
  // Primero intentamos el diccionario demo (funciona offline, instantáneo)
  const demo = buscarLugaresDemo(ciudad);
  if (demo) {
    console.log('Demo: lugares encontrados para', ciudad, ':', demo.length);
    return demo;
  }

  // Si no hay demo, devolvemos vacío con mensaje para que el usuario sepa
  console.log('Demo: no hay datos para', ciudad);
  return [];
}