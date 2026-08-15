$ErrorActionPreference = "Stop"
$src = "src\main\java\com\smarthostel\hostel"

# 1. Create Directories
$domains = @("auth", "student", "room", "meal", "attendance", "communication", "support", "finance", "leave", "core")
foreach ($d in $domains) {
    New-Item -ItemType Directory -Force -Path "$src\$d" | Out-Null
}

# 2. Define File Mappings
$files = @(
    # auth
    @{Name="AuthController.java"; Dir="controller"; Dest="auth"},
    @{Name="AuthService.java"; Dir="service"; Dest="auth"},
    @{Name="SecurityConfig.java"; Dir="config"; Dest="auth"},
    @{Name="AuthFilter.java"; Dir="config"; Dest="auth"},
    @{Name="JwtUtil.java"; Dir="config"; Dest="auth"},
    @{Name="OAuth2SuccessHandler.java"; Dir="config"; Dest="auth"},
    @{Name="User.java"; Dir="entity"; Dest="auth"},
    @{Name="UserRepository.java"; Dir="repository"; Dest="auth"},
    @{Name="UserSession.java"; Dir="entity"; Dest="auth"},
    @{Name="UserSessionRepository.java"; Dir="repository"; Dest="auth"},
    @{Name="LoginRequest.java"; Dir="dto"; Dest="auth"},
    @{Name="LoginResponse.java"; Dir="dto"; Dest="auth"},

    # student
    @{Name="StudentController.java"; Dir="controller"; Dest="student"},
    @{Name="StudentService.java"; Dir="service"; Dest="student"},
    @{Name="QrService.java"; Dir="service"; Dest="student"},
    @{Name="Student.java"; Dir="entity"; Dest="student"},
    @{Name="StudentRepository.java"; Dir="repository"; Dest="student"},

    # room
    @{Name="RoomController.java"; Dir="controller"; Dest="room"},
    @{Name="HostelController.java"; Dir="controller"; Dest="room"},
    @{Name="RoomService.java"; Dir="service"; Dest="room"},
    @{Name="Room.java"; Dir="entity"; Dest="room"},
    @{Name="RoomRepository.java"; Dir="repository"; Dest="room"},
    @{Name="Hostel.java"; Dir="entity"; Dest="room"},
    @{Name="HostelRepository.java"; Dir="repository"; Dest="room"},
    @{Name="RoomAuditLog.java"; Dir="entity"; Dest="room"},
    @{Name="RoomAuditLogRepository.java"; Dir="repository"; Dest="room"},

    # meal
    @{Name="MealVerificationController.java"; Dir="controller"; Dest="meal"},
    @{Name="MessController.java"; Dir="controller"; Dest="meal"},
    @{Name="MealVerificationService.java"; Dir="service"; Dest="meal"},
    @{Name="MealVerification.java"; Dir="entity"; Dest="meal"},
    @{Name="MealVerificationRepository.java"; Dir="repository"; Dest="meal"},
    @{Name="MessMenu.java"; Dir="entity"; Dest="meal"},
    @{Name="MessMenuRepository.java"; Dir="repository"; Dest="meal"},
    @{Name="MessFeedback.java"; Dir="entity"; Dest="meal"},
    @{Name="MessFeedbackRepository.java"; Dir="repository"; Dest="meal"},
    @{Name="MealSlot.java"; Dir="entity"; Dest="meal"},
    @{Name="VerifyMealRequest.java"; Dir="dto"; Dest="meal"},
    @{Name="VerifyMealResponse.java"; Dir="dto"; Dest="meal"},

    # attendance
    @{Name="HostelAttendanceController.java"; Dir="controller"; Dest="attendance"},
    @{Name="VisitorController.java"; Dir="controller"; Dest="attendance"},
    @{Name="HostelAttendance.java"; Dir="entity"; Dest="attendance"},
    @{Name="HostelAttendanceRepository.java"; Dir="repository"; Dest="attendance"},
    @{Name="Visitor.java"; Dir="entity"; Dest="attendance"},
    @{Name="VisitorRepository.java"; Dir="repository"; Dest="attendance"},

    # communication
    @{Name="NoticeController.java"; Dir="controller"; Dest="communication"},
    @{Name="ParentAlertController.java"; Dir="controller"; Dest="communication"},
    @{Name="NoticeService.java"; Dir="service"; Dest="communication"},
    @{Name="ParentNotificationService.java"; Dir="service"; Dest="communication"},
    @{Name="Notice.java"; Dir="entity"; Dest="communication"},
    @{Name="NoticeRepository.java"; Dir="repository"; Dest="communication"},
    @{Name="ParentAlert.java"; Dir="entity"; Dest="communication"},
    @{Name="ParentAlertRepository.java"; Dir="repository"; Dest="communication"},

    # support
    @{Name="ComplaintController.java"; Dir="controller"; Dest="support"},
    @{Name="SupportTicketController.java"; Dir="controller"; Dest="support"},
    @{Name="ComplaintService.java"; Dir="service"; Dest="support"},
    @{Name="Complaint.java"; Dir="entity"; Dest="support"},
    @{Name="ComplaintRepository.java"; Dir="repository"; Dest="support"},
    @{Name="SupportTicket.java"; Dir="entity"; Dest="support"},
    @{Name="SupportTicketRepository.java"; Dir="repository"; Dest="support"},

    # finance
    @{Name="PaymentController.java"; Dir="controller"; Dest="finance"},
    @{Name="Payment.java"; Dir="entity"; Dest="finance"},
    @{Name="PaymentRepository.java"; Dir="repository"; Dest="finance"},

    # leave
    @{Name="LeaveRequestController.java"; Dir="controller"; Dest="leave"},
    @{Name="LeaveRequestService.java"; Dir="service"; Dest="leave"},
    @{Name="LeaveRequest.java"; Dir="entity"; Dest="leave"},
    @{Name="LeaveRequestRepository.java"; Dir="repository"; Dest="leave"},

    # core
    @{Name="DashboardController.java"; Dir="controller"; Dest="core"},
    @{Name="SystemSettingController.java"; Dir="controller"; Dest="core"},
    @{Name="StaffController.java"; Dir="controller"; Dest="core"},
    @{Name="SystemSetting.java"; Dir="entity"; Dest="core"},
    @{Name="SystemSettingRepository.java"; Dir="repository"; Dest="core"},
    @{Name="Staff.java"; Dir="entity"; Dest="core"},
    @{Name="StaffRepository.java"; Dir="repository"; Dest="core"},
    @{Name="WebConfig.java"; Dir="config"; Dest="core"}
)

