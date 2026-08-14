package com.neuroforge.dto.project;

import com.neuroforge.enums.ProjectRole;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProjectRoleRequest {
    private ProjectRole role;
}
