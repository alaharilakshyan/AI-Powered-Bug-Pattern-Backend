package com.buggraph.backend.controller;

import com.buggraph.backend.model.BugEntity;
import com.buggraph.backend.repository.BugRepository;
import com.buggraph.backend.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @Autowired
    private AiService aiService;

    @Autowired
    private BugRepository bugRepository;

    @PostMapping("/solve")
    public Map<String, Object> solve(@RequestBody Map<String, Object> payload) {
        String errorSnippet = extractError(payload);

        // 1. Run AI analysis (or resilient fallback)
        Map<String, Object> rawResult = aiService.analyzeError(errorSnippet);
        Map<String, Object> response = new HashMap<>(rawResult);

        // 2. Query Knowledge Graph pattern nodes from Database
        try {
            String keyword = errorSnippet.split("[\n:]")[0].trim();
            List<BugEntity> matched = bugRepository.searchBugs(keyword);
            response.put("matchedGraphNodes", matched != null ? matched.stream().limit(3).toList() : Collections.emptyList());
        } catch (Exception ex) {
            response.put("matchedGraphNodes", Collections.emptyList());
        }

        return response;
    }

    @PostMapping("/explain")
    public Map<String, Object> explain(@RequestBody Map<String, Object> payload) {
        String errorSnippet = extractError(payload);
        return aiService.explainError(errorSnippet);
    }

    @PostMapping("/fix")
    public Map<String, Object> fix(@RequestBody Map<String, Object> payload) {
        String errorSnippet = extractError(payload);
        return aiService.generateFix(errorSnippet);
    }

    private String extractError(Map<String, Object> payload) {
        String err = String.valueOf(payload.getOrDefault("error", ""));
        if (err.isBlank()) {
            err = String.valueOf(payload.getOrDefault("stackTrace", ""));
        }
        return err.isBlank() ? "Unknown error" : err;
    }
}