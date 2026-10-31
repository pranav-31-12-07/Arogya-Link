# AAROGYA LINK

## Development Rules and AI Coding Agent Instructions

**Project:** AAROGYA LINK\
**Document:** Development Rules (`rules.md`)\
**Version:** 1.0\
**Audience:** Antigravity and all developers\
**Related documents:** `prd.md`, `design.md`

------------------------------------------------------------------------

# 1. Purpose of This Document

This document defines the mandatory development rules for AAROGYA LINK.

All developers and AI coding agents, including Antigravity, must follow
these rules when creating, modifying, testing or documenting the
project.

The goal is to keep the codebase consistent, maintainable, secure and
aligned with the approved product requirements and Stitch designs.

**When instructions conflict, follow this priority:**

1.  Explicit user instructions in the current task.
2.  `prd.md` for product scope and requirements.
3.  `design.md` for visual design and UI behaviour.
4.  `rules.md` for implementation conventions.
5.  Existing project conventions, provided they do not conflict with the
    documents above.

Do not silently invent requirements or expand the product scope.

# 2. General AI Agent Behaviour

Antigravity must:

-   Read `prd.md`, `design.md` and this document before implementing
    features.
-   Inspect the existing project structure before changing files.
-   Understand existing code before replacing it.
-   Make focused, incremental changes.
-   Reuse existing components and utilities where appropriate.
-   Keep frontend, backend and documentation responsibilities separated.
-   Explain important implementation decisions.
-   Report files created or modified.
-   Run relevant checks after making changes.
-   Identify incomplete work honestly.

Antigravity must NOT:

-   Rewrite the entire project without approval.
-   Delete existing files or working features without explicit
    justification and approval.
-   Replace the approved Stitch design with a different visual
    direction.
-   Add unrelated features.
-   Introduce unnecessary dependencies.
-   fabricate clinical information, test results or doctor approvals.
-   Claim that a feature works when it is only a visual placeholder.
-   expose secrets, credentials, patient data or private configuration
    in logs.

If a requirement is ambiguous and affects architecture, security, data
integrity or user experience, ask for clarification before making an
irreversible decision.

# 3. Project Structure Rules

Use a clear separation between frontend, backend, documentation and
assets.

Recommended structure:

``` text
AAROGYA-LINK/
│
├── docs/
│   ├── prd.md
│   ├── design.md
│   ├── rules.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── ai.md
│   ├── offline.md
│   └── tasks.md
│
├── frontend/
│   ├── public/
│   │   └── videos/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── utils/
│       └── styles/
│
├── backend/
│   └── app/
│       ├── api/
│       ├── core/
│       ├── schemas/
│       ├── models/
│       ├── services/
│       ├── ai/
│       ├── safety/
│       ├── database/
│       └── main.py
│
├── .gitignore
├── README.md
└── .env.example
```

This is a recommended structure, not permission to move existing files
without checking the current repository.

Rules:

-   Keep frontend code inside `frontend/`.
-   Keep backend code inside `backend/`.
-   Keep project documentation inside `docs/`.
-   Keep generated doctor videos in `frontend/public/videos/`.
-   Do not commit model weights, large temporary files, local databases
    or secrets.
-   Do not create duplicate files or folders to work around
    understanding existing code.

# 4. Frontend Development Rules

## 4.1 Technology

Use:

-   React.
-   Vite.
-   Tailwind CSS.
-   JavaScript unless TypeScript is explicitly approved.
-   Lucide icons or the icon library already configured in the project.

Do not introduce another CSS framework without approval.

## 4.2 Component Architecture

Build reusable, focused components.

Examples:

-   `AppNavbar`
-   `ModeSwitcher`
-   `LanguageSelector`
-   `ProfileDropdown`
-   `ChatMessage`
-   `ChatComposer`
-   `ImageUploader`
-   `MicrophoneButton`
-   `DoctorSelector`
-   `DoctorVideo`
-   `ConsultationControls`
-   `CameraPreview`

Rules:

-   Keep components small and responsibility-focused.
-   Avoid giant components that manage the entire application.
-   Separate UI from API and business logic.
-   Use shared components for repeated UI.
-   Avoid unnecessary prop drilling; use context or a suitable state
    solution only when needed.
-   Do not introduce a global state library for a small feature without
    a clear reason.

## 4.3 Naming Conventions

-   React components: PascalCase, e.g. `DoctorVideo.jsx`.
-   Hooks: camelCase with `use` prefix, e.g. `useConsultation.js`.
-   Utility functions: camelCase.
-   Constants: UPPER_SNAKE_CASE where appropriate.
-   CSS classes: follow the existing Tailwind and project conventions.
-   File names should describe their purpose.

