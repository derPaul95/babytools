const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const GEO_REVERSE_API_BASE = "https://geocoding-api.open-meteo.com/v1/reverse";
const FALLBACK_PLACES = [
  { name: "Berlin", country: "Deutschland", latitude: 52.52, longitude: 13.405 },
  { name: "Hamburg", country: "Deutschland", latitude: 53.5511, longitude: 9.9937 },
  { name: "Muenchen", country: "Deutschland", latitude: 48.1371, longitude: 11.5754 },
  { name: "Koeln", country: "Deutschland", latitude: 50.9375, longitude: 6.9603 },
  { name: "Frankfurt am Main", country: "Deutschland", latitude: 50.1109, longitude: 8.6821 },
  { name: "Offenbach am Main", country: "Deutschland", latitude: 50.0956, longitude: 8.7761 },
  { name: "Hanau", country: "Deutschland", latitude: 50.1264, longitude: 8.9283 },
  { name: "Stuttgart", country: "Deutschland", latitude: 48.7758, longitude: 9.1829 },
  { name: "Duesseldorf", country: "Deutschland", latitude: 51.2277, longitude: 6.7735 },
  { name: "Dortmund", country: "Deutschland", latitude: 51.5136, longitude: 7.4653 },
  { name: "Essen", country: "Deutschland", latitude: 51.4556, longitude: 7.0116 },
  { name: "Leipzig", country: "Deutschland", latitude: 51.3397, longitude: 12.3731 },
  { name: "Bremen", country: "Deutschland", latitude: 53.0793, longitude: 8.8017 },
  { name: "Dresden", country: "Deutschland", latitude: 51.0504, longitude: 13.7373 },
  { name: "Hannover", country: "Deutschland", latitude: 52.3759, longitude: 9.732 },
  { name: "Nuernberg", country: "Deutschland", latitude: 49.4521, longitude: 11.0767 },
  { name: "Mannheim", country: "Deutschland", latitude: 49.4875, longitude: 8.466 },
  { name: "Freiburg im Breisgau", country: "Deutschland", latitude: 47.999, longitude: 7.8421 },
  { name: "Saarbruecken", country: "Deutschland", latitude: 49.2402, longitude: 6.9969 },
  { name: "Wien", country: "Oesterreich", latitude: 48.2082, longitude: 16.3738 },
  { name: "Zuerich", country: "Schweiz", latitude: 47.3769, longitude: 8.5417 },
];

const el = {
  geoBtn: document.getElementById("geoBtn"),
  searchBtn: document.getElementById("searchBtn"),
  locationQuery: document.getElementById("locationQuery"),
  resultsLabel: document.getElementById("resultsLabel"),
  locationResults: document.getElementById("locationResults"),
  status: document.getElementById("status"),
  form: document.getElementById("weatherForm"),
  recommendBtn: document.getElementById("recommendBtn"),
  tempValue: document.getElementById("tempValue"),
  windValue: document.getElementById("windValue"),
  rainValue: document.getElementById("rainValue"),
  conditionSymbol: document.getElementById("conditionSymbol"),
  conditionValue: document.getElementById("conditionValue"),
  age: document.getElementById("age"),
  situation: document.getElementById("situation"),
  choiceButtons: document.querySelectorAll(".choice-btn"),
  empty: document.getElementById("emptyState"),
  result: document.getElementById("result"),
  outTemp: document.getElementById("outTemp"),
  outFeels: document.getElementById("outFeels"),
  topRecommendation: document.getElementById("topRecommendation"),
  riskIcon: document.getElementById("riskIcon"),
  riskBadge: document.getElementById("riskBadge"),
  outfitList: document.getElementById("outfitList"),
  tipsList: document.getElementById("tipsList"),
};

let locationResultsCache = [];
let weatherDataReady = false;
let weatherData = null;

function setStatus(message, isError = false) {
  el.status.textContent = message;
  el.status.style.color = isError ? "#b91c1c" : "";
}

