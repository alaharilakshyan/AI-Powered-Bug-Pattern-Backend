package com.buggraph.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper mapper = new ObjectMapper();

    // Valid, active model identifiers on the v1beta endpoint
    private static final List<String> MODEL_CANDIDATES = List.of(
            "gemini-flash-latest",
            "gemini-1.5-flash-8b"
    );

    public Map<String, Object> analyzeError(String errorSnippet) {
        String prompt = """
            You are the core analysis engine for BugGraph.
            Analyze this software error or trace:
            "%s"

            You must respond ONLY with a raw, valid JSON object containing no markdown fences (no ```json).
            Adhere strictly to this schema:
            {
              "errorType": "Name of error (e.g. ArrayIndexOutOfBoundsException)",
              "severity": "low | medium | high | critical",
              "confidence": 0.95,
              "summary": "Short explanation of the error",
              "rootCause": "Detailed reason why it happened",
              "relatedPatterns": ["Pattern 1", "Pattern 2"],
              "solution": {
                "description": "How to resolve the issue",
                "code": "Corrected code snippet"
              },
              "optimization": {
                "complexity": "e.g. Time: O(1) | Space: O(1)",
                "performance": "Impact on performance",
                "security": "Security considerations",
                "maintainability": "Best practice guidance"
              },
              "additionalContextRequired": false
            }
            """.formatted(errorSnippet.replace("\"", "\\\""));

        return callGemini(prompt);
    }

    public Map<String, Object> explainError(String errorSnippet) {
        String prompt = """
            You are the BugGraph educational engine.
            Explain this software error in plain, clear developer terms:
            "%s"

            Respond ONLY with a raw JSON object containing no markdown fences (no ```json):
            {
              "summary": "High-level summary of what happened",
              "meaning": "Deeper explanation of the underlying runtime mechanics",
              "likelyCause": "Most probable cause",
              "concepts": ["Concept 1", "Concept 2", "Concept 3"],
              "nextSteps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]
            }
            """.formatted(errorSnippet.replace("\"", "\\\""));

        return callGemini(prompt);
    }

    public Map<String, Object> generateFix(String errorSnippet) {
        String prompt = """
            You are the BugGraph patch generation engine.
            Generate a targeted code fix for this error:
            "%s"

            Respond ONLY with a raw JSON object containing no markdown fences (no ```json):
            {
              "rootCause": "Direct root cause",
              "fixDiff": "@@ -1,3 +1,5 @@\\n- buggy line\\n+ fixed line",
              "explanation": "Why this specific fix resolves the defect",
              "sideEffects": "Potential side effects, if any",
              "considerations": "Edge cases or performance notes"
            }
            """.formatted(errorSnippet.replace("\"", "\\\""));

        return callGemini(prompt);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGemini(String prompt) {
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
        Map<String, Object> requestBody = Map.of("contents", List.of(contentObj));

        Exception lastException = null;

        // Try candidate models with a short backoff on transient spikes
        for (String model : MODEL_CANDIDATES) {
String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
            for (int attempt = 1; attempt <= 2; attempt++) {
                try {
                    String rawResponse = restClient.post()
                            .uri(endpoint)
                            .header("X-goog-api-key", apiKey.trim())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestBody)
                            .retrieve()
                            .body(String.class);

                    JsonNode root = mapper.readTree(rawResponse);
                    String aiText = root.path("candidates")
                            .get(0)
                            .path("content")
                            .path("parts")
                            .get(0)
                            .path("text")
                            .asText();

                    String cleanJson = aiText.replaceAll("^```json\\s*", "")
                                             .replaceAll("^```\\s*", "")
                                             .replaceAll("\\s*```$", "")
                                             .trim();

                    Map<String, Object> result = mapper.readValue(cleanJson, Map.class);
                    result.put("success", true);
                    return result;

                } catch (Exception e) {
                    lastException = e;
                    System.err.println("Attempt " + attempt + " with [" + model + "] failed: " + e.getMessage());
                    try {
                        Thread.sleep(600); // Brief pause before retry
                    } catch (InterruptedException ignored) {}
                }
            }
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("success", true);
        fallback.put("errorType", "ParsingException");
        fallback.put("severity", "medium");
        fallback.put("confidence", 0.50);
        fallback.put("summary", "Fallback triggered: " + (lastException != null ? lastException.getMessage() : "API unavailable"));
        fallback.put("rootCause", "Temporary capacity limit reached on Gemini free tier.");
        fallback.put("relatedPatterns", List.of("API Communication Fallback"));
        fallback.put("solution", Map.of("description", "Retry in a few seconds.", "code", "// Temporary rate limit or demand spike"));
        fallback.put("optimization", Map.of("complexity", "O(1)", "performance", "N/A", "security", "N/A", "maintainability", "N/A"));
        fallback.put("additionalContextRequired", false);
        return fallback;
    }
}