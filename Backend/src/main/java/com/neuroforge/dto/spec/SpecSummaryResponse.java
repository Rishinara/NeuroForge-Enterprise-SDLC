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
public class SpecSummaryResponse {
    private Long id;
    private String title;
    private Integer storyCount;
    private String updatedAt;
    private Integer version;
    private String status;
}