function toNumber(input) {
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

function setWeatherReadyState(isReady) {
  weatherDataReady = isReady;
  el.recommendBtn.disabled = !isReady;
}

function formatLocationName(item) {
  if (item?.label) return item.label;
  const parts = [item.name, item.admin1, item.country].filter(Boolean);
  return parts.join(", ") || "Unbekannter Ort";
}

function formatCoordinates(lat, lon) {
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function findNearestFallbackPlace(lat, lon) {
  let nearest = null;
  let minDistance = Infinity;

  FALLBACK_PLACES.forEach((place) => {
    const km = distanceKm(lat, lon, place.latitude, place.longitude);
    if (km < minDistance) {
      minDistance = km;
      nearest = place;
    }
  });

  if (!nearest) return null;
  return {
    ...nearest,
    label: `${nearest.name}, ${nearest.country}`,
    distanceKm: minDistance,
  };
}

function describeWeatherCode(code) {
  const c = Number(code);

  if (c === 0) return { label: "Sonnig/Klar", symbol: "☀️", type: "sunny" };
  if (c === 1 || c === 2) return { label: "Leicht bewoelkt", symbol: "⛅", type: "cloudy" };
  if (c === 3) return { label: "Bedeckt", symbol: "☁️", type: "cloudy" };
  if (c === 45 || c === 48) return { label: "Nebel", symbol: "🌫️", type: "fog" };
  if (
    c === 51 ||
    c === 53 ||
    c === 55 ||
    c === 56 ||
    c === 57 ||
    c === 61 ||
    c === 63 ||
    c === 65 ||
    c === 66 ||
    c === 67 ||
    c === 80 ||
    c === 81 ||
    c === 82 ||
    c === 95 ||
    c === 96 ||
    c === 99
  ) {
    return { label: "Regen/Schauer", symbol: "🌧️", type: "rain" };
  }
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) {
    return { label: "Schnee", symbol: "❄️", type: "snow" };
  }

  return { label: "Wetter gemischt", symbol: "🌤️", type: "mixed" };
}

// Sehr einfache Approximation: Wind kuehlt, Regen ebenfalls leicht.
function calculateFeelsLike(temp, wind, rain) {
  const windPenalty = Math.min(wind * 0.07, 7);
  const rainPenalty = rain > 0 ? Math.min(rain * 0.6, 3) : 0;
  return temp - windPenalty - rainPenalty;
}

function determineRisk(feelsLike) {
  if (feelsLike < 5) return { key: "cold", label: "Kaelte" };
  if (feelsLike > 27) return { key: "hot", label: "Hitze" };
  return { key: "normal", label: "Normal" };
}

function getNewbornSituationOffset(situation) {
  if (situation === "stroller") return -2.0;
  if (situation === "carrier") return 1.5;
  return 0;
}

function getBabySituationOffset(situation) {
  if (situation === "stroller") return -1.2;
  if (situation === "carrier") return 0.8;
  return 0;
}

function getToddlerSituationOffset(situation) {
  if (situation === "stroller") return -0.8;
  if (situation === "carrier") return 0.3;
  return 0.5;
}

function getNewbornLayerProfile(baseFeelsLike, situation) {
  const newbornIndex = baseFeelsLike + getNewbornSituationOffset(situation);

  if (newbornIndex < -5) {
    return [
      "Langarm-Body (hautnah)",
      "Warmer Midlayer (Wolle/Fleece)",
      "Sehr warme Aussenschicht (Winteroverall)",
      "Muetze, Halstuch, Handschuhe, sehr warme Socken",
    ];
  }

  if (newbornIndex < 3) {
    return [
      "Langarm-Body (hautnah)",
      "Warmer Midlayer (Wolle/Fleece)",
      "Warme Jacke oder Overall",
      "Muetze und warme Socken",
    ];
  }

  if (newbornIndex < 10) {
    return [
      "Langarm-Body",
      "Pullover oder Strickjacke",
      "Winddichte Jacke",
      "Lange Hose und Muetze",
    ];
  }

  if (newbornIndex < 18) {
    return [
      "Body",
      "Leichter Midlayer (Cardigan/Hoodie)",
      "Leichte Jacke oder winddichte Schicht",
    ];
  }

  if (newbornIndex < 24) {
    return [
      "Kurz- oder Langarm-Body (je nach Wind)",
      "Leichte Hose",
      "Optional duenne Schicht zum schnellen Anpassen",
    ];
  }

  return [
    "Sehr leichte, luftige Kleidung",
    "Sonnenschutz (Hut, Schatten, luftige Decke als Schattenspender)",
  ];
}

function getBabyLayerProfile(baseFeelsLike, situation) {
  const babyIndex = baseFeelsLike + getBabySituationOffset(situation);

  if (babyIndex < -3) {
    return [
      "Langarm-Body",
      "Warmer Midlayer (Fleece/Strick)",
      "Warme Aussenschicht (Jacke/Overall)",
      "Muetze und warme Socken",
    ];
  }

  if (babyIndex < 6) {
    return [
      "Langarm-Body",
      "Pullover oder Strickjacke",
      "Winddichte Jacke",
      "Lange Hose",
    ];
  }

  if (babyIndex < 14) {
    return [
      "Body",
      "Leichter Midlayer (Cardigan/Hoodie)",
      "Leichte Jacke bei Wind",
      "Lange Hose",
    ];
  }

  if (babyIndex < 22) {
    return [
      "Kurz- oder Langarm-Body",
      "Leichte Hose",
      "Optional duenne Zusatzschicht fuer Pausen",
    ];
  }

  return [
    "Sehr leichte, luftige Kleidung",
    "Sonnenhut und Schatten einplanen",
  ];
}

function getToddlerLayerProfile(baseFeelsLike, situation) {
  const toddlerIndex = baseFeelsLike + getToddlerSituationOffset(situation);

  if (toddlerIndex < -2) {
    return [
      "Langarm-Shirt oder Body",
      "Warmer Midlayer",
      "Warme Jacke",
      "Muetze und warme Socken",
    ];
  }

  if (toddlerIndex < 8) {
    return [
      "Langarm-Shirt",
      "Pulli/Strickjacke",
      "Winddichte Jacke",
      "Lange Hose",
    ];
  }

  if (toddlerIndex < 16) {
    return [
      "Shirt oder Body",
      "Leichter Layer (Hoodie/Cardigan)",
      "Lange Hose",
    ];
  }

  if (toddlerIndex < 24) {
    return [
      "Duennes Shirt",
      "Leichte Hose oder duenne Leggings",
      "Leichte Jacke nur bei Wind",
    ];
  }

  return [
    "Luftige Kleidung",
    "Sonnenhut, Schatten und Trinkpausen",
  ];
}

function getOutfitByAge(age, feelsLike, situation) {
  if (age === "newborn") return getNewbornLayerProfile(feelsLike, situation);
  if (age === "baby") return getBabyLayerProfile(feelsLike, situation);
  return getToddlerLayerProfile(feelsLike, situation);
}

function getTips(risk, rain, wind, conditionType) {
  const tips = [
    "Nacken- und Brust-Check: warm, aber nicht schwitzig.",
    "Mehrere duenne Schichten sind besser als eine dicke.",
    "Ueberhitzung vermeiden, besonders im Kinderwagen mit Decke.",
  ];

  if (rain > 0) {
    tips.push("Regenschutz fuer Kinderwagen/Buggy und trockene Ersatzkleidung einplanen.");
  }

  if (wind >= 20) {
    tips.push("Bei starkem Wind zusaetzlich winddichte Aussenschicht nutzen.");
  }

  if (risk.key === "cold") {
    tips.push("Bei kaelteren Bedingungen Haende, Fuesse und Kopf besonders gut schuetzen.");
  }

  if (risk.key === "hot") {
    tips.push("Bei Hitze direkte Sonne meiden und auf regelmaessige Trinkpausen achten.");
  }

  if (conditionType === "sunny") {
    tips.push("Bei Sonne Schatten suchen und Kopfschutz einplanen.");
  }

  if (conditionType === "fog") {
    tips.push("Bei Nebel Sichtbarkeit erhoehen und Wege mit Verkehr meiden.");
  }

  if (conditionType === "snow") {
    tips.push("Bei Schnee auf trockene, warme Aussenschicht und Fusswaerme achten.");
  }

  return tips;
}

function renderLayerItems(items) {
  el.outfitList.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "layer-item";

    const step = document.createElement("span");
    step.className = "layer-step";
    step.textContent = String(index + 1);

    const text = document.createElement("p");
    text.className = "layer-text";
    text.textContent = item;

    li.appendChild(step);
    li.appendChild(text);
    el.outfitList.appendChild(li);
  });
}

