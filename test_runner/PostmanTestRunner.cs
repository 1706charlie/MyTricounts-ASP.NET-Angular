using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace test_runner;

public class PostmanTestRunner(
    string jsonFilePath,
    string baseUrl,
    bool showUrls = false,
    bool showBody = false,
    bool showResponse = false,
    bool validateResponseOnError = false,
    bool validateStatusCodeOnError = false,
    bool stopOnFirstError = false,
    int? stopAfterTestId = null,
    bool showSummary = false,
    bool formatJson = false,
    bool checkOrder = false)
{
    private readonly bool _checkOrder = checkOrder;
    private JsonElement _collection;
    private Dictionary<string, string> _variables = new();
    private string? _accessToken;
    private int _testCount = 0;
    private readonly Dictionary<string, EndpointStats> _endpointStats = new();

    private readonly HttpClient _client = new();

    private class EndpointStats {
        public int Passed { get; set; }
        public int Failed { get; set; }
        public int Warnings { get; set; }
    }

    private class StopExecutionException : Exception {
        public StopExecutionException() : base() { }
    }

    public async Task RunAsync() {
        try {
            Console.WriteLine($"Postman Test Runner - Version: {Assembly.GetExecutingAssembly().GetName().Version}");
            await LoadCollection();
            Console.WriteLine($"\nCollection: {_collection.GetProperty("info").GetProperty("name").GetString()}");
            await WalkItems(_collection.GetProperty("item"));
        } catch (StopExecutionException) {
            // Arrêt demandé, on affiche le résumé avant de quitter
        } finally {
            if (showSummary) {
                DisplaySummary();
            }
        }
    }

    private async Task LoadCollection() {
        var json = await File.ReadAllTextAsync(jsonFilePath);
        _collection = JsonDocument.Parse(json).RootElement;

        _variables = new Dictionary<string, string>();
        if (_collection.TryGetProperty("variable", out var varArray)) {
            foreach (var v in varArray.EnumerateArray()) {
                // Console.WriteLine(v.GetProperty("key") + " - " + v.GetProperty("value"));
                var key = v.GetProperty("key").GetString() ?? "";
                var value = v.GetProperty("value").GetString() ?? "";
                _variables[key] = value;
            }
        }

        _variables["BASE_URL"] = baseUrl;
        _variables["today"] = DateTime.Today.ToString("yyyy-MM-dd");
    }

    private async Task WalkItems(JsonElement items) {
        foreach (var item in items.EnumerateArray()) {
            if (item.TryGetProperty("item", out var subItems)) {
                Console.WriteLine($">> Group: {item.GetProperty("name").GetString()}");
                await WalkItems(subItems);
            } else {
                try {
                    await RunTest(item);
                    _testCount++;
                    if (stopAfterTestId.HasValue && _testCount >= stopAfterTestId.Value)
                        return;
                } catch (InvalidOperationException) {
                    Console.WriteLine("URL not found");
                } catch (StopExecutionException) {
                    throw; // Propager l'exception pour arrêter l'exécution
                } catch (Exception e) {
                    Console.WriteLine("Unexpected error: " + e);
                    if (showSummary) {
                        DisplaySummary();
                    }
                    Environment.Exit(1);
                }
            }
        }
    }

    private string Interpolate(string? input) {
        if (input == null) return "";
        foreach (var pair in _variables) {
            input = input.Replace("{{" + pair.Key + "}}", pair.Value);
        }

        return input;
    }

    private async Task RunTest(JsonElement item) {
        var name = item.GetProperty("name").GetString() ?? "(Unnamed Test)";
        bool testPassed = true;
        bool hasWarning = false;
        string? endpointKey = null;
        
        try {
            var request = item.GetProperty("request");
            var method = request.GetProperty("method").GetString() ?? "GET";
            var url = Interpolate(request.GetProperty("url").GetProperty("raw").GetString());
            
            if (showSummary) {
                // Utiliser le nom du test (pas l'URL) pour éviter que les paramètres d'URL créent des endpoints distincts
                // Supprimer les numéros entre parenthèses et les paramètres de requête (tout ce qui suit ?)
                endpointKey = Regex.Replace(name, @"\s*\([^)]*\)\s*", "").Trim();
                // Supprimer les paramètres de requête (tout ce qui suit ?)
                var questionMarkIndex = endpointKey.IndexOf('?');
                if (questionMarkIndex >= 0) {
                    endpointKey = endpointKey.Substring(0, questionMarkIndex).Trim();
                }
            }
            var body = request.TryGetProperty("body", out var b) && b.TryGetProperty("raw", out var raw)
                ? Interpolate(CleanJson(raw.GetString()))
                : null;
            var savedResponse = item.TryGetProperty("response", out var responses) && responses.GetArrayLength() > 0
                ? responses[0]
                : default;

            var expectedStatus = savedResponse.ValueKind != JsonValueKind.Undefined
                ? savedResponse.GetProperty("code").GetInt32()
                : 200;
            var expectedBody =
                savedResponse.ValueKind != JsonValueKind.Undefined && savedResponse.TryGetProperty("body", out var eb)
                    ? Interpolate(CleanJson(eb.GetString()))
                    : null;
            Console.WriteLine(showUrls ? $"> {name} ({method} {url})" : $"> {name}");
            if (showBody && method == "POST" && body != null) {
                Console.WriteLine("body: " + FormatJsonIfNeeded(body));
            }

            var requestMessage = new HttpRequestMessage(new HttpMethod(method), url);
            if (!string.IsNullOrEmpty(body)) {
                requestMessage.Content = new StringContent(body);
                requestMessage.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            }

            if (!string.IsNullOrEmpty(_accessToken))
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

            var response = await _client.SendAsync(requestMessage);
            var actualBody = await response.Content.ReadAsStringAsync();
            
            // Valider que si la réponse n'est pas vide, elle doit être un JSON valide
            bool isValidJson = string.IsNullOrWhiteSpace(actualBody) || IsValidJson(actualBody);
            
            if (showResponse) {
                Console.WriteLine($"response: {FormatJsonIfNeeded(actualBody)}");
            }
            if (!string.IsNullOrWhiteSpace(actualBody) && !isValidJson) {
                Console.WriteLine("Erreur: La réponse n'est pas vide et n'est pas un JSON valide");
                if (!showResponse)
                    Console.WriteLine(actualBody);
                testPassed = false;
                if (stopOnFirstError) throw new StopExecutionException();
            }

            if ((expectedStatus < 300 || (int)response.StatusCode < 300 || validateStatusCodeOnError) &&
                response.StatusCode != (HttpStatusCode)expectedStatus) {
                Console.WriteLine($"Erreur: Statut attendu: {expectedStatus}, reçu: {(int)response.StatusCode}");
                if (!showResponse) {
                    Console.WriteLine(FormatJsonIfNeeded(actualBody));
                }
                testPassed = false;
                if (stopOnFirstError) throw new StopExecutionException();
            }

            if (!string.IsNullOrWhiteSpace(expectedBody) && (expectedStatus < 300 || validateResponseOnError) && isValidJson) {
                var expected = JsonDocument.Parse(expectedBody).RootElement;
                var actual = string.IsNullOrWhiteSpace(actualBody) ? new JsonElement() : JsonDocument.Parse(actualBody).RootElement;
                var diffs = new List<string>();
                bool warningGenerated = false;

                if (IsLogin(name, actual)) {
                    _accessToken = actual.GetProperty("token").GetString();
                } else if (!DeepEquals(expected, actual, diffs, out warningGenerated, formatJson)) {
                    Console.WriteLine("Erreur: Différences:");
                    diffs.ForEach(Console.WriteLine);
                    var options = new JsonSerializerOptions { WriteIndented = formatJson };
                    Console.WriteLine("Actual: " + JsonSerializer.Serialize(actual, options));
                    Console.WriteLine("Expected: " + JsonSerializer.Serialize(expected, options));
                    testPassed = false;

                    if (stopOnFirstError) throw new StopExecutionException();
                } else if (warningGenerated) {
                    hasWarning = true;
                }
            }
        } catch (StopExecutionException) {
            testPassed = false;
            throw; // Propager l'exception pour arrêter l'exécution
        } catch (Exception e) {
            Console.WriteLine("Erreur: Error during test execution: " + e);
            testPassed = false;
            if (stopOnFirstError) throw new StopExecutionException();
        } finally {
            if (showSummary && endpointKey != null) {
                if (!_endpointStats.ContainsKey(endpointKey)) {
                    _endpointStats[endpointKey] = new EndpointStats();
                }
                
                if (testPassed) {
                    _endpointStats[endpointKey].Passed++;
                } else {
                    _endpointStats[endpointKey].Failed++;
                }
                
                if (hasWarning) {
                    _endpointStats[endpointKey].Warnings++;
                }
            }
        }
    }

    private bool IsLogin(string name, JsonElement response) {
        return name.ToLower().Contains("login") && response.TryGetProperty("token", out _);
    }

    private bool IsValidJson(string json) {
        if (string.IsNullOrWhiteSpace(json))
            return true;
        
        try {
            JsonDocument.Parse(json);
            return true;
        } catch (JsonException) {
            return false;
        }
    }

    private string FormatJsonIfNeeded(string json) {
        if (!formatJson || string.IsNullOrWhiteSpace(json) || !IsValidJson(json)) {
            return json;
        }
        
        try {
            using var doc = JsonDocument.Parse(json);
            var options = new JsonSerializerOptions { WriteIndented = true };
            return JsonSerializer.Serialize(doc.RootElement, options);
        } catch {
            return json;
        }
    }

    private bool DeepEquals(JsonElement a, JsonElement b, List<string> diffs, out bool warningGenerated, bool formatJson = false, string path = "") {
        warningGenerated = false;
        if (a.ValueKind != b.ValueKind) {
            diffs.Add($"{path}: types différents ({a.ValueKind} vs {b.ValueKind})");
            return false;
        }

        switch (a.ValueKind) {
            case JsonValueKind.Object:
                var aProps = a.EnumerateObject().ToList();
                var bProps = b.EnumerateObject().ToDictionary(p => p.Name, p => p.Value);
                foreach (var prop in aProps) {
                    var newPath = string.IsNullOrEmpty(path) ? prop.Name : $"{path}.{prop.Name}";
                    if (!bProps.TryGetValue(prop.Name, out JsonElement bProp)) {
                        diffs.Add($"{newPath}: propriété absente");
                        return false;
                    }

                    if (prop.Name == "created_at") {
                        var val = prop.Value.ToString();
                        if (!Regex.IsMatch(val, @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?")) {
                            diffs.Add($"{newPath}: format date invalide");
                            return false;
                        }
                    } else if (!DeepEquals(prop.Value, bProp, diffs, out var propWarning, formatJson, newPath)) {
                        warningGenerated |= propWarning;
                        return false;
                    } else {
                        warningGenerated |= propWarning;
                    }
                }

                return true;

            case JsonValueKind.Array:
                var aItems = a.EnumerateArray().ToList();
                var bItems = b.EnumerateArray().ToList();
                if (aItems.Count != bItems.Count) {
                    diffs.Add($"{path}: tailles différentes ({aItems.Count} vs {bItems.Count})");
                    return false;
                }

                var unmatched = new List<JsonElement>(bItems);
                foreach (var item in aItems) {
                    int matchIndex = unmatched.FindIndex(bItem => DeepEquals(item, bItem, new List<string>(), out _, formatJson, path));
                    if (matchIndex == -1) {
                        var options = new JsonSerializerOptions { WriteIndented = formatJson };
                        var itemJson = JsonSerializer.Serialize(item, options);
                        diffs.Add($"{path}: élément non trouvé : {itemJson}");
                        return false;
                    }

                    unmatched.RemoveAt(matchIndex);
                }

                bool orderPreserved = true;
                for (int i = 0; i < aItems.Count; i++) {
                    if (!DeepEquals(aItems[i], bItems[i], new List<string>(), out _, formatJson, path)) {
                        orderPreserved = false;
                        break;
                    }
                }

                if (_checkOrder && !orderPreserved) {
                    Console.WriteLine($"Warning: ordre différent dans la liste: {path}");
                    Console.WriteLine("Expected: " + string.Join(", ", aItems.Select(i => i.ToString())));
                    Console.WriteLine("Actual: " + string.Join(", ", bItems.Select(i => i.ToString())));
                    warningGenerated = true;
                }

                return true;

            default:
                return DeepCompareValues(a, b, diffs, path);
        }
    }

    private bool DeepCompareValues(JsonElement a, JsonElement b, List<string> diffs, string path) {
        if (a.ValueKind == JsonValueKind.Number && b.ValueKind == JsonValueKind.Number) {
            var aDouble = a.GetDouble();
            var bDouble = b.GetDouble();
            if (Math.Abs(aDouble - bDouble) < 0.02) return true;
            diffs.Add($"{path}: valeurs numériques différentes ({aDouble} vs {bDouble})");
            return false;
        }

        if (a.ValueKind == JsonValueKind.String && b.ValueKind == JsonValueKind.String) {
            if (a.GetString()?.Trim() == b.GetString()?.Trim()) return true;
            diffs.Add($"{path}: chaînes différentes ('{a.GetString()}' vs '{b.GetString()}')");
            return false;
        }

        if (a.ValueKind == JsonValueKind.True || a.ValueKind == JsonValueKind.False) {
            if (a.GetBoolean() == b.GetBoolean()) return true;
            diffs.Add($"{path}: booléens différents ({a.GetBoolean()} vs {b.GetBoolean()})");
            return false;
        }

        if (a.ToString() == b.ToString()) return true;
        diffs.Add($"{path}: valeurs différentes ({a} vs {b})");
        return false;
    }

    private static string CleanJson(string? json) {
        if (string.IsNullOrEmpty(json)) return "";
        var lines = json.Split('\n');
        return string.Join('\n',
            lines.Select(l => l.Contains("//") ? l[..l.IndexOf("//", StringComparison.Ordinal)] : l));
    }

    private void DisplaySummary() {
        Console.WriteLine("\n" + new string('=', 80));
        Console.WriteLine("RÉSUMÉ DES TESTS PAR ENDPOINT");
        Console.WriteLine(new string('=', 80));
        
        if (_endpointStats.Count > 0) {
            // Calculer la largeur maximale du nom d'endpoint pour l'alignement
            var maxNameLength = _endpointStats.Keys.Max(k => k.Length);
            var nameColumnWidth = Math.Max(maxNameLength, 30);
            
            // En-tête des colonnes - format exactement comme les données
            // "Passed/Total" fait 12 caractères, donc on doit utiliser au moins cette largeur
            var passedTotalWidth = Math.Max("Passed/Total".Length, 12);
            // Les données utilisent {successRate,3}% qui fait toujours 4 caractères (3 pour le nombre + 1 pour "%")
            // "Ratio" fait 5 caractères, donc on utilise 5 pour l'en-tête, mais les données restent à 4 caractères
            var ratioWidth = 5;
            Console.WriteLine($"{"Endpoint".PadRight(nameColumnWidth)} {"Passed/Total".PadRight(passedTotalWidth)} {"Ratio".PadLeft(ratioWidth)} {"Warning".PadRight(8)}");
            Console.WriteLine(new string('-', 80));
            
            foreach (var kvp in _endpointStats.OrderBy(e => e.Key)) {
                var stats = kvp.Value;
                var total = stats.Passed + stats.Failed;
                var successRate = total > 0 ? Math.Round(stats.Passed * 100.0 / total) : 0;
                
                // Warning uniquement si au moins un test a généré un warning
                var warning = stats.Warnings > 0 ? "warning" : "";
                
                var countStr = $"{stats.Passed}/{total}";
                var warningColumn = warning.PadRight(8);
                // Les données utilisent {successRate,3}% (4 caractères), on les aligne à droite dans la colonne Ratio (5 caractères)
                var rateStr = $"{successRate,3}%".PadLeft(ratioWidth);
                Console.WriteLine($"{kvp.Key.PadRight(nameColumnWidth)} {countStr.PadRight(passedTotalWidth)} {rateStr} {warningColumn}");
            }
            
            // Ligne de total
            var totalPassed = _endpointStats.Values.Sum(s => s.Passed);
            var totalFailed = _endpointStats.Values.Sum(s => s.Failed);
            var grandTotal = totalPassed + totalFailed;
            var totalWarnings = _endpointStats.Values.Sum(s => s.Warnings);
            var overallRate = grandTotal > 0 ? Math.Round(totalPassed * 100.0 / grandTotal) : 0;
            
            Console.WriteLine(new string('-', 80));
            var totalCountStr = $"{totalPassed}/{grandTotal}";
            var totalWarningColumn = (totalWarnings > 0 ? "warning" : "").PadRight(8);
            var totalRateStr = $"{overallRate,3}%".PadLeft(ratioWidth);
            Console.WriteLine($"{"TOTAL".PadRight(nameColumnWidth)} {totalCountStr.PadRight(passedTotalWidth)} {totalRateStr} {totalWarningColumn}");
        }
        
        Console.WriteLine(new string('=', 80));
    }
}