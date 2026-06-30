export const CATEGORIAS = {
  'Monumento':   { color: '#e67e22', emoji: '🏛️', en: 'Monument' },
  'Templo':      { color: '#9b59b6', emoji: '⛩️', en: 'Temple' },
  'Museo':       { color: '#8e44ad', emoji: '🎨', en: 'Museum' },
  'Parque':      { color: '#27ae60', emoji: '🌳', en: 'Park' },
  'Iglesia':     { color: '#f5eea0', emoji: '⛪', en: 'Church' },
  'Plaza':       { color: '#2980b9', emoji: '📍', en: 'Square' },
  'Palacio':     { color: '#d4a017', emoji: '👑', en: 'Palace' },
  'Mercado':     { color: '#16a085', emoji: '🧺', en: 'Market' },
  'Estacion':    { color: '#34495e', emoji: '🚉', en: 'Station' },
  'Mirador':     { color: '#7f8c8d', emoji: '🔭', en: 'Viewpoint' },
  'Puente':      { color: '#2c3e50', emoji: '🌉', en: 'Bridge' },
  'Teatro':      { color: '#6d3b8e', emoji: '🎭', en: 'Theatre' },
  'Restaurante': { color: '#e74c3c', emoji: '🍽️', en: 'Restaurant' },
  'Bar':         { color: '#e67e22', emoji: '🍺', en: 'Bar' },
  'Playa':       { color: '#00b4d8', emoji: '🏖️', en: 'Beach' },
  'Castillo':    { color: '#8b6914', emoji: '🏰', en: 'Castle' },
  'Otros':       { color: '#95a5a6', emoji: '🚩', en: 'Other' },
  'Fuente':      { color: '#3498db', emoji: '⛲', en: 'Fountain' },
  'Calle':       { color: '#589ee4', emoji: '🏙️', en: 'Street' },
  'Aeropuerto':  { color: '#34495e', emoji: '✈️', en: 'Airport' },
  'Estadio':     { color: '#c0392b', emoji: '🏟️', en: 'Stadium' },
};

// Devuelve el nombre de la categoría en el idioma activo
export function labelCategoria(key, lang) {
  if (!key) return key;
  if (lang !== 'en') return key;
  return CATEGORIAS[key]?.en ?? key;
}

export const RELEVANCIA = {
  3: { label: 'Imprescindible', labelEn: 'Must-see',    color: '#f59e0b', estrellas: '★★★' },
  2: { label: 'Recomendado',    labelEn: 'Recommended', color: '#6366f1', estrellas: '★★☆' },
  1: { label: 'Opcional',       labelEn: 'Optional',    color: '#94a3b8', estrellas: '★☆☆' },
};

// Devuelve el label de relevancia en el idioma activo
export function labelRelevancia(nivel, lang) {
  const r = RELEVANCIA[nivel];
  if (!r) return '';
  return lang === 'en' ? r.labelEn : r.label;
}

export const SECCIONES = [
  { key: 'historia',     labelEs: 'Historia',     labelEn: 'History',      emoji: '📜' },
  { key: 'arquitectura', labelEs: 'Arquitectura', labelEn: 'Architecture', emoji: '🏗️' },
  { key: 'curiosidades', labelEs: 'Curiosidades', labelEn: 'Curiosities',  emoji: '💡' },
  { key: 'misterios',    labelEs: 'Misterios',    labelEn: 'Mysteries',    emoji: '🔮' },
];

export const OPCIONES_TIEMPO = [
  { labelEs: '1 hora',       labelEn: '1 hour',      minutos: 60,  emoji: '⚡' },
  { labelEs: '3 horas',      labelEn: '3 hours',     minutos: 180, emoji: '🚶' },
  { labelEs: 'Medio día',    labelEn: 'Half day',    minutos: 300, emoji: '☀️' },
  { labelEs: 'Día completo', labelEn: 'Full day',    minutos: 550, emoji: '🗺️' },
];

export const CONTINENTES = [
  { id: 'Europa',           emoji: '🏰', color: '#3b5bdb' },
  { id: 'América del Norte',emoji: '🗽', color: '#2f9e44' },
  { id: 'América del Sur',  emoji: '🌴', color: '#1a7a4a' },
  { id: 'Asia',             emoji: '🏯', color: '#e67700' },
  { id: 'África',           emoji: '🦁', color: '#c2255c' },
  { id: 'Oceanía',          emoji: '🦘', color: '#0c8599' },
];

