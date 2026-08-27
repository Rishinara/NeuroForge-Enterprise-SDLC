package com.neuroforge.enums;

public enum Role {
    SUPER_ADMIN,
    ORG_ADMIN,
    PROJECT_MANAGER,
    DEVELOPER,
    FRONTEND_DEVELOPER,
    BACKEND_DEVELOPER,
    QA_TESTER,
    CLIENT,
    ROLE_USER,
    ROLE_ADMIN;

    public boolean isDeveloper() {
        return this == DEVELOPER || this == FRONTEND_DEVELOPER || this == BACKEND_DEVELOPER;
    }
}