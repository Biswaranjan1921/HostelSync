package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HostelRepository extends JpaRepository<Hostel, Long> {
	Optional<Hostel> findByCode(String code);
}
