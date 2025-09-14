# SAVAGE API DOCUMENTATION - THE COMPLETE GUIDE!!! 📚🔥📚

## Overview

The Worker Check-In System API provides comprehensive endpoints for managing workers, events, check-ins, and administrative functions. This RESTful API is built with Express.js and PostgreSQL.

**Base URL:** `http://localhost:3001/api` (development) or `https://your-domain.com/api` (production)

## Authentication

### Admin Authentication
Most administrative endpoints require JWT authentication.

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "password": "admin-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "sessionId": "session-id-here",
    "expiresIn": "24h",
    "tokenType": "Bearer"
  }
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
x-session-id: <session-id>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
x-session-id: <session-id>
```

---

## Workers API

### Search Workers
Search for workers by name, email, or phone number.

```http
GET /api/workers/search?q=<search-term>
```

**Parameters:**
- `q` (string, required): Search term (minimum 3 characters)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "555-0101"
    }
  ]
}
```

### Get All Workers (Admin)
```http
GET /api/workers
Authorization: Bearer <token>
x-session-id: <session-id>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `city` (string): Filter by city
- `state` (string): Filter by state
- `sortBy` (string): Sort field
- `sortOrder` (string): ASC or DESC

### Create Worker
```http
POST /api/workers
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "email": "john.doe@example.com",
  "phone": "555-0101",
  "streetAddress": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "country": "USA"
}
```

### Update Worker (Admin)
```http
PUT /api/workers/:id
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "firstName": "Updated Name"
}
```

### Delete Worker (Admin)
```http
DELETE /api/workers/:id
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Bulk Delete Workers (Admin)
```http
POST /api/workers/bulk/delete
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "workerIds": [1, 2, 3]
}
```

### Worker Statistics (Admin)
```http
GET /api/workers/stats/overview
Authorization: Bearer <token>
x-session-id: <session-id>
```

---

## Events API

### Get Active Events
```http
GET /api/events/active
```

### Get All Events (Admin)
```http
GET /api/events
Authorization: Bearer <token>
x-session-id: <session-id>
```

**Query Parameters:**
- `page`, `limit`, `search`, `location`, `isActive`, `startDate`, `endDate`, `sortBy`, `sortOrder`

### Create Event (Admin)
```http
POST /api/events
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "name": "Tech Conference 2024",
  "startDate": "2024-06-15",
  "endDate": "2024-06-17",
  "location": "Convention Center",
  "isActive": false
}
```

### Update Event (Admin)
```http
PUT /api/events/:id
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Delete Event (Admin)
```http
DELETE /api/events/:id
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Set Active Event (Admin)
```http
POST /api/events/:id/activate
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Import Events from JSON (Admin)
```http
POST /api/events/import/json
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "events": [
    {
      "name": "Event 1",
      "startDate": "2024-06-01",
      "endDate": "2024-06-02",
      "location": "Location 1",
      "isActive": false
    }
  ]
}
```

---

## Check-ins API

### Create Check-in
```http
POST /api/checkins
Content-Type: application/json

{
  "workerId": 1,
  "eventId": 1,
  "question1Response": "Social Media",
  "question2Response": true,
  "question3Response1": "Networking",
  "question3Response2": "Intermediate",
  "termsAccepted": true
}
```

### Get All Check-ins (Admin)
```http
GET /api/checkins
Authorization: Bearer <token>
x-session-id: <session-id>
```

**Query Parameters:**
- `page`, `limit`, `workerId`, `eventId`, `startDate`, `endDate`, `question1Response`, `question2Response`, `termsAccepted`, `sortBy`, `sortOrder`

### Update Check-in (Admin)
```http
PUT /api/checkins/:id
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "question1Response": "Updated Response"
}
```

### Delete Check-in (Admin)
```http
DELETE /api/checkins/:id
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Get Check-ins by Event (Admin)
```http
GET /api/checkins/event/:eventId
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Get Check-ins by Worker (Admin)
```http
GET /api/checkins/worker/:workerId
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Check-in Statistics (Admin)
```http
GET /api/checkins/stats/overview
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Check-in Analytics (Admin)
```http
GET /api/checkins/analytics
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Recent Check-ins (Admin)
```http
GET /api/checkins/recent/:limit
Authorization: Bearer <token>
x-session-id: <session-id>
```

---

## Admin Settings API

### Get Settings (Admin)
```http
GET /api/admin/settings
Authorization: Bearer <token>
x-session-id: <session-id>
```

### Update Settings (Admin)
```http
PUT /api/admin/settings
Authorization: Bearer <token>
x-session-id: <session-id>
Content-Type: application/json

{
  "termsAndConditions": "<h2>Updated Terms</h2>",
  "question1Options": ["Option 1", "Option 2"],
  "question3Options1": ["Interest 1", "Interest 2"],
  "question3Options2": ["Level 1", "Level 2"]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "field": "fieldName" // Optional, for validation errors
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_FAILED`: Invalid credentials
- `INVALID_TOKEN`: JWT token is invalid or expired
- `WORKER_NOT_FOUND`: Worker does not exist
- `EVENT_NOT_FOUND`: Event does not exist
- `DUPLICATE_EMAIL`: Email already exists
- `DUPLICATE_CHECKIN`: Worker already checked in to this event
- `EVENT_NOT_ACTIVE`: Cannot check in to inactive event
- `TERMS_NOT_ACCEPTED`: Terms and conditions must be accepted

---

## Rate Limiting

API endpoints are rate limited:
- General API: 10 requests per second per IP
- Authentication: 1 request per second per IP
- Burst allowance: 20 requests for general API, 5 for auth

---

## Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Performance

- All search endpoints are cached for 2-5 minutes
- Database connection pooling with 25 max connections
- Response times monitored and logged
- Slow queries (>500ms) are logged for optimization

---

## Security

- JWT tokens expire after 24 hours
- Admin sessions require both token and session ID
- Rate limiting prevents abuse
- Input validation on all endpoints
- SQL injection protection
- XSS protection headers
- HTTPS enforced in production