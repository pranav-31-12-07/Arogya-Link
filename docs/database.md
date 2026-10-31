# AAROGYA LINK

## Database Design -- MySQL

**Document:** `database.md`\
**Version:** 1.0\
**Status:** Proposed schema\
**Authentication:** Firebase Authentication\
**Application database:** MySQL 8.0+

------------------------------------------------------------------------

# 1. Database Strategy

AAROGYA LINK uses two separate systems for two different
responsibilities:

  -----------------------------------------------------------------------
  System                              Responsibility
  ----------------------------------- -----------------------------------
  Firebase Authentication                       Sign-up, login, password recovery,
                                      authentication sessions and access
                                      tokens

  MySQL                               Application users, patient
                                      profiles, consultations, messages,
                                      uploads, reports, doctor reviews,
                                      referrals, follow-ups, consent and
                                      audit records
  -----------------------------------------------------------------------

**Important:** MySQL does not store user passwords. A user's Firebase
Auth UUID is stored in MySQL as the external identity reference.

FastAPI verifies the Firebase ID token, obtains the trusted `sub`
user UUID, and uses that UUID to locate the corresponding MySQL
application user.

------------------------------------------------------------------------

# 2. Entity Relationship Diagram

``` mermaid
erDiagram
    users ||--o| patient_profiles : has
    users ||--o{ consultations : starts
    consultations ||--o{ messages : contains
    consultations ||--o{ uploaded_files : includes
    consultations ||--o| consultation_reports : produces
    consultations ||--o{ doctor_reviews : receives
    users ||--o{ doctor_reviews : writes
    consultations ||--o{ referrals : creates
    referrals ||--o{ follow_ups : tracks
    users ||--o{ consent_records : grants
    users ||--o{ audit_logs : performs

    users {
        BIGINT id PK
        CHAR firebase_uid UK
        VARCHAR email
        ENUM role
        DATETIME created_at
        DATETIME updated_at
    }

    patient_profiles {
        BIGINT id PK
        BIGINT user_id FK
        DATE date_of_birth
        VARCHAR gender
        DECIMAL height_cm
        DECIMAL weight_kg
        VARCHAR blood_group
        VARCHAR preferred_language
    }

    consultations {
        BIGINT id PK
        CHAR public_id UK
        BIGINT patient_user_id FK
        VARCHAR language
        ENUM status
        DATETIME started_at
        DATETIME ended_at
    }

    messages {
        BIGINT id PK
        CHAR public_id UK
        BIGINT consultation_id FK
        ENUM sender_type
        TEXT content
        VARCHAR language
        DATETIME created_at
    }

    uploaded_files {
        BIGINT id PK
        CHAR public_id UK
        BIGINT consultation_id FK
        BIGINT uploaded_by_user_id FK
        VARCHAR storage_key
        VARCHAR mime_type
        BIGINT file_size_bytes
        DATETIME created_at
    }

    consultation_reports {
        BIGINT id PK
        BIGINT consultation_id FK
        JSON report_data
        ENUM review_status
        DATETIME generated_at
    }

    doctor_reviews {
        BIGINT id PK
        BIGINT consultation_id FK
        BIGINT doctor_user_id FK
        TEXT clinical_notes
        DATETIME reviewed_at
    }

    referrals {
        BIGINT id PK
        BIGINT consultation_id FK
        BIGINT created_by_user_id FK
        VARCHAR destination
        ENUM status
        TEXT instructions
    }

    follow_ups {
        BIGINT id PK
        BIGINT referral_id FK
        DATETIME scheduled_at
        ENUM status
    }

    consent_records {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR consent_type
        DATETIME granted_at
        DATETIME withdrawn_at
    }

    audit_logs {
        BIGINT id PK
        BIGINT actor_user_id FK
        VARCHAR action
        VARCHAR resource_type
        VARCHAR resource_id
        DATETIME created_at
    }
```

------------------------------------------------------------------------

# 3. Table Design

## 3.1 `users`

