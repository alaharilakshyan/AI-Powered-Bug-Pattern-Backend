package com.buggraph.backend.controller;

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

    @PostMapping("/solve")
    public Map<String, Object> solve(@RequestBody Map<String, Object> payload) {
        String errorSnippet = extractError(payload);
        return aiService.analyzeError(errorSnippet);
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