// Nombres de continentes en inglés (el id siempre queda en español internamente)
export const CONTINENTES_EN = {
  'Europa':            'Europe',
  'América del Norte': 'North America',
  'América del Sur':   'South America',
  'Asia':              'Asia',
  'África':            'Africa',
  'Oceanía':           'Oceania',
};

// Tabla de traducción ES→EN para nombres de países
// Cubre los 197 países del archivo paises.json
export const PAISES_EN = {
  // Europa
  'Andorra':'Andorra','Albania':'Albania','Austria':'Austria','Bosnia':'Bosnia',
  'Bélgica':'Belgium','Bulgaria':'Bulgaria','Bielorrusia':'Belarus','Suiza':'Switzerland',
  'Chipre':'Cyprus','Rep. Checa':'Czech Republic','Alemania':'Germany','Dinamarca':'Denmark',
  'Estonia':'Estonia','España':'Spain','Finlandia':'Finland','Francia':'France',
  'Reino Unido':'United Kingdom','Grecia':'Greece','Croacia':'Croatia','Hungría':'Hungary',
  'Irlanda':'Ireland','Islandia':'Iceland','Italia':'Italy','Liechtenstein':'Liechtenstein',
  'Lituania':'Lithuania','Luxemburgo':'Luxembourg','Letonia':'Latvia','Mónaco':'Monaco',
  'Moldavia':'Moldova','Montenegro':'Montenegro','Macedonia':'North Macedonia',
  'Macedonia del N.':'North Macedonia','Malta':'Malta','Países Bajos':'Netherlands',
  'Noruega':'Norway','Polonia':'Poland','Portugal':'Portugal','Rumanía':'Romania',
  'Serbia':'Serbia','Eslovaquia':'Slovakia','Eslovenia':'Slovenia','San Marino':'San Marino',
  'Suecia':'Sweden','Turquía':'Turkey','Ucrania':'Ukraine','Vaticano':'Vatican City',
  'Kosovo':'Kosovo','Armenia':'Armenia','Azerbaiyán':'Azerbaijan','Georgia':'Georgia',
  // América del Norte
  'Canadá':'Canada','México':'Mexico','Estados Unidos':'United States','Cuba':'Cuba',
  'Guatemala':'Guatemala','Honduras':'Honduras','El Salvador':'El Salvador',
  'Nicaragua':'Nicaragua','Costa Rica':'Costa Rica','Panamá':'Panama','Jamaica':'Jamaica',
  'Haití':'Haiti','Rep. Dominicana':'Dominican Republic','Puerto Rico':'Puerto Rico',
  'Trinidad y Tobago':'Trinidad and Tobago','Bahamas':'Bahamas','Barbados':'Barbados',
  'Belice':'Belize','Antigua y Barbuda':'Antigua and Barbuda','San Bartolomé':'Saint Barthélemy',
  'Dominica':'Dominica','Granada':'Grenada','San Cristóbal':'Saint Kitts and Nevis',
  'Santa Lucía':'Saint Lucia','San Vicente':'Saint Vincent and the Grenadines',
  // América del Sur
  'Argentina':'Argentina','Bolivia':'Bolivia','Brasil':'Brazil','Chile':'Chile',
  'Colombia':'Colombia','Ecuador':'Ecuador','Guyana':'Guyana','Paraguay':'Paraguay',
  'Perú':'Peru','Surinam':'Suriname','Uruguay':'Uruguay','Venezuela':'Venezuela',
  // Asia
  'Afganistán':'Afghanistan','Arabia Saudí':'Saudi Arabia','Bangladesh':'Bangladesh',
  'Birmania':'Myanmar','Myanmar':'Myanmar','Brunéi':'Brunei','Bután':'Bhutan',
  'Camboya':'Cambodia','China':'China','Corea del Norte':'North Korea',
  'Corea del Sur':'South Korea','Emiratos Árabes':'United Arab Emirates',
  'Filipinas':'Philippines','India':'India','Indonesia':'Indonesia','Irak':'Iraq',
  'Irán':'Iran','Israel':'Israel','Japón':'Japan','Jordania':'Jordan',
  'Kazajistán':'Kazakhstan','Kirguistán':'Kyrgyzstan','Kuwait':'Kuwait','Laos':'Laos',
  'Líbano':'Lebanon','Malasia':'Malaysia','Maldivas':'Maldives','Mongolia':'Mongolia',
  'Nepal':'Nepal','Omán':'Oman','Pakistán':'Pakistan','Palestina':'Palestine',
  'Qatar':'Qatar','Catar':'Qatar','Rusia':'Russia','Singapur':'Singapore',
  'Siria':'Syria','Sri Lanka':'Sri Lanka','Tailandia':'Thailand','Taiwán':'Taiwan',
  'Tayikistán':'Tajikistan','Timor Oriental':'East Timor','Turkmenistán':'Turkmenistan',
  'Uzbekistán':'Uzbekistan','Vietnam':'Vietnam','Yemen':'Yemen',
  'Baréin':'Bahrain','R.D. del Congo':'DR Congo',
  // África
  'Angola':'Angola','Argelia':'Algeria','Benín':'Benin','Botsuana':'Botswana',
  'Burkina Faso':'Burkina Faso','Burundi':'Burundi','Cabo Verde':'Cape Verde',
  'Camerún':'Cameroon','Chad':'Chad','Comoras':'Comoros','Congo':'Republic of the Congo',
  'Costa de Marfil':"Ivory Coast",'Djibouti':'Djibouti','Egipto':'Egypt',
  'Eritrea':'Eritrea','Etiopía':'Ethiopia','Gabón':'Gabon','Gambia':'Gambia',
  'Ghana':'Ghana','Guinea':'Guinea','Guinea-Bisáu':'Guinea-Bissau',
  'Guinea Ecuatorial':'Equatorial Guinea','Kenia':'Kenya','Lesoto':'Lesotho',
  'Liberia':'Liberia','Libia':'Libya','Madagascar':'Madagascar','Malaui':'Malawi',
  'Malí':'Mali','Marruecos':'Morocco','Mauricio':'Mauritius','Mauritania':'Mauritania',
  'Mozambique':'Mozambique','Namibia':'Namibia','Níger':'Niger','Nigeria':'Nigeria',
  'Rep. Centroafricana':'Central African Republic','R. Centroafricana':'Central African Republic',
  'Ruanda':'Rwanda','Santo Tomé':'São Tomé and Príncipe','Senegal':'Senegal',
  'Seychelles':'Seychelles','Sierra Leona':'Sierra Leone','Somalia':'Somalia',
  'Sudáfrica':'South Africa','Sudán':'Sudan','Sudán del Sur':'South Sudan',
  'Suazilandia':'Eswatini','Esuatini':'Eswatini','Tanzania':'Tanzania','Togo':'Togo',
  'Túnez':'Tunisia','Uganda':'Uganda','Yibuti':'Djibouti','Zambia':'Zambia',
  'Zimbabue':'Zimbabwe',
  // Oceanía
  'Australia':'Australia','Fiji':'Fiji','Fiyi':'Fiji','Kiribati':'Kiribati',
  'Micronesia':'Micronesia','Nauru':'Nauru','Nueva Zelanda':'New Zealand',
  'Palaos':'Palau','Papúa Nueva Guinea':'Papua New Guinea',
  'Papúa N. Guinea':'Papua New Guinea','Samoa':'Samoa',
  'Salomón':'Solomon Islands','Islas Salomón':'Solomon Islands',
  'Islas Marshall':'Marshall Islands','Tonga':'Tonga','Tuvalu':'Tuvalu',
  'Vanuatu':'Vanuatu',
};

// Función helper: devuelve el nombre del país en el idioma activo
export function nombrePaisEn(nombre, lang) {
  if (lang !== 'en') return nombre;
  return PAISES_EN[nombre] ?? nombre;
}

// Función helper: devuelve el nombre del continente en el idioma activo
export function nombreContinenteEn(nombre, lang) {
  if (lang !== 'en') return nombre;
  return CONTINENTES_EN[nombre] ?? nombre;
}