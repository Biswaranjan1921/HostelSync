package com.smarthostel.hostel.communication;

import com.smarthostel.hostel.communication.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
	List<Notice> findAllByOrderByCreatedAtDesc();
}
