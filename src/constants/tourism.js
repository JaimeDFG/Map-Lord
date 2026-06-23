export const CATEGORIAS = {
  'Monumento':   { color: '#e67e22', emoji: '🏛️' },
  'Templo':     { color: '#9b59b6', emoji: '⛩️' },
  'Museo':       { color: '#8e44ad', emoji: '🎨' },
  'Parque':      { color: '#27ae60', emoji: '🌳' },
  'Iglesia':     { color: '#f5eea0', emoji: '⛪' },
  'Plaza':       { color: '#2980b9', emoji: '📍' },
  'Palacio':     { color: '#d4a017', emoji: '👑' },
  'Mercado':     { color: '#16a085', emoji: '🧺' },
  'Estacion':    { color: '#34495e', emoji: '🚉' },
  'Mirador':     { color: '#7f8c8d', emoji: '🔭' },
  'Puente':      { color: '#2c3e50', emoji: '🌉' },
  'Teatro':      { color: '#6d3b8e', emoji: '🎭' },
  'Restaurante': { color: '#e74c3c', emoji: '🍽️' },
  'Bar':         { color: '#e67e22', emoji: '🍺' },
  'Playa':       { color: '#00b4d8', emoji: '🏖️' },
  'Castillo':    { color: '#8b6914', emoji: '🏰' },
  'Otros':        { color: '#95a5a6', emoji: '🚩' },
  'Fuente':      { color: '#3498db', emoji: '⛲' },
  'Calle':        { color: '#589ee4', emoji: '🏙️' },
  'Aeropuerto':   { color: '#34495e', emoji: '✈️' },
  'Estadio':      { color: '#c0392b', emoji: '🏟️' },
};

export const RELEVANCIA = {
  3: { label: 'Imprescindible', color: '#f59e0b', estrellas: '★★★' },
  2: { label: 'Recomendado',    color: '#6366f1', estrellas: '★★☆' },
  1: { label: 'Opcional',       color: '#94a3b8', estrellas: '★☆☆' },
};

export const SECCIONES = [
  { key: 'historia',     label: 'Historia',     emoji: '📜' },
  { key: 'arquitectura', label: 'Arquitectura', emoji: '🏗️' },
  { key: 'curiosidades', label: 'Curiosidades', emoji: '💡' },
  { key: 'misterios',    label: 'Misterios',    emoji: '🔮' },
];

export const OPCIONES_TIEMPO = [
  { label: '1 hora',       minutos: 60,  emoji: '⚡' },
  { label: '3 horas',      minutos: 180, emoji: '🚶' },
  { label: 'Medio día',    minutos: 300, emoji: '☀️' },
  { label: 'Día completo', minutos: 550, emoji: '🗺️' },
];

export const CONTINENTES = [
  { id: 'Europa',           emoji: '🏰', color: '#3b5bdb' },
  { id: 'América del Norte',emoji: '🗽', color: '#2f9e44' },
  { id: 'América del Sur',  emoji: '🌴', color: '#1a7a4a' },
  { id: 'Asia',             emoji: '🏯', color: '#e67700' },
  { id: 'África',           emoji: '🦁', color: '#c2255c' },
  { id: 'Oceanía',          emoji: '🦘', color: '#0c8599' },
];