Stores the application identity associated with a Firebase Authentication account.

  --------------------------------------------------------------------------
  Column               Type              Constraints       Description
  -------------------- ----------------- ----------------- -----------------
  `id`                 BIGINT            PK,               Internal
                                         AUTO_INCREMENT    application user
                                                           ID

  `firebase_uid`   VARCHAR(128)          UNIQUE, NOT NULL  UUID from
                                                           Firebase Authentication

  `email`              VARCHAR(255)      NULL              Contact email, if
                                                           stored

  `role`               ENUM              NOT NULL          `patient`,
                                                           `doctor`, `admin`

  `is_active`          BOOLEAN           DEFAULT TRUE      Application
                                                           access status

  `created_at`         DATETIME          NOT NULL          Record creation
                                                           time

  `updated_at`         DATETIME          NOT NULL          Last update time
  --------------------------------------------------------------------------

Rules: - Never store passwords here. - Do not allow a public sign-up
request to set `doctor` or `admin`. - Assign roles through a trusted
backend administrative workflow. - Treat the Firebase UID as the
identity mapping key.

## 3.2 `patient_profiles`

Stores optional patient profile information.

  ---------------------------------------------------------------------------------
  Column                      Type              Constraints       Description
  --------------------------- ----------------- ----------------- -----------------
  `id`                        BIGINT            PK,               Profile ID
                                                AUTO_INCREMENT    

  `user_id`                   BIGINT            FK, UNIQUE        References
                                                                  `users.id`

  `date_of_birth`             DATE              NULL              Date of birth

  `gender`                    VARCHAR(30)       NULL              User-provided
                                                                  gender

  `height_cm`                 DECIMAL(5,2)      NULL              Height in
                                                                  centimetres

  `weight_kg`                 DECIMAL(5,2)      NULL              Weight in
                                                                  kilograms

  `blood_group`               VARCHAR(5)        NULL              User-provided
                                                                  blood group

  `preferred_language`        VARCHAR(20)       DEFAULT `en`      Language
                                                                  preference

  `allergies`                 TEXT              NULL              Optional
                                                                  user-provided
                                                                  allergy
                                                                  information

  `existing_conditions`       TEXT              NULL              Optional
                                                                  user-provided
                                                                  health context

  `emergency_contact_name`    VARCHAR(120)      NULL              Optional contact
                                                                  name

  `emergency_contact_phone`   VARCHAR(30)       NULL              Optional contact
                                                                  number

  `created_at`                DATETIME          NOT NULL          Creation time

  `updated_at`                DATETIME          NOT NULL          Update time
  ---------------------------------------------------------------------------------

Collect only fields needed for the product workflow. Profile fields are
optional unless a specific feature has a justified requirement.

## 3.3 `consultations`

Represents one patient consultation. Text Mode and Virtual Doctor Mode
share the same consultation record.

  -------------------------------------------------------------------------
  Column              Type              Constraints       Description
  ------------------- ----------------- ----------------- -----------------
  `id`                BIGINT            PK,               Internal
                                        AUTO_INCREMENT    consultation ID

  `public_id`         VARCHAR(128)          UNIQUE, NOT NULL  Client-safe UUID

  `patient_user_id`   BIGINT            FK, NOT NULL      Patient who
                                                          started the
                                                          consultation

  `language`          VARCHAR(20)       NOT NULL          Consultation
                                                          language

  `status`            ENUM              NOT NULL          `draft`,
                                                          `in_progress`,
                                                          `pending_sync`,
                                                          `submitted`,
                                                          `under_review`,
                                                          `reviewed`,
                                                          `closed`

  `started_at`        DATETIME          NOT NULL          Start time

  `ended_at`          DATETIME          NULL              End time

  `created_at`        DATETIME          NOT NULL          Creation time

  `updated_at`        DATETIME          NOT NULL          Last update time
  -------------------------------------------------------------------------

Do not create separate consultation records just because the patient
switches between Text Mode and Virtual Doctor Mode.

## 3.4 `messages`

Stores messages and structured interaction events within a consultation.

  ---------------------------------------------------------------------------
  Column              Type              Constraints       Description
  ------------------- ----------------- ----------------- -------------------
  `id`                BIGINT            PK,               Internal message ID
                                        AUTO_INCREMENT    

  `public_id`         VARCHAR(128)          UNIQUE, NOT NULL  Client-generated or
                                                          server-generated
                                                          UUID

  `consultation_id`   BIGINT            FK, NOT NULL      Parent consultation

  `sender_type`       ENUM              NOT NULL          `patient`,
                                                          `assistant`,
                                                          `doctor`, `system`

  `content`           TEXT              NOT NULL          Message text

  `language`          VARCHAR(20)       NULL              Message language

  `input_mode`        ENUM              NULL              `text`, `voice`,
                                                          `virtual_doctor`,
                                                          `system`

  `created_at`        DATETIME          NOT NULL          Creation time
  ---------------------------------------------------------------------------

