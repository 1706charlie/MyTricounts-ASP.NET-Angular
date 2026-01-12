using test_runner;

const string testFilePath = "postman_tests.json";

var runner = new PostmanTestRunner(testFilePath,
    baseUrl: "http://localhost:3000",
    // baseUrl: "http://infolab.epfc.eu:58XXX",    // remplacer XXX par le numéro de votre machine
    showUrls: true,
    showBody: false,
    showResponse: false,
    validateResponseOnError: false,
    validateStatusCodeOnError: false,
    stopOnFirstError: false,
    stopAfterTestId: null,      // null pour exécuter tous les tests
    showSummary: true,          // true pour afficher un résumé des tests réussis
    formatJson: false,          // true pour formater le JSON dans la console
    checkOrder: true            // true pour vérifier l'ordre des éléments dans la réponse
);

await runner.RunAsync();
