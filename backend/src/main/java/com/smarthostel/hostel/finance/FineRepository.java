package com.smarthostel.hostel.finance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByStudentId(Long studentId);
}
