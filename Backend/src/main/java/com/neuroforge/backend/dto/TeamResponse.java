package com.neuroforge.backend.dto;

public class TeamResponse {
    private Long id;
    private String name;
    private int memberCount;

    public TeamResponse(Long id, String name, int memberCount) {
        this.id = id;
        this.name = name;
        this.memberCount = memberCount;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getMemberCount() { return memberCount; }
}
