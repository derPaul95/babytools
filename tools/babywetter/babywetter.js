(function () {
const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const GEO_REVERSE_API_BASE = "https://geocoding-api.open-meteo.com/v1/reverse";
const DAY_WINDOWS = [
  { key: "morning", label: "Morgens", startHour: 7, endHour: 9 },
  { key: "midday", label: "Mittags", startHour: 12, endHour: 14 },
  { key: "evening", label: "Abends", startHour: 18, endHour: 20 },
];
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
  dayRangeValue: document.getElementById("dayRangeValue"),
  dayWindValue: document.getElementById("dayWindValue"),
  dayRainValue: document.getElementById("dayRainValue"),
  dayConditionValue: document.getElementById("dayConditionValue"),
  conditionSymbol: document.getElementById("conditionSymbol"),
  conditionValue: document.getElementById("conditionValue"),
  age: document.getElementById("age"),
  situation: document.getElementById("situation"),
  mode: document.getElementById("mode"),
  choiceButtons: document.querySelectorAll(".choice-btn"),
  empty: document.getElementById("emptyState"),
  modeSwitch: document.getElementById("modeSwitch"),
  nowResult: document.getElementById("result"),
  dayResult: document.getElementById("dayResult"),
  outTemp: document.getElementById("outTemp"),
  outFeels: document.getElementById("outFeels"),
  topRecommendation: document.getElementById("topRecommendation"),
  riskIcon: document.getElementById("riskIcon"),
  riskBadge: document.getElementById("riskBadge"),
  outfitList: document.getElementById("outfitList"),
  tipsList: document.getElementById("tipsList"),
  carryList: document.getElementById("carryList"),
  dayCards: document.getElementById("dayCards"),
};

let locationResultsCache = [];
let weatherDataReady = false;
let hourlyDataReady = false;
let weatherData = null;
let dayWindowData = [];
let dayOverview = null;

function trackEvent(name, props) {
  if (typeof window.babytoolsTrack !== "function") return;
  window.babytoolsTrack(name, props || {});
}

function setStatus(message, isError) {
  el.status.textContent = message;
  el.status.style.color = isError ? "#b91c1c" : "";
}

function toNumber(input) {
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((acc, item) => acc + item, 0) / values.length;
}

function getMode() {
  return el.mode ? el.mode.value : "now";
}

function updateRecommendState() {
  const mode = getMode();
  if (mode === "day") {
    el.recommendBtn.disabled = !(weatherDataReady && hourlyDataReady);
    return;
  }
  el.recommendBtn.disabled = !weatherDataReady;
}

function renderDayRange() {
  if (!el.dayRangeValue || !el.dayWindValue || !el.dayRainValue || !el.dayConditionValue) return;
  if (!dayOverview) {
    el.dayRangeValue.textContent = "Tag: -- bis -- °C";
    el.dayWindValue.textContent = "Tag: -- bis -- km/h";
    el.dayRainValue.textContent = "Tag: -- bis -- mm/h";
    el.dayConditionValue.textContent = "Tag: --";
    return;
  }
  el.dayRangeValue.textContent =
    "Tag: " + dayOverview.tempMin.toFixed(1) + " bis " + dayOverview.tempMax.toFixed(1) + " °C";
  el.dayWindValue.textContent =
    "Tag: " + dayOverview.windMin.toFixed(1) + " bis " + dayOverview.windMax.toFixed(1) + " km/h";
  el.dayRainValue.textContent =
    "Tag: " + dayOverview.rainMin.toFixed(1) + " bis " + dayOverview.rainMax.toFixed(1) + " mm/h";
  el.dayConditionValue.textContent = "Tag: " + dayOverview.conditionText;
}

function setWeatherReadyState(isReady) {
  weatherDataReady = isReady;
  updateRecommendState();
}

function setHourlyReadyState(isReady) {
  hourlyDataReady = isReady;
  updateRecommendState();
}

function setMode(modeValue, source) {
  if (!el.mode) return;
  const allowed = modeValue === "day" ? "day" : "now";
  const previous = el.mode.value;
  el.mode.value = allowed;

  el.choiceButtons.forEach((item) => {
    if (item.dataset.target !== "mode") return;
    const isActive = item.dataset.value === allowed;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  updateRecommendState();
  if (source === "user" && previous !== allowed) {
    trackEvent("babywetter_mode_change", { mode: allowed });
  }
}

function showResult(mode) {
  el.empty.classList.add("hidden");
  if (mode === "day") {
    el.dayResult.classList.remove("hidden");
    el.nowResult.classList.add("hidden");
    return;
  }
  el.nowResult.classList.remove("hidden");
  el.dayResult.classList.add("hidden");
}

function formatLocationName(item) {
  if (item && item.label) return item.label;
  const parts = [item.name, item.admin1, item.country].filter(Boolean);
  return parts.join(", ") || "Unbekannter Ort";
}

function formatCoordinates(lat, lon) {
  return lat.toFixed(2) + ", " + lon.toFixed(2);
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
    name: nearest.name,
    country: nearest.country,
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    label: nearest.name + ", " + nearest.country,
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
    c === 51 || c === 53 || c === 55 || c === 56 || c === 57 ||
    c === 61 || c === 63 || c === 65 || c === 66 || c === 67 ||
    c === 80 || c === 81 || c === 82 || c === 95 || c === 96 || c === 99
  ) {
    return { label: "Regen/Schauer", symbol: "🌧️", type: "rain" };
  }
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) {
    return { label: "Schnee", symbol: "❄️", type: "snow" };
  }

  return { label: "Wetter gemischt", symbol: "🌤️", type: "mixed" };
}

function shouldPackRainGear(rainMm, rainProb) {
  return rainMm >= 0.2 || rainProb >= 40 || rainMm > 0;
}

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

function getTips(risk, rain, wind, conditionType, rainProb) {
  const tips = [
    "Nacken- und Brust-Check: warm, aber nicht schwitzig.",
    "Mehrere duenne Schichten sind besser als eine dicke.",
    "Ueberhitzung vermeiden, besonders im Kinderwagen mit Decke.",
  ];

  if (shouldPackRainGear(rain, rainProb)) {
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

function renderLayerItems(target, items) {
  target.innerHTML = "";
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
    target.appendChild(li);
  });
}

function renderTipChips(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "tip-chip";
    chip.textContent = item;
    target.appendChild(chip);
  });
}

