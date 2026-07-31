package com.neuroforge.entity;

import jakarta.persistence.*;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Organization organization;

    @ManyToMany(mappedBy = "teams")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<User> users = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

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


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Team)) return false;
        Team other = (Team) o;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
