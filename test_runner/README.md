# Test Runner for Postman Collections

## Exécution

```bash
dotnet run
```

## Versions Log

### V0.0.3 - 2025-01-12

- Formatage JSON aussi pour les body et les responses
- Correction d'une incohérence dans les données du test 70 (sans impact sur le résultat du tests)

### V0.0.2 - 2025-11-11

- Paramètre `checkOrder` pour vérifier l'ordre des éléments dans la réponse
- Paramètre `formatJson` pour formattage JSON dans la console
- Vérification que les réponses sont du JSON (ou vide)
- Affichage des stats globales sur les tests par endpoint
- Tolérance de <0,02€ pour les valeurs numériques pour ignorer les erreurs d'arrondis

### V0.0.1 - 2025-11-06

- README
- numéro version
- vérification statusCodes : aussi si celui qu'on reçoit est inférieur à 300

### V0.0.0 - 2025-11-03
    
- Version initiale