For an image or audio attachment, store a reference in `uploaded_files`
and associate it with the relevant consultation. Avoid putting large
binary files directly in message text.

## 3.5 `uploaded_files`

Stores metadata and protected storage references for images and other
uploaded files.

  ------------------------------------------------------------------------------
  Column                  Type              Constraints       Description
  ----------------------- ----------------- ----------------- ------------------
  `id`                    BIGINT            PK,               File record ID
                                            AUTO_INCREMENT    

  `public_id`             VARCHAR(128)          UNIQUE, NOT NULL  Public-safe UUID

  `consultation_id`       BIGINT            FK, NOT NULL      Related
                                                              consultation

  `uploaded_by_user_id`   BIGINT            FK, NOT NULL      Uploading user

  `storage_key`           VARCHAR(500)      NOT NULL          Private storage
                                                              object key

  `original_filename`     VARCHAR(255)      NULL              Sanitized original
                                                              filename

  `mime_type`             VARCHAR(100)      NOT NULL          Validated content
                                                              type

  `file_size_bytes`       BIGINT            NOT NULL          File size

  `file_purpose`          ENUM              NOT NULL          `patient_image`,
                                                              `audio`,
                                                              `document`,
                                                              `other`

  `created_at`            DATETIME          NOT NULL          Upload record
                                                              creation time
  ------------------------------------------------------------------------------

Store file binaries in protected file storage, not in MySQL by default.
MySQL stores metadata and the storage reference.

Validate file type, file size and access permissions. Never trust the
filename or browser-provided MIME type alone.

## 3.6 `consultation_reports`

Stores the AI-generated structured consultation summary and its review
state.

  -----------------------------------------------------------------------------
  Column              Type              Constraints       Description
  ------------------- ----------------- ----------------- ---------------------
  `id`                BIGINT            PK,               Report ID
                                        AUTO_INCREMENT    

  `consultation_id`   BIGINT            FK, UNIQUE        Related consultation

  `report_data`       JSON              NOT NULL          Structured report
                                                          payload

  `model_name`        VARCHAR(100)      NULL              Model used to draft
                                                          report

  `prompt_version`    VARCHAR(50)       NULL              Prompt/template
                                                          version

  `review_status`     ENUM              NOT NULL          `draft`,
                                                          `pending_review`,
                                                          `reviewed`,
                                                          `changes_requested`

  `generated_at`      DATETIME          NOT NULL          Generation time

  `updated_at`        DATETIME          NOT NULL          Last update time
  -----------------------------------------------------------------------------

The report must clearly distinguish patient-reported information,
AI-generated summaries, image observations and clinician-entered
findings. AI-generated content is not a clinician-approved diagnosis.

## 3.7 `doctor_reviews`

Stores clinician review activity.

  Column               Type       Constraints          Description
  -------------------- ---------- -------------------- ----------------------------
  `id`                 BIGINT     PK, AUTO_INCREMENT   Review ID
  `consultation_id`    BIGINT     FK, NOT NULL         Reviewed consultation
  `doctor_user_id`     BIGINT     FK, NOT NULL         Doctor application user
  `clinical_notes`     TEXT       NULL                 Doctor-entered notes
  `decision_summary`   TEXT       NULL                 Clinician's review summary
  `reviewed_at`        DATETIME   NOT NULL             Review time

Only authorized doctor accounts may create or update doctor reviews.

## 3.8 `referrals`