# 3. Move Files
foreach ($f in $files) {
    $sourceFile = "$src\$($f.Dir)\$($f.Name)"
    $destFile = "$src\$($f.Dest)\$($f.Name)"
    if (Test-Path $sourceFile) {
        Move-Item $sourceFile $destFile -Force
    }
}

# 4. Remove empty old directories
$oldDirs = @("controller", "service", "entity", "repository", "config", "dto")
foreach ($oldDir in $oldDirs) {
    if (Test-Path "$src\$oldDir") {
        Remove-Item "$src\$oldDir" -Recurse -Force
    }
}

# 5. Fix packages and imports across ALL .java files
$allJavaFiles = Get-ChildItem -Path $src -Filter *.java -Recurse

# Create a mapping for replacing specific imports/packages
# For example, any mention of 'com.smarthostel.hostel.controller' or 'entity' or 'repository'
# must be mapped to their new domain.
# A simpler approach: Since every file is moved, we can map ClassName -> NewPackage.
$classMap = @{}
foreach ($f in $files) {
    $className = $f.Name.Replace(".java", "")
    $classMap[$className] = "com.smarthostel.hostel.$($f.Dest)"
}

foreach ($file in $allJavaFiles) {
    $content = Get-Content -Path $file.FullName
    $newContent = @()
    
    foreach ($line in $content) {
        $newLine = $line
        
        # 1. Update the package declaration for the file
        if ($line -match "^package com\.smarthostel\.hostel\.(controller|service|entity|repository|config|dto);") {
            # Figure out its new domain based on where it lives now
            $parentName = $file.Directory.Name
            $newLine = "package com.smarthostel.hostel.$parentName;"
        }
        
        # 2. Update all imports
        if ($line -match "^import com\.smarthostel\.hostel\.(controller|service|entity|repository|config|dto)\.(.*?);") {
            $importedClass = $matches[2]
            if ($classMap.ContainsKey($importedClass)) {
                $newPackage = $classMap[$importedClass]
                $newLine = "import $newPackage.$importedClass;"
            }
        }
        
        $newContent += $newLine
    }
    
    Set-Content -Path $file.FullName -Value $newContent
}

Write-Host "Backend restructuring completed!"