## 4.4 State Management

Maintain clear state for:

-   Active mode: Text or Virtual Doctor.
-   Selected doctor: Male or Female.
-   Avatar state: Listening, Speaking, Processing or Error.
-   Microphone permission and mute state.
-   Camera permission and active state.
-   Current consultation ID.
-   Current conversation messages.
-   Upload progress and attachment status.
-   Authentication and profile state.
-   Online/offline and synchronization state.

Text Mode and Virtual Doctor Mode must share the same active
consultation context.

Switching modes must not clear messages or create an unintended new
consultation.

Do not use unrelated state variables to represent multiple different
concepts.

## 4.5 UI Behaviour

-   Every visible interactive control must perform its stated action.
-   Show loading states for asynchronous operations.
-   Show clear error and success feedback.
-   Disable controls when an action cannot safely be performed.
-   Prevent accidental duplicate submissions.
-   Preserve user input when a recoverable request fails.
-   Use accessible labels for icon-only controls.
-   Avoid browser alerts for routine application feedback; use
    consistent inline feedback or toast components if configured.

# 5. Design System Rules

The approved Stitch designs and `design.md` are the visual source of
truth.

## 5.1 Brand Colors

Use these design tokens:

``` css
:root {
  --color-primary: #16865B;
  --color-primary-dark: #116B49;
  --color-primary-light: #E8F5EE;
  --color-background: #F8FAF9;
  --color-surface: #FFFFFF;
  --color-text: #172B24;
  --color-text-secondary: #718078;
  --color-border: #E4EBE6;
}
```

Do not introduce competing blue or purple primary themes.

## 5.2 Consistency

-   Keep the same navbar across authenticated modes.
-   Keep button styles consistent.
-   Use consistent input heights and border radii.
-   Use the same typography scale.
-   Maintain consistent spacing.
-   Use restrained shadows.
-   Avoid unnecessary gradients and decorative effects.

## 5.3 Responsive Design

-   Support desktop, tablet and mobile.
-   Prevent horizontal overflow.
-   Reflow layouts instead of merely shrinking desktop content.
-   Keep touch targets comfortable on mobile.
-   Ensure the chat composer remains accessible.
-   Keep the doctor video prominent on small screens.

## 5.4 Stitch Reference Preservation

When implementing a screen:

1.  Inspect the corresponding Stitch reference.
2.  Identify layout regions and reusable components.
3.  Implement the structure before adding polish.
4.  Compare the result against the reference.
5.  Fix spacing, alignment, typography and proportions.
6.  Do not add unrelated panels or widgets.

If an asset is not yet available, use a clearly identified placeholder
with the correct dimensions. Do not invent a different avatar identity.

# 6. Virtual Doctor Video Rules

The four planned assets are:

``` text
frontend/public/videos/
├── male-speaking.mp4
├── male-listening.mp4
├── female-speaking.mp4
└── female-listening.mp4
```

Rules:

-   Preserve the same doctor identity across speaking and listening
    videos.
-   Keep video dimensions and framing consistent.
-   Use `object-fit: cover` or another deliberate fit appropriate to the
    supplied asset.
-   Preload the next relevant video when practical.
-   Handle missing or unsupported video files gracefully.
-   Provide a poster or static fallback.
-   Avoid flashing or layout shifts when switching videos.
-   Respect reduced-motion preferences where relevant.

Avatar state logic:

-   Patient is speaking: show selected doctor's listening video.
-   AI audio is playing: show selected doctor's speaking video.
-   AI is generating a response: show listening/idle video with a
    processing indicator.
-   Muted: show an accurate muted indicator.
-   Error: show a clear error state.

Do not mark the avatar as speaking before response audio playback
begins.

# 7. Browser Media and Permission Rules

Microphone and camera access must be handled through browser media APIs.

Rules:

-   Request permission only after a clear user action.
-   Explain why microphone or camera access is needed.
-   Handle denied permissions gracefully.
-   Stop media tracks when the user disables the device or leaves the
    active media session.
-   Do not access the camera or microphone silently.
-   Do not transmit media without clear user action and appropriate
    consent.
-   Show when the microphone or camera is active.
-   Handle unavailable devices and browser errors.
-   Use secure contexts (HTTPS or localhost) for browser media access.

Camera capture, live preview and image upload are distinct operations
and must be represented accurately in the UI.

# 8. Backend Development Rules

## 8.1 Technology

Use:

-   Python.
-   FastAPI.
-   Pydantic.
-   MySQL.

## 8.2 Backend Structure

Separate responsibilities into:

-   API routes.
-   Request and response schemas.
-   Database models.
-   Business services.
-   AI integrations.
-   Clinical safety logic.
-   Authentication and authorization.
-   Configuration.

