"""Prépare les indicateurs de matchs, de boutique et de fréquentation."""

from __future__ import annotations

import re
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "dataset"
GOLD = ROOT / "gold"


def _to_number(series: pd.Series) -> pd.Series:
    """Convertit les nombres français à virgule en valeurs numériques."""
    return pd.to_numeric(
        series.astype("string").str.replace(",", ".", regex=False), errors="coerce"
    )


def load_matches() -> pd.DataFrame:
    """Lit les résultats et le calendrier, puis conserve les matchs à domicile."""
    results = pd.read_csv(DATA / "resultats_matchs.csv", encoding="utf-8-sig")
    calendar = pd.read_csv(DATA / "calendrier_matchs.csv", encoding="utf-8-sig")
    results["date"] = pd.to_datetime(results["date"], errors="coerce")
    calendar["date"] = pd.to_datetime(calendar["date"], errors="coerce")
    for column in ("score_domicile", "score_exterieur"):
        results[column] = pd.to_numeric(results[column], errors="coerce")

    # Le résultat CSV indique si Paris joue à domicile; les scores restent à orienter
    # selon l'équipe dans les colonnes domicile et extérieur.
    home = results[
        results["lieu"].astype("string").str.strip().str.upper().eq("DOMICILE")
    ].copy()
    home["points_paris"] = home.apply(
        lambda row: row["score_domicile"]
        if str(row["domicile"]).strip().upper() == "PARIS BASKETBALL"
        else row["score_exterieur"],
        axis=1,
    )
    home["victoire_paris"] = home.apply(
        lambda row: (
            row["score_domicile"] > row["score_exterieur"]
            if str(row["domicile"]).strip().upper() == "PARIS BASKETBALL"
            else row["score_exterieur"] > row["score_domicile"]
        ),
        axis=1,
    )
    home["promo_declenchee"] = home["points_paris"] >= 100

    # Le calendrier apporte l'identifiant, la salle et la capacité; la date relie les exports.
    joined = home.merge(
        calendar[["match_id", "date", "competition", "adversaire", "salle", "capacite_salle", "heure"]],
        on="date",
        how="left",
        suffixes=("_resultat", "_calendrier"),
        validate="one_to_one",
    )
    joined["scenario"] = joined.apply(
        lambda row: ("Victoire" if row["victoire_paris"] else "Défaite")
        + (" / 100 points ou plus" if row["promo_declenchee"] else " / moins de 100 points"),
        axis=1,
    )
    return joined


