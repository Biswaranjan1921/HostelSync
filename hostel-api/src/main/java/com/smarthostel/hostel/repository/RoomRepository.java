package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
	List<Room> findByBlockOrderByNumber(String block);
	List<Room> findByBlockAndNumber(String block, String number);
}
