package com.neuroforge.dto.auth;

import com.neuroforge.enums.Role;

public class AuthResponse {

    private String token;
    private UserPayload user;

    public AuthResponse(String token, UserPayload user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public UserPayload getUser() { return user; }

    public static class UserPayload {
        private Long userId;
        private String email;
        private String fullName;
        private Long orgId;
        private String orgName;
        private Role role;
        private Boolean orgApproved;

        public UserPayload(Long userId, String email, String fullName, Long orgId, String orgName, Role role, Boolean orgApproved) {
            this.userId = userId;
            this.email = email;
            this.fullName = fullName;
            this.orgId = orgId;
            this.orgName = orgName;
            this.role = role;
            this.orgApproved = orgApproved;
        }

        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public Long getOrgId() { return orgId; }
        public String getOrgName() { return orgName; }
        public Role getRole() { return role; }
        public Boolean getOrgApproved() { return orgApproved; }
    }
}
