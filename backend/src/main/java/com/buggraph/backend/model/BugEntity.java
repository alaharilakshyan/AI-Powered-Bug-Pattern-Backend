package com.buggraph.backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bugs")
public class BugEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String stackTrace;

    private String severity;
    private String component;
    private String tags;

    private LocalDateTime createdAt;

    public BugEntity() {}

    public BugEntity(String id, String title, String description, String stackTrace, String severity, String component, String tags) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.stackTrace = stackTrace;
        this.severity = severity != null ? severity : "medium";
        this.component = component != null ? component : "default-service";
        this.tags = tags;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getComponent() { return component; }
    public void setComponent(String component) { this.component = component; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

