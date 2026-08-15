# HostelSync System Architecture

## Architecture Overview

```
 [ Client Browser ]
        │
        ▼ (Port 80 / 443)
 [ Nginx Reverse Proxy ]
   ├── /            ---> [ React Vite Frontend Container ] (Port 80)
   └── /api         ---> [ Spring Boot Backend Container ] (Port 8085)
                               │
                               ├──> [ H2 / PostgreSQL Database ]
                               └──> [ Google OAuth2 Provider ]
```

---

## Security & Isolation Rules

1. **Role-Based Access Control (RBAC)**:
   - `SUPERADMIN`: Full system access across all hostels.
   - `ADMIN` (Superintendent): Scoped strictly to allotted hostel (`hostelId`).
   - `CANTEEN_STAFF`: Restricted strictly to `/canteen-dashboard` (Scanner & Scan Logs).
   - `STUDENT`: Scoped to personal digital pass, hostel notices, and complaints.

2. **Daily Unique QR Tokens**:
   - Dynamic QR payload format: `{BASE_TOKEN}-{YYYYMMDD}`.
   - Server-side verification validates daily date suffix to prevent pass sharing across days.
