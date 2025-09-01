<<<<<<< HEAD
# NOIRA Backend API Documentation

This document provides an overview of the main routes available in the NOIRA backend Express server.

## Base URL

```
http://localhost:3000/
```

---

## Routes

### Root
- **GET /**
  - Returns a welcome message.

### User Authentication & Registration
- **POST /auth/user/register**
  - Register a new user.
- **POST /auth/user/login**
  - User login.

### Admin Authentication
- **POST /auth/admin/login**
  - Admin login.

### Therapist Authentication & Filtering
- **POST /auth/therapist/login**
  - Therapist login.
- **POST /auth/therapist/filter**
  - Filter therapists based on criteria (service, date, time, etc).

### OTP Verification
- **POST /verifyotp**
  - Verify OTP for user authentication/registration.

### Services
- **GET /services/list**
  - Get all available services.

---

## Notes
- All endpoints accept and return JSON unless otherwise specified.
- Authentication endpoints expect credentials in the request body.
- Filtering and registration endpoints require specific fields as described in the codebase.

---

For more details, see the route files in the `routes/` folder and controller logic in the `controller/` folder.
=======
# NOIRA Backend API Documentation

This document provides an overview of the main routes available in the NOIRA backend Express server.

## Base URL

```
http://localhost:3000/
```

---

## Routes

### Root
- **GET /**
  - Returns a welcome message.

### User Authentication & Registration
- **POST /auth/user/register**
  - Register a new user.
- **POST /auth/user/login**
  - User login.

### Admin Authentication
- **POST /auth/admin/login**
  - Admin login.

### Therapist Authentication & Filtering
- **POST /auth/therapist/login**
  - Therapist login.
- **POST /auth/therapist/filter**
  - Filter therapists based on criteria (service, date, time, etc).

### OTP Verification
- **POST /verifyotp**
  - Verify OTP for user authentication/registration.

### Services
- **GET /services/list**
  - Get all available services.

---

## Notes
- All endpoints accept and return JSON unless otherwise specified.
- Authentication endpoints expect credentials in the request body.
- Filtering and registration endpoints require specific fields as described in the codebase.

---

For more details, see the route files in the `routes/` folder and controller logic in the `controller/` folder.
>>>>>>> noira-backend/main
