"""Sert le dashboard et une API limitée aux indicateurs nécessaires."""

from __future__ import annotations

import json

from flask import Flask, Response, jsonify, send_file

from pipeline import ROOT, build


app = Flask(__name__, static_folder=None)

# Colonnes nécessaires au rendu visuel.
DASHBOARD_COLUMNS = [
    "match_id",
    "date",
    "competition_calendrier",
    "adversaire",
    "salle",
    "domicile",
    "score_domicile",
    "score_exterieur",
    "points_paris",
    "victoire_paris",
    "promo_declenchee",
    "scenario",
    "chiffre_affaires_net_eur",
    "transactions_vente",
    "transactions_avoir",
    "transactions_code_promo_10pct",
    "billets_scannes_uniques",
    "remplissage_pct",
    "ca_net_eur_pour_1000_entrees",
    "ca_net_fenetre_sortie_eur",
    "transactions_fenetre_sortie",
]


@app.get("/")
def dashboard() -> Response:
    """Renvoie la page HTML qui charge les fichiers CSS et JavaScript séparés."""
    return send_file(ROOT / "src" / "dashbord.html")


@app.get("/dashboard.css")
def dashboard_styles() -> Response:
    """Sert les styles du dashboard."""
    return send_file(ROOT / "src" / "dashboard.css", mimetype="text/css")


@app.get("/dashboard.js")
def dashboard_script() -> Response:
    """Sert le code JavaScript du dashboard."""
    return send_file(ROOT / "src" / "dashboard.js", mimetype="text/javascript")


@app.get("/api/dashboard")
def dashboard_data() -> Response:
    """Calcule les données depuis les fichiers sources et renvoie les seuls agrégats utiles."""
    matches = build()[DASHBOARD_COLUMNS]
    payload = {
        "competitions": sorted(matches["competition_calendrier"].dropna().unique().tolist()),
        "matches": json.loads(matches.to_json(orient="records", force_ascii=False, date_format="iso")),
    }
    return jsonify(payload)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