def load_shop() -> tuple[pd.DataFrame, dict[str, object]]:
    """Nettoie les lignes de caisse et calcule le CA journalier et les transactions."""
    path = DATA / "boutique_ventes_avoirs.csv"
    shop = pd.read_csv(path, sep=";", dtype="string", encoding="utf-8-sig")
    source_rows = len(shop)
    # L'export ajoute deux lignes de total sans identifiant de ligne.
    shop = shop[shop["LIGNE_ligne"].notna()].copy()
    # Des lignes réexportées partagent le même ID. On fusionne les copies concordantes
    # et on conserve les IDs ambigus lorsque d'autres champs sont en conflit.
    duplicate_ids = shop[shop["LIGNE_ligne"].duplicated(False)]
    compare_columns = [
        column for column in shop.columns
        if column not in {"LIGNE_ligne", "VENTE_date"}
    ]
    conflicting_ids = set(
        duplicate_ids.groupby("LIGNE_ligne")[compare_columns]
        .nunique(dropna=False)
        .gt(1)
        .any(axis=1)
        .loc[lambda values: values]
        .index
    )
    safe_duplicate_ids = duplicate_ids[~duplicate_ids["LIGNE_ligne"].isin(conflicting_ids)]
    safely_deduplicated_rows = int(safe_duplicate_ids["LIGNE_ligne"].duplicated().sum())
    if safely_deduplicated_rows:
        safe_rows = shop[~shop["LIGNE_ligne"].isin(conflicting_ids)].drop_duplicates(
            "LIGNE_ligne", keep="first"
        )
        conflicting_rows = shop[shop["LIGNE_ligne"].isin(conflicting_ids)]
        shop = pd.concat([safe_rows, conflicting_rows], ignore_index=True)
    shop["date_vente"] = pd.to_datetime(
        shop["VENTE_date"], format="mixed", dayfirst=True, errors="coerce"
    )
    shop["montant_ligne"] = _to_number(shop["LIGNE_Total"])
    shop["remise_pct"] = _to_number(shop["LIGNE_Remise"])
    shop["heure_vente"] = pd.to_datetime(
        shop["VENTE_heure"], format="mixed", errors="coerce"
    ).dt.strftime("%H:%M:%S")

    # Garde uniquement les transactions validées de la boutique physique ARENA.
    valid = shop[
        shop["VENTE_Etat"].str.strip().str.upper().eq("VALIDEE")
        & shop["VENTE_nature"].isin(["VENTE", "AVOIR"])
        & shop["VENTE_codemag"].str.strip().str.upper().eq("ARENA")
        & shop["date_vente"].notna()
        & shop["montant_ligne"].notna()
    ].copy()
    valid["code_promo_10pct"] = (
        valid["LIGNE_TypeRemise"].str.strip().str.upper().eq("CODE_PROMO")
        & valid["remise_pct"].eq(10)
    )

    # Regroupe les lignes d'un même ticket avant l'agrégation; le total du ticket
    # est répété sur chaque article dans l'export.
    receipts = (
        valid.groupby(
            ["VENTE_vente", "date_vente", "heure_vente", "VENTE_nature"],
            dropna=False,
            as_index=False,
        )
        .agg(chiffre_affaires_net=("montant_ligne", "sum"))
    )
    receipts["horodatage_vente"] = pd.to_datetime(
        receipts["date_vente"].dt.strftime("%Y-%m-%d") + " " + receipts["heure_vente"],
        errors="coerce",
    )

    daily = (
        valid.groupby("date_vente", as_index=False)
        .agg(chiffre_affaires_net_eur=("montant_ligne", "sum"))
        .rename(columns={"date_vente": "date"})
    )
    by_nature = (
        valid.groupby(["date_vente", "VENTE_nature"])["VENTE_vente"]
        .nunique()
        .unstack(fill_value=0)
    )
    for nature in ("VENTE", "AVOIR"):
        if nature not in by_nature:
            by_nature[nature] = 0
    by_nature = (
        by_nature.rename(
            columns={"VENTE": "transactions_vente", "AVOIR": "transactions_avoir"}
        )
        .reset_index()
        .rename(columns={"date_vente": "date"})
    )
    promo_receipts = (
        valid[valid["code_promo_10pct"] & valid["VENTE_nature"].eq("VENTE")]
        .groupby("date_vente")["VENTE_vente"].nunique()
        .rename("transactions_code_promo_10pct")
        .reset_index()
        .rename(columns={"date_vente": "date"})
    )
    daily = daily.merge(by_nature, on="date", how="left").merge(
        promo_receipts, on="date", how="left"
    )
    daily["transactions_code_promo_10pct"] = daily["transactions_code_promo_10pct"].fillna(0)
    quality = {
        "source": "dataset/boutique_ventes_avoirs.csv",
        "rows_read": source_rows,
        "rows_used": len(valid),
        "rows_excluded": source_rows - len(valid),
        "detail": (
            "ARENA uniquement; ventes/avoirs validés; lignes de synthèse sans identifiant écartées; "
            f"{safely_deduplicated_rows} doublons de ligne sans conflit fusionnés; "
            f"{len(conflicting_ids)} identifiants de ligne ambigus conservés."
        ),
    }
    return daily, {"quality": quality, "receipts": receipts}


