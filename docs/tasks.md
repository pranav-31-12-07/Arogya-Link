# AAROGYA LINK

## Development Roadmap and Implementation Tasks

**Document:** `tasks.md`\
**Version:** 1.0\
**Status:** Proposed implementation plan\
**Purpose:** Guide development using Antigravity and the project
documentation.

------------------------------------------------------------------------

# 1. How to Use This Roadmap

This roadmap converts the AAROGYA LINK requirements into implementation
phases and verifiable tasks.

Use it alongside:

-   `prd.md` -- Product requirements.
-   `design.md` -- UI/UX design system and screen requirements.
-   `rules.md` -- Development rules and AI coding-agent instructions.
-   `architecture.md` -- System architecture.
-   `database.md` -- MySQL schema.
-   `ai.md` -- AI model and shared context design.
-   `api.md` -- FastAPI endpoint specification.
-   `offline.md` -- PWA and offline-first architecture.

## 1.1 Working Rules

-   Complete one logical task at a time.
-   Read the relevant documentation before implementing a feature.
-   Do not redesign approved Stitch screens without a clear requirement.
-   Do not silently change the technology stack or confirmed model
    allocation.
-   Keep frontend, backend, AI, storage and database responsibilities
    separated.
-   Run relevant tests after each implementation phase.
-   Do not claim a feature is complete unless it has been implemented
    and verified.
-   Update this roadmap when tasks are completed or scope changes.

------------------------------------------------------------------------

# 2. Project Setup and Repository

## Phase 0 -- Repository and Environment

### Tasks

-   [ ] Create the project repository.
-   [ ] Establish a clean project root.
-   [ ] Add all project documentation under `/docs`.
-   [ ] Add `.gitignore`.
-   [ ] Add `.env.example` files.
-   [ ] Add a root `README.md`.
-   [ ] Define frontend and backend development commands.
-   [ ] Document supported runtime versions.
-   [ ] Confirm the Ollama service is reachable locally.
-   [ ] Confirm `qwen2.5:7b` is installed.
-   [ ] Confirm `qwen2.5vl:3b` is installed.
-   [ ] Record baseline model response time and resource usage.

### Suggested Repository Structure

``` text
aarogya-link/
├── docs/
│   ├── prd.md
│   ├── design.md
│   ├── rules.md
│   ├── architecture.md
│   ├── database.md
│   ├── ai.md
│   ├── api.md
│   ├── offline.md
│   └── tasks.md
├── frontend/
├── backend/
├── storage/
│   └── .gitkeep
├── .gitignore
├── .env.example
└── README.md
```

Do not commit real `.env` files, credentials, patient data, model files
or private consultation media.

### Completion Criteria

-   Repository structure is established.
-   Documentation is version-controlled.
-   Frontend and backend can be started independently.
-   Secrets and local storage are excluded from Git.

------------------------------------------------------------------------

# 3. Frontend Foundation

## Phase 1 -- React Application Setup

### Tasks

-   [ ] Initialize React with Vite.
-   [ ] Configure JavaScript.
-   [ ] Install and configure Tailwind CSS.
-   [ ] Add Lucide icons.
-   [ ] Configure application routing.
-   [ ] Create shared design tokens from `design.md`.
-   [ ] Configure typography and global styles.
-   [ ] Create reusable buttons, inputs, cards and dialogs.
-   [ ] Create a consistent loading, empty and error state system.
-   [ ] Implement responsive layout foundations.

### Completion Criteria

-   Frontend starts without errors.
-   Shared styles and reusable components are available.
-   The UI follows the approved white-and-green design direction.

------------------------------------------------------------------------

# 4. Authentication

## Phase 2 -- Firebase Authentication Integration

### Tasks

-   [ ] Create/configure the Firebase project.
-   [ ] Configure frontend Firebase client using public project
    configuration.
-   [ ] Implement Sign Up.
-   [ ] Implement Login.
-   [ ] Implement session persistence.
-   [ ] Implement Sign Out.
-   [ ] Implement password recovery.
-   [ ] Handle email verification if enabled.
-   [ ] Implement protected frontend routes.
-   [ ] Implement FastAPI Firebase ID token verification.
-   [ ] Implement `POST /users/bootstrap`.
-   [ ] Map verified Firebase UID to MySQL `users.firebase_uid`.
-   [ ] Ensure new users receive the default `patient` role.
-   [ ] Prevent public self-assignment of doctor/admin roles.

### Completion Criteria

-   User can sign up and log in through Firebase Authentication.
-   FastAPI rejects invalid or expired access tokens.
-   Application user mapping is idempotent.
-   Role permissions are enforced on the backend.

------------------------------------------------------------------------

# 5. Patient Interface

## Phase 3 -- Shared Patient Application Shell

### Tasks

-   [ ] Implement the shared navbar.
-   [ ] Implement Text / Virtual Doctor mode switch.
-   [ ] Implement language selector.
-   [ ] Implement profile icon and profile panel.
-   [ ] Implement connection status indicator.
-   [ ] Implement consultation status indicator.
-   [ ] Implement shared active-consultation state.
-   [ ] Ensure switching modes does not create a new consultation.
-   [ ] Implement navigation and empty states.

### Completion Criteria

-   Shared navigation works across patient screens.
-   Current consultation remains active while switching modes.
-   UI is consistent with approved Stitch references.

## Phase 4 -- Text Mode

### Tasks

-   [ ] Build conversation message list.
-   [ ] Build message composer.
-   [ ] Add send action.
-   [ ] Add image upload control.
-   [ ] Add microphone control.
-   [ ] Add assistant loading state.
-   [ ] Add copy response action.
-   [ ] Add text-to-speech playback control.
-   [ ] Add error and retry states.
-   [ ] Connect to consultation and message APIs.

### Completion Criteria

-   Patient can send and view messages.
-   Message history remains associated with the active consultation.
-   UI handles loading, failure and retry states.

## Phase 5 -- Virtual Doctor Mode

### Tasks

-   [ ] Build the central doctor video area.
-   [ ] Add male/female avatar selector.
-   [ ] Add microphone mute/unmute control.
-   [ ] Add camera enable/disable control.
-   [ ] Add image upload control.
-   [ ] Add listening video asset for male avatar.
-   [ ] Add speaking video asset for male avatar.
-   [ ] Add listening video asset for female avatar.
-   [ ] Add speaking video asset for female avatar.
-   [ ] Implement processing indicator.
-   [ ] Synchronize video state with actual audio interaction state.
-   [ ] Handle camera and microphone permissions.
-   [ ] Handle unavailable or denied media permissions.
-   [ ] Connect speech and media APIs.

### Completion Criteria

-   Avatar selection works.
-   Listening and speaking assets switch according to actual interaction
    state.
-   Camera and microphone permissions are respected.
-   Text and Virtual Doctor modes share the same consultation.

------------------------------------------------------------------------

# 6. Patient Profile

## Phase 6 -- Profile Management

### Tasks

-   [ ] Build profile view.
-   [ ] Implement editable optional fields.
-   [ ] Connect profile read API.
-   [ ] Connect profile update API.
-   [ ] Validate height, weight and date fields.
-   [ ] Implement preferred language setting.
-   [ ] Implement safe handling of optional emergency contact
    information.
-   [ ] Add profile completeness indicator only if useful.

### Completion Criteria

-   User can view and update permitted profile information.
-   Backend validates all changes.
-   Only the authenticated user's profile can be modified.

------------------------------------------------------------------------

# 7. Backend Foundation

## Phase 7 -- FastAPI Setup

### Tasks

-   [ ] Initialize FastAPI application.
-   [ ] Configure settings using environment variables.
-   [ ] Configure CORS for known frontend origins.
-   [ ] Configure request validation.
-   [ ] Configure consistent error responses.
-   [ ] Configure request IDs and safe logging.
-   [ ] Configure Firebase ID token verification.
-   [ ] Configure MySQL connection.
-   [ ] Add database migrations.
-   [ ] Add health endpoint.
-   [ ] Add readiness checks for required dependencies.
-   [ ] Add automated backend test setup.

### Completion Criteria

-   FastAPI starts reliably.
-   Firebase ID tokens are verified.
-   MySQL connection works.
-   Health and readiness checks behave correctly.

------------------------------------------------------------------------

# 8. Database Implementation

## Phase 8 -- MySQL Schema

### Tasks

-   [ ] Create development database.
-   [ ] Create `users` table.
-   [ ] Create `patient_profiles` table.
-   [ ] Create `consultations` table.
-   [ ] Create `messages` table.
-   [ ] Create `uploaded_files` table.
-   [ ] Create `consultation_reports` table.
-   [ ] Create `doctor_reviews` table.
-   [ ] Create `referrals` table.
-   [ ] Create `follow_ups` table.
-   [ ] Create `consent_records` table.
-   [ ] Create `audit_logs` table.
-   [ ] Add foreign keys and indexes.
-   [ ] Add migration and rollback process.
-   [ ] Test ownership and role-based data access.

### Completion Criteria

-   Schema matches the approved database design.
-   Referential integrity works.
-   Migrations can be applied and rolled back in development.
-   Cross-patient data access tests pass.

------------------------------------------------------------------------

# 9. Consultation and Messaging

## Phase 9 -- Consultation Workflow

### Tasks

-   [ ] Implement consultation creation.
-   [ ] Implement consultation listing.
-   [ ] Implement consultation detail endpoint.
-   [ ] Implement consultation status updates.
-   [ ] Implement consultation closing.
-   [ ] Implement message creation.
-   [ ] Implement message history pagination.
-   [ ] Add stable client message IDs.
-   [ ] Add duplicate request handling.
-   [ ] Ensure Text and Virtual Doctor modes use the same consultation
    ID.

### Completion Criteria

-   Consultation lifecycle works.
-   Messages persist in MySQL.
-   Duplicate retries do not create duplicate messages.
-   Access is restricted to authorized users.

------------------------------------------------------------------------

# 10. Shared AI Context

## Phase 10 -- `context.txt` Management

### Tasks

-   [ ] Create a protected consultation storage root.
-   [ ] Create a separate consultation directory.
-   [ ] Create one `context.txt` per consultation.
-   [ ] Define a consistent context entry format.
-   [ ] Persist patient messages before model calls.
-   [ ] Append assistant responses after validation.
-   [ ] Add speech transcriptions to the same context.
-   [ ] Add validated visual observations to the same context.
-   [ ] Add timestamps and interaction mode metadata.
-   [ ] Add context version or event sequence tracking.
-   [ ] Serialize concurrent updates per consultation.
-   [ ] Rebuild context from MySQL when missing or stale.
-   [ ] Prevent arbitrary client filesystem paths.
-   [ ] Test patient and consultation isolation.

### Completion Criteria

-   Each consultation has an isolated context artifact.
-   Mode switches preserve context.
-   Context can be rebuilt from persisted records.
-   Failed file writes do not lose persisted messages.
-   No context is shared between different patients or consultations.

------------------------------------------------------------------------

# 11. AI Model Integration

## Phase 11 -- Ollama and Text Model

### Confirmed model allocation

-   Text-to-Text: `qwen2.5:7b`
-   Speech-to-Speech conversation: `qwen2.5:7b`
-   Video/visual input: `qwen2.5vl:3b`

### Tasks

-   [ ] Configure Ollama base URL.
-   [ ] Configure model names through environment variables.
-   [ ] Implement backend Ollama client.
-   [ ] Check model availability.
-   [ ] Implement `qwen2.5:7b` text conversation.
-   [ ] Load shared consultation context for each request.
-   [ ] Validate response output.
-   [ ] Persist assistant response.
-   [ ] Update shared context.
-   [ ] Add timeouts and recoverable errors.
-   [ ] Benchmark latency and memory usage.
-   [ ] Test model switching and resource management.

### Completion Criteria

-   Text Mode uses the configured text model.
-   Responses include relevant prior consultation context.
-   Model failures preserve the patient's submitted message.
-   Ollama is not exposed directly to the browser.

## Phase 12 -- Vision Model

### Tasks

-   [ ] Implement protected image upload.
-   [ ] Validate MIME type and file size.
-   [ ] Store media outside public directories.
-   [ ] Implement selected-frame extraction if required.
-   [ ] Integrate `qwen2.5vl:3b`.
-   [ ] Send relevant consultation context with visual requests.
-   [ ] Validate structured visual observations.
-   [ ] Record model and media provenance.
-   [ ] Add observations to the shared context.
-   [ ] Test poor-quality and unsupported images.

### Completion Criteria

-   Vision model processes supported selected images/frames.
-   Observations are labelled as AI-generated.
-   No visual output is represented as a confirmed diagnosis.

------------------------------------------------------------------------

# 12. Speech Integration

## Phase 13 -- Speech-to-Speech

### Tasks

-   [ ] Select and benchmark ASR for Marathi, Hindi and English.
-   [ ] Implement microphone audio capture.
-   [ ] Implement speech upload endpoint.
-   [ ] Implement speech-to-text.
-   [ ] Preserve original transcription.
-   [ ] Integrate `qwen2.5:7b` for response generation.
-   [ ] Integrate selected TTS service.
-   [ ] Return protected audio response.
-   [ ] Add audio playback controls.
-   [ ] Add interruption and retry handling.
-   [ ] Add speech transcription and response to shared context.
-   [ ] Synchronize avatar speaking/listening states.

### Completion Criteria

-   Speech input becomes a transcription.
-   The text model generates the conversational response.
-   TTS converts the response to audio.
-   The complete interaction is persisted in the same consultation.
-   Switching to Text Mode retains speech interaction history.

------------------------------------------------------------------------

# 13. Reports and Doctor Workflow

## Phase 14 -- Consultation Reports

### Tasks

-   [ ] Define structured report schema.
-   [ ] Generate draft summary from persisted consultation events.
-   [ ] Distinguish patient statements from AI observations.
-   [ ] Record model and prompt version where applicable.
-   [ ] Implement report retrieval.
-   [ ] Add explicit draft/review status.
-   [ ] Ensure AI-generated content is not labelled clinician-approved.

### Completion Criteria

-   Report is traceable to its consultation.
-   AI content is clearly distinguished from clinician-entered content.
-   Report can be reviewed through an authorized workflow.

## Phase 15 -- Doctor Dashboard

### Tasks

-   [ ] Define doctor onboarding and verification workflow.
-   [ ] Implement doctor role assignment through trusted administration.
-   [ ] Build doctor dashboard.
-   [ ] List authorized consultations.
-   [ ] Build consultation detail view.
-   [ ] Display messages and uploaded media securely.
-   [ ] Display AI-generated summary and visual observations.
-   [ ] Implement doctor review and notes.
-   [ ] Implement referral workflow.
-   [ ] Implement follow-up workflow.
-   [ ] Add audit events for sensitive actions.

### Completion Criteria

-   Only authorized doctors can access permitted patient records.
-   Doctors can review and document clinical decisions.
-   Patients cannot self-assign doctor permissions.

------------------------------------------------------------------------

# 14. Offline-First Implementation

## Phase 16 -- PWA and Local Storage

### Tasks

-   [ ] Add web app manifest.
-   [ ] Configure Service Worker.
-   [ ] Cache approved application shell assets.
-   [ ] Implement offline fallback.
-   [ ] Create IndexedDB schema.
-   [ ] Add local consultation drafts.
-   [ ] Add local message capture.
-   [ ] Add media upload queue.
-   [ ] Add synchronization outbox.
-   [ ] Add clear offline and pending-sync UI states.
-   [ ] Handle IndexedDB schema upgrades.
-   [ ] Define local data retention and sign-out behaviour.

### Completion Criteria

-   Installed PWA opens offline.
-   Patient can save eligible text interactions locally.
-   UI distinguishes local save from server synchronization.
-   Private API responses are not indiscriminately cached.

## Phase 17 -- Synchronization

### Tasks

-   [ ] Implement sync batch endpoint.
-   [ ] Validate event ownership and payloads.
-   [ ] Add idempotent event handling.
-   [ ] Return per-event acknowledgements.
-   [ ] Implement retry policy.
-   [ ] Handle partial batch acceptance.
-   [ ] Handle expired Firebase Authentication sessions.
-   [ ] Rebuild server context from accepted MySQL events.
-   [ ] Test duplicate and out-of-order events.
-   [ ] Add recovery for failed media uploads.

### Completion Criteria

-   Accepted events are stored once.
-   Client marks events synced only after acknowledgement.
-   Failed events remain recoverable.
-   Context is reconstructed without overwriting server history.

------------------------------------------------------------------------

# 15. Security and Quality Assurance

## Phase 18 -- Security Review

### Tasks

-   [ ] Verify Firebase ID token validation.
-   [ ] Verify backend role checks.
-   [ ] Verify resource ownership checks.
-   [ ] Verify file access authorization.
-   [ ] Check upload size and content validation.
-   [ ] Check secrets are not committed.
-   [ ] Check no Firebase Admin SDK secret reaches the frontend.
-   [ ] Check Ollama is not publicly exposed.
-   [ ] Check context-file path isolation.
-   [ ] Check local storage and shared-device behaviour.
-   [ ] Review consent and retention workflows.
-   [ ] Review audit logging.
-   [ ] Test cross-patient access attempts.

### Completion Criteria

-   Unauthorized access attempts are rejected.
-   Sensitive files and context are protected.
-   No secrets are exposed in browser bundles or Git.

## Phase 19 -- Functional and Integration Testing

### Tasks

-   [ ] Test registration and login.
-   [ ] Test patient profile.
-   [ ] Test consultation lifecycle.
-   [ ] Test text conversation.
-   [ ] Test speech conversation.
-   [ ] Test visual analysis.
-   [ ] Test switching between all modes.
-   [ ] Test context continuity.
-   [ ] Test context isolation.
-   [ ] Test model unavailable scenarios.
-   [ ] Test offline capture and synchronization.
-   [ ] Test doctor review and referral workflows.
-   [ ] Test responsive UI.
-   [ ] Test browser permission denial.
-   [ ] Test application restart and recovery.

### Completion Criteria

-   Critical end-to-end workflows pass.
-   Errors are handled without silently losing patient input.
-   No unresolved critical security or data-isolation defect remains.

------------------------------------------------------------------------

# 16. Deployment and Demo Preparation

## Phase 20 -- Deployment Readiness

### Tasks

-   [ ] Configure production environment variables.
-   [ ] Configure frontend hosting.
-   [ ] Configure backend hosting.
-   [ ] Configure MySQL hosting and backups.
-   [ ] Configure Firebase Authentication redirect URLs.
-   [ ] Configure HTTPS and allowed origins.
-   [ ] Configure protected file storage.
-   [ ] Configure Ollama/model deployment strategy.
-   [ ] Add health monitoring.
-   [ ] Prepare synthetic demonstration data.
-   [ ] Verify no real patient data is included in the demo.
-   [ ] Write deployment instructions.
-   [ ] Prepare architecture and workflow diagrams.
-   [ ] Record known limitations.

### Completion Criteria

-   A reproducible deployment procedure exists.
-   Demo uses synthetic or appropriately anonymized data.
-   Known limitations and model constraints are disclosed.

------------------------------------------------------------------------

# 17. Suggested MVP Priority

The full product has a broad scope. Prioritize a reliable end-to-end
demonstration before implementing every advanced feature.

## MVP Must-Have

1.  Firebase Authentication.
2.  Patient profile basics.
3.  Shared React application shell.
4.  Text Mode.
5.  Virtual Doctor Mode with avatar state videos.
6.  FastAPI backend.
7.  MySQL application schema.
8.  Text interaction with `qwen2.5:7b`.
9.  Speech transcription → `qwen2.5:7b` → TTS flow.
10. Image upload and selected-frame analysis with `qwen2.5vl:3b`.
11. Consultation-specific `context.txt`.
12. Context continuity across interaction modes.
13. Basic draft consultation report.
14. Clear AI limitations and clinician-review workflow.
15. Basic PWA shell and offline text capture.

## Later Enhancements

-   Full multilingual coverage beyond initial test languages.
-   More advanced local healthcare-centre deployment.
-   Continuous video analysis.
-   Advanced offline authentication strategy.
-   Multi-device conflict resolution.
-   More complete doctor scheduling and facility directory.
-   Advanced analytics and operational reporting.

Do not claim a later enhancement is implemented until it has been built
and tested.

------------------------------------------------------------------------

# 18. End-to-End Demonstration Scenario

Use synthetic patient information.

1.  Patient signs up using Firebase Authentication.
2.  Patient opens a new consultation.
3.  Patient describes a concern in Marathi using Text Mode.
4.  `qwen2.5:7b` asks a follow-up question.
5.  Patient switches to Speech-to-Speech.
6.  ASR transcribes the response.
7.  `qwen2.5:7b` responds using the existing consultation context.
8.  TTS generates audio.
9.  Patient switches to Video Mode and captures a still image.
10. `qwen2.5vl:3b` provides cautious visual observations.
11. The observations are added to the same consultation context.
12. Patient returns to Text Mode and continues without repeating the
    previous details.
13. A structured draft summary is generated.
14. An authorized doctor reviews the consultation and enters clinical
    notes.
15. The application demonstrates offline capture and later
    synchronization with a separate test event.

The demonstration must make clear that model observations are not
diagnoses and that clinical decisions belong to qualified professionals.

------------------------------------------------------------------------

# 19. Final Development Principles

-   Follow the approved product and design documents.
-   Firebase Authentication handles identity.
-   MySQL stores application records.
-   FastAPI controls authorization and orchestration.
-   Ollama provides model inference.
-   `qwen2.5:7b` handles text and transcribed speech.
-   `qwen2.5vl:3b` handles selected visual inputs.
-   Each consultation has its own shared `context.txt`.
-   IndexedDB stores eligible pending offline work.
-   Server acknowledgement determines synchronization success.
-   Human clinical oversight remains essential.
-   Build, test and document each phase before moving on.

**The goal is a dependable, privacy-conscious, demonstrable healthcare
workflow---not simply a collection of AI features.**


## Authentication Provider Update

All authentication tasks must use Firebase Authentication:
- Configure Firebase project and Firebase Web SDK.
- Implement sign-up, sign-in, sign-out and password recovery with Firebase Authentication.
- Verify Firebase ID tokens in FastAPI using the Firebase Admin SDK.
- Map verified Firebase UIDs to MySQL `users.firebase_uid`.
- Ensure no legacy authentication-provider SDK, configuration or token-verification code remains.