function getRiskVisual(riskKey) {
  if (riskKey === "cold") return "🥶";
  if (riskKey === "hot") return "🌤️";
  return "✅";
}

function addSituationOutfitItems(outfit, situation, age, feelsLike, wind, rain, rainProb) {
  if (situation === "stroller") {
    outfit.push("Kinderwagen-Windschutz/Abdeckung bereithalten.");
    if (feelsLike < 14) {
      outfit.push("Kinderwagen-Decke oder Fusssack als Zusatzwaerme einplanen.");
    }
    if (shouldPackRainGear(rain, rainProb)) {
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

  if (wind >= 15) {
    outfit.push("Leichte winddichte Schicht fuer aktive Abschnitte bereithalten.");
  }
}

function getOutfitDedupKey(item) {
  const text = item.toLowerCase();
  if (text.indexOf("regenschutz") !== -1) return "regenschutz";
  if (text.indexOf("windschutz") !== -1 || text.indexOf("winddichte") !== -1) return "windschutz";
  if (text.indexOf("body") !== -1) return "body";
  if (
    text.indexOf("midlayer") !== -1 ||
    text.indexOf("strickjacke") !== -1 ||
    text.indexOf("pullover") !== -1 ||
    text.indexOf("hoodie") !== -1
  ) return "midlayer";
  if (
    text.indexOf("jacke") !== -1 ||
    text.indexOf("overall") !== -1 ||
    text.indexOf("aussenschicht") !== -1
  ) return "outer";
  if (
    text.indexOf("muetze") !== -1 ||
    text.indexOf("kopfschutz") !== -1 ||
    text.indexOf("sonnenhut") !== -1
  ) return "head";
  if (
    text.indexOf("socken") !== -1 ||
    text.indexOf("fuesse") !== -1 ||
    text.indexOf("beine") !== -1
  ) return "feet";

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

function getRecommendationAdjustment(feelsLike, wind, rain, rainProb) {
  let adjustment = 0;

  if (wind >= 20) adjustment += 2.0;
  else if (wind >= 12) adjustment += 1.0;

  if (rain > 0.6) adjustment += 2.0;
  else if (rain > 0 || rainProb >= 40) adjustment += 1.0;

  if (rain === 0 && rainProb < 40 && wind < 10 && feelsLike >= 17 && feelsLike <= 23) {
    adjustment -= 0.8;
  }

  return adjustment;
}

function applySafetyLayerRules(outfit, feelsLike, wind, rain, rainProb) {
  const normalized = outfit.map((item) => item.toLowerCase());
  const hasBody = normalized.some((item) => item.indexOf("body") !== -1);
  const hasMidlayer = normalized.some(
    (item) =>
      item.indexOf("midlayer") !== -1 ||
      item.indexOf("strickjacke") !== -1 ||
      item.indexOf("pullover") !== -1 ||
      item.indexOf("hoodie") !== -1
  );
  const hasOuter = normalized.some(
    (item) =>
      item.indexOf("jacke") !== -1 ||
      item.indexOf("overall") !== -1 ||
      item.indexOf("aussenschicht") !== -1 ||
      item.indexOf("winddicht") !== -1
  );

  if (feelsLike < 12) {
    if (!hasBody) outfit.unshift("Body als Basis-Schicht.");
    if (!hasMidlayer) outfit.push("Zusaetzlicher Midlayer (z. B. Strickjacke/Fleece) einplanen.");
    if (!hasOuter) outfit.push("Wind- und wetterfeste Aussenschicht (Jacke/Overall) anziehen.");
  }

  if (shouldPackRainGear(rain, rainProb) || wind >= 15) {
    outfit.push("Bei Regen/Wind eine zusaetzliche Schicht einplanen.");
  }
}

function buildOutfitPlan(input) {
  const feelsLike = calculateFeelsLike(input.temp, input.wind, input.rain);
  const recommendationAdjustment = getRecommendationAdjustment(feelsLike, input.wind, input.rain, input.rainProb);
  const recommendationIndex = feelsLike - recommendationAdjustment;
  const risk = determineRisk(feelsLike);
  const outfit = getOutfitByAge(input.age, recommendationIndex, input.situation);
  const tips = getTips(risk, input.rain, input.wind, input.conditionType, input.rainProb);

  addSituationOutfitItems(outfit, input.situation, input.age, recommendationIndex, input.wind, input.rain, input.rainProb);
  applySafetyLayerRules(outfit, recommendationIndex, input.wind, input.rain, input.rainProb);

  if (recommendationAdjustment >= 1.5) {
    tips.push("Wind/Naesse beruecksichtigt: Empfehlung faellt bewusst etwas waermer aus.");
  }

  if (input.age === "newborn") {
    if (input.situation === "stroller") {
      tips.push("Neugeboren im Kinderwagen: Temperatur haeufiger pruefen (Nacken-Check).");
    } else if (input.situation === "carrier") {
      tips.push("Neugeboren in der Trage: Hitzestau zwischen Koerpern vermeiden.");
    }
  } else if (input.age === "baby" && input.situation === "carrier") {
    tips.push("Bei Babys in der Trage auf Waermestau achten und Schichten flexibel halten.");
  } else if (input.age === "toddler" && input.situation === "active") {
    tips.push("Aktive Kleinkinder waermen schnell auf: Schichten unterwegs leicht reduzierbar halten.");
  }

  if (shouldPackRainGear(input.rain, input.rainProb)) {
    outfit.push("Regenschutz (z. B. Regenhaube/Abdeckung) mitnehmen.");
  }

  outfit.push("Optional zusaetzlich: eine duenne Extraschicht (z. B. Cardigan/Weste) mitnehmen.");

  return {
    feelsLike: feelsLike,
    risk: risk,
    outfit: dedupeOutfitItems(outfit),
    tips: tips,
  };
}

function readFormValues() {
  if (!weatherDataReady) {
    throw new Error("Bitte zuerst Standort freigeben oder einen Ort suchen.");
  }

  const temp = weatherData ? weatherData.temp : null;
  const wind = weatherData ? weatherData.wind : null;
  const rain = weatherData ? weatherData.rain : null;
  const age = el.age.value;
  const situation = el.situation.value;

  if (temp === null || wind === null || rain === null) {
    throw new Error("Wetterdaten sind unvollstaendig. Bitte erneut laden.");
  }

  return { temp: temp, wind: wind, rain: rain, age: age, situation: situation };
}

function renderNowRecommendation(values) {
  const weatherInfo = describeWeatherCode(weatherData ? weatherData.weatherCode : null);
  const plan = buildOutfitPlan({
    temp: values.temp,
    wind: values.wind,
    rain: values.rain,
    rainProb: values.rain > 0 ? 100 : 0,
    age: values.age,
    situation: values.situation,
    conditionType: weatherInfo.type,
  });

  el.outTemp.textContent = values.temp.toFixed(1);
  el.outFeels.textContent = plan.feelsLike.toFixed(1);
  el.topRecommendation.textContent = "Heute: " + plan.outfit.length + " Layer empfohlen, angepasst auf Wetter und Situation.";
  el.riskIcon.textContent = getRiskVisual(plan.risk.key);
  el.riskBadge.textContent = plan.risk.label;
  el.riskBadge.className = "badge " + plan.risk.key;

  renderLayerItems(el.outfitList, plan.outfit);
  renderTipChips(el.tipsList, plan.tips);
  showResult("now");
}

function getBerlinTodayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((item) => item.type === "year").value;
  const month = parts.find((item) => item.type === "month").value;
  const day = parts.find((item) => item.type === "day").value;
  return year + "-" + month + "-" + day;
}

function buildHourlyPoints(hourly) {
  const points = [];
  for (let i = 0; i < hourly.time.length; i += 1) {
    const temp = toNumber(hourly.temperature_2m[i]);
    const wind = toNumber(hourly.wind_speed_10m[i]);
    const rainProb = toNumber(hourly.precipitation_probability[i]);
    const rain = toNumber(hourly.precipitation[i]);
    const weatherCode = toNumber(hourly.weather_code && hourly.weather_code[i]);
    const timeValue = hourly.time[i];
    if (temp === null || wind === null || rainProb === null || rain === null || !timeValue) continue;

    const hour = Number(timeValue.slice(11, 13));
    points.push({
      time: timeValue,
      dateKey: timeValue.slice(0, 10),
      hour: Number.isFinite(hour) ? hour : -1,
      temp: temp,
      wind: wind,
      rainProb: rainProb,
      rain: rain,
      weatherCode: weatherCode,
    });
  }
  return points;
}

function buildDayOverview(hourly) {
  const points = buildHourlyPoints(hourly);
  if (!points.length) return null;
  const preferredDateKey = getBerlinTodayKey();
  const dateKeys = Array.from(new Set(points.map((item) => item.dateKey))).sort();
  if (!dateKeys.length) return null;
  const selectedDateKey = dateKeys.find((item) => item >= preferredDateKey) || dateKeys[0];
  const selected = points.filter((item) => item.dateKey === selectedDateKey);
  if (!selected.length) return null;

  const conditionLabels = Array.from(
    new Set(
      selected
        .map((item) => describeWeatherCode(item.weatherCode).label)
        .filter(Boolean)
    )
  );
  let conditionText = "--";
  if (conditionLabels.length === 1) {
    conditionText = conditionLabels[0];
  } else if (conditionLabels.length > 1) {
    conditionText = conditionLabels[0] + " bis " + conditionLabels[conditionLabels.length - 1];
  }

  return {
    tempMin: Math.min.apply(null, selected.map((item) => item.temp)),
    tempMax: Math.max.apply(null, selected.map((item) => item.temp)),
    windMin: Math.min.apply(null, selected.map((item) => item.wind)),
    windMax: Math.max.apply(null, selected.map((item) => item.wind)),
    rainMin: Math.min.apply(null, selected.map((item) => item.rain)),
    rainMax: Math.max.apply(null, selected.map((item) => item.rain)),
    conditionText: conditionText,
  };
}

function selectWindowPoints(points, windowConfig, preferredDateKey) {
  const inWindow = points.filter((item) => item.hour >= windowConfig.startHour && item.hour <= windowConfig.endHour);

  const todayMatches = inWindow.filter((item) => item.dateKey === preferredDateKey);
  if (todayMatches.length) return todayMatches;

  const keys = Array.from(new Set(inWindow.map((item) => item.dateKey))).sort();
  if (!keys.length) return [];

  const nextKey = keys.find((item) => item >= preferredDateKey) || keys[0];
  return inWindow.filter((item) => item.dateKey === nextKey);
}

function aggregateWindow(windowLabel, points) {
  if (!points.length) {
    return {
      label: windowLabel,
      hasData: false,
    };
  }

  const tempAvg = average(points.map((item) => item.temp));
  const windMax = Math.max.apply(null, points.map((item) => item.wind));
  const rainProbMax = Math.max.apply(null, points.map((item) => item.rainProb));
  const rainMmMax = Math.max.apply(null, points.map((item) => item.rain));
  const feelAvg = average(points.map((item) => calculateFeelsLike(item.temp, item.wind, item.rain)));
  const risk = determineRisk(feelAvg);

  return {
    label: windowLabel,
    hasData: true,
    tempAvg: tempAvg,
    windMax: windMax,
    rainProbMax: rainProbMax,
    rainMmMax: rainMmMax,
    feelAvg: feelAvg,
    risk: risk,
  };
}

function buildDayWindows(hourly) {
  const points = buildHourlyPoints(hourly);
  const preferredDateKey = getBerlinTodayKey();

  return DAY_WINDOWS.map((windowConfig) => {
    const selected = selectWindowPoints(points, windowConfig, preferredDateKey);
    return aggregateWindow(windowConfig.label, selected);
  });
}

function buildCarryItems(windowItems) {
  const valid = windowItems.filter((item) => item.hasData);
  if (!valid.length) return ["Keine zusaetzlichen Mitnahmehinweise verfuegbar."];

  const items = [];
  const hasRain = valid.some((item) => item.rainProbMax >= 40 || item.rainMmMax >= 0.2);
  const hasWind = valid.some((item) => item.windMax >= 25);
  const temps = valid.map((item) => item.tempAvg);
  const tempSpread = Math.max.apply(null, temps) - Math.min.apply(null, temps);

  if (hasRain) items.push("Regenverdeck/Regenschutz einpacken");
  if (hasWind) items.push("Windschutz oder winddichte Schicht mitnehmen");
  if (tempSpread >= 6) items.push("Zwiebellook: 1 Layer zum Ausziehen einplanen");
  if (!items.length) items.push("Keine besonderen Extras noetig, Standardschicht reicht meist aus.");

  return items;
}

function renderCarryItems(items) {
  el.carryList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.carryList.appendChild(li);
  });
}

