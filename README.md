# Analyse exploratoire : résultats sportifs et ventes boutique

Ce projet étudie les recettes de la boutique physique les jours de match à domicile du Paris Basketball. Il compare quatre situations : victoire ou défaite, avec Paris à 100 points ou plus ou à moins de 100 points.

Le seuil est inclusif : **100 points exactement déclenche** l’indicateur `promo_declenchee`. Le dashboard montre les recettes de la journée entière et, séparément, les recettes de la fenêtre estimée T+1 h 40 à T+2 h 40. Les résultats sont descriptifs et ne mesurent pas à eux seuls l’effet causal d’une réduction proposée à la sortie.

## Lancer le dashboard

Prérequis : Python 3.10 ou plus récent, pandas et Flask.

```powershell
python -m pip install -r requirements.txt
python src/server.py
```

Ouvre ensuite `http://127.0.0.1:8000`. Le serveur relit les fichiers locaux et calcule les indicateurs lorsqu’il reçoit une demande sur `/api/dashboard`. Le HTML et le JavaScript ne contiennent aucun enregistrement métier. L’API renvoie uniquement les mesures agrégées par match nécessaires aux graphiques et au tableau ; les exports source, les lignes de caisse et les données client ne sont pas servis.

Le pipeline peut aussi être exécuté seul pour régénérer les agrégats de contrôle :

```powershell
python src/pipeline.py
```

Il produit :

- `gold/match_shop_performance.csv` : une ligne par match à domicile, avec le résultat, les recettes boutique, les entrées scannées, le remplissage estimé et les recettes sur la fenêtre T+1 h 40 à T+2 h 40 ;
- `gold/data_quality.csv` : volume lu/utilisé/écarté et anomalies rencontrées par source ;

## Structure

```text
src/pipeline.py                 ingestion, nettoyage, jointures et agrégations
src/server.py                   serveur web local et endpoint des mesures agrégées
src/dashbord.html               interface du dashboard, sans données intégrées
src/dashboard.css               styles du dashboard
src/dashboard.js                interactions, graphiques et chargement de l’API
gold/                           agrégats et rapport qualité générés
NOTES.md                        question métier, résultat provisoire et limites
```
