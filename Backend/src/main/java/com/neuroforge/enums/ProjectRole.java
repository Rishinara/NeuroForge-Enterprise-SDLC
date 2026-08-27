package com.neuroforge.enums;

public enum ProjectRole {
    PROJECT_MANAGER,

    DEVELOPER,

    FRONTEND_DEVELOPER,

    BACKEND_DEVELOPER,

    QA,

    CLIENT,
    
    ORG_ADMIN,
    
    SUPER_ADMIN;

    public boolean isDeveloper() {
        return this == DEVELOPER || this == FRONTEND_DEVELOPER || this == BACKEND_DEVELOPER;
    }
}
