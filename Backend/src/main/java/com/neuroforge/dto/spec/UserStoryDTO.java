package com.neuroforge.dto.spec;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStoryDTO {
    private String id; // can be "local-..." on frontend, so we accept string
    private String asA;
    private String iWant;
    private String soThat;
    private List<String> criteria;
}
