package com.smarthostel.hostel.core;

import com.smarthostel.hostel.core.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
