package com.neuroforge.dto;

public class OrgSettingsRequest {
    private String name;
    private String description;
    private String supportEmail;

    public OrgSettingsRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }
}