function renderTipChips(items) {
  el.tipsList.innerHTML = "";
  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "tip-chip";
    chip.textContent = item;
    el.tipsList.appendChild(chip);
  });
}

function getRiskVisual(riskKey) {
  if (riskKey === "cold") return "🥶";
  if (riskKey === "hot") return "🌤️";
  return "✅";
}

function addSituationOutfitItems(outfit, situation, age, feelsLike, wind, rain) {
  if (situation === "stroller") {
    outfit.push("Kinderwagen-Windschutz/Abdeckung bereithalten.");
    if (feelsLike < 14) {
      outfit.push("Kinderwagen-Decke oder Fusssack als Zusatzwaerme einplanen.");
    }
    if (rain > 0) {
      outfit.push("Regenschutz fuer den Kinderwagen mitnehmen.");
    }
    return;
  }

  if (situation === "carrier") {
    outfit.push("In der Trage lieber duenn schichten und dicke Overalls vermeiden.");
    outfit.push("Nacken und Atembereich in der Trage frei halten.");
    if (age === "newborn" || feelsLike < 10) {
      outfit.push("Fuesse und Beine in der Trage zusaetzlich warm halten.");
    }
    return;
  }

  // Normal draussen (aktiv)
  if (wind >= 15) {
    outfit.push("Leichte winddichte Schicht fuer aktive Abschnitte bereithalten.");
  }
}

