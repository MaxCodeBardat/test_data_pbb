# Notes d’analyse

## Question métier

Lors de toutes les fois où j'étais à l'Adidas Arena en tant qu'ambassadeur ou simple supporter, j'ai observé une chose : A chaque fois que Paris scorait 100 points ou plus, une annonce de réduction de 10% sur toute la boutique était faite.

Je me suis alors toujours demandé quel impact cette annonce avait sur les comportement de consommation des clients. Est-ce que ça augmentait drastiquement les ventes d'après-match ? Est ce que ça ne changeait pas grand chose ?

Voilà pourquoi j'ai décidé de traiter de cette question : **100 points ou plus par match, quel impact l'annonce des 10% de réduction sur la boutique a-t'elle sur la consommation des clients du Paris BasketBall après un match ?**

Cela implique bien évidemment d'autres sous-question, comme **l'impact d'une défaite ou d'une victoire dans ce comportement**, ou bien **l'impact de l'adversaire et du championnat** (Une grosse équipe d'Euroleague ne va pas attirer le même public qu'un match du milieu de tableau en BETCLIC ELITE).

## Chiffres clés

- Data basée sur les 41 matchs à domicile de la saison 2025/2026
- Distinction en 4 groupes :
  - Victoires avec 100 points ou + marqués (10)
  - Défaites avec 100 points ou + marqués (3)
  - Victoires avec - de 100 points marqués (12)
  - Défaites avec - de 100 points marqués (16)
- Boutique : magasin physique `ARENA`. Les commandes `ESHOP` sont exclues.
- Recettes du jour : montant net des lignes de vente et d’avoir validées à la date du match. Les avoirs ont un montant négatif et réduisent le chiffre d’affaires.
- Fenêtre d'après match : ventes enregistrées entre **T+1 h 40 et T+2 h 40 après le coup d’envoi**. Faute d’heure réelle de fin, T+1 h 40 sert d’estimation de fin de jeu ; cette fenêtre d’une heure n’est pas une mesure exacte de l’après-match.
- Codes de réduction : le fichier comprend plusieurs taux de `CODE_PROMO`, dont 10 %, mais aucun identifiant propre à l’offre déclenchée par le score. Je me suis donc basé uniquement sur les horaires de fin de match.
- Fréquentation : nombre de codes-barres distincts vus au moins une fois dans un scan `OK`. C’est une estimation des entrées, pas des billets vendus ou des personnes uniques.

### Résultats descriptifs

| Scénario                      | Matchs | CA boutique net moyen, jour entier | CA boutique net moyen, fenêtre T+1h40 à T+2h40 |
| ----------------------------- | -----: | ---------------------------------: | ---------------------------------------------: |
| Victoire, 100 points ou plus  |     10 |                           28 605 € |                                        1 828 € |
| Défaite, 100 points ou plus   |      3 |                           40 352 € |                                        2 363 € |
| Victoire, moins de 100 points |     12 |                           35 319 € |                                        2 101 € |
| Défaite, moins de 100 points  |     16 |                           41 768 € |                                        1 301 € |

La journée entière inclut les achats d’avant-match.
Dans la fenêtre d'après-match, on compte :

- 183 transactions de vente pour les 10 victoires à 100 points ou plus
- 100 pour les 3 défaites à 100 points ou plus
- 265 pour les victoires sous 100 points
- 191 pour les défaites sous 100 points.

Des codes `CODE_PROMO` génériques à 10 % apparaissent dans chaque groupe ; ça prouve donc que leur utilisation n'implique pas forcément les match à 100 points ou plus. On ne peut donc pas se servir de cette donnée comme référentiel.

Les graphiques du dashboard montrent d’une part le CA journée complète par affluence et, d’autre part, le CA de la fenêtre estimée par affluence, match par match. Le survol donne le match, la salle, la compétition, le score, l’affluence et les deux mesures de recettes. Ainsi, peut essayer d'analyser d'autres facteurs influençants les recettes d'après-match. Essayer de déceler des tendances, en comparant aux comportements d'avant match dans l'autre graphique, ou même juste trouver des tendances entre les matchs, des contextes communs expliquants des résultats/tendances similaires. Pour plus de détail, cliquer sur un point met en évidence le match dans le tableau.

Cet échantillon de match reste néanmoins assez petit pour obtenir des résultats pertinents.

## Interprétation des données : Ma réponse

Il y a 2 chosent qui saute aux yeux en analysant les graphiques des médianes des CA en fonction des 4 scénarios :

- Lors de l'après-match, le client consomme beacoup plus en cas de victoire de paris.
- Si l'on prend les CA journaliers, les client consomment quand même beaucoup plus lors des défaites, ou des victoires de moins de 100 points. On peut donc en déduire que les matchs gagnés avec 100 points ou plus ne sont pas des matchs qui initialement attiraient un public consommateur.

