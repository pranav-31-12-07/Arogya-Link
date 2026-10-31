# AAROGYA LINK

## Offline-First Architecture and Synchronization Specification

**Document:** `offline.md`\
**Version:** 1.0\
**Status:** Proposed MVP implementation specification\
**Frontend:** React + Vite PWA\
**Local browser storage:** IndexedDB\
**Caching:** Service Worker\
**Backend:** FastAPI\
**Application database:** MySQL\
**Authentication:** Firebase Authentication\
**AI runtime:** Ollama

------------------------------------------------------------------------

# 1. Purpose

AAROGYA LINK is designed to remain useful when internet connectivity is
weak or unavailable.

The offline-first design should allow the patient to:

-   Open the previously installed application shell.
-   Access locally cached application resources.
-   Start or continue a locally stored consultation draft.
-   Record text messages and supported media locally.
-   Queue eligible events for later synchronization.
-   See which information is saved locally and which information has
    reached the server.

When connectivity returns, the application can synchronize queued data
with FastAPI.

**Important:** Offline browser functionality does not automatically mean
that cloud authentication, cloud doctor review, remote MySQL access or
AI inference on a developer's laptop are available offline.

------------------------------------------------------------------------

# 2. Offline Capability Levels

Separate offline features into three capability levels.

## 2.1 Level 1 -- Offline Application Shell

Available after the application has been installed or visited online and
the Service Worker has cached the required resources.

-   Open the application shell.
-   Load cached styles, scripts, icons and approved static assets.
-   Show offline status.
-   Display previously stored consultation history where locally
    available.

## 2.2 Level 2 -- Offline Data Capture

Available when the browser has local storage available.

-   Create a local consultation draft.
-   Save text entries.
-   Queue eligible audio/image files.
-   Save local interaction timestamps and identifiers.
-   Continue a supported workflow without contacting the cloud backend.

The UI must clearly show that the data is stored locally and has not yet
been synchronized.

## 2.3 Level 3 -- Local AI at a Healthcare Centre

Available only when a configured local healthcare-centre server is
reachable.

Possible local setup:

-   Local React PWA access over centre Wi-Fi.
-   Local FastAPI service.
-   Local Ollama runtime.
-   Downloaded Qwen models.
-   Local protected storage.

A patient's phone cannot automatically access the developer's laptop or
its Ollama endpoint. Local network deployment, device discovery,
firewall configuration, authorization and secure communication must be
implemented.

------------------------------------------------------------------------

# 3. Architecture Overview

``` mermaid
flowchart TB
    P[Patient Browser / PWA]
    UI[React Application]
    SW[Service Worker]
    IDB[(IndexedDB)]
    OUTBOX[Pending Sync Outbox]
    API[FastAPI]
    AUTH[Firebase Authentication]
    DB[(MySQL)]
    FILES[Protected File Storage]
    LOCAL[Optional Local FastAPI + Ollama]
    CLOUD[Remote Doctor / Cloud Services]

    P --> UI
    UI <--> SW
    UI <--> IDB
    UI --> OUTBOX
    UI --> AUTH
    OUTBOX -->|Internet available| API
    API --> AUTH
    API <--> DB
    API <--> FILES
    UI -->|Centre LAN, configured| LOCAL
    LOCAL --> DB
    API --> CLOUD
```

The diagram shows logical components. A local deployment must define
which services run on the local network and which remain remote.

------------------------------------------------------------------------

# 4. Service Worker

## 4.1 Responsibilities

The Service Worker manages the application cache.

Cache only resources that are appropriate for offline use, such as:

-   Application shell.
-   JavaScript and CSS bundles.
-   Fonts and icons.
-   Approved static illustrations.
-   Offline fallback page.

Do not cache private consultation API responses or sensitive patient
records in a shared cache by default.

## 4.2 Cache Strategy

  -----------------------------------------------------------------------
  Resource                            Suggested strategy
  ----------------------------------- -----------------------------------
  Versioned JS/CSS bundles            Cache-first

  Static icons and approved assets    Cache-first

  Application navigation shell        Network-first with offline fallback

  Public configuration                Network-first

  Private patient data                IndexedDB with explicit access and
                                      retention rules

  Authentication endpoints            Network-only

  AI inference endpoints              Network-only unless a configured
                                      local service is used
  -----------------------------------------------------------------------

Use versioned cache names and clean up old caches during Service Worker
activation.

## 4.3 Offline Fallback

When a network request cannot be completed:

-   Keep the user inside the application where possible.
-   Display an offline indicator.
-   Explain which actions are available locally.
-   Avoid showing a false success state for remote operations.

