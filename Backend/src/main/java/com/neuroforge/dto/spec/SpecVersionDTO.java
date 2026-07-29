package com.neuroforge.dto.spec;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecVersionDTO {
    private Integer version;
    private String status;
    private String updatedAt;
    private String updatedBy;
}