function renderDayCards(items, age, situation) {
  el.dayCards.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "day-card";

    const title = document.createElement("h4");
    title.textContent = item.label;
    card.appendChild(title);

    if (!item.hasData) {
      const empty = document.createElement("p");
      empty.className = "day-empty";
      empty.textContent = "Keine Daten";
      card.appendChild(empty);
      el.dayCards.appendChild(card);
      return;
    }

    const metrics = document.createElement("div");
    metrics.className = "day-metrics";
    metrics.innerHTML =
      "<p><strong>Temp Ø:</strong> " + item.tempAvg.toFixed(1) + " °C</p>" +
      "<p><strong>Gefuehlt Ø:</strong> " + item.feelAvg.toFixed(1) + " °C</p>" +
      "<p><strong>Risiko:</strong> " + item.risk.label + "</p>" +
      "<p><strong>Wind max:</strong> " + item.windMax.toFixed(1) + " km/h</p>" +
      "<p><strong>Regenchance max:</strong> " + Math.round(item.rainProbMax) + " %</p>";
    card.appendChild(metrics);

    const plan = buildOutfitPlan({
      temp: item.tempAvg,
      wind: item.windMax,
      rain: item.rainMmMax,
      rainProb: item.rainProbMax,
      age: age,
      situation: situation,
      conditionType: shouldPackRainGear(item.rainMmMax, item.rainProbMax) ? "rain" : "mixed",
    });

    const outfitTitle = document.createElement("p");
    outfitTitle.className = "day-subtitle";
    outfitTitle.textContent = "Outfit";
    card.appendChild(outfitTitle);

    const outfitList = document.createElement("ol");
    outfitList.className = "layer-list compact";
    renderLayerItems(outfitList, plan.outfit);
    card.appendChild(outfitList);

    const carry = document.createElement("p");
    carry.className = "day-hint";
    carry.textContent = shouldPackRainGear(item.rainMmMax, item.rainProbMax)
      ? "Mitnehmen: Regenschutz einplanen."
      : "Mitnehmen: Optional duenne Zusatzschicht.";
    card.appendChild(carry);

    el.dayCards.appendChild(card);
  });
}

