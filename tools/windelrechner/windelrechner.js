(function () {
  const PRESETS = [
    { maxMonths: 2, perDay: 10, label: 'Neugeboren (0-2 Monate)' },
    { maxMonths: 5, perDay: 8, label: 'Saeugling (3-5 Monate)' },
    { maxMonths: 11, perDay: 7, label: 'Baby (6-11 Monate)' },
    { maxMonths: 23, perDay: 6, label: 'Kleinkind (12-23 Monate)' },
    { maxMonths: 60, perDay: 5, label: 'Kleinkind (24+ Monate)' },
  ];

  const el = {
    form: document.getElementById('calcForm'),
    ageMonths: document.getElementById('ageMonths'),
    ageHint: document.getElementById('ageHint'),
    customPerDay: document.getElementById('customPerDay'),
    periodDays: document.getElementById('periodDays'),
    packSize: document.getElementById('packSize'),
    packPrice: document.getElementById('packPrice'),
    reserve: document.getElementById('reserve'),
    nightExtra: document.getElementById('nightExtra'),
    status: document.getElementById('status'),
    empty: document.getElementById('emptyState'),
    result: document.getElementById('result'),
    summary: document.getElementById('summary'),
    outTotalDiapers: document.getElementById('outTotalDiapers'),
    outPacks: document.getElementById('outPacks'),
    outTotalCost: document.getElementById('outTotalCost'),
    outPerDay: document.getElementById('outPerDay'),
    outPerDiaper: document.getElementById('outPerDiaper'),
    outPlannedPerDay: document.getElementById('outPlannedPerDay'),
    tip: document.getElementById('tip'),
  };

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  function getPresetByAge(months) {
    return PRESETS.find((item) => months <= item.maxMonths) || PRESETS[PRESETS.length - 1];
  }

  function setAgeHint() {
    const months = Math.max(0, toNumber(el.ageMonths.value) || 0);
    const preset = getPresetByAge(months);
    el.ageHint.textContent = `Richtwert: ${preset.perDay} Windeln/Tag (${preset.label})`;
  }

  function setStatus(message, isError) {
    el.status.textContent = message;
    el.status.classList.toggle('is-error', Boolean(isError));
  }

  function validateInputs(data) {
    if (data.ageMonths === null || data.ageMonths < 0) {
      return 'Bitte ein gueltiges Alter in Monaten angeben.';
    }

    if (data.packSize === null || data.packSize < 1) {
      return 'Bitte eine gueltige Packungsgroesse angeben.';
    }

    if (data.packPrice === null || data.packPrice < 0) {
      return 'Bitte einen gueltigen Preis pro Packung angeben.';
    }

    if (data.reserve === null || data.reserve < 0 || data.reserve > 100) {
      return 'Reserve muss zwischen 0 und 100 Prozent liegen.';
    }

    if (data.customPerDay !== null && data.customPerDay < 0) {
      return 'Eigener Verbrauch pro Tag darf nicht negativ sein.';
    }

    return null;
  }

  function readForm() {
    return {
      ageMonths: toNumber(el.ageMonths.value),
      customPerDay: el.customPerDay.value === '' ? null : toNumber(el.customPerDay.value),
      periodDays: toNumber(el.periodDays.value),
      packSize: toNumber(el.packSize.value),
      packPrice: toNumber(el.packPrice.value),
      reserve: toNumber(el.reserve.value),
      nightExtra: el.nightExtra.checked,
    };
  }

  function calculate(data) {
    const preset = getPresetByAge(data.ageMonths);
    const basePerDay = data.customPerDay !== null ? data.customPerDay : preset.perDay;
    const plannedPerDay = basePerDay + (data.nightExtra ? 1 : 0);

    const netDiapers = plannedPerDay * data.periodDays;
    const totalDiapers = Math.ceil(netDiapers * (1 + data.reserve / 100));
    const packs = Math.ceil(totalDiapers / data.packSize);
    const totalCost = packs * data.packPrice;

    return {
      preset,
      plannedPerDay,
      totalDiapers,
      packs,
      totalCost,
      perDayCost: totalCost / data.periodDays,
      perDiaperCost: totalDiapers > 0 ? totalCost / totalDiapers : 0,
    };
  }

  function getTip(result) {
    if (result.packs <= 2) {
      return 'Kleine Menge geplant: achte auf haeufige Angebotspruefung statt Vorratskauf.';
    }

    if (result.packs >= 10) {
      return 'Grosse Menge: pruefe Staffelpreise oder Monatsboxen fuer niedrigeren Stueckpreis.';
    }

    return 'Mittlere Menge: 1-2 Reservepackungen sind meist sinnvoll.';
  }

  function render(data, result) {
    const usedCustom = data.customPerDay !== null;
    const sourceText = usedCustom
      ? 'basierend auf deinem eigenen Verbrauch'
      : `basierend auf Richtwert (${result.preset.label})`;

    el.summary.textContent = `${result.totalDiapers} Windeln in ${data.periodDays} Tagen (${sourceText}).`;
    el.outTotalDiapers.textContent = String(result.totalDiapers);
    el.outPacks.textContent = String(result.packs);
    el.outTotalCost.textContent = formatCurrency(result.totalCost);
    el.outPerDay.textContent = formatCurrency(result.perDayCost);
    el.outPerDiaper.textContent = formatCurrency(result.perDiaperCost);
    el.outPlannedPerDay.textContent = result.plannedPerDay.toFixed(1).replace('.', ',');
    el.tip.textContent = `${getTip(result)} Geplant: ${result.packs} Packungen kaufen.`;

    el.empty.classList.add('hidden');
    el.result.classList.remove('hidden');
    setStatus('Berechnung aktualisiert.', false);
  }

  function onSubmit(event) {
    event.preventDefault();
    const data = readForm();
    const error = validateInputs(data);

    if (error) {
      setStatus(error, true);
      return;
    }

    const result = calculate(data);
    render(data, result);
  }

  el.form.addEventListener('submit', onSubmit);
  el.ageMonths.addEventListener('input', setAgeHint);
  setAgeHint();
})();
