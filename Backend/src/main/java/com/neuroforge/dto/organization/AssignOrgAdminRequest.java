package com.neuroforge.dto.organization;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AssignOrgAdminRequest {
    @NotNull
    private Long userId;
}
