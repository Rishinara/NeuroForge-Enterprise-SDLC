package com.neuroforge.dto.project;

import com.neuroforge.enums.ProjectRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberResponse {

    private Long id;

    private String fullName;

    private String email;

    private ProjectRole projectRole;

}