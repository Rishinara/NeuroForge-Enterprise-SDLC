package com.neuroforge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_stories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "as_a", length = 1000)
    private String asA;

    @Column(name = "i_want", length = 1000)
    private String iWant;

    @Column(name = "so_that", length = 1000)
    private String soThat;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_story_criteria",
            joinColumns = @JoinColumn(name = "user_story_id")
    )
    @Column(name = "criterion", length = 2000)
    private List<String> criteria = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spec_id")
    private Spec spec;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserStory)) return false;
        UserStory other = (UserStory) o;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