Stores referral information created through an authorized clinical
workflow.

  ----------------------------------------------------------------------------
  Column                 Type              Constraints       Description
  ---------------------- ----------------- ----------------- -----------------
  `id`                   BIGINT            PK,               Referral ID
                                           AUTO_INCREMENT    

  `consultation_id`      BIGINT            FK, NOT NULL      Related
                                                             consultation

  `created_by_user_id`   BIGINT            FK, NOT NULL      Authorized
                                                             creator

  `destination`          VARCHAR(255)      NULL              Facility or
                                                             service

  `instructions`         TEXT              NULL              Referral
                                                             instructions

  `status`               ENUM              NOT NULL          `pending`,
                                                             `accepted`,
                                                             `completed`,
                                                             `cancelled`

  `created_at`           DATETIME          NOT NULL          Creation time

  `updated_at`           DATETIME          NOT NULL          Update time
  ----------------------------------------------------------------------------

AI may help organize referral information, but clinical referral
decisions must follow the approved human-led workflow.

## 3.9 `follow_ups`

Tracks follow-up activities related to a referral.

  -----------------------------------------------------------------------
  Column            Type              Constraints       Description
  ----------------- ----------------- ----------------- -----------------
  `id`              BIGINT            PK,               Follow-up ID
                                      AUTO_INCREMENT    

  `referral_id`     BIGINT            FK, NOT NULL      Parent referral

  `scheduled_at`    DATETIME          NULL              Planned follow-up
                                                        time

  `status`          ENUM              NOT NULL          `scheduled`,
                                                        `completed`,
                                                        `missed`,
                                                        `cancelled`

  `notes`           TEXT              NULL              Follow-up notes

  `created_at`      DATETIME          NOT NULL          Creation time

  `updated_at`      DATETIME          NOT NULL          Update time
  -----------------------------------------------------------------------

## 3.10 `consent_records`

Records consent events relevant to the platform.

  ------------------------------------------------------------------------
  Column             Type              Constraints       Description
  ------------------ ----------------- ----------------- -----------------
  `id`               BIGINT            PK,               Consent record ID
                                       AUTO_INCREMENT    

  `user_id`          BIGINT            FK, NOT NULL      User giving or
                                                         withdrawing
                                                         consent

  `consent_type`     VARCHAR(80)       NOT NULL          Purpose of
                                                         consent

  `policy_version`   VARCHAR(40)       NULL              Policy version
                                                         shown

  `granted_at`       DATETIME          NULL              Consent grant
                                                         time

  `withdrawn_at`     DATETIME          NULL              Withdrawal time

  `created_at`       DATETIME          NOT NULL          Record creation
                                                         time
  ------------------------------------------------------------------------

Consent must be specific, understandable and revocable where applicable.
Do not bundle unrelated purposes into one vague consent.

## 3.11 `audit_logs`

Stores security-relevant application events.

  Column            Type           Constraints          Description
  ----------------- -------------- -------------------- -------------------------------
  `id`              BIGINT         PK, AUTO_INCREMENT   Audit record ID
  `actor_user_id`   BIGINT         FK, NULL             User who performed the action
  `action`          VARCHAR(100)   NOT NULL             Action name
  `resource_type`   VARCHAR(80)    NOT NULL             Resource category
  `resource_id`     VARCHAR(100)   NULL                 Resource identifier
  `created_at`      DATETIME       NOT NULL             Event time

Avoid storing passwords, access tokens, full medical notes or
unnecessary personal data in audit logs.

------------------------------------------------------------------------

# 4. Initial MySQL DDL

The following is a proposed starting schema for MySQL 8.0+. Review and
test it in a development database before using it with real patient
data.

