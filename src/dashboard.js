// Les lignes agrégées sont chargées depuis l'API Flask, jamais stockées dans ce fichier.
let DATA = [];
// Formats français partagés par les nombres, les dates et les montants affichés.
const fmt = new Intl.NumberFormat("fr-FR");
const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
// Les couleurs rendent les mêmes quatre scénarios dans les deux graphiques.
const colors = {
  "Victoire / 100 points ou plus": "#e83b78",
  "Défaite / 100 points ou plus": "#e7a83e",
  "Victoire / moins de 100 points": "#137d78",
  "Défaite / moins de 100 points": "#3558a8",
};
const select = document.getElementById("competition");
// Fonctions de présentation réutilisées dans les infobulles et le tableau.
const money = (value) => euro.format(Number(value) || 0);
const number = (value) => fmt.format(Number(value) || 0);
const dateFmt = (value) =>
  value
    ? new Date(String(value).slice(0, 10) + "T12:00:00").toLocaleDateString(
        "fr-FR",
        { day: "2-digit", month: "short" },
      )
    : "—";
const venueName = (value) =>
  String(value || "")
    .toUpperCase()
    .includes("ACCOR")
    ? "Accor Arena"
    : String(value || "")
          .toUpperCase()
          .includes("ADIDAS")
      ? "Adidas Arena"
      : value || "Salle inconnue";