function getOutfitDedupKey(item) {
  const text = item.toLowerCase();
  if (text.includes("regenschutz")) return "regenschutz";
  if (text.includes("windschutz") || text.includes("winddichte")) return "windschutz";
  if (text.includes("body")) return "body";
  if (text.includes("midlayer") || text.includes("strickjacke") || text.includes("pullover") || text.includes("hoodie")) return "midlayer";
  if (text.includes("jacke") || text.includes("overall") || text.includes("aussenschicht")) return "outer";
  if (text.includes("muetze") || text.includes("kopfschutz") || text.includes("sonnenhut")) return "head";
  if (text.includes("socken") || text.includes("fuesse") || text.includes("beine")) return "feet";
  if (text.includes("extraschicht") || text.includes("zusatzschicht")) return "extra-layer";

  return text.replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeOutfitItems(items) {
  const result = [];
  const seen = new Set();

  items.forEach((item) => {
    const key = getOutfitDedupKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });

  return result;
}

function getRecommendationAdjustment(feelsLike, wind, rain) {
  let adjustment = 0;

  if (wind >= 20) adjustment += 2.0;
  else if (wind >= 12) adjustment += 1.0;

  if (rain > 0.6) adjustment += 2.0;
  else if (rain > 0) adjustment += 1.0;

  // Bei milden, trockenen Bedingungen etwas sanfter einstufen.
  if (rain === 0 && wind < 10 && feelsLike >= 17 && feelsLike <= 23) {
    adjustment -= 0.8;
  }

  return adjustment;
}

function applySafetyLayerRules(outfit, feelsLike, wind, rain) {
  const normalized = outfit.map((item) => item.toLowerCase());
  const hasBody = normalized.some((item) => item.includes("body"));
  const hasMidlayer = normalized.some(
    (item) =>
      item.includes("midlayer") ||
      item.includes("strickjacke") ||
      item.includes("pullover") ||
      item.includes("hoodie")
  );
  const hasOuter = normalized.some(
    (item) =>
      item.includes("jacke") ||
      item.includes("overall") ||
      item.includes("aussenschicht") ||
      item.includes("winddicht")
  );

  if (feelsLike < 12) {
    if (!hasBody) {
      outfit.unshift("Body als Basis-Schicht.");
    }
    if (!hasMidlayer) {
      outfit.push("Zusaetzlicher Midlayer (z. B. Strickjacke/Fleece) einplanen.");
    }
    if (!hasOuter) {
      outfit.push("Wind- und wetterfeste Aussenschicht (Jacke/Overall) anziehen.");
    }
  }

  if (rain > 0 || wind >= 15) {
    outfit.push("Bei Regen/Wind eine zusaetzliche Schicht einplanen.");
  }
}

function renderRecommendation({ temp, wind, rain, age, situation }) {
  const feelsLike = calculateFeelsLike(temp, wind, rain);
  const recommendationAdjustment = getRecommendationAdjustment(feelsLike, wind, rain);
  const recommendationIndex = feelsLike - recommendationAdjustment;
  const risk = determineRisk(feelsLike);
  const outfit = getOutfitByAge(age, recommendationIndex, situation);
  const weatherInfo = describeWeatherCode(weatherData?.weatherCode);
  const tips = getTips(risk, rain, wind, weatherInfo.type);

  addSituationOutfitItems(outfit, situation, age, recommendationIndex, wind, rain);
  applySafetyLayerRules(outfit, recommendationIndex, wind, rain);

  if (recommendationAdjustment >= 1.5) {
    tips.push("Wind/Naesse beruecksichtigt: Empfehlung faellt bewusst etwas waermer aus.");
  }

  if (age === "newborn") {
    if (situation === "stroller") {
      tips.push("Neugeboren im Kinderwagen: Temperatur haeufiger pruefen (Nacken-Check).");
    } else if (situation === "carrier") {
      tips.push("Neugeboren in der Trage: Hitzestau zwischen Koerpern vermeiden.");
    }
  } else if (age === "baby" && situation === "carrier") {
    tips.push("Bei Babys in der Trage auf Waermestau achten und Schichten flexibel halten.");
  } else if (age === "toddler" && situation === "active") {
    tips.push("Aktive Kleinkinder waermen schnell auf: Schichten unterwegs leicht reduzierbar halten.");
  }

  if (rain > 0) {
    outfit.push("Regenschutz (z. B. Regenhaube/Abdeckung) mitnehmen.");
  }

  outfit.push("Optional zusaetzlich: eine duenne Extraschicht (z. B. Cardigan/Weste) mitnehmen.");

  const cleanedOutfit = dedupeOutfitItems(outfit);

  el.outTemp.textContent = temp.toFixed(1);
  el.outFeels.textContent = feelsLike.toFixed(1);
  el.topRecommendation.textContent = `Heute: ${cleanedOutfit.length} Layer empfohlen, angepasst auf Wetter und Situation.`;
  el.riskIcon.textContent = getRiskVisual(risk.key);
  el.riskBadge.textContent = risk.label;
  el.riskBadge.className = `badge ${risk.key}`;

  renderLayerItems(cleanedOutfit);
  renderTipChips(tips);

  el.empty.classList.add("hidden");
  el.result.classList.remove("hidden");
}

function readFormValues() {
  if (!weatherDataReady) {
    throw new Error("Bitte zuerst Standort freigeben oder einen Ort suchen.");
  }

  const temp = weatherData?.temp ?? null;
  const wind = weatherData?.wind ?? null;
  const rain = weatherData?.rain ?? null;
  const age = el.age.value;
  const situation = el.situation.value;

  if (temp === null || wind === null || rain === null) {
    throw new Error("Wetterdaten sind unvollstaendig. Bitte erneut laden.");
  }

  if (rain < 0 || wind < 0) {
    throw new Error("Wind und Regen duerfen nicht negativ sein.");
  }

  return { temp, wind, rain, age, situation };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,wind_speed_10m,precipitation,weather_code",
    wind_speed_unit: "kmh",
    timezone: "Europe/Berlin",
  });

  const url = `${API_BASE}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo Fehler: HTTP ${response.status}`);
  }

  const data = await response.json();
  const current = data?.current;

  if (!current) {
    throw new Error("Open-Meteo Antwort unvollstaendig.");
  }

  const temp = toNumber(current.temperature_2m);
  const wind = toNumber(current.wind_speed_10m);
  const rain = toNumber(current.precipitation);
  const weatherCode = toNumber(current.weather_code);

  if (temp === null || wind === null || rain === null || weatherCode === null) {
    throw new Error("Wetterdaten konnten nicht gelesen werden.");
  }

  return { temp, wind, rain, weatherCode };
}

