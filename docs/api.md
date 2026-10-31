# AAROGYA LINK

## FastAPI API Specification

**Document:** `api.md`\
**Version:** 1.0\
**Status:** Proposed MVP API contract\
**Backend:** FastAPI\
**Authentication:** Firebase Authentication\
**Application database:** MySQL\
**AI runtime:** Ollama

------------------------------------------------------------------------

# 1. Purpose

This document defines the proposed HTTP API between the AAROGYA LINK
React frontend and FastAPI backend.

FastAPI is responsible for application authorization, data access,
consultation workflows, AI orchestration, file handling and
synchronization.

Firebase Authentication manages identity and authentication. MySQL stores
application data. Ollama is accessed only by trusted backend services.

## 1.1 Base URL

Development example:

``` text
http://localhost:8000/api/v1
```

Production must use HTTPS.

## 1.2 Common Headers

Authenticated request:

``` http
Authorization: Bearer <firebase_access_token>
Content-Type: application/json
```

For file uploads, use `multipart/form-data` and let the HTTP client set
the multipart boundary.

## 1.3 API Conventions

-   JSON for normal request and response bodies.
-   UUID public identifiers for consultation and message references.
-   UTC timestamps in ISO 8601 format.
-   Pagination for list endpoints.
-   Pydantic validation for request bodies.
-   Consistent error response structure.
-   All protected endpoints require a verified Firebase ID token.
-   Never trust a user ID supplied in the request body as proof of
    identity.

------------------------------------------------------------------------

# 2. Authentication and Application User APIs

Firebase Authentication handles registration, login, password recovery, session
refresh and sign-out through its client SDK.

FastAPI does not implement password login or store passwords.

## 2.1 Application User Bootstrap

Creates or retrieves the MySQL application user associated with the
verified Firebase identity.

``` http
POST /users/bootstrap
```

Authentication: Required.

Request body:

``` json
{}
```

The backend obtains the Firebase UID from the verified access token.

Example response:

``` json
{
  "id": 101,
  "role": "patient",
  "profile_complete": false
}
```

Rules: - Idempotent for the same authenticated Firebase user. - New
users receive the default `patient` role. - The client cannot request a
`doctor` or `admin` role. - Email may be read from trusted verified
claims or an appropriately configured trusted identity source.

## 2.2 Get Current Application User

``` http
GET /users/me
```

Example response:

``` json
{
  "id": 101,
  "role": "patient",
  "is_active": true,
  "profile_complete": false
}
```

## 2.3 Get Current User Profile

``` http
GET /profiles/me
```

## 2.4 Create or Update Current User Profile

``` http
PUT /profiles/me
```

Example request:

``` json
{
  "date_of_birth": "2000-01-15",
  "gender": "Prefer not to say",
  "height_cm": 165.5,
  "weight_kg": 62.0,
  "blood_group": "O+",
  "preferred_language": "mr",
  "allergies": null,
  "existing_conditions": null,
  "emergency_contact_name": null,
  "emergency_contact_phone": null
}
```

All profile fields are optional unless a particular workflow requires
them. Validate units, lengths and allowed values.

------------------------------------------------------------------------

# 3. Consultation APIs

Text Mode, Speech-to-Speech Mode and Video Mode all operate on the same
consultation record.

Switching modes does not create a new consultation.

## 3.1 Create Consultation

``` http
POST /consultations
```

Request:

``` json
{
  "language": "mr"
}
```

Response:

``` json
{
  "consultation_id": "7a16c802-40a7-4f17-9d11-c97f6f6a1001",
  "status": "in_progress",
  "language": "mr",
  "started_at": "2026-10-31T04:30:00Z"
}
```

The patient identity is taken from the verified token.

## 3.2 List My Consultations

``` http
GET /consultations?limit=20&cursor=<optional_cursor>
```

Returns only consultations the authenticated user is authorized to
access.

## 3.3 Get Consultation

``` http
GET /consultations/{consultation_id}
```

Check ownership or an explicit doctor/admin authorization before
returning details.

## 3.4 Update Consultation Language

``` http
PATCH /consultations/{consultation_id}
```

Request:

``` json
{
  "language": "hi"
}
```

The backend must verify that the user can access the consultation.

## 3.5 Close Consultation

``` http
POST /consultations/{consultation_id}/close
```

The backend records the end time and updates the status according to the
workflow.

------------------------------------------------------------------------

# 4. Conversation APIs

## 4.1 Send Text Message

``` http
POST /consultations/{consultation_id}/messages
```

Request:

``` json
{
  "client_message_id": "a8a5e5b3-7d2b-4d53-94f3-1ef4c4d71001",
  "mode": "text",
  "content": "I have had a headache since yesterday.",
  "language": "en"
}
```

Response:

``` json
{
  "message": {
    "message_id": "b9b5e5b3-7d2b-4d53-94f3-1ef4c4d71002",
    "sender_type": "patient",
    "content": "I have had a headache since yesterday.",
    "created_at": "2026-10-31T04:35:00Z"
  },
  "assistant_response": {
    "message_id": "c0c5e5b3-7d2b-4d53-94f3-1ef4c4d71003",
    "content": "I can help collect some information. When did it begin?",
    "language": "en"
  },
  "interaction": {
    "mode": "text",
    "model": "qwen2.5:7b",
    "context_version": 2
  }
}
```

The response content is illustrative.

Backend processing:

1.  Verify Firebase ID token.
2.  Verify consultation ownership/access.
3.  Validate request and idempotency key.
4.  Persist the patient message to MySQL.
5.  Load or rebuild that consultation's shared context.
6.  Call `qwen2.5:7b` through Ollama.
7.  Validate the response.
8.  Persist the assistant response.
9.  Update the consultation context artifact.
10. Return the response.

If model inference fails, preserve the patient message and return a
recoverable error. Do not pretend an assistant response was generated.

## 4.2 Get Conversation History

``` http
GET /consultations/{consultation_id}/messages?limit=50&cursor=<optional_cursor>
```

Returns paginated messages in chronological order.

## 4.3 Idempotency

`client_message_id` should be unique within the appropriate
user/consultation scope. Repeated retries must not create duplicate
patient messages or duplicate assistant turns.

------------------------------------------------------------------------

# 5. Speech-to-Speech APIs

The selected language model for speech conversations is `qwen2.5:7b`.

ASR and TTS are separate services. Qwen receives text, not raw
microphone audio, in this architecture.

## 5.1 Submit Speech Audio

``` http
POST /consultations/{consultation_id}/speech
```

Content type: `multipart/form-data`.

Fields: - `audio`: audio file. - `client_message_id`: client-generated
UUID. - `language`: optional language hint.

Backend workflow:

1.  Verify token and consultation access.
2.  Validate audio size and format.
3.  Transcribe audio using the configured ASR service.
4.  Preserve the transcription.
5.  Load shared consultation context.
6.  Call `qwen2.5:7b`.
7.  Validate and persist assistant text.
8.  Convert assistant text to audio using TTS.
9.  Persist relevant interaction metadata.
10. Update the consultation context.
11. Return transcription, response text and audio reference.

Example response:

``` json
{
  "transcription": {
    "text": "मला कालपासून डोकेदुखी आहे.",
    "language": "mr"
  },
  "assistant_response": {
    "message_id": "d1d5e5b3-7d2b-4d53-94f3-1ef4c4d71004",
    "text": "तुमची डोकेदुखी नेमकी कुठे आहे?"
  },
  "audio": {
    "audio_id": "e2d5e5b3-7d2b-4d53-94f3-1ef4c4d71005",
    "status": "ready",
    "url": "/api/v1/audio/e2d5e5b3-7d2b-4d53-94f3-1ef4c4d71005"
  },
  "interaction": {
    "mode": "speech_to_speech",
    "model": "qwen2.5:7b",
    "context_version": 4
  }
}
```

The audio URL must be protected by authorization. It must not be a
public link to private consultation audio.

## 5.2 Retrieve Generated Audio

``` http
GET /audio/{audio_id}
```

Authentication and authorization required. Return the audio stream with
an appropriate content type.

If audio storage is temporary, define its expiry and retention policy.

------------------------------------------------------------------------

# 6. Video and Image APIs

The selected vision model is `qwen2.5vl:3b`.

For the MVP, use a still image or selected video frame rather than
sending every frame from a continuous stream.

## 6.1 Upload Image or Frame

``` http
POST /consultations/{consultation_id}/media
```

Content type: `multipart/form-data`.

Fields: - `file`: image or supported media file. - `file_purpose`:
`patient_image` or an approved supported purpose. - `client_file_id`:
client-generated UUID.

Response:

``` json
{
  "file_id": "f3d5e5b3-7d2b-4d53-94f3-1ef4c4d71006",
  "status": "uploaded",
  "mime_type": "image/jpeg",
  "file_size_bytes": 245000
}
```

## 6.2 Analyze Image

``` http
POST /consultations/{consultation_id}/media/{file_id}/analyze
```

Request:

``` json
{
  "task": "describe_visible_features",
  "language": "en"
}
```

Backend workflow:

1.  Verify user and consultation access.
2.  Verify access to the uploaded file.
3.  Load relevant shared context.
4.  Send the selected image and appropriate context to `qwen2.5vl:3b`.
5.  Validate the model output.
6.  Label the result as an AI-generated visual observation.
7.  Persist observation and provenance.
8.  Update shared consultation context.
9.  Return the observation.

Example response:

``` json
{
  "observation_id": "04e5e5b3-7d2b-4d53-94f3-1ef4c4d71007",
  "model": "qwen2.5vl:3b",
  "observation": "A concise description of visible features.",
  "limitations": [
    "Image quality may affect observations.",
    "This is not a diagnosis."
  ],
  "requires_clinician_review": true,
  "context_version": 6
}
```

Do not return unsupported disease conclusions as confirmed findings.

------------------------------------------------------------------------

# 7. Shared Context APIs

The consultation-specific `context.txt` is maintained by the backend.
The frontend must not choose file paths, read arbitrary context files or
directly edit them.

MySQL remains the permanent source of truth for messages and
observations. The context file is a recoverable model-context artifact.

## 7.1 Get Context Status

``` http
GET /consultations/{consultation_id}/context/status
```

Example response:

``` json
{
  "consultation_id": "7a16c802-40a7-4f17-9d11-c97f6f6a1001",
  "status": "ready",
  "version": 6,
  "last_updated_at": "2026-10-31T04:40:00Z"
}
```

Do not expose the server filesystem path or raw context contents through
this endpoint.

## 7.2 Rebuild Context

``` http
POST /consultations/{consultation_id}/context/rebuild
```

This endpoint should normally be restricted to trusted internal recovery
workflows or authorized administrators.

It rebuilds the context artifact from the authorized persisted
consultation events.

## 7.3 Context Update Rules

-   Save events to MySQL first.
-   Update context after each completed interaction.
-   Use per-consultation serialization or locking.
-   Use a monotonically increasing context version or event sequence.
-   If file writing fails, mark context as pending rebuild.
-   Rebuild only from the correct consultation.
-   Never share context across different consultations.

A normal patient-facing message endpoint should orchestrate the update;
the browser should not call a separate context-write endpoint.

------------------------------------------------------------------------

# 8. Report APIs

## 8.1 Generate Consultation Summary

``` http
POST /consultations/{consultation_id}/report
```

The backend builds a report from the consultation history and AI
observations. The report remains a draft until reviewed according to the
clinical workflow.

## 8.2 Get Report

``` http
GET /consultations/{consultation_id}/report
```

## 8.3 Doctor Review

``` http
POST /consultations/{consultation_id}/reviews
```

Doctor-only, authorized access.

Example request:

``` json
{
  "clinical_notes": "Clinician-entered review notes.",
  "decision_summary": "Clinician-entered summary."
}
```

## 8.4 Update Review

``` http
PATCH /reviews/{review_id}
```

Only the authorized doctor or permitted administrator may update the
review, subject to audit and versioning rules.

------------------------------------------------------------------------

# 9. Referral and Follow-up APIs

Proposed endpoints:

  ---------------------------------------------------------------------------------
  Method                  Endpoint                          Purpose
  ----------------------- --------------------------------- -----------------------
  `POST`                  `/consultations/{id}/referrals`   Create an authorized
                                                            referral

  `GET`                   `/consultations/{id}/referrals`   List referrals for a
                                                            consultation

  `GET`                   `/referrals/{id}`                 Get an authorized
                                                            referral

  `PATCH`                 `/referrals/{id}`                 Update referral
                                                            status/details

  `POST`                  `/referrals/{id}/follow-ups`      Schedule a follow-up

  `GET`                   `/referrals/{id}/follow-ups`      List follow-ups

  `PATCH`                 `/follow-ups/{id}`                Update follow-up status
  ---------------------------------------------------------------------------------

The backend must enforce ownership and role permissions for every
operation.

------------------------------------------------------------------------

# 10. Offline Synchronization APIs

The browser stores pending events in IndexedDB when offline. When a
connection is available, it submits queued events to FastAPI.

## 10.1 Sync Batch

``` http
POST /sync
```

Example request:

``` json
{
  "device_id": "client-generated-device-id",
  "events": [
    {
      "event_id": "f4e5e5b3-7d2b-4d53-94f3-1ef4c4d71008",
      "event_type": "message",
      "consultation_id": "7a16c802-40a7-4f17-9d11-c97f6f6a1001",
      "created_at": "2026-10-31T04:45:00Z",
      "payload": {
        "mode": "text",
        "content": "The headache is getting better."
      }
    }
  ]
}
```

Example response:

``` json
{
  "accepted_event_ids": [
    "f4e5e5b3-7d2b-4d53-94f3-1ef4c4d71008"
  ],
  "rejected": [],
  "sync_status": "completed"
}
```

Rules: - Validate every event. - Verify consultation ownership. -
Deduplicate by event ID within the authenticated scope. - Return
explicit per-event acceptance or rejection. - Do not mark a client event
synchronized until the server acknowledges it. - Define conflict
behaviour before implementing multi-device edits. - Offline
authentication and expired Firebase Authentication sessions require an explicit design;
do not assume cloud requests can succeed offline.

