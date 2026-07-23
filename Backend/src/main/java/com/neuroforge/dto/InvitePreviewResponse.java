package com.neuroforge.dto;

import com.neuroforge.entity.Role;

public class InvitePreviewResponse {
    private boolean valid;
    private Role role;
    private String orgName;
    private String invitedEmail;
    private String reasonIfInvalid;

    public InvitePreviewResponse(boolean valid, Role role, String orgName, String invitedEmail) {
        this.valid = valid;
        this.role = role;
        this.orgName = orgName;
        this.invitedEmail = invitedEmail;
    }

    public InvitePreviewResponse(String reasonIfInvalid) {
        this.valid = false;
        this.reasonIfInvalid = reasonIfInvalid;
    }

    public boolean isValid() { return valid; }
    public Role getRole() { return role; }
    public String getOrgName() { return orgName; }
    public String getInvitedEmail() { return invitedEmail; }
    public String getReasonIfInvalid() { return reasonIfInvalid; }
}
