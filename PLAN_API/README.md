# Copies locales des sources externes

Si une API du catalogue est indisponible pendant ton test, utilise les fichiers
de ce dossier. Ne reste pas bloqué sur une API qui ne répond pas : ça ne fait
pas partie de ce qui est évalué.

Signale-le simplement dans ton `NOTES.md`.

## Contenu

Tous les fichiers ont été récupérés le **28 juillet 2026**.

| Fichier | Source | Contenu |
| --- | --- | --- |
| `euroleague/E2025/basicstandings_r01.json` … `_r38.json` | `api-live.euroleague.net` — `/v3/competitions/E/seasons/E2025/rounds/{n}/basicstandings` | Classement EuroLeague après chaque journée de la saison 2025-26 |
| `euroleague/E2025/calendarstandings_r*.json`, `streaks_r*.json`, `aheadbehind_r*.json`, `margins_r*.json` | même API, mêmes journées | Variantes du classement (calendrier, séries, écarts) |
| `euroleague/E2025/games_v2.json` | même API — `/v2/competitions/E/seasons/E2025/games` | Calendrier et résultats complets de la saison 2025-26 |
| `euroleague/E2025/v2_standings_r01.json` | même API — chemin v2 historique | Classement journée 1, ancien format |
| `euroleague/E2025/players_traditional_accumulated.json` | même API — `/v3/competitions/E/statistics/players/traditional?seasonMode=Single&seasonCode=E2025&statisticMode=accumulated` | Statistiques cumulées par joueur, toute la ligue (335 joueurs, dont les 16 de Paris) |
| `open_meteo/paris_horaire_20250815_20260715.json` | `archive-api.open-meteo.com/v1/archive` | Météo horaire à Paris (48.8566, 2.3522) du 15/08/2025 au 15/07/2026 : température, ressenti, précipitations, neige, code temps, nébulosité, vent |
| `calendrier_scolaire/zone_c_2025_2026.json` | `data.education.gouv.fr` — dataset `fr-en-calendrier-scolaire` | Vacances scolaires de la zone C, année 2025-2026 |
| `calendrier_scolaire/zone_c_2026_2027.json` | même source | Année 2026-2027 |
| `population/communes_idf_population.json` | `geo.api.gouv.fr/communes` | Nom, code INSEE, codes postaux et population des 1 266 communes d'Île-de-France (départements 75 à 95) |
| `population/arrondissements_paris_population.json` | même API, `type=arrondissement-municipal` | Population des 20 arrondissements de Paris |
