// Maps Vercel's `x-vercel-ip-country-region` codes (ISO 3166-2:IN subdivision
// part, e.g. "MH", "DL") to full state names, plus an approximate tile-grid
// layout used to draw a self-contained India heat-map (a cartogram — each
// state is a grid cell, not a true geographic border).

export const REGION_NAMES = {
  AN: 'Andaman & Nicobar', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh',
  AS: 'Assam', BR: 'Bihar', CH: 'Chandigarh', CT: 'Chhattisgarh', CG: 'Chhattisgarh',
  DL: 'Delhi', DH: 'Dadra & Nagar Haveli', DD: 'Daman & Diu', GA: 'Goa',
  GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JK: 'Jammu & Kashmir',
  JH: 'Jharkhand', KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep',
  MP: 'Madhya Pradesh', MH: 'Maharashtra', MN: 'Manipur', ML: 'Meghalaya',
  MZ: 'Mizoram', NL: 'Nagaland', OR: 'Odisha', OD: 'Odisha', PY: 'Puducherry',
  PB: 'Punjab', RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TG: 'Telangana',
  TS: 'Telangana', TR: 'Tripura', UP: 'Uttar Pradesh', UT: 'Uttarakhand',
  UK: 'Uttarakhand', WB: 'West Bengal',
};

export function regionToState(code) {
  if (!code) return 'Unknown';
  return REGION_NAMES[String(code).toUpperCase()] || 'Unknown';
}

// Approximate tile grid (col x, row y), north→south, west→east. Not to scale —
// it's a cartogram so every state is equally visible regardless of area.
export const STATE_TILES = [
  { name: 'Jammu & Kashmir', code: 'JK', x: 2, y: 0 },
  { name: 'Ladakh',         code: 'LA', x: 4, y: 0 },
  { name: 'Punjab',         code: 'PB', x: 2, y: 1 },
  { name: 'Himachal Pradesh', code: 'HP', x: 3, y: 1 },
  { name: 'Uttarakhand',    code: 'UT', x: 4, y: 1 },
  { name: 'Haryana',        code: 'HR', x: 2, y: 2 },
  { name: 'Delhi',          code: 'DL', x: 3, y: 2 },
  { name: 'Rajasthan',      code: 'RJ', x: 1, y: 3 },
  { name: 'Uttar Pradesh',  code: 'UP', x: 3, y: 3 },
  { name: 'Bihar',          code: 'BR', x: 5, y: 3 },
  { name: 'Sikkim',         code: 'SK', x: 6, y: 3 },
  { name: 'Arunachal Pradesh', code: 'AR', x: 8, y: 2 },
  { name: 'Gujarat',        code: 'GJ', x: 0, y: 4 },
  { name: 'Madhya Pradesh', code: 'MP', x: 2, y: 4 },
  { name: 'Jharkhand',      code: 'JH', x: 5, y: 4 },
  { name: 'West Bengal',    code: 'WB', x: 6, y: 4 },
  { name: 'Assam',          code: 'AS', x: 7, y: 3 },
  { name: 'Nagaland',       code: 'NL', x: 8, y: 3 },
  { name: 'Meghalaya',      code: 'ML', x: 7, y: 4 },
  { name: 'Manipur',        code: 'MN', x: 8, y: 4 },
  { name: 'Maharashtra',    code: 'MH', x: 1, y: 5 },
  { name: 'Chhattisgarh',   code: 'CT', x: 3, y: 5 },
  { name: 'Odisha',         code: 'OR', x: 5, y: 5 },
  { name: 'Tripura',        code: 'TR', x: 7, y: 5 },
  { name: 'Mizoram',        code: 'MZ', x: 8, y: 5 },
  { name: 'Goa',            code: 'GA', x: 1, y: 6 },
  { name: 'Telangana',      code: 'TG', x: 2, y: 6 },
  { name: 'Andhra Pradesh', code: 'AP', x: 3, y: 6 },
  { name: 'Karnataka',      code: 'KA', x: 1, y: 7 },
  { name: 'Tamil Nadu',     code: 'TN', x: 3, y: 7 },
  { name: 'Puducherry',     code: 'PY', x: 4, y: 7 },
  { name: 'Kerala',         code: 'KL', x: 1, y: 8 },
  { name: 'Andaman & Nicobar', code: 'AN', x: 6, y: 7 },
];
