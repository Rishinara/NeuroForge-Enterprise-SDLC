package com.neuroforge.repository.mongo;

import com.neuroforge.entity.mongo.AiTriageSuggestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiTriageSuggestionRepository extends MongoRepository<AiTriageSuggestion, String> {

    Optional<AiTriageSuggestion> findByTaskId(Long taskId);

    Optional<AiTriageSuggestion> findFirstByTaskIdOrderByCreatedAtDesc(Long taskId);
}
