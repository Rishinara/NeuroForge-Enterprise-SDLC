package com.neuroforge.dto;

public class UpdateStatusRequest {
    private boolean enabled;

    public UpdateStatusRequest() {
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
