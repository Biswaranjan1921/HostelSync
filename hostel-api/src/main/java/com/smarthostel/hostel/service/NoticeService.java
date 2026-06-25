package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.Notice;
import com.smarthostel.hostel.repository.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NoticeService {

	private final NoticeRepository noticeRepository;

	public NoticeService(NoticeRepository noticeRepository) {
		this.noticeRepository = noticeRepository;
	}

	public List<Notice> findAll() {
		return noticeRepository.findAllByOrderByCreatedAtDesc();
	}

	public Optional<Notice> findById(Long id) {
		return noticeRepository.findById(id);
	}

	@Transactional
	public Notice create(Notice notice) {
		return noticeRepository.save(notice);
	}

	@Transactional
	public void delete(Long id) {
		noticeRepository.deleteById(id);
	}
}