function renderDayRecommendation(values) {
  const valid = dayWindowData.filter((item) => item.hasData);
  if (!valid.length) {
    throw new Error("Fuer den Tagesverlauf sind keine passenden Stunden verfuegbar.");
  }
  renderCarryItems(buildCarryItems(dayWindowData));
  renderDayCards(dayWindowData, values.age, values.situation);
  showResult("day");
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,wind_speed_10m,precipitation,weather_code",
    wind_speed_unit: "kmh",
    timezone: "Europe/Berlin",
  });

  const url = API_BASE + "?" + params.toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error("Open-Meteo Fehler: HTTP " + response.status);

  const data = await response.json();
  const current = data && data.current;
  if (!current) throw new Error("Open-Meteo Antwort unvollstaendig.");

  const temp = toNumber(current.temperature_2m);
  const wind = toNumber(current.wind_speed_10m);
  const rain = toNumber(current.precipitation);
  const weatherCode = toNumber(current.weather_code);

  if (temp === null || wind === null || rain === null || weatherCode === null) {
    throw new Error("Wetterdaten konnten nicht gelesen werden.");
  }

  return { temp: temp, wind: wind, rain: rain, weatherCode: weatherCode };
}

async function fetchHourlyWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,wind_speed_10m,precipitation_probability,precipitation,weather_code",
    wind_speed_unit: "kmh",
    timezone: "Europe/Berlin",
  });

  const url = API_BASE + "?" + params.toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error("Hourly-API Fehler: HTTP " + response.status);

  const data = await response.json();
  const hourly = data && data.hourly;
  if (!hourly) throw new Error("Hourly-Daten unvollstaendig.");

  const required = ["time", "temperature_2m", "wind_speed_10m", "precipitation_probability", "precipitation", "weather_code"];
  required.forEach((key) => {
    if (!Array.isArray(hourly[key])) {
      throw new Error("Hourly-Feld fehlt: " + key);
    }
  });

  return hourly;
}

