package com.buggraph.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class BugRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String stackTrace;
    private String severity;
    private String component;
    private String tags;

    public BugRequestDto() {}

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
}