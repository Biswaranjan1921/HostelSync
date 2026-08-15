# HostelSync REST API Documentation

Base URL: `http://localhost:8085/api` (or proxied via Nginx at `/api`)

---

## 🔑 Authentication Endpoints

### 1. User Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ "username": "admin", "password": "admin123" }`
- **Response**: `{ "token": "JWT_TOKEN...", "role": "ADMIN", "name": "Superintendent" }`

### 2. Google OAuth Initialization
- **Endpoint**: `GET /oauth2/authorization/google`
- **Redirects**: Google Sign-In -> Callback -> Frontend `/oauth2/redirect?token=...`

---

## 🍽️ Canteen & Meal Verification

### 1. Verify Meal Scan
- **Endpoint**: `POST /meal-verification/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "qrPayload": "ST-XXXXXXXX-YYYYMMDD" }`
- **Response Success**: `{ "studentId": 1, "studentName": "John", "mealSlot": "LUNCH", "verifiedAt": "2026-08-15T12:45:00Z" }`
- **Response Error**: `{ "message": "FORMAL REJECTION NOTICE: The scanned QR Pass has expired for today's date." }`

### 2. Today's Recent Scans
- **Endpoint**: `GET /meal-verification/recent?limit=50`
- **Response**: Array of recent verification records with student name, meal slot, and timestamp.

---

## 🏢 Hostel & Room Management

### 1. List Rooms (Scoped by Allotted Hostel)
- **Endpoint**: `GET /rooms`
- **Response**: List of room entities for the user's allotted hostel.

---

## 📢 Notices & Announcements

### 1. List Notices
- **Endpoint**: `GET /notices`
- **Response**: List of global or hostel-scoped notice announcements.
