package com.buggraph.backend.repository;

import com.buggraph.backend.model.BugEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<BugEntity, String> {

    @Query("SELECT b FROM BugEntity b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(b.description) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(b.stackTrace) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<BugEntity> searchBugs(@Param("q") String query);

    List<BugEntity> findByComponentIgnoreCase(String component);
    List<BugEntity> findBySeverityIgnoreCase(String severity);
}
