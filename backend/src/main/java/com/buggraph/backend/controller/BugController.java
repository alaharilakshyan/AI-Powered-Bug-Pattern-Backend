package com.buggraph.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/bugs")
@CrossOrigin(origins = "*")
public class BugController {

    // Simple in-memory list to store bugs temporarily
    private final List<Map<String, Object>> bugs = new ArrayList<>();

    // 1. Handles the health-check / query from api.js: client.get('/api/bugs?q=')
    @GetMapping
    public List<Map<String, Object>> getBugs(@RequestParam(value = "q", defaultValue = "") String query) {
        return bugs;
    }

    // 2. Handles bug submissions from api.js: client.post('/api/bugs', payload)
    @PostMapping
    public Map<String, Object> createBug(@RequestBody Map<String, Object> payload) {
        String bugId = "bug_" + UUID.randomUUID().toString().substring(0, 8);
        payload.put("id", bugId);
        payload.put("createdAt", new Date().toString());
        bugs.add(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payload);
        return response;
    }
}