``` sql
CREATE DATABASE IF NOT EXISTS aarogya_link
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aarogya_link;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NULL,
    role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE patient_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    date_of_birth DATE NULL,
    gender VARCHAR(30) NULL,
    height_cm DECIMAL(5,2) NULL,
    weight_kg DECIMAL(5,2) NULL,
    blood_group VARCHAR(5) NULL,
    preferred_language VARCHAR(20) NOT NULL DEFAULT 'en',
    allergies TEXT NULL,
    existing_conditions TEXT NULL,
    emergency_contact_name VARCHAR(120) NULL,
    emergency_contact_phone VARCHAR(30) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE consultations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(128) NOT NULL UNIQUE,
    patient_user_id BIGINT UNSIGNED NOT NULL,
    language VARCHAR(20) NOT NULL,
    status ENUM(
        'draft', 'in_progress', 'pending_sync', 'submitted',
        'under_review', 'reviewed', 'closed'
    ) NOT NULL DEFAULT 'draft',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consultations_patient_started (patient_user_id, started_at),
    INDEX idx_consultations_status (status),
    CONSTRAINT fk_consultations_patient
        FOREIGN KEY (patient_user_id) REFERENCES users(id)
);

CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(128) NOT NULL UNIQUE,
    consultation_id BIGINT UNSIGNED NOT NULL,
    sender_type ENUM('patient', 'assistant', 'doctor', 'system') NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(20) NULL,
    input_mode ENUM('text', 'voice', 'virtual_doctor', 'system') NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_consultation_created (consultation_id, created_at),
    CONSTRAINT fk_messages_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

CREATE TABLE uploaded_files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(128) NOT NULL UNIQUE,
    consultation_id BIGINT UNSIGNED NOT NULL,
    uploaded_by_user_id BIGINT UNSIGNED NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT UNSIGNED NOT NULL,
    file_purpose ENUM('patient_image', 'audio', 'document', 'other')
        NOT NULL DEFAULT 'other',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_files_consultation (consultation_id),
    CONSTRAINT fk_files_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_files_uploader
        FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE consultation_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT UNSIGNED NOT NULL UNIQUE,
    report_data JSON NOT NULL,
    model_name VARCHAR(100) NULL,
    prompt_version VARCHAR(50) NULL,
    review_status ENUM(
        'draft', 'pending_review', 'reviewed', 'changes_requested'
    ) NOT NULL DEFAULT 'draft',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

CREATE TABLE doctor_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT UNSIGNED NOT NULL,
    doctor_user_id BIGINT UNSIGNED NOT NULL,
    clinical_notes TEXT NULL,
    decision_summary TEXT NULL,
    reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_consultation (consultation_id),
    CONSTRAINT fk_reviews_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_reviews_doctor
        FOREIGN KEY (doctor_user_id) REFERENCES users(id)
);

CREATE TABLE referrals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT UNSIGNED NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    destination VARCHAR(255) NULL,
    instructions TEXT NULL,
    status ENUM('pending', 'accepted', 'completed', 'cancelled')
        NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_referrals_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_referrals_creator
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE follow_ups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referral_id BIGINT UNSIGNED NOT NULL,
    scheduled_at DATETIME NULL,
    status ENUM('scheduled', 'completed', 'missed', 'cancelled')
        NOT NULL DEFAULT 'scheduled',
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_followups_referral
        FOREIGN KEY (referral_id) REFERENCES referrals(id)
);

CREATE TABLE consent_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    consent_type VARCHAR(80) NOT NULL,
    policy_version VARCHAR(40) NULL,
    granted_at DATETIME NULL,
    withdrawn_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consent_user_type (user_id, consent_type),
    CONSTRAINT fk_consent_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_actor_created (actor_user_id, created_at),
    INDEX idx_audit_resource (resource_type, resource_id),
    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
```

------------------------------------------------------------------------

# 5. Firebase Authentication to MySQL User Provisioning

## 5.1 Registration Flow

1.  User submits the sign-up form in React.
2.  React calls Firebase Authentication.
3.  Firebase creates the authentication identity.
4.  After a valid session is available, the frontend calls the FastAPI
    application bootstrap endpoint with the access token.
5.  FastAPI verifies the token.
6.  FastAPI reads the trusted Firebase subject UUID.
7.  FastAPI creates or retrieves the matching MySQL `users` row.
8.  FastAPI returns the application profile and permitted role.

The backend must be idempotent: repeated bootstrap requests for the same
Firebase user must not create duplicate application users.

## 5.2 Example API Behaviour

``` http
POST /api/v1/users/bootstrap
Authorization: Bearer <firebase_access_token>
Content-Type: application/json
```

Example response:

``` json
{
  "id": 101,
  "role": "patient",
  "profile_complete": false
}
```

The example ID is illustrative. The backend must derive the identity
from the verified token, not from a user ID in the request body.

## 5.3 Account Deletion

Define a coordinated account deletion process across Firebase Authentication and
MySQL.

Before deletion is implemented, decide: - Which application records must
be retained. - Which records can be deleted or anonymized. - How legal
or clinical retention obligations are handled. - How related files and
backups are handled. - How deletion failures are retried and audited.