Do not put all backend logic in `main.py`.

## 8.3 API Rules

-   Use appropriate HTTP methods and status codes.
-   Validate request bodies.
-   Validate uploaded file types and sizes.
-   Return consistent error structures.
-   Avoid exposing stack traces to clients.
-   Keep internal service URLs and secrets out of API responses.
-   Add authentication and authorization to protected routes.
-   Document endpoints in `api.md`.

## 8.4 Configuration

-   Read configuration from environment variables.
-   Provide `.env.example` with placeholder values only.
-   Never commit `.env` files containing real secrets.
-   Do not hardcode database passwords, API keys or tokens.
-   Validate required configuration at startup.

# 9. MySQL and Data Rules

-   Use MySQL as the primary relational database.
-   Use migrations or a version-controlled schema process.
-   Define primary keys and foreign keys.
-   Use appropriate indexes.
-   Use transactions for operations that must succeed or fail together.
-   Use parameterized queries or a safe ORM.
-   Validate and normalize data.
-   Store timestamps consistently.
-   Avoid storing uploaded image binaries directly in ordinary
    relational records unless specifically justified.
-   Store file metadata and secure storage references in the database.
-   Do not delete clinical history casually; use an auditable retention
    and correction process.

Never use patient email, name or other predictable personal information
as a security token or record authorization mechanism.

# 10. Authentication and Authorization Rules

-   Hash passwords using a suitable password hashing algorithm.
-   Never store plaintext passwords.
-   Protect authentication tokens and sessions.
-   Apply authorization on the backend, not only in the frontend.
-   Separate patient and doctor permissions.
-   A patient must only access their own records unless an explicitly
    authorized workflow permits sharing.
-   Doctors must only access records they are authorized to review.
-   Validate ownership for every protected resource.
-   Provide logout and session expiry behaviour.
-   Do not trust user-supplied role values.

# 11. AI Integration Rules

## 11.1 Ollama

The backend must communicate with Ollama.

Do not call the local Ollama API directly from browser code.

Keep the Ollama base URL configurable.

## 11.2 Qwen2.5:7B

Primary responsibilities:

-   Conversational intake.
-   Follow-up questions.
-   Summarization.
-   Structured report drafting.

## 11.3 Qwen2.5-VL:3B

Primary responsibilities:

-   Image understanding.
-   Descriptive visual observations.
-   Image-related consultation assistance.

## 11.4 Model Orchestration

-   Keep model calls behind backend service interfaces.
-   Use timeouts.
-   Handle model unavailability.
-   Handle malformed or incomplete model responses.
-   Validate structured outputs before saving them.
-   Avoid loading multiple large models simultaneously unless hardware
    testing supports it.
-   Keep prompts versioned and maintainable.
-   Do not assume model output is medically correct.

## 11.5 Clinical Safety

AI must not:

-   Claim to provide a confirmed diagnosis.
-   Prescribe medication.
-   Invent test results or vital signs.
-   Present image observations as clinical confirmation.
-   Hide uncertainty.
-   Replace qualified clinical judgment.

The system must distinguish:

1.  Patient-reported symptoms.
2.  AI-generated summaries.
3.  AI-generated visual observations.
4.  Clinician-reviewed findings.
5.  Clinician decisions and recommendations.

Emergency warning signs must be handled using a clinician-approved
safety workflow. Do not rely solely on an unconstrained LLM response to
identify emergencies.

# 12. Speech and Language Rules

The product aims to support major Indian languages.

Initial demonstration languages: - Marathi. - Hindi. - English.

Rules:

-   Keep language configuration separate from UI components.
-   Do not hardcode all user-facing text in individual components.
-   Preserve the original patient statement where appropriate.
-   Distinguish original speech transcription from translated text.
-   Do not silently change the patient's meaning.
-   Handle low-confidence transcription.
-   Provide a way for users to correct transcription errors.
-   Test language support with representative speakers and accents.
-   Do not claim support for a language until the required speech and
    text pipeline has been tested.

# 13. File Upload and Image Handling Rules

-   Validate file size and MIME type on the backend.
-   Do not trust file extensions alone.
-   Generate safe storage names.
-   Avoid exposing local filesystem paths.
-   Restrict access to uploaded files.
-   Provide upload progress and error feedback.
-   Allow users to preview and remove attachments before submission.
-   Avoid retaining unnecessary image copies.
-   Apply consent and retention rules to health-related images.
-   Do not send images to external services without appropriate
    disclosure and consent.

# 14. Offline-First Rules

Offline functionality must be designed deliberately.

## 14.1 Frontend Storage

Use IndexedDB for structured local records and pending work.

