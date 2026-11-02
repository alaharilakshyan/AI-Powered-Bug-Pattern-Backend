package com.buggraph.backend.controller;

import com.buggraph.backend.dto.BugRequestDto;
import com.buggraph.backend.model.BugEntity;
import com.buggraph.backend.repository.BugRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bugs")
@CrossOrigin(origins = "*")
public class BugController {

    @Autowired
    private BugRepository bugRepository;

    @GetMapping
    public List<BugEntity> getBugs(@RequestParam(value = "q", defaultValue = "") String query) {
        if (query == null || query.isBlank()) {
            return bugRepository.findAll();
        }
        return bugRepository.searchBugs(query.trim());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBug(@Valid @RequestBody BugRequestDto request) {
        String bugId = "bug_" + UUID.randomUUID().toString().substring(0, 8);

        BugEntity bug = new BugEntity(
                bugId,
                request.getTitle(),
                request.getDescription(),
                request.getStackTrace(),
                request.getSeverity(),
                request.getComponent(),
                request.getTags()
        );

        BugEntity savedBug = bugRepository.save(bug);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", savedBug);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public Map<String, Object> getBugStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBugs", bugRepository.count());
        return stats;
    }
}