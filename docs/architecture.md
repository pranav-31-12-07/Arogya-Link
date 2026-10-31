# AAROGYA LINK

## System Architecture and Technical Design

**Project:** AAROGYA LINK\
**Document:** System Architecture (`architecture.md`)\
**Version:** 1.0\
**Status:** Proposed architecture\
**Related documents:** `prd.md`, `design.md`, `rules.md`

------------------------------------------------------------------------

# 1. Architecture Overview

AAROGYA LINK is a multilingual, AI-assisted healthcare access and
coordination platform.

The system uses a modular architecture with the following primary
components:

-   React frontend for patient and doctor interfaces.
-   FastAPI backend for application APIs and orchestration.
-   Firebase Authentication for user authentication.
-   MySQL for application data.
-   Ollama for local language-model inference.
-   Qwen2.5:7B for text-based conversation and report drafting.
-   Qwen2.5-VL:3B for image understanding.
-   Speech recognition, translation and text-to-speech services.
-   IndexedDB and Service Workers for offline-first browser
    functionality.

## 1.1 Key Architecture Decision

**Authentication and application data are separate responsibilities.**

-   **Firebase Authentication** manages identity, sign-up, login, password
    recovery and authentication sessions.
-   **MySQL** remains the primary application database for patient
    profiles, consultations, messages, uploaded-file metadata, reports,
    doctor reviews, referrals and follow-ups.
-   **FastAPI** verifies Firebase ID tokens and enforces application
    authorization before accessing MySQL records.

Do not implement a second password authentication system in FastAPI.

Do not assume that using Firebase Authentication means using Firebase Database.
The application database for AAROGYA LINK is MySQL.

------------------------------------------------------------------------

# 2. High-Level System Architecture

``` mermaid
flowchart TB
    U[Patient / Doctor Browser]
    FE[React + Vite Frontend]
    SW[Service Worker + IndexedDB]
    AUTH[Firebase Authentication]
    API[FastAPI Backend]
    VERIFY[Firebase ID token Verification]
    MYSQL[(MySQL Application Database)]
    ORCH[AI Orchestrator]
    QWEN[Ollama - Qwen2.5:7B]
    VL[Ollama - Qwen2.5-VL:3B]
    SPEECH[Speech Recognition / TTS / Translation]
    FILES[Secure Image and File Storage]
    DOCTOR[Authorized Doctor Interface]

    U --> FE
    FE <--> SW
    FE <--> AUTH
    FE --> API
    API --> VERIFY
    VERIFY --> AUTH
    API <--> MYSQL
    API --> ORCH
    ORCH --> QWEN
    ORCH --> VL
    ORCH --> SPEECH
    API <--> FILES
    FE --> DOCTOR
```

The diagram represents logical responsibilities. In a local/offline
deployment, some services may run on a community healthcare centre
computer. In a cloud deployment, the backend and storage services may be
hosted remotely.

------------------------------------------------------------------------

# 3. Frontend Architecture

## 3.1 Technology

-   React.
-   Vite.
-   Tailwind CSS.
-   JavaScript.
-   Lucide icons.

## 3.2 Main Application Areas

### Public Authentication

-   Login.
-   Sign Up.
-   Password recovery.

Firebase Authentication provides the authentication workflow.

### Patient Application

-   Shared application navbar.
-   Text Mode.
-   Virtual Doctor Mode.
-   Language selection.
-   Profile panel.
-   Consultation history.
-   Consultation reports.

### Doctor Application

-   Doctor dashboard.
-   Authorized consultation list.
-   Patient consultation details.
-   Report review.
-   Clinical notes.
-   Referral and follow-up workflow.

Doctor-only screens must be protected by backend authorization, not
merely hidden in the frontend.

## 3.3 Shared Consultation State

Text Mode and Virtual Doctor Mode must use the same active consultation
context.

The shared state should include:

-   Consultation ID.
-   Message history.
-   Selected language.
-   Patient context permitted for the consultation.
-   Attachment references.
-   Current request status.
-   AI interaction state.

Switching modes must not create a new consultation or clear existing
messages unless the user explicitly starts a new consultation.

## 3.4 Frontend Service Layer

Keep network and integration code outside presentation components.

Suggested services:

-   `authService`
-   `consultationService`
-   `messageService`
-   `profileService`
-   `uploadService`
-   `reportService`
-   `doctorService`
-   `syncService`
-   `aiService`

The frontend must never connect directly to MySQL or directly expose the
Ollama API to the public browser.

------------------------------------------------------------------------

# 4. Authentication Architecture -- Firebase Authentication

## 4.1 Responsibilities

Firebase Authentication is responsible for:

-   User registration.
-   User login.
-   Session management.
-   Access-token issuance and refresh.
-   Password recovery.
-   Email verification, if enabled.
-   Sign-out.

## 4.2 Authentication Flow

``` mermaid
sequenceDiagram
    participant User
    participant React as React Frontend
    participant Firebase as Firebase Authentication
    participant API as FastAPI
    participant DB as MySQL

    User->>React: Submit sign-up or login
    React->>Firebase: Authentication request
    Firebase-->>React: Session and access token
    React->>API: Request with Bearer token
    API->>API: Validate token signature and claims
    API->>DB: Find application user by Firebase user ID
    DB-->>API: Application profile and role
    API-->>React: Authorized application response
```

## 4.3 Backend Token Verification

FastAPI must verify Firebase-issued access tokens using the project's
configured Firebase ID token verification method.

Verification must validate:

-   Token signature using the appropriate trusted key or configured
    verification method.
-   Issuer.
-   Expiration.
-   Audience, where applicable.
-   Required subject claim.

Do not merely decode a JWT and trust its contents.

Do not accept a user ID supplied in the request body as proof of
identity.

## 4.4 User Identity Mapping

MySQL should maintain an application user record linked to the Firebase
Auth identity.

Suggested fields:

-   `id`: MySQL application primary key.
-   `firebase_uid`: Firebase Authentication user UUID, unique and not null.
-   `email`: application contact email, if stored.
-   `role`: application role assigned and controlled by the backend.
-   `created_at`.
-   `updated_at`.

The Firebase UID is the identity mapping key. Do not store the
user's password in MySQL.

## 4.5 Roles and Authorization

Initial application roles may include:

-   `patient`
-   `doctor`
-   `admin`

Rules:

-   New registrations must not be able to self-assign the doctor or
    admin role.
-   Role assignment must be controlled by a trusted administrative
    workflow.
-   The backend must enforce role permissions on every protected
    operation.
-   Frontend route guards are for user experience only and are not a
    security boundary.

## 4.6 Logout and Account Lifecycle

-   Use Firebase Authentication sign-out.
-   Clear local application session state.
-   Handle expired or refreshed sessions.
-   Define how application profile records are created and updated after
    authentication.
-   Define an explicit account deletion and health-data retention
    process before implementing deletion.

------------------------------------------------------------------------

# 5. Backend Architecture

## 5.1 Technology

-   Python.
-   FastAPI.
-   Pydantic.
-   MySQL driver or ORM.
-   Firebase ID token verification.

## 5.2 Backend Responsibilities

FastAPI acts as the central application API and orchestration layer.

It is responsible for:

-   Authentication-token verification.
-   Role-based authorization.
-   Patient profile management.
-   Consultation lifecycle.
-   Message persistence.
-   AI orchestration.
-   Image upload validation.
-   Report generation and storage.
-   Doctor review workflows.
-   Referral and follow-up management.
-   Offline synchronization endpoints.
-   Audit logging.

## 5.3 Suggested Backend Modules

``` text
backend/
└── app/
    ├── main.py
    ├── core/
    │   ├── config.py
    │   ├── security.py
    │   └── dependencies.py
    ├── api/
    │   ├── profiles.py
    │   ├── consultations.py
    │   ├── messages.py
    │   ├── uploads.py
    │   ├── reports.py
    │   ├── doctors.py
    │   ├── referrals.py
    │   └── sync.py
    ├── schemas/
    ├── models/
    ├── services/
    ├── ai/
    │   ├── orchestrator.py
    │   ├── qwen_text.py
    │   ├── qwen_vision.py
    │   ├── speech.py
    │   └── translation.py
    ├── safety/
    │   ├── triage_rules.py
    │   └── escalation.py
    └── database/
        ├── connection.py
        └── repositories/
```

------------------------------------------------------------------------

# 6. MySQL Application Data Architecture

MySQL is the primary relational database for application data.

Firebase Authentication is not a replacement for this database.

## 6.1 Main Entities

``` mermaid
erDiagram
    USERS ||--o| PATIENT_PROFILES : has
    USERS ||--o{ CONSULTATIONS : starts
    CONSULTATIONS ||--o{ MESSAGES : contains
    CONSULTATIONS ||--o{ UPLOADED_FILES : includes
    CONSULTATIONS ||--o| MEDICAL_REPORTS : produces
    CONSULTATIONS ||--o{ DOCTOR_REVIEWS : receives
    USERS ||--o{ DOCTOR_REVIEWS : writes
    CONSULTATIONS ||--o{ REFERRALS : creates
    REFERRALS ||--o{ FOLLOW_UPS : tracks
    USERS ||--o{ CONSENT_RECORDS : grants

    USERS {
        bigint id PK
        uuid firebase_uid UK
        varchar email
        varchar role
        datetime created_at
    }

    PATIENT_PROFILES {
        bigint id PK
        bigint user_id FK
        date date_of_birth
        varchar gender
        decimal height
        decimal weight
        varchar blood_group
        varchar preferred_language
    }

    CONSULTATIONS {
        bigint id PK
        bigint patient_user_id FK
        varchar status
        varchar language
        datetime started_at
        datetime ended_at
    }

    MESSAGES {
        bigint id PK
        bigint consultation_id FK
        varchar sender_type
        text content
        datetime created_at
    }

    UPLOADED_FILES {
        bigint id PK
        bigint consultation_id FK
        varchar storage_key
        varchar mime_type
        bigint file_size
        datetime created_at
    }

    MEDICAL_REPORTS {
        bigint id PK
        bigint consultation_id FK
        json report_data
        varchar review_status
        datetime created_at
    }

    DOCTOR_REVIEWS {
        bigint id PK
        bigint consultation_id FK
        bigint doctor_user_id FK
        text clinical_notes
        datetime reviewed_at
    }

    REFERRALS {
        bigint id PK
        bigint consultation_id FK
        varchar status
        text instructions
    }

    FOLLOW_UPS {
        bigint id PK
        bigint referral_id FK
        datetime scheduled_at
        varchar status
    }

    CONSENT_RECORDS {
        bigint id PK
        bigint user_id FK
        varchar consent_type
        datetime granted_at
        datetime withdrawn_at
    }
```

This is a conceptual relationship model. Exact SQL types, indexes,
constraints and deletion policies must be defined in `database.md`.

## 6.2 Data Separation

Store only the information required for each workflow.

-   Authentication credentials and sessions: Firebase Authentication.
-   Application identity and role mapping: MySQL `users`.
-   Optional health profile: MySQL `patient_profiles`.
-   Consultation data: MySQL.
-   File binaries: protected file storage.
-   File metadata and storage references: MySQL.

Never store passwords in the application database.

------------------------------------------------------------------------

# 7. AI Architecture

## 7.1 AI Orchestrator

The backend AI orchestrator coordinates the different models and
services.

It should:

1.  Receive a validated consultation request.
2.  Load only the authorized consultation context.
3.  Identify the required task.
4.  Route the task to the appropriate model or service.
5.  Validate the result.
6.  Apply clinical safety checks.
7.  Return a structured response.
8.  Persist appropriate records.

## 7.2 Text Model -- Qwen2.5:7B

Runtime: Ollama.

Responsibilities:

-   Conversational intake.
-   Relevant follow-up questions.
-   Patient-friendly explanations.
-   Symptom summarization.
-   Structured consultation report drafting.

The model is an assistant for intake and documentation. It is not an
autonomous diagnostic or prescribing system.

## 7.3 Vision Model -- Qwen2.5-VL:3B

Runtime: Ollama.

Responsibilities:

-   Process supported image inputs.
-   Describe visible image features.
-   Provide cautious preliminary observations.
-   Contribute descriptive observations to a consultation summary.

Vision output must not be treated as a confirmed clinical finding.

## 7.4 Model Resource Management

The development laptop has limited GPU memory.

Initial implementation should:

-   Run models sequentially where practical.
-   Avoid loading both models into GPU memory unnecessarily.
-   Configure model timeouts.
-   Handle model loading delays.
-   Handle Ollama unavailable errors.
-   Benchmark latency and memory use.
-   Keep model selection configurable.

Do not assume that a model downloaded on a developer laptop is
automatically available to deployed users.

## 7.5 AI Response Validation

Use structured output schemas for reports.

Validate: - Required fields. - Field types. - Allowed status values. -
Source of each observation. - Uncertainty and limitation fields.

Do not save unvalidated model output as a clinician-reviewed report.

------------------------------------------------------------------------

# 8. Voice and Multilingual Architecture

The voice pipeline is separate from the text LLM.

## 8.1 Speech Input

``` text
Patient microphone
       |
       v
Audio capture
       |
       v
Speech recognition
       |
       v
Transcribed text
       |
       v
Language identification / translation if needed
       |
       v
AI orchestrator
```

## 8.2 Speech Output

``` text
AI response text
       |
       v
Translation if required
       |
       v
Text-to-speech
       |
       v
Audio playback
       |
       v
Virtual doctor speaking video
```

## 8.3 Candidate Services

Evaluate suitable versions of:

-   AI4Bharat IndicConformer or Whisper for speech recognition.
-   AI4Bharat IndicTrans2 for translation.
-   AI4Bharat Indic-TTS or another tested TTS system.

Initial language testing should prioritize Marathi, Hindi and English.

Do not assume all candidate models can run simultaneously on the target
hardware. Benchmark them and choose a practical deployment
configuration.

## 8.4 Avatar Synchronization

The frontend should follow actual interaction state:

-   Patient audio capture: listening video.
-   AI response generation: processing indicator with idle/listening
    video.
-   AI response audio playback: speaking video.
-   Audio playback completed: listening video.

The video is a visual representation of the assistant's state; it must
not be presented as a real human doctor.

------------------------------------------------------------------------

# 9. Camera and Image Architecture

## 9.1 Image Capture

The browser obtains camera access after explicit user permission.

The user can:

-   Enable or disable the camera.
-   Preview the camera feed.
-   Capture a still image.
-   Upload an existing image.
-   Preview or remove an image before submission.

## 9.2 Image Processing Flow

``` mermaid
flowchart TD
    A[User captures or selects image]
    B[Frontend preview and consent]
    C[Secure upload to FastAPI]
    D[File validation]
    E[Protected file storage]
    F[Metadata saved in MySQL]
    G[Vision model processing]
    H[Validated descriptive observations]
    I[Consultation summary]
    J[Doctor review]

    A --> B --> C --> D --> E
    D --> F
    E --> G --> H --> I --> J
```

The system must distinguish an image captured locally from an image
successfully uploaded and processed.

Do not infer disease from eye colour or other visual appearance alone.
For example, a photograph cannot confirm or rule out jaundice.

------------------------------------------------------------------------

# 10. Offline-First Architecture

Offline support is implemented as a combination of browser storage and
optional local services.

## 10.1 Browser Layer

-   Service Worker caches the application shell and approved static
    assets.
-   IndexedDB stores pending consultation data and upload queue
    metadata.
-   Local status indicators show whether data is pending
    synchronization.

## 10.2 Local AI Layer

Where a community healthcare centre has a configured local computer:

-   FastAPI can run locally.
-   Ollama can run locally.
-   Downloaded Qwen models can process supported tasks.
-   Devices can connect over the centre's local network.

A patient's phone cannot automatically access the developer's laptop or
a local Ollama service unless the network and deployment are explicitly
configured.

## 10.3 Synchronization

``` mermaid
flowchart TD
    A[Patient creates consultation]
    B{Internet available?}
    C[Send to remote FastAPI]
    D[Save locally in IndexedDB]
    E[Add to outbox queue]
    F[Connection restored]
    G[Retry synchronization]
    H[Server validates and deduplicates]
    I[Save in MySQL]
    J[Server acknowledgement]
    K[Mark synchronized]

    A --> B
    B -->|Yes| C --> H
    B -->|No| D --> E --> F --> G --> H
    H --> I --> J --> K
```

Use stable client-generated IDs and idempotent synchronization
operations to prevent duplicate records.

Firebase Authentication session availability and token expiry must also be
considered during offline use. Do not promise that all authenticated
cloud operations will work offline.

------------------------------------------------------------------------

# 11. Security Boundaries

## 11.1 Authentication

Firebase Authentication manages authentication.

FastAPI verifies tokens and applies authorization.

## 11.2 Application Data

MySQL stores application records.

All queries must be scoped to the authenticated user and their
authorized role.

## 11.3 AI Services

Model calls are made through trusted backend services.

Do not expose internal Ollama endpoints or privileged credentials to the
browser.

## 11.4 File Storage

Uploaded files must be protected.

Use authenticated access or short-lived authorized download links. Do
not expose private medical images through public URLs.

## 11.5 Auditability

Record important actions such as:

-   Consent changes.
-   Doctor review.
-   Referral updates.
-   Report amendments.
-   Access to sensitive clinical records where required.

Do not place unnecessary patient health information in application logs.

------------------------------------------------------------------------

# 12. Deployment Topologies

## 12.1 Hackathon Development Setup

``` text
Developer Laptop
├── React + Vite
├── FastAPI
├── MySQL
├── Ollama
│   ├── Qwen2.5:7B
│   └── Qwen2.5-VL:3B
└── Browser
```

Firebase Authentication is accessed through its configured hosted service, so
authentication requires internet connectivity.

## 12.2 Hybrid Community Healthcare Centre

``` text
Patient Phones / Tablets
        |
        | Local Wi-Fi
        v
Community Centre Computer
├── Local Frontend / PWA access
├── Local FastAPI
├── Ollama + downloaded models
└── Local pending-data storage
        |
        | Internet available
        v
Remote Services
├── Firebase Authentication
├── Remote FastAPI / application services
├── MySQL application database
└── Protected file storage
        |
        v
Authorized Doctor Interface
```

This is a proposed deployment model. It requires explicit implementation
of local networking, secure storage, synchronization and authentication
behaviour.

------------------------------------------------------------------------

# 13. Implementation Sequence

Recommended implementation order:

## Phase 1 -- Frontend Foundation

-   Initialize React and Vite.
-   Configure Tailwind CSS.
-   Implement shared design tokens.
-   Implement Login and Sign Up using Firebase Authentication.
-   Implement shared navbar.
-   Implement Text Mode.
-   Implement Virtual Doctor Mode.
-   Implement profile interface.

## Phase 2 -- Backend and Identity

-   Initialize FastAPI.
-   Configure environment variables.
-   Integrate Firebase ID token verification.
-   Create MySQL connection.
-   Create application user mapping.
-   Implement role-based authorization.

## Phase 3 -- Consultation Data

-   Create consultation APIs.
-   Create message APIs.
-   Persist conversation history.
-   Implement patient profile APIs.
-   Implement protected image uploads.

## Phase 4 -- AI Integration

-   Integrate Qwen2.5:7B.
-   Integrate Qwen2.5-VL:3B.
-   Implement AI orchestration.
-   Validate structured outputs.
-   Implement clinical safety checks.

## Phase 5 -- Voice and Avatar

-   Implement speech recognition.
-   Implement multilingual text handling.
-   Implement text-to-speech.
-   Integrate four doctor video assets.
-   Synchronize avatar states with audio playback.

## Phase 6 -- Doctor Workflow

-   Doctor dashboard.
-   Authorized report review.
-   Clinical notes.
-   Referral and follow-up management.

## Phase 7 -- Offline Support

-   PWA and Service Worker.
-   IndexedDB.
-   Local consultation capture.
-   Upload queue.
-   Synchronization and conflict handling.
-   Local AI deployment testing.

------------------------------------------------------------------------

# 14. Architecture Decisions Summary

  Concern                   Selected technology / approach
  ------------------------- -------------------------------------
  Frontend                  React + Vite
  Styling                   Tailwind CSS
  Backend                   FastAPI
  Authentication            Firebase Authentication
  Application database      MySQL
  Main LLM                  Qwen2.5:7B via Ollama
  Vision LLM                Qwen2.5-VL:3B via Ollama
  Speech recognition        IndicConformer / Whisper evaluation
  Translation               IndicTrans2 evaluation
  Text-to-speech            Indic-TTS evaluation
  Offline browser storage   IndexedDB
  Application caching       Service Worker / PWA
  Media access              Browser Media APIs
  Doctor review             Authorized FastAPI workflows

------------------------------------------------------------------------

# 15. Open Technical Decisions

The following decisions require validation before production
implementation:

1.  Firebase ID token verification configuration for the selected project
    and signing-key setup.
2.  MySQL hosting and backup strategy.
3.  Protected image storage provider and retention policy.
4.  Exact speech recognition and TTS models based on language quality
    and hardware performance.
5.  Local healthcare centre deployment and device discovery.
6.  Offline authentication and session-expiry behaviour.
7.  Clinical review workflow and authorized doctor onboarding.
8.  Security, privacy and retention requirements for the intended
    deployment region.

Do not silently assume these decisions have already been finalized.

------------------------------------------------------------------------

# 16. Final Architecture Principle

AAROGYA LINK must remain modular.

Authentication, application data, AI inference, speech processing, media
handling and offline synchronization must have clearly separated
responsibilities.

**Firebase Authentication handles identity. MySQL handles application data.
FastAPI coordinates the system. Ollama provides local AI inference.
React delivers the patient and doctor experience.**

The architecture must prioritize patient privacy, reliable operation,
transparent AI limitations and qualified clinical oversight.


## Firebase Authentication Implementation Notes

- Initialize the Firebase Web SDK in the React application using the Firebase project configuration.
- Use Firebase Authentication client methods for registration, sign-in, sign-out and password recovery.
- Obtain the current user's Firebase ID token and send it as `Authorization: Bearer <id_token>`.
- FastAPI must verify the ID token with the Firebase Admin SDK. Validate token signature, issuer, audience, expiry and project association through the SDK's verification method.
- Use the verified `uid` claim as the identity key. Never trust a UID supplied in the request body.
- Keep Firebase Admin credentials/service-account material only in the backend secret manager or protected environment. Never bundle it into frontend code or commit it to Git.
- In MySQL, store the UID in `users.firebase_uid` as `VARCHAR(128) UNIQUE NOT NULL`; do not store passwords.
