package com.smarthostel.hostel.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffApplicationRepository extends JpaRepository<StaffApplication, Long> {
    List<StaffApplication> findByStatus(String status);
    Optional<StaffApplication> findByEmail(String email);
}