Use Service Workers to cache the application shell and approved static
assets.

Do not assume that browser storage is permanent or unlimited.

## 14.2 Offline Behaviour

-   Clearly show online/offline status.
-   Allow supported patient intake while offline.
-   Save pending consultations locally.
-   Queue image uploads.
-   Display synchronization status.
-   Preserve records after recoverable failures.
-   Do not show a record as synchronized until the server acknowledges
    it.

## 14.3 Synchronization

-   Assign stable unique IDs to offline-created records.
-   Make upload operations idempotent.
-   Retry safely.
-   Avoid duplicate consultations.
-   Handle conflicts explicitly.
-   Record synchronization timestamps and status.
-   Protect locally stored health data.
-   Clear sensitive local data according to logout and retention
    policies.

## 14.4 Offline AI

Local AI is available only when the required local server and models are
installed and running.

Do not assume that a patient's phone can access the developer's laptop
Ollama instance.

For a local healthcare centre deployment, use an explicitly configured
local network service.

Clearly distinguish: - Offline capture. - Local AI inference. - Cloud AI
processing. - Cloud doctor review.

# 15. Error Handling and Logging

-   Handle expected failures gracefully.
-   Show user-friendly error messages.
-   Log technical details only on the server.
-   Never log passwords, tokens or unnecessary patient health
    information.
-   Use request or correlation IDs where useful.
-   Include enough diagnostic context to investigate failures without
    exposing sensitive data.
-   Avoid silently swallowing exceptions.
-   Provide retry options where safe.

# 16. Testing Rules

Run relevant checks after implementation.

Frontend: - Build the application. - Check browser console errors. -
Test navigation. - Test responsive layouts. - Test media permissions. -
Test upload states. - Test mode switching and conversation continuity.

Backend: - Test API validation. - Test authentication and
authorization. - Test database operations. - Test file upload
restrictions. - Test Ollama unavailable and timeout scenarios. - Test
malformed model output. - Test synchronization and duplicate prevention.

Security: - Verify that users cannot access other users' records. -
Verify that doctors cannot access unauthorized consultations. - Verify
that secrets are not exposed. - Verify that uploaded files are
protected.

Do not claim tests passed unless they were actually run.

# 17. Git and Change Management Rules

-   Use meaningful commit messages.
-   Keep changes focused.
-   Do not commit generated model files or secrets.
-   Do not overwrite user changes.
-   Inspect Git status before major changes.
-   Avoid destructive Git operations unless explicitly approved.
-   Keep `.gitignore` updated.
-   Do not commit temporary test uploads or patient data.

# 18. Documentation Rules

Update relevant documentation when implementation changes.

-   Product scope changes: update `prd.md`.
-   UI changes: update `design.md`.
-   Architecture changes: update `architecture.md`.
-   Database changes: update `database.md`.
-   API changes: update `api.md`.
-   AI model or prompt changes: update `ai.md`.
-   Offline behaviour changes: update `offline.md`.
-   Work progress: update `tasks.md`.

Do not leave documentation describing features that no longer exist.

# 19. Implementation Workflow for Antigravity

For each task, follow this workflow:

1.  Read the relevant project documents.
2.  Inspect the existing code and assets.
3.  Identify the smallest appropriate implementation.
4.  Explain the planned changes briefly.
5.  Implement the feature.
6.  Run relevant checks.
7.  Fix issues caused by the changes.
8.  Summarize files changed and tests performed.
9.  Identify remaining limitations or follow-up tasks.

For larger tasks, break implementation into small milestones.

Do not start unrelated phases without the user's approval.

# 20. Definition of Done

A task is complete only when:

-   The requested behaviour is implemented.
-   The UI follows `design.md`.
-   Existing functionality remains intact.
-   Relevant loading, empty, success and error states are handled.
-   Input validation is implemented where needed.
-   Security and authorization requirements are respected.
-   Relevant checks have been run.
-   Documentation is updated where necessary.
-   Any limitations are reported honestly.

**Final instruction to Antigravity:**

Build AAROGYA LINK incrementally, preserve the approved Stitch designs,
follow the PRD, prioritize working functionality over decorative
complexity, and never compromise patient privacy or clinical safety for
a faster demonstration.


## Firebase Authentication Rules

- Use the Firebase Web SDK in React for sign-up, sign-in, sign-out and password recovery.
- Send Firebase ID tokens to FastAPI as Bearer tokens.
- Verify tokens with the Firebase Admin SDK on the backend.
- Map the verified Firebase UID to `users.firebase_uid` in MySQL.
- Never store passwords or Firebase Admin service-account credentials in MySQL, frontend code or Git.
- Never trust a client-supplied UID or an unverified decoded token.
