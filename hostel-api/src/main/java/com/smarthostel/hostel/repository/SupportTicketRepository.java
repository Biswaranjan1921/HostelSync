package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
	List<SupportTicket> findByUserId(Long userId);
	List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
