package com.smarthostel.hostel.support;

import com.smarthostel.hostel.support.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
	List<SupportTicket> findByUserId(Long userId);
	List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
