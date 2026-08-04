package com.neuroforge.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams",uniqueConstraints = {
        @UniqueConstraint(
                columnNames = {"org_id", "name"}
        )
})
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private User lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@JoinColumn(name = "org_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore    private Organization organization;

    @ManyToMany(mappedBy = "teams")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<User> users = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Team() {}
    public Team(String name, Organization organization) {
        this.name = name;
        this.organization = organization;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<User> getUsers() {return users;}
    public void setUsers(List<User> users) {this.users = users;}
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public User getLead() { return lead; }
    public void setLead(User lead) { this.lead = lead; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

}