def load_scans() -> tuple[pd.DataFrame, list[dict[str, object]]]:
    """Compte les scans valides et estime l'affluence par code-barres unique."""
    rows: list[dict[str, object]] = []
    quality: list[dict[str, object]] = []
    # Chaque fichier correspond à un match; un fichier absent ou vide ne bloque pas le reste.
    for path in sorted((DATA / "sftp").glob("scan_*.csv")):
        date_match = re.search(r"scan_(\d{8})\.csv$", path.name)
        match_date = pd.to_datetime(date_match.group(1), format="%Y%m%d") if date_match else pd.NaT
        if path.stat().st_size == 0:
            quality.append({"source": str(path.relative_to(ROOT)), "rows_read": 0, "rows_used": 0, "rows_excluded": 0, "detail": "Fichier vide ignoré."})
            continue
        try:
            scans = pd.read_csv(path, dtype="string", encoding="utf-8-sig")
        except (pd.errors.EmptyDataError, UnicodeDecodeError, pd.errors.ParserError) as error:
            quality.append({"source": str(path.relative_to(ROOT)), "rows_read": 0, "rows_used": 0, "rows_excluded": 0, "detail": f"Fichier illisible ignoré: {type(error).__name__}."})
            continue
        required = {"barcode", "resultat"}
        if not required.issubset(scans.columns):
            quality.append({"source": str(path.relative_to(ROOT)), "rows_read": len(scans), "rows_used": 0, "rows_excluded": len(scans), "detail": "Colonnes obligatoires absentes; fichier ignoré."})
            continue
        scans["resultat"] = scans["resultat"].str.strip().str.upper()
        valid = scans[
            scans["resultat"].eq("OK")
            & scans["barcode"].notna()
            & scans["barcode"].str.strip().ne("")
        ]
        rows.append({"date": match_date, "billets_scannes_uniques": valid["barcode"].nunique()})
        quality.append({
            "source": str(path.relative_to(ROOT)),
            "rows_read": len(scans),
            "rows_used": len(valid),
            "rows_excluded": len(scans) - len(valid),
            "detail": "Scans OK comptés; fréquentation estimée par codes-barres uniques.",
        })
    return pd.DataFrame(rows), quality


def build() -> pd.DataFrame:
    """Produit les tables agrégées utilisées par l'API du dashboard."""
    GOLD.mkdir(exist_ok=True)
    matches = load_matches()
    daily_shop, shop_data = load_shop()
    scans, scan_quality = load_scans()

    gold = matches.merge(daily_shop, on="date", how="left", validate="one_to_one")
    gold = gold.merge(scans, on="date", how="left", validate="one_to_one")
    # Les jours sans vente ni scan reçoivent zéro pour garder des valeurs exploitables.
    for column in (
        "chiffre_affaires_net_eur",
        "transactions_vente",
        "transactions_avoir",
        "transactions_code_promo_10pct",
        "billets_scannes_uniques",
    ):
        if column in gold:
            gold[column] = gold[column].fillna(0)
    # Ces ratios contextualisent les recettes par la capacité et la fréquentation.
    gold["remplissage_pct"] = (
        gold["billets_scannes_uniques"] / gold["capacite_salle"] * 100
    ).where(gold["capacite_salle"].gt(0))
    gold["ca_net_eur_pour_1000_entrees"] = (
        gold["chiffre_affaires_net_eur"] / gold["billets_scannes_uniques"] * 1000
    ).where(gold["billets_scannes_uniques"].gt(0))

    receipts = shop_data["receipts"]
    # L'heure réelle de fin manque. On utilise T+1 h 40 comme approximation
    # et on observe les tickets jusqu'à T+2 h 40 après le coup d'envoi.
    exit_window: list[dict[str, object]] = []
    for _, match in gold.iterrows():
        kickoff = pd.to_datetime(
            f"{match['date']:%Y-%m-%d} {match['heure']}", errors="coerce"
        )
        window_start = kickoff + pd.Timedelta(minutes=100)
        window_end = kickoff + pd.Timedelta(minutes=160)
        subset = receipts[
            receipts["date_vente"].eq(match["date"])
            & receipts["horodatage_vente"].between(window_start, window_end, inclusive="both")
        ]
        sales = subset[subset["VENTE_nature"].eq("VENTE")]
        exit_window.append({
            "date": match["date"],
            "ca_net_fenetre_sortie_eur": float(subset["chiffre_affaires_net"].sum()),
            "transactions_fenetre_sortie": int(sales["VENTE_vente"].nunique()),
        })
    gold = gold.merge(pd.DataFrame(exit_window), on="date", how="left", validate="one_to_one")
    gold.to_csv(GOLD / "match_shop_performance.csv", index=False, encoding="utf-8-sig")

    quality = [shop_data["quality"], *scan_quality]
    pd.DataFrame(quality).to_csv(GOLD / "data_quality.csv", index=False, encoding="utf-8-sig")
    print(f"Agrégats calculés pour {len(gold)} matchs à domicile.")
    print(f"Écrit: {GOLD / 'match_shop_performance.csv'}")
    print(f"Écrit: {GOLD / 'data_quality.csv'}")
    return gold


if __name__ == "__main__":
    build()