async function fetchLocations(query) {
  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "de",
    format: "json",
  });

  const url = `${GEO_API_BASE}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ortsuche Fehler: HTTP ${response.status}`);
  }

  const data = await response.json();
  const results = data?.results;

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Kein passender Ort gefunden.");
  }

  return results;
}

async function fetchReverseLocation(lat, lon) {
  const attempts = [
    { latitude: String(lat), longitude: String(lon), count: "5", language: "de", format: "json" },
    { latitude: String(lat), longitude: String(lon), count: "5", format: "json" },
    { latitude: lat.toFixed(3), longitude: lon.toFixed(3), count: "5", format: "json" },
  ];

  for (const paramsObj of attempts) {
    const params = new URLSearchParams(paramsObj);
    const url = `${GEO_REVERSE_API_BASE}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) continue;

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const named = results.find((item) => Boolean(item?.name));
    if (named) return named;
  }

  throw new Error("Ort fuer Standort konnte nicht ermittelt werden.");
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation wird von diesem Browser nicht unterstuetzt."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });
}

function applyWeatherToForm(weather) {
  const weatherInfo = describeWeatherCode(weather.weatherCode);

  weatherData = {
    temp: weather.temp,
    wind: weather.wind,
    rain: weather.rain,
    weatherCode: weather.weatherCode,
  };
  el.tempValue.textContent = `${weather.temp.toFixed(1)} °C`;
  el.windValue.textContent = `${weather.wind.toFixed(1)} km/h`;
  el.rainValue.textContent = `${weather.rain.toFixed(1)} mm/h`;
  el.conditionSymbol.textContent = weatherInfo.symbol;
  el.conditionValue.textContent = weatherInfo.label;
  setWeatherReadyState(true);
}

function renderLocationResults(results) {
  locationResultsCache = results;
  el.locationResults.innerHTML = "";

  results.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `result-btn${index === 0 ? " is-active" : ""}`;
    button.dataset.index = String(index);
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.textContent = formatLocationName(item);
    el.locationResults.appendChild(button);
  });

  el.resultsLabel.classList.remove("hidden");
}

function setActiveLocationResult(index) {
  const buttons = el.locationResults.querySelectorAll(".result-btn");
  buttons.forEach((button) => {
    const isActive = Number(button.dataset.index) === index;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

async function loadWeatherForLocation(location, sourceText) {
  const lat = toNumber(location.latitude);
  const lon = toNumber(location.longitude);

  if (lat === null || lon === null) {
    throw new Error("Ungueltige Koordinaten fuer den Ort.");
  }

  setStatus("Wetter wird geladen...");
  const weather = await fetchWeather(lat, lon);
  applyWeatherToForm(weather);
  setStatus(`Wetterdaten uebernommen (${sourceText}).`);
}

async function handleGeoClick() {
  setStatus("Standort wird abgefragt...");
  el.geoBtn.disabled = true;

  try {
    const pos = await getCurrentPosition();
    const { latitude, longitude } = pos.coords;
    let currentLocation = {
      latitude,
      longitude,
      label: `Aktueller Standort (${formatCoordinates(latitude, longitude)})`,
    };

    try {
      const reverse = await fetchReverseLocation(latitude, longitude);
      const reverseName = formatLocationName(reverse);
      currentLocation = {
        ...reverse,
        latitude,
        longitude,
        label: reverseName,
      };
    } catch (_error) {
      const nearest = findNearestFallbackPlace(latitude, longitude);
      if (nearest) {
        currentLocation = {
          ...nearest,
          latitude,
          longitude,
          label: `Naechster Ort: ${nearest.label}`,
        };
      }
    }

    renderLocationResults([currentLocation]);
    await loadWeatherForLocation(currentLocation, formatLocationName(currentLocation));
  } catch (error) {
    setStatus(
      `Standort/Wetter nicht verfuegbar: ${error.message}. Nutze die Ortssuche oder versuche es erneut.`,
      true
    );
  } finally {
    el.geoBtn.disabled = false;
  }
}

async function handleLocationSearch() {
  const query = el.locationQuery.value.trim();

  if (query.length < 2) {
    setStatus("Bitte mindestens 2 Zeichen fuer die Ortssuche eingeben.", true);
    return;
  }

  setStatus("Orte werden gesucht...");
  el.searchBtn.disabled = true;

  try {
    const results = await fetchLocations(query);
    renderLocationResults(results);
    const firstLocation = results[0];
    await loadWeatherForLocation(firstLocation, formatLocationName(firstLocation));
  } catch (error) {
    setStatus(`Ortsuche fehlgeschlagen: ${error.message}`, true);
    el.resultsLabel.classList.add("hidden");
    locationResultsCache = [];
  } finally {
    el.searchBtn.disabled = false;
  }
}

async function handleLocationPick(selectedIndex) {
  const item = locationResultsCache[selectedIndex];

  if (!item) {
    setStatus("Ausgewaehlter Ort konnte nicht gelesen werden.", true);
    return;
  }

  try {
    setActiveLocationResult(selectedIndex);
    await loadWeatherForLocation(item, formatLocationName(item));
  } catch (error) {
    setStatus(`Wetterabruf fehlgeschlagen: ${error.message}`, true);
  }
}

function handleChoicePick(event) {
  const button = event.target.closest(".choice-btn");
  if (!button) return;

  const target = button.dataset.target;
  const value = button.dataset.value;
  const hiddenInput = document.getElementById(target);
  if (!hiddenInput) return;

  hiddenInput.value = value;

  el.choiceButtons.forEach((item) => {
    if (item.dataset.target !== target) return;
    const isActive = item === button;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function handleLocationResultsClick(event) {
  const button = event.target.closest(".result-btn");
  if (!button) return;
  const selectedIndex = Number(button.dataset.index);
  if (!Number.isFinite(selectedIndex)) return;
  handleLocationPick(selectedIndex);
}

function handleFormSubmit(event) {
  event.preventDefault();

  try {
    const values = readFormValues();
    renderRecommendation(values);
    setStatus("Empfehlung aktualisiert.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

setWeatherReadyState(false);
setStatus("Bitte Standort verwenden oder einen Ort suchen, um Wetterdaten zu laden.");

el.geoBtn.addEventListener("click", handleGeoClick);
el.searchBtn.addEventListener("click", handleLocationSearch);
el.form.addEventListener("click", handleChoicePick);
el.locationResults.addEventListener("click", handleLocationResultsClick);
el.form.addEventListener("submit", handleFormSubmit);
