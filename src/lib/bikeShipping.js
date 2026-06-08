/*
 * Bike shipping cost calculator helpers.
 * Pricing is indicative only — a final quote is locked in via a support
 * ticket so the ops team can confirm carrier availability.
 *
 * Originally built for trylinqr; ported here so Angels & Roadsters riders can
 * quote bike transport for events like Trailstorm without leaving the site.
 */

// Major Indian cities — straight-line coords, used with a road-factor multiplier
export const SHIPPING_CITIES = [
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', lat: 28.5355, lng: 77.391 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Goa', lat: 15.2993, lng: 74.124 },
  { name: 'Manali', lat: 32.2396, lng: 77.1887 },
  { name: 'Shimla', lat: 31.1048, lng: 77.1734 },
  { name: 'Leh', lat: 34.1526, lng: 77.5771 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { name: 'Jaisalmer', lat: 26.9157, lng: 70.9083 },
  { name: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
];

export const BIKE_CATEGORIES = [
  { value: 'standard',  label: 'Standard / Commuter', weight: 130, description: 'Up to 150cc city commuters' },
  { value: 'sport',     label: 'Sport',                weight: 195, description: '200–600cc sport / naked bikes' },
  { value: 'cruiser',   label: 'Cruiser',              weight: 235, description: 'Royal Enfield, Harley, Indian' },
  { value: 'adventure', label: 'Adventure / Touring',  weight: 225, description: 'KTM Adv, Tiger, Himalayan, GS' },
  { value: 'super',     label: 'Super-bike',           weight: 215, description: '750cc+ superbikes — premium handling' },
  { value: 'electric',  label: 'Electric',             weight: 120, description: 'EV scooters & bikes (battery safe pack)' },
];

function toRad(d) { return (d * Math.PI) / 180; }

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const ROAD_FACTOR = 1.32;
const BASE_FEE = 499;
const PER_KM = 14;
const GST = 0.18;
const EXPRESS_SURCHARGE = 0.35;
const INSURANCE_RATE = 0.015;
const INSURANCE_MIN = 199;

function weightSurchargePct(weight) {
  if (weight > 250) return 0.28;
  if (weight > 200) return 0.18;
  if (weight > 150) return 0.1;
  return 0;
}

export function calcShipping({
  fromCity,
  toCity,
  weight = 130,
  declaredValue = 0,
  express = false,
  insurance = false,
}) {
  const from = SHIPPING_CITIES.find((c) => c.name === fromCity);
  const to = SHIPPING_CITIES.find((c) => c.name === toCity);
  if (!from || !to) return null;
  if (from.name === to.name) {
    return { sameCity: true, distance: 0, total: 0 };
  }

  const straight = haversineKm(from, to);
  const distance = Math.round(straight * ROAD_FACTOR);

  const base = BASE_FEE;
  const distanceCharge = Math.round(distance * PER_KM);
  const core = base + distanceCharge;

  const surchargePct = weightSurchargePct(weight);
  const weightSurcharge = Math.round(core * surchargePct);

  const expressSurcharge = express
    ? Math.round((core + weightSurcharge) * EXPRESS_SURCHARGE)
    : 0;

  const insuranceFee = insurance
    ? Math.max(INSURANCE_MIN, Math.round((declaredValue || 0) * INSURANCE_RATE))
    : 0;

  const subtotal = core + weightSurcharge + expressSurcharge + insuranceFee;
  const gst = Math.round(subtotal * GST);
  const total = subtotal + gst;

  // ETA: ~600km/day with a base 2-day pickup/handover window
  const transitDays = Math.max(2, Math.ceil(distance / 600) + 1);
  const expressDays = Math.max(1, Math.ceil(transitDays * 0.65));

  return {
    sameCity: false,
    distance,
    base,
    distanceCharge,
    weightSurcharge,
    surchargePct,
    expressSurcharge,
    insuranceFee,
    subtotal,
    gst,
    total,
    transitDays,
    expressDays,
  };
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