Do not assume deleting a Firebase Authentication account automatically deletes
MySQL records or stored files.

------------------------------------------------------------------------

# 6. Data Access and Authorization Rules

Every protected database operation must be authorized by FastAPI.

  -----------------------------------------------------------------------
  Resource          Patient           Doctor            Admin
  ----------------- ----------------- ----------------- -----------------
  Own profile       Read/update       No by default     Administrative
                    permitted fields                    access as
                                                        authorized

  Own consultations Read/create       Assigned or       Administrative
                                      authorized        access as
                                      consultations     authorized
                                      only              

  Consultation      Own consultations Authorized        Administrative
  messages                            consultations     access as
                                                        authorized

  Uploaded files    Own consultation  Authorized        Administrative
                    files             consultation      access as
                                      files             authorized

  Doctor reviews    Read released     Create/update own Administrative
                    information       authorized        oversight
                    according to      reviews           
                    policy                              

  Referrals         Read own referral Create/update     Administrative
                    status            when authorized   oversight

  User roles        Cannot assign     Cannot assign     Trusted
                                                        role-management
                                                        workflow
  -----------------------------------------------------------------------

This table is a starting policy. Exact permissions must be finalized and
enforced server-side.

------------------------------------------------------------------------

# 7. Data Integrity and Engineering Rules

1.  Use foreign keys for relational integrity.
2.  Use unique constraints for Firebase UIDs and public UUIDs.
3.  Use indexes for frequent patient, consultation and status lookups.
4.  Use UTC consistently for stored timestamps; convert for display.
5.  Use transactions for multi-table operations.
6.  Use parameterized queries or a trusted ORM.
7.  Validate all input with Pydantic before database writes.
8.  Avoid hard deletion of clinical records without an approved
    retention policy.
9.  Keep file binaries outside MySQL unless there is a specific,
    reviewed reason to store them in the database.
10. Never store passwords, Firebase Admin SDK keys or access tokens
    in application tables.
11. Never trust a client-supplied patient ID without checking ownership
    and authorization.
12. Use migrations to evolve the schema; do not rely on manually
    changing production tables.

------------------------------------------------------------------------

# 8. Important Design Notes and Future Refinements

The schema is a practical MVP starting point, not a complete production
healthcare data model.

Before production, review:

-   Whether one consultation can have multiple report versions.
-   Whether doctor reviews need version history and amendments.
-   Whether messages need a separate attachment join table.
-   Whether patient consent should be recorded per consultation and
    purpose.
-   Whether referrals need facility, provider and appointment entities.
-   Whether emergency escalation events need a dedicated table.
-   Whether local offline records need a dedicated synchronization-event
    table.
-   Whether profile fields such as allergies require normalized child
    tables.
-   Whether a clinician's registration and verification details need a
    separate doctor profile.
-   Data retention, encryption, backups, access logging and applicable
    privacy requirements.

Do not add every possible field to the MVP. Add data structures when a
defined feature requires them.

------------------------------------------------------------------------

# 9. Database Design Summary

-   Firebase Authentication manages identity and authentication.
-   MySQL stores application users and all AAROGYA LINK application
    records.
-   `users.firebase_uid` links a MySQL user to the Firebase Authentication
    identity.
-   `consultations` is the central record shared by Text Mode and
    Virtual Doctor Mode.
-   `messages` stores the conversation history.
-   `uploaded_files` stores protected file references and metadata.
-   `consultation_reports` stores AI-generated draft summaries with
    explicit review status.
-   `doctor_reviews` stores clinician-entered review information.
-   `referrals` and `follow_ups` support continuity of care.
-   `consent_records` and `audit_logs` support accountability and
    governance.

**Core rule:** Firebase Authentication identifies the user; FastAPI authorizes the
user; MySQL stores the user's application data.


## Firebase Authentication Mapping Notes

The `users.firebase_uid` column must store the UID from the verified Firebase Authentication identity. Use `VARCHAR(128) NOT NULL UNIQUE` rather than assuming the UID is a UUID with a fixed 36-character length.

FastAPI must verify the Firebase ID token with the Firebase Admin SDK, then use the verified `uid` to find or create the MySQL application user. Never accept a client-supplied UID as proof of identity. Never store passwords in MySQL.
