# Final Hostel – Hostel Management & QR Meal Verification

A complete hostel management system with **QR-based meal verification**: residents get a unique QR code; staff scan it at meal times to record attendance and prevent duplicate claims (one verification per meal slot per day).

## Features

- **Dashboard** – Total students, rooms, and meals verified today; recent verifications list
- **Students** – Add, edit, delete; assign room; view/download **meal QR code** (unique per student)
- **Rooms** – Add, edit, delete; block, number, capacity, floor; occupancy shown
- **QR Meal Verification** – Scan student QR (camera or manual token entry), select meal slot (Breakfast/Lunch/Dinner), verify once per slot per day per student

## Tech Stack

- **Backend:** Spring Boot 3.2, JPA/H2 (or MySQL), ZXing for QR generation
- **Frontend:** React 18, Vite, React Router, html5-qrcode for camera scanning

## Quick Start

### 1. Backend (hostel-api)

**Option A – Double-click (Windows)**  
- Open the folder `Final Hostel\hostel-api` in File Explorer.  
- Double-click **run-backend.bat**.

**Option B – Terminal**
```bash
cd "Final Hostel/hostel-api"
mvn clean spring-boot:run
```

- API: **http://localhost:8080**
- H2 console: **http://localhost:8080/h2-console** (JDBC URL: `jdbc:h2:file:./data/smarthostel`, user: `sa`, password empty)

### 2. Frontend (hostel-web)

**Option A – Double-click (Windows)**  
- Open the folder `Final Hostel\hostel-web` in File Explorer.  
- Double-click **run-frontend.bat** (run `npm install` once first if needed).

**Option B – Terminal**
```bash
cd "Final Hostel/hostel-web"
npm install
npm run dev
```

- App: **http://localhost:5173** (or next available port)
- Vite proxies `/api` to the backend.

### 3. Try it

1. Open **Rooms** → Add a room (e.g. Block A, Number 101, capacity 2).
2. Open **Students** → Add a student, assign the room, click **QR** to see their meal QR.
3. Open **Verify Meal** → Choose meal slot, paste the student’s token or use **Camera scan**, then click **Verify meal**.
4. Check **Dashboard** for stats and recent verifications.

## Project layout

- **hostel-api** – Spring Boot REST API, JPA entities (Student, Room, MealVerification), QR generation, meal verification logic
- **hostel-web** – React SPA: Dashboard, Students, Rooms, Verify Meal (manual + camera QR)

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Total students, rooms, meals verified today |
| GET | `/api/students` | List students |
| GET | `/api/students/{id}/qr` | Get QR image as base64 |
| POST | `/api/students` | Create student (auto-generates `qrToken`) |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms` | Create room |
| PUT | `/api/rooms/{id}` | Update room |
| DELETE | `/api/rooms/{id}` | Delete room |
| POST | `/api/meal-verification/verify` | Body: `{ "qrPayload": "<token>", "mealSlot": "BREAKFAST" \| "LUNCH" \| "DINNER" }` |
| GET | `/api/meal-verification/recent?limit=20` | Recent verifications (today) |

## Database (H2 → MySQL)

In `hostel-api/src/main/resources/application.yml` set:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smarthostel
    username: your_user
    password: your_password
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
```

Add `mysql-connector-j` to `hostel-api/pom.xml` and remove the `h2` dependency.

## License

MIT (or your choice).