------------------------------------------------------------------------

# 5. IndexedDB Data Architecture

IndexedDB stores local pending data and selected cached records.

It is not a replacement for MySQL.

## 5.1 Suggested Object Stores

  Object store      Purpose
  ----------------- -----------------------------------------------
  `consultations`   Local consultation drafts and cached metadata
  `messages`        Locally captured messages
  `media_queue`     Pending image/audio file blobs and metadata
  `sync_outbox`     Events waiting for server acknowledgement
  `sync_state`      Last synchronization status and cursor
  `app_metadata`    Schema version and local application settings

Use a stable client-generated UUID for each local consultation, message
and event.

## 5.2 Example Local Consultation

``` json
{
  "client_consultation_id": "local-consultation-uuid",
  "server_consultation_id": null,
  "language": "mr",
  "status": "pending_sync",
  "created_at": "2026-10-31T05:00:00Z",
  "sync_status": "pending"
}
```

## 5.3 Example Outbox Event

``` json
{
  "event_id": "client-generated-event-uuid",
  "event_type": "message",
  "client_consultation_id": "local-consultation-uuid",
  "created_at": "2026-10-31T05:01:00Z",
  "sync_status": "pending",
  "retry_count": 0,
  "payload": {
    "mode": "text",
    "content": "I have a headache."
  }
}
```

Do not store access tokens in the outbox payload.

------------------------------------------------------------------------

# 6. Offline Interaction Workflow

## 6.1 Patient Creates a Consultation Offline

1.  The application detects that the remote backend is unavailable.
2.  It creates a client-generated consultation UUID.
3.  It saves the consultation draft in IndexedDB.
4.  It saves subsequent patient messages locally.
5.  It creates outbox events for eligible records.
6.  It displays a `Saved on this device` status.
7.  It does not claim that the record has reached the server.

## 6.2 Patient Returns Online

1.  The application detects connectivity.
2.  It checks whether a valid Firebase Authentication session is available.
3.  It checks whether the backend is reachable.
4.  It sends eligible pending events to FastAPI.
5.  FastAPI validates authorization and payloads.
6.  FastAPI deduplicates events using their stable IDs.
7.  FastAPI persists accepted events to MySQL.
8.  FastAPI returns per-event acknowledgements.
9.  The browser marks only acknowledged events as synchronized.
10. Rejected events remain visible with a recoverable status.

Browser connectivity events are hints only. A successful request to the
backend is the reliable indication that the server is reachable.

------------------------------------------------------------------------

# 7. Synchronization Design

## 7.1 Event-Based Outbox

Use an outbox rather than trying to upload the entire local database
every time.

Each event should include:

-   Stable event UUID.
-   Local consultation UUID.
-   Server consultation UUID, once assigned.
-   Event type.
-   Creation timestamp.
-   Payload version.
-   Payload.
-   Retry count.
-   Synchronization status.

## 7.2 Suggested Event Types

-   `consultation_created`
-   `message_created`
-   `media_uploaded`
-   `visual_observation_created`, only when generated by a configured
    local AI service
-   `consultation_updated`

Do not let a client fabricate a clinician review or mark a report as
clinically approved.

## 7.3 Idempotency

The server must recognize repeated event IDs.

If a client retries because an acknowledgement was lost, FastAPI must
not create a duplicate message or consultation.

## 7.4 Acknowledgement

Possible local states:

-   `pending`
-   `syncing`
-   `synced`
-   `failed`
-   `needs_attention`

A record is `synced` only after the server confirms persistence.

## 7.5 Retry Policy

Use bounded exponential backoff with jitter.

-   Retry transient network failures.
-   Retry temporary server errors.
-   Do not endlessly retry invalid payloads.
-   Do not retry authorization failures without resolving the
    authentication state.
-   Preserve failed records for user or support review.

------------------------------------------------------------------------

# 8. Firebase Authentication and Offline Behaviour

Firebase Authentication remains the authentication provider.

Offline behaviour needs careful design:

-   A user may have an existing locally available session, but token
    expiry still matters.
-   Cloud-protected API calls require a valid token and network access.
-   A new sign-up or login generally requires connectivity to Firebase
    Auth.
-   Do not store passwords locally.
-   Do not bypass backend authorization because a user is offline.
-   Do not treat a locally cached profile as proof that the user is
    currently authenticated.
-   Define a safe shared-device sign-out and local-data protection
    policy.

If the token expires while offline, the application may allow a
deliberately limited local capture mode only if the product's security
policy explicitly permits it. Cloud synchronization must wait until
authentication can be renewed.

------------------------------------------------------------------------

# 9. Local AI Deployment

## 9.1 Local Service Topology

A healthcare centre may run:

``` text
Healthcare Centre Computer
├── FastAPI
├── Ollama
│   ├── qwen2.5:7b
│   └── qwen2.5vl:3b
├── MySQL or approved local persistence
└── Protected local media/context storage
```

Patient devices connect over a configured local network.

## 9.2 Model Allocation

  Task                                      Model
  ----------------------------------------- ----------------
  Text conversation                         `qwen2.5:7b`
  Speech conversation after transcription   `qwen2.5:7b`
  Selected image/video-frame analysis       `qwen2.5vl:3b`

Speech recognition and text-to-speech remain separate services.

## 9.3 Local AI Limitations

-   Local inference is available only when the configured server is
    running and reachable.
-   A browser alone does not run these Ollama models.
-   The target computer must have sufficient RAM, GPU memory and disk
    space.
-   Model availability must be checked before accepting a local AI
    request.
-   If local AI is unavailable, preserve the patient's input and clearly
    indicate that AI processing is pending.

The current development laptop is not automatically a production
community-centre server.

------------------------------------------------------------------------

# 10. Offline Context Management

The AI architecture uses one shared `context.txt` per consultation.

Offline mode must preserve this rule.

## 10.1 Context Ownership

-   Server-side context artifact: stored under the protected
    consultation storage root.
-   Local pending events: stored in IndexedDB until synchronization.
-   MySQL: authoritative source for server-persisted messages and
    observations.

Do not use one global context file for all consultations.

## 10.2 Offline Context

If a configured local FastAPI service is available, it may update the
local consultation context using the same event rules.

If no local AI/backend service is available:

-   Save patient messages and media metadata in IndexedDB.
-   Keep the events in the outbox.
-   Do not pretend that Qwen processed the content.
-   After synchronization, the server can rebuild the consultation
    context from persisted events.

## 10.3 Merge After Synchronization

When local events reach the server:

1.  Validate each event.
2.  Deduplicate by event UUID.
3.  Persist accepted events to MySQL.
4.  Maintain the event order using recorded timestamps and sequence
    metadata.
5.  Rebuild or incrementally update the server-side context.
6.  Return acknowledgements.
7.  Mark local events synchronized.

Do not overwrite the server context with a stale local `context.txt`
file. Merge validated events into the authoritative history.

------------------------------------------------------------------------

# 11. Media Queue

Images and audio may be large. Manage them separately from ordinary text
events.

## 11.1 Media Queue Requirements

-   Validate allowed file types before queueing.
-   Enforce file-size limits.
-   Generate stable media UUIDs.
-   Store file blobs in IndexedDB only as long as needed.
-   Show upload progress.
-   Retry transient upload failures.
-   Delete local copies only according to the approved retention policy.
-   Do not mark media uploaded until FastAPI acknowledges storage.

## 11.2 Video Strategy

For the MVP, use still images or selected frames rather than queueing
continuous video streams.

If video recording is later supported, define duration, size, consent,
storage and retention limits before implementation.

------------------------------------------------------------------------

# 12. Conflict Handling

The MVP should minimize conflicting edits.

Recommended rules:

-   Client-created messages are append-only events.
-   Server-generated IDs are mapped to local UUIDs after
    acknowledgement.
-   Duplicate event IDs are ignored safely.
-   Patient profile edits use explicit update timestamps or version
    checks.
-   Doctor review records are server-authoritative.
-   A patient device must never overwrite a clinician's review.
-   Conflicting profile changes should be surfaced rather than silently
    choosing one.

------------------------------------------------------------------------

# 13. Security and Privacy

Offline storage creates additional risk, especially on shared devices.

Requirements:

-   Do not store passwords or service-role keys in IndexedDB.
-   Minimize sensitive data stored locally.
-   Use device-level security and appropriate browser storage controls.
-   Define how local data is cleared at sign-out on shared devices.
-   Do not expose private data through Service Worker caches.
-   Protect local server endpoints with authentication and
    authorization.
-   Use HTTPS for remote communication and a secure local-network
    configuration.
-   Avoid logging sensitive medical content.
-   Define local data expiry and deletion.
-   Obtain appropriate consent before capturing or retaining
    images/audio.
-   Do not claim that browser storage is encrypted unless encryption is
    actually implemented and its key management is defined.

------------------------------------------------------------------------

# 14. User Interface States

The interface should clearly distinguish these states:

  ---------------------------------------------------------------------------------------
  State                               Suggested UI wording
  ----------------------------------- ---------------------------------------------------
  Online                              `Connected`

  Offline                             `Offline – changes will be saved on this device`

  Local save complete                 `Saved on this device`

  Waiting for sync                    `Waiting to sync`

  Synchronizing                       `Syncing…`

  Server acknowledged                 `Synced`

  Sync failed                         `Couldn't sync – will retry`

  Authentication expired              `Sign in again to sync`

  Local AI available                  `Local AI available`

  Local AI unavailable                `AI processing unavailable – your input is saved`
  ---------------------------------------------------------------------------------------

Do not display `Submitted`, `Reviewed` or `Synced` until the relevant
server or clinician action has actually completed.

------------------------------------------------------------------------

# 15. Testing Plan

## 15.1 PWA Tests

-   Install application.
-   Reload while offline.
-   Load cached application shell.
-   Update Service Worker version.
-   Recover from a failed asset request.

## 15.2 IndexedDB Tests

-   Save a consultation offline.
-   Save multiple messages.
-   Queue image/audio metadata.
-   Close and reopen browser.
-   Verify pending data remains available according to the retention
    policy.

## 15.3 Synchronization Tests

-   Restore internet after offline capture.
-   Lose network during upload.
-   Retry after timeout.
-   Receive duplicate acknowledgement.
-   Send duplicate event IDs.
-   Handle partial batch acceptance.
-   Handle expired Firebase Authentication session.
-   Rebuild context after synchronization.

## 15.4 Context Tests

-   Preserve text history after offline capture.
-   Preserve speech transcriptions after sync.
-   Preserve validated visual observations.
-   Never mix different consultations.
-   Rebuild server context from MySQL events.
-   Handle concurrent event ordering.

## 15.5 Local AI Tests

-   Local Ollama available.
-   Local Ollama unavailable.
-   Text model available but vision model missing.
-   Vision model available but text model missing.
-   Model timeout.
-   Insufficient memory.
-   Local server unreachable from a patient device.

------------------------------------------------------------------------

# 16. MVP Implementation Sequence

1.  Configure the PWA manifest and Service Worker.
2.  Cache the application shell and static assets.
3.  Create IndexedDB schema and versioning.
4.  Implement local consultation drafts.
5.  Implement local message capture.
6.  Implement the synchronization outbox.
7.  Add FastAPI batch synchronization endpoint.
8.  Add event idempotency and acknowledgements.
9.  Add media upload queue.
10. Integrate consultation context rebuilding.
11. Add clear offline and sync UI states.
12. Test shared-device and authentication-expiry behaviour.
13. Evaluate local healthcare-centre AI deployment separately.

------------------------------------------------------------------------

# 17. Acceptance Criteria

Offline-first MVP is ready for review when:

1.  The installed PWA opens its cached application shell offline.
2.  A patient can create a local consultation draft.
3.  Text messages can be saved locally without internet.
4.  Pending events survive a browser restart within the supported
    storage conditions.
5.  The interface clearly distinguishes local saves from server
    synchronization.
6.  Pending events synchronize when network and valid authentication are
    available.
7.  Repeated sync requests do not create duplicate records.
8.  The server acknowledges accepted events individually.
9.  Failed events remain recoverable.
10. Server-side context is rebuilt from persisted MySQL events when
    required.
11. No patient context is shared with another consultation.
12. Offline mode does not claim remote doctor review or AI inference has
    occurred.
13. Local AI is used only when a configured local backend and model
    runtime are reachable.

------------------------------------------------------------------------

# 18. Final Offline Architecture Principle

**Service Worker caches the application. IndexedDB stores pending local
work. FastAPI validates and synchronizes events. MySQL remains the
server-side source of truth. The consultation-specific `context.txt` is
rebuilt or updated from validated events.**

Offline mode must be honest about what is stored locally, what has been
synchronized, and which AI or clinical services are actually available.


## Firebase Authentication Offline Notes

- Use Firebase Authentication's supported browser persistence mode, configured deliberately for the device-sharing and privacy requirements.
- A previously authenticated user may have locally persisted authentication state, but protected cloud API requests still require a valid Firebase ID token and network connectivity.
- Firebase token refresh and reauthentication require connectivity when a fresh token cannot be obtained.
- Do not store passwords or Firebase Admin service-account credentials in IndexedDB.
- Do not treat cached profile data as proof of current authentication.
- On shared devices, define sign-out behaviour and whether local consultation data is retained, locked or cleared.
- A restricted local capture mode while disconnected must be an explicit product/security decision. Cloud synchronization waits until a valid Firebase ID token can be presented and the backend is reachable.