------------------------------------------------------------------------

# 11. Health Check and Service Status

## 11.1 Basic Health

``` http
GET /health
```

Example:

``` json
{
  "status": "ok"
}
```

## 11.2 Internal Dependency Readiness

``` http
GET /health/ready
```

This may report readiness for configured dependencies such as MySQL and
Ollama.

Do not expose secrets, internal hostnames or sensitive infrastructure
details in a public health response. Restrict detailed diagnostics to
trusted operators.

------------------------------------------------------------------------

# 12. Standard Error Format

Use a consistent structure:

``` json
{
  "error": {
    "code": "CONSULTATION_NOT_FOUND",
    "message": "The requested consultation could not be found.",
    "request_id": "server-generated-request-id"
  }
}
```

Suggested HTTP status codes:

  Status   Meaning
  -------- --------------------------------------------
  `400`    Invalid request
  `401`    Missing, expired or invalid authentication
  `403`    Authenticated but not authorized
  `404`    Resource not found or not accessible
  `409`    Conflict or duplicate state transition
  `413`    Upload too large
  `415`    Unsupported media type
  `422`    Request validation failed
  `429`    Rate limit exceeded
  `500`    Unexpected server error
  `502`    Upstream model/service failure
  `503`    Required dependency unavailable
  `504`    Upstream timeout

Avoid revealing whether another patient's consultation exists. For
sensitive resources, use a response policy that does not leak resource
ownership.

------------------------------------------------------------------------

# 13. Authentication and Authorization Middleware

For every protected endpoint:

1.  Read the Bearer access token.
2.  Verify the token using the configured Firebase verification method.
3.  Validate signature and relevant claims.
4.  Extract the trusted Firebase subject UUID.
5.  Find the active MySQL application user.
6.  Check role and resource-level permissions.
7.  Execute the requested operation only after authorization.

Never: - Trust a user ID from a request body as authentication. - Accept
an unverified JWT. - Let patients assign themselves doctor/admin
roles. - Expose Firebase Admin SDK secrets to the frontend. - Expose
Ollama directly to the browser.

------------------------------------------------------------------------

# 14. Suggested FastAPI Project Structure

``` text
backend/
└── app/
    ├── main.py
    ├── api/
    │   ├── users.py
    │   ├── profiles.py
    │   ├── consultations.py
    │   ├── messages.py
    │   ├── speech.py
    │   ├── media.py
    │   ├── context.py
    │   ├── reports.py
    │   ├── reviews.py
    │   ├── referrals.py
    │   ├── sync.py
    │   └── health.py
    ├── core/
    │   ├── config.py
    │   ├── security.py
    │   └── dependencies.py
    ├── schemas/
    ├── models/
    ├── services/
    ├── ai/
    ├── database/
    └── storage/
```

Keep route handlers thin. Put business logic in service modules and data
access in repositories.

------------------------------------------------------------------------

# 15. MVP API Implementation Order

1.  Firebase ID token verification.
2.  `POST /users/bootstrap`.
3.  `GET /users/me`.
4.  Profile read and update.
5.  Create and retrieve consultations.
6.  Send text message and retrieve history.
7.  Shared context creation, update and recovery.
8.  Speech upload, transcription and TTS workflow.
9.  Image upload and vision analysis.
10. Report generation and doctor review.
11. Referral and follow-up workflow.
12. Offline sync batch.
13. Health and readiness endpoints.

Implement and test each stage before moving to the next.

------------------------------------------------------------------------

# 16. Final API Principles

-   Firebase Authentication handles authentication.
-   FastAPI verifies identity and enforces authorization.
-   MySQL stores permanent application records.
-   Ollama is only called by trusted backend services.
-   `qwen2.5:7b` handles text and transcribed speech conversations.
-   `qwen2.5vl:3b` handles selected images and video frames.
-   Each consultation has its own backend-managed `context.txt`.
-   Switching interaction modes preserves the same consultation context.
-   AI-generated information remains clearly distinct from
    clinician-reviewed information.
-   Offline synchronization is idempotent and acknowledgement-based.

This API contract is a proposed MVP specification. Request schemas,
response schemas, upload limits, token verification details and clinical
workflows must be finalized and tested during implementation.


## Firebase Authentication – Backend Verification

- React uses the Firebase Web SDK for authentication.
- The client sends the Firebase ID token in the Bearer authorization header.
- FastAPI verifies the token using the Firebase Admin SDK, initialized for the correct Firebase project.
- Use the verified token's `uid` to map to `users.firebase_uid` in MySQL.
- Do not trust a UID in the request body or merely decode a token without verification.
- Keep service-account credentials exclusively on the backend and out of source control.