Cependant, en analysant les recettes d'après match, on peut voir que cette victoire avec 100 points ou plus de marqués à inversé la tendance.
La ou les jours de victoires de - de 100 points, qui attiraient en moyenne des consommateurs qui consomment quasiment comme ceux des jours de défaites, continuent à consommer dans l'après match et dominent le graphique (cela montre bien qu'il y a une tendance à consommer en fonction des contexte des matchs), les jours de victoires remontent la pente et incitent les clients à consommer en après match, ce qui permet très partiellement de rattrapper l'écart de CA qu'il y a avec les autres matchs.

En prenant en détail les matchs à + de 100 points qui ont le plus rapporté de CA en après match :

**Chalon le 2 mai - 5759 euros de CA après match :** le CA d'après match est nettement au dessus de tous les autres, je préfère ne pas traiter cette donnée car elle est surement dûe à un bug dans les données et des erreurs lors des saisie des heure d'achats des articles.

| Équipe    | Championnat              | CA journée | CA d'après match | Affluence |
| --------- | ------------------------ | ---------- | ---------------- | --------- |
| Baskonia  | Euroleague               | 40 992 €   | 2 807 €          | 5085      |
| Cholet    | Betclic Elite (Playoffs) | 42 072 €   | 2 426 €          | 5856      |
| Le Portel | Betclic Elite            | 17 236 €   | 2 033 €          | 4397      |

On se rend compte qu'on peut contextualiser ça individuellement :

- Baskonia : très grosse journée en terme de CA, taux de remplissage à 75% (6800 sieges max), petite équipe d'Euroleague donc + de supporter de Paris et non des gens venus voir l'équipe d'en face. Le CA d'après match suit donc logiquement la tendance d'avant match avec le code promo.
- Cholet : match de playoff, qualification pour la finale de Betclic Elite, 86 % de remplissage, petit marché donc beaucoup de gens la pour Paris, gros CA journalier, pareil, suis logiquement la tendance avec le code promo.
- Le Portel : match de betclic elite, 9 décembre donc précédent noël, équipe petit marché, seulement 64 % de remplissage, et un CA très faible sur la journée (17236 euros). On peut dire que le code promo a eu un réel impact sur les ventes d'après match, surement poussé par l'arrivée de noël, servant d'idée de cadeau. C'est un exemple typique de l'utilité du code promo, car c'est un des CA journaliers les plus faibles de l'année, toute catégorie confondue. Par contre, il est facilement dans la première moitié des CA d'après match toute catégorie confondue.

On peut donc en conclure qu'il y a bien un impact sur les ventes, ou dans 2 cas sur 3, il y avait un match a assez forte affluence, avec un CA journalier haut, et le code promo a perpétué l'élent des gens vers la boutique.
sur le dernier cas, le code promo a, dans un certains contexte, clairement boosté les ventes de la journée.

## Les limites de cette analyse

Tout d'abord, de nombreuses limites sont à poser quand à la pertinence des données.
Nous n'avons pas de certitudes que toutes les ventes d'après matchs soient prises en compte dans ces données (car pas de réel filtre correspondant). le filtre comprend les ventes entre 1h40 et 2h40 après le coup d'envoie. il y a peut etre des exceptions qui ne rentrent pas dans ce filtre.
L'échantillon est très peu élevé pour en dégager une tendance logique.
Certaines nouveautées dans la boutique ont pu pousser à une forte consommation à certains moments, et ce sont des évènements non-pris en compte.
Surement des matchs qui ramènent des groupes de touristes conséquents, cible qui va consommer + facilement pour avoir un souvenir.

Aussi, on peut se demander quelle différence il y aurait eu si aucun code promo n'avait été annoncé. Malgré l'euphorie de la victoire, il y aurait eu surement moins de ventes, mais est ce que l'absence du code de 10% aurait couvert l'augmentation des ventes, en terme de CA mais surtout de profit. C'est une question qui est difficile à traiter, même si l'on peut avoir une idée avec certains autres matchs.

On ne traite aussi pas le jour de la semaine auquel a lieu le match (en semaine les matchs ont lieu le soir, donc les gens veulent rentrer chez eux, la ou le week end les gens ont plus le temps car les matchs se jouent dans l'après midi.)

## Recommandation de mesure

- Pour évaluer la promotion, enregistrer dans la caisse un identifiant dédié à un achat d'après match, un autre qui identifie l'utilisation du code promo, et identifier l’heure d’activation, le match associé, le taux et le montant de réduction, ainsi que le total du panier.
- Il faudrait aussi disposer du coût ou de la marge des articles pour mesurer la marge incrémentale et non seulement le chiffre d’affaires.
- Une comparaison de matchs similaires ou un test contrôlé permettrait ensuite d’estimer l’effet de l’offre.