async function fetchLocations(query) {
  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "de",
    format: "json",
  });

  const url = GEO_API_BASE + "?" + params.toString();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Ortsuche Fehler: HTTP " + response.status);
  }

  const data = await response.json();
  const results = data && data.results;

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
    const url = GEO_REVERSE_API_BASE + "?" + params.toString();
    const response = await fetch(url);
    if (!response.ok) continue;

    const data = await response.json();
    const results = Array.isArray(data && data.results) ? data.results : [];
    const named = results.find((item) => Boolean(item && item.name));
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
  el.tempValue.textContent = weather.temp.toFixed(1) + " °C";
  el.windValue.textContent = weather.wind.toFixed(1) + " km/h";
  el.rainValue.textContent = weather.rain.toFixed(1) + " mm/h";
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
    button.className = "result-btn" + (index === 0 ? " is-active" : "");
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

  let extraStatus = "";
  try {
    const hourly = await fetchHourlyWeather(lat, lon);
    dayWindowData = buildDayWindows(hourly);
    dayOverview = buildDayOverview(hourly);
    renderDayRange();
    setHourlyReadyState(true);
  } catch (error) {
    dayWindowData = [];
    dayOverview = null;
    renderDayRange();
    setHourlyReadyState(false);
    if (getMode() === "day") {
      setMode("now", "fallback");
    }
    extraStatus = " Tagesverlauf nicht verfuegbar: " + error.message;
  }

  setStatus("Wetterdaten uebernommen (" + sourceText + ")." + extraStatus, Boolean(extraStatus));
  trackEvent("babywetter_weather_loaded", {
    mode: getMode(),
    hourly_ready: hourlyDataReady ? 1 : 0,
  });
}

