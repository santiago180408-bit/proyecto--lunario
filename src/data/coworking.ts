export const rooms = [
  { id: "room-01", name: "Cuarto 1", capacity: 4 },
  { id: "room-02", name: "Cuarto 2", capacity: 4 },
  { id: "room-03", name: "Cuarto 3", capacity: 4 },
  { id: "room-04", name: "Cuarto 4", capacity: 10 },
] as const;
export const periods = [
  { id: "hour", name: "Hora" },
  { id: "day", name: "Día" },
  { id: "week", name: "Semana" },
  { id: "month", name: "Mes" },
] as const;
export type Period = (typeof periods)[number]["id"];
export const rates = [
  {
    id: "premium",
    name: "Premium",
    prices: { hour: 70, day: 280, week: 1120, month: 2580 },
    includes:
      "Bebidas ilimitadas: capuchino/latte, sodas italianas, lattes saborizados indicados, té, americano o agua.",
    minHours: null,
    perPersonHourlyTiers: null,
    roomRestrictions: null,
  },
  {
    id: "basic",
    name: "Básica",
    prices: { hour: 50, day: 219, week: 860, month: 1900 },
    includes: "Incluye una bebida entre las opciones publicadas.",
    minHours: null,
    perPersonHourlyTiers: null,
    roomRestrictions: null,
  },
  {
    id: "light",
    name: "Light",
    prices: { hour: 30, day: 160, week: 700, month: 1800 },
    includes: "Solo renta del espacio.",
    minHours: 3,
    perPersonHourlyTiers: [
      { people: "1–4", price: 30 },
      { people: "5–10", price: 27 },
      { people: "11–16", price: 25 },
    ],
    roomRestrictions: null,
  },
] as const;