const median = (values) => {
  // Trie une copie pour ne pas modifier les données originales.
  const s = [...values].sort((a, b) => a - b),
    m = Math.floor(s.length / 2);
  return !s.length ? 0 : s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// Applique le filtre de compétition choisi, ou renvoie tous les matchs.
const active = () =>
  select.value === "Toutes"
    ? DATA
    : DATA.filter((d) => d.competition_calendrier === select.value);

// Remplit les indicateurs en haut du dashboard selon le filtre sélectionné.
function renderKpis(rows) {
  const games = rows.length,
    triggers = rows.filter((d) => d.promo_declenchee),
    attendance = rows.reduce(
      (a, d) => a + (Number(d.billets_scannes_uniques) || 0),
      0,
    ),
    ca = rows.reduce(
      (a, d) => a + (Number(d.chiffre_affaires_net_eur) || 0),
      0,
    );
  const cards = [
    ["Matchs à domicile", number(games), "Échantillon de la comparaison"],
    [
      "Match où Paris est à 100 points ou plus",
      number(triggers.length),
      `${triggers.filter((d) => d.victoire_paris).length} victoires · ${triggers.filter((d) => !d.victoire_paris).length} défaites`,
    ],
    [
      "CA net boutique total lors des jours de match",
      money(ca),
      `${money(games ? ca / games : 0)} par match en moyenne`,
    ],
    [
      "Entrées scannées",
      number(attendance),
      `${number(games ? attendance / games : 0)} par match en moyenne`,
    ],
  ];
  document.getElementById("kpis").innerHTML = cards
    .map(
      (c) =>
        `<article class="card"><div class="kpi-label">${c[0]}</div><div class="kpi-value">${c[1]}</div><div class="kpi-note">${c[2]}</div></article>`,
    )
    .join("");
}

// Compare les recettes nettes médianes de la journée complète pour les quatre scénarios.
function renderGroups(rows) {
  const groups = Object.keys(colors).map((name) => {
    const g = rows.filter((d) => d.scenario === name);
    const medianRevenue = g.length
      ? median(g.map((d) => Number(d.chiffre_affaires_net_eur) || 0))
      : 0;
    return { name, g, medianRevenue };
  });
  const max = Math.max(1, ...groups.map((g) => g.medianRevenue));
  document.getElementById("group-chart").innerHTML = groups
    .map((g) =>
      '<div class="group-row"><div class="group-name">' + g.name +
      '</div><div class="bar-bg"><div class="bar" style="width:' +
      Math.max(0, (100 * g.medianRevenue) / max) + '%;background:' +
      colors[g.name] + '"></div></div><div class="group-val">' +
      money(g.medianRevenue) + '</div><div class="group-sub">Médiane · ' +
      g.g.length + ' match' + (g.g.length === 1 ? '' : 's') +
      '</div></div>')
    .join("");

  const wins = groups.find((g) => g.name === "Victoire / 100 points ou plus");
  const winsLow = groups.find((g) => g.name === "Victoire / moins de 100 points");
  let note = "Les données ne permettent pas de comparer ces deux groupes.";
  if (wins && wins.g.length && winsLow && winsLow.g.length) {
    note = "Sur la journée entière, la médiane des recettes boutique est de " +
      money(wins.medianRevenue) + " pour les victoires à 100 points ou plus, contre " +
      money(winsLow.medianRevenue) + " pour les victoires sous 100 points. " +
      "Ce chiffre inclut les ventes d’avant-match et ne mesure pas l’effet de la remise.";
  }
  document.getElementById("group-note").innerHTML =
    "<strong>Interprétation :</strong> " + note;
}

// Compare les médianes de la fenêtre de sortie et rédige l'interprétation descriptive.
function renderExit(rows) {
  const groups = Object.keys(colors).map((name) => {
    const g = rows.filter((d) => d.scenario === name);
    const medianRevenue = g.length
      ? median(g.map((d) => Number(d.ca_net_fenetre_sortie_eur) || 0))
      : 0;
    return { name, g, medianRevenue };
  });
  const max = Math.max(1, ...groups.map((g) => g.medianRevenue));
  document.getElementById("exit-chart").innerHTML = groups
    .map((g) =>
      '<div class="group-row"><div class="group-name">' + g.name +
      '</div><div class="bar-bg"><div class="bar" style="width:' +
      Math.max(0, (100 * g.medianRevenue) / max) + '%;background:' +
      colors[g.name] + '"></div></div><div class="group-val">' +
      money(g.medianRevenue) + '</div><div class="group-sub">Médiane · ' +
      g.g.length + ' match' + (g.g.length === 1 ? '' : 's') + ' · ' +
      number(g.g.reduce((a, d) => a + (Number(d.transactions_fenetre_sortie) || 0), 0)) +
      ' transactions</div></div>')
    .join("");

  const wins = rows.filter((d) => d.victoire_paris);
  const losses = rows.filter((d) => !d.victoire_paris);
  const wins100 = wins.filter((d) => d.promo_declenchee);
  const winsUnder100 = wins.filter((d) => !d.promo_declenchee);
  const exitRevenue = (d) => Number(d.ca_net_fenetre_sortie_eur) || 0;
  const interpretations = [];
  if (wins.length && losses.length) {
    interpretations.push(
      "La médiane des recettes boutique dans cette fenêtre est de " +
      money(median(wins.map(exitRevenue))) + " après une victoire (" +
      wins.length + " matchs), contre " +
      money(median(losses.map(exitRevenue))) + " après une défaite (" +
      losses.length + " matchs)."
    );
  }
  if (wins100.length && winsUnder100.length) {
    const revenue100 = median(wins100.map(exitRevenue));
    const revenueUnder100 = median(winsUnder100.map(exitRevenue));
    const attendance100 = median(wins100.map((d) => Number(d.billets_scannes_uniques) || 0));
    const attendanceUnder100 = median(winsUnder100.map((d) => Number(d.billets_scannes_uniques) || 0));
    interpretations.push(
      "Parmi les victoires, la médiane est plus basse à 100 points ou plus (" +
      money(revenue100) + ") que sous 100 points (" +
      money(revenueUnder100) + "). L’affluence médiane est respectivement de " +
      number(attendance100) + " et " + number(attendanceUnder100) + " entrées."
    );
  }
  interpretations.push(
    "Ces recettes sont des totaux par match, pas une dépense moyenne par spectateur. " +
    "Elles ne prouvent pas que la remise de 10 % augmente les ventes : l’affluence et le " +
    "contexte des matchs peuvent aussi jouer, et les tickets ne permettent pas d’identifier cette offre."
  );
  document.getElementById("exit-note").innerHTML =
    "<strong>Interprétation :</strong> " + interpretations.join(" ");
}

// Dessine un nuage de points interactif : survol pour le détail, clic pour la ligne du match.
function renderScatter(
  rows,
  targetId = "scatter",
  measure = "chiffre_affaires_net_eur",
  yLabel = "CA net boutique",
) {
  const w = 620,
    h = 320,
    p = { l: 62, r: 18, t: 20, b: 47 };
  const xs = rows.map((d) => Number(d.billets_scannes_uniques) || 0),
    ys = rows.map((d) => Number(d[measure]) || 0);
  const xmax = Math.max(1, ...xs) * 1.08,
    ymax = Math.max(1, ...ys) * 1.08;
  const X = (x) => p.l + (x / xmax) * (w - p.l - p.r),
    Y = (y) => h - p.b - (y / ymax) * (h - p.t - p.b);
  let svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Nuage de points du chiffre d'affaires et des entrées scannées">`;
  for (let i = 0; i <= 4; i++) {
    let x = p.l + ((w - p.l - p.r) * i) / 4,
      y = h - p.b - ((h - p.t - p.b) * i) / 4;
    svg += `<line x1="${x}" y1="${p.t}" x2="${x}" y2="${h - p.b}" stroke="#edf0f5"/><line x1="${p.l}" y1="${y}" x2="${w - p.r}" y2="${y}" stroke="#edf0f5"/><text x="${x}" y="${h - 17}" text-anchor="middle" font-size="10" fill="#758198">${number((xmax * i) / 4)}</text><text x="${p.l - 9}" y="${y + 3}" text-anchor="end" font-size="10" fill="#758198">${money((ymax * i) / 4)}</text>`;
  }
  svg += `<text x="${(w + p.l - p.r) / 2}" y="${h - 1}" text-anchor="middle" font-size="11" fill="#64748b">Billets scannés uniques</text><text transform="translate(13 ${(h - p.b + p.t) / 2}) rotate(-90)" text-anchor="middle" font-size="11" fill="#64748b">${yLabel}</text>`;
  for (const d of rows) {
    const x = Number(d.billets_scannes_uniques) || 0,
      y = Number(d[measure]) || 0;
    svg += `<circle data-match="${d.match_id}" cx="${X(x)}" cy="${Y(y)}" r="6" fill="${colors[d.scenario] || "#789"}" fill-opacity=".88" stroke="#fff" stroke-width="1.5" tabindex="0" role="button" aria-label="${d.match_id}, ${d.adversaire}, ${money(y)}"><title>${dateFmt(d.date)} · ${d.adversaire} · ${d.scenario}</title></circle>`;
  }
  svg += "</svg>";
  document.getElementById(targetId).innerHTML = svg;
  document.getElementById(
    targetId === "scatter" ? "legend" : "legend-after",
  ).innerHTML = Object.entries(colors)
    .map(
      ([n, c]) =>
        `<span><i class="dot" style="background:${c}"></i>${n}</span>`,
    )
    .join("");
  const tooltip = document.getElementById("tooltip");
  function showPoint(circle, event) {
    // Retrouve le match lié au point et affiche les détails près du curseur.
    const d = DATA.find((item) => item.match_id === circle.dataset.match);
    if (!d) return;
    const rival =
      String(d.domicile).trim().toUpperCase() === "PARIS BASKETBALL"
        ? Number(d.score_exterieur)
        : Number(d.score_domicile);
    tooltip.textContent = `${dateFmt(d.date)} · ${d.adversaire}\n${venueName(d.salle)} · ${d.competition_calendrier}\nScore : Paris ${number(d.points_paris)}–${number(rival)} · ${d.victoire_paris ? "Victoire" : "Défaite"}\nAffluence : ${number(d.billets_scannes_uniques)} entrées scannées\nRecettes boutique (jour) : ${money(d.chiffre_affaires_net_eur)}\nBoutique T+1h40–T+2h40 : ${money(d.ca_net_fenetre_sortie_eur)}`;
    tooltip.style.display = "block";
    const x = event.clientX || circle.getBoundingClientRect().left,
      y = event.clientY || circle.getBoundingClientRect().top;
    tooltip.style.left = Math.min(x + 14, window.innerWidth - 330) + "px";
    tooltip.style.top = Math.min(y + 14, window.innerHeight - 180) + "px";
  }
  for (const circle of document.querySelectorAll(
    `#${targetId} circle[data-match]`,
  )) {
    // Le survol et le clavier ouvrent l'infobulle; le clic sélectionne la ligne.
    circle.addEventListener("pointerenter", (e) => showPoint(circle, e));
    circle.addEventListener("pointermove", (e) => showPoint(circle, e));
    circle.addEventListener(
      "pointerleave",
      () => (tooltip.style.display = "none"),
    );
    circle.addEventListener("focus", (e) => showPoint(circle, e));
    circle.addEventListener("blur", () => (tooltip.style.display = "none"));
    circle.addEventListener("click", () => {
      const row = document.getElementById("row-" + circle.dataset.match);
      if (row) {
        document
          .querySelectorAll("#match-table tr")
          .forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
}

// Construit le tableau détaillé des matchs actuellement filtrés.
function renderTable(rows) {
  const sorted = [...rows].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
  document.getElementById("table-count").textContent = `${rows.length} matchs`;
  document.getElementById("match-table").innerHTML = sorted
    .map(
      (d) =>
        `<tr id="row-${d.match_id}"><td>${dateFmt(d.date)}</td><td>${d.competition_calendrier || "—"}</td><td class="match">${d.adversaire || "—"}</td><td>${venueName(d.salle)}</td><td>${number(d.points_paris)}–${number(d.score_exterieur)}</td><td class="${d.victoire_paris ? "win" : "loss"}">${d.victoire_paris ? "Victoire" : "Défaite"}</td><td><span class="pill ${d.promo_declenchee ? "high" : "low"}">${d.promo_declenchee ? "100 points ou plus" : "Moins de 100 points"}</span></td><td>${number(d.billets_scannes_uniques)}</td><td>${pct.format(d.remplissage_pct || 0)} %</td><td>${number(d.transactions_vente)}</td><td>${number(d.transactions_avoir)}</td><td>${money(d.chiffre_affaires_net_eur)}</td><td>${number(d.transactions_code_promo_10pct)}</td><td>${money(d.ca_net_eur_pour_1000_entrees)}</td><td>${money(d.ca_net_fenetre_sortie_eur)}</td></tr>`,
    )
    .join("");
}

// Rafraîchit ensemble les cartes, les graphiques et le tableau.
function render() {
  const rows = active();
  renderKpis(rows);
  renderGroups(rows);
  renderScatter(
    rows,
    "scatter",
    "chiffre_affaires_net_eur",
    "CA boutique net (journée)",
  );
  renderScatter(
    rows,
    "scatter-after",
    "ca_net_fenetre_sortie_eur",
    "CA boutique net (fenêtre)",
  );
  renderExit(rows);
  renderTable(rows);
}

// Demande les agrégats au serveur, crée les options de filtre, puis affiche les résultats.
async function loadDashboard() {
  // Récupère les agrégats calculés par le serveur et peuple le filtre.
  const response = await fetch("/api/dashboard");
  if (!response.ok)
    throw new Error("Erreur de chargement des données du dashboard");
  const payload = await response.json();
  DATA = payload.matches;
  for (const competition of payload.competitions) {
    const option = document.createElement("option");
    option.value = competition;
    option.textContent = competition;
    select.appendChild(option);
  }
  select.addEventListener("change", render);
  render();
}
loadDashboard().catch((error) => {
  document.getElementById("kpis").innerHTML =
    `<article class="card">${error.message}. Lance le serveur avec python src/server.py.</article>`;
});