async function handleGeoClick() {
  setStatus("Standort wird abgefragt...");
  el.geoBtn.disabled = true;
  trackEvent("babywetter_use_geolocation", { action: "start" });

  try {
    const pos = await getCurrentPosition();
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;
    let currentLocation = {
      latitude: latitude,
      longitude: longitude,
      label: "Aktueller Standort (" + formatCoordinates(latitude, longitude) + ")",
    };

    try {
      const reverse = await fetchReverseLocation(latitude, longitude);
      currentLocation = {
        latitude: latitude,
        longitude: longitude,
        name: reverse.name,
        admin1: reverse.admin1,
        country: reverse.country,
        label: formatLocationName(reverse),
      };
    } catch (_error) {
      const nearest = findNearestFallbackPlace(latitude, longitude);
      if (nearest) {
        currentLocation = {
          latitude: latitude,
          longitude: longitude,
          name: nearest.name,
          country: nearest.country,
          label: "Naechster Ort: " + nearest.label,
        };
      }
    }

    renderLocationResults([currentLocation]);
    await loadWeatherForLocation(currentLocation, formatLocationName(currentLocation));
    trackEvent("babywetter_use_geolocation", { action: "success" });
  } catch (error) {
    setStatus(
      "Standort/Wetter nicht verfuegbar: " + error.message + ". Nutze die Ortssuche oder versuche es erneut.",
      true
    );
    trackEvent("babywetter_use_geolocation", { action: "error" });
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
  trackEvent("babywetter_search_location", { action: "start" });

  try {
    const results = await fetchLocations(query);
    renderLocationResults(results);
    await loadWeatherForLocation(results[0], formatLocationName(results[0]));
    trackEvent("babywetter_search_location", { action: "success" });
  } catch (error) {
    setStatus("Ortsuche fehlgeschlagen: " + error.message, true);
    el.resultsLabel.classList.add("hidden");
    locationResultsCache = [];
    trackEvent("babywetter_search_location", { action: "error" });
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
    trackEvent("babywetter_pick_location", { action: "success" });
  } catch (error) {
    setStatus("Wetterabruf fehlgeschlagen: " + error.message, true);
    trackEvent("babywetter_pick_location", { action: "error" });
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

  if (target === "mode") {
    setMode(value, "user");
    if (el.empty.classList.contains("hidden")) {
      handleFormSubmit(event);
    }
  }
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
    if (getMode() === "day") {
      if (!hourlyDataReady) {
        setMode("now", "fallback");
        renderNowRecommendation(values);
        setStatus("Tagesverlauf nicht verfuegbar. Auf 'Jetzt' umgestellt.", true);
        trackEvent("babywetter_recommendation", { mode: "day", result: "fallback_now" });
        return;
      }
      renderDayRecommendation(values);
      setStatus("Tagesempfehlung aktualisiert.");
      trackEvent("babywetter_recommendation", { mode: "day", result: "ok" });
      return;
    }

    renderNowRecommendation(values);
    setStatus("Empfehlung aktualisiert.");
    trackEvent("babywetter_recommendation", { mode: "now", result: "ok" });
  } catch (error) {
    setStatus(error.message, true);
    trackEvent("babywetter_recommendation", { mode: getMode(), result: "error" });
  }
}

setMode("now", "init");
setWeatherReadyState(false);
setHourlyReadyState(false);
renderDayRange();
setStatus("Bitte Standort verwenden oder einen Ort suchen, um Wetterdaten zu laden.");

el.geoBtn.addEventListener("click", handleGeoClick);
el.searchBtn.addEventListener("click", handleLocationSearch);
el.form.addEventListener("click", handleChoicePick);
if (el.modeSwitch) {
  el.modeSwitch.addEventListener("click", handleChoicePick);
}
el.locationResults.addEventListener("click", handleLocationResultsClick);
el.form.addEventListener("submit", handleFormSubmit);
})();
