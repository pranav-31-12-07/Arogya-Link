# AAROGYA LINK

## Product Requirements Document (PRD)

**Project Name:** AAROGYA LINK\
**Product Type:** AI-Assisted Multilingual Healthcare Platform\
**Version:** 1.0\
**Document Status:** Initial Product Specification

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Introduction

AAROGYA LINK is an AI-assisted, multilingual healthcare platform
designed to improve healthcare accessibility in rural and remote
communities.

The platform connects patients with qualified healthcare professionals
through an AI-powered virtual health assistant.

Patients can communicate with the AI assistant through two primary
modes:

1.  **Text Mode:** Patients can describe symptoms using text, voice
    input or images and receive AI-generated text responses.
2.  **Virtual Doctor Mode:** Patients can interact with an animated
    virtual doctor through voice-to-voice communication and visual input
    using a camera.

The AI assistant helps collect patient information, understand reported
symptoms, ask relevant follow-up questions and generate structured
consultation reports.

These reports can be reviewed by qualified healthcare professionals for
appropriate clinical assessment, referral and follow-up.

The platform is designed with multilingual accessibility and
offline-first functionality in mind.

## 1.2 Vision

"Making healthcare accessible to everyone, regardless of their location,
language or connectivity."

## 1.3 Mission

To simplify the initial healthcare journey by combining conversational
AI, visual interaction, local-language communication and human clinical
expertise.

# 2. Problem Statement

Rural and remote communities frequently face challenges such as:

-   Limited access to qualified healthcare professionals.
-   Long travel distances to healthcare facilities.
-   Language barriers between patients and doctors.
-   Difficulty explaining symptoms.
-   Fragmented medical histories.
-   Poor internet connectivity.
-   Delayed referrals and follow-ups.

AAROGYA LINK aims to reduce these barriers through an accessible
AI-assisted healthcare coordination platform.

# 3. Target Users

## 3.1 Primary Users -- Patients

Individuals who need assistance communicating their health concerns.

Expected capabilities:

-   Create an account.
-   Select a preferred language.
-   Enter basic personal and health information.
-   Interact with the AI assistant.
-   Upload medical images.
-   Access previous consultations.
-   View consultation reports.
-   Track doctor reviews and referrals.

## 3.2 Secondary Users -- Healthcare Professionals

Qualified doctors who review patient information and provide clinical
assessment.

Expected capabilities:

-   Access authorized patient consultations.
-   Review patient history.
-   View AI-generated consultation summaries.
-   Review uploaded images.
-   Add clinical observations.
-   Provide recommendations and referral instructions.
-   Track patient follow-ups.

# 4. Core Application Modules

## 4.1 Authentication Module

Provide secure user registration and login.

### Sign Up

-   Full name.
-   Email address.
-   Password.
-   Confirm password.
-   Terms and conditions consent.

### Login

-   Email address.
-   Password.
-   Remember me.
-   Forgot password.

### Requirements

-   Secure password hashing.
-   Backend-managed authentication.
-   Protected application routes.
-   Session management.
-   Logout functionality.

## 4.2 Main Application Navigation

The primary application interface must contain:

### Top Navigation Bar

**Left Section:** - AAROGYA LINK logo. - Application branding.

**Center Section:** A floating pill-shaped navigation switch with: -
Text Mode. - Virtual Doctor Mode.

**Right Section:** - Language selector. - User profile icon.

The navigation must remain consistent across both primary modes.

## 4.3 Text Mode

Text Mode provides a conversational healthcare interface.

### Interface Requirements

-   Clean chat interface.
-   Patient messages aligned to the right.
-   AI responses aligned to the left.
-   Message input bar fixed near the bottom.
-   Image attachment button.
-   Microphone input button.
-   Send button.

### AI Response Features

-   Understand patient messages.
-   Ask relevant follow-up questions.
-   Maintain consultation context.
-   Provide understandable explanations.
-   Generate structured symptom summaries.
-   Display appropriate safety guidance.

### Message Actions

Every AI response should support: - Copy response. - Text-to-speech
playback. - Clear message timestamps.

### Conversation Continuity

Text Mode and Virtual Doctor Mode must share the same consultation
context.

Switching between modes must not erase the existing conversation.

## 4.4 Virtual Doctor Mode

Virtual Doctor Mode is the signature feature of AAROGYA LINK.

It provides an animated virtual doctor interface that communicates with
patients through speech and visual interaction.

### Doctor Avatar Selection

Provide two avatar options:

1.  Male Virtual Doctor.
2.  Female Virtual Doctor.

The user can switch between the two avatars.

Each avatar has two video states:

-   **Listening Video:** Doctor appears attentive, with mouth closed and
    natural idle movements.
-   **Speaking Video:** Doctor appears to be talking with natural facial
    expressions and lip movement.

### Video Behaviour

-   Display the listening video while the patient is speaking.
-   Display the speaking video while the AI response is being played.
-   Use the same doctor identity across both states.
-   Maintain consistent video dimensions and visual appearance.
-   Display an appropriate processing indicator when the AI is
    generating a response.

### Consultation Controls

Display controls on the right side of the doctor interface:

-   Microphone mute/unmute.
-   Camera enable/disable.
-   Image upload.
-   Consultation status.

### Doctor Information

Display: - Doctor avatar name. - AI Assistant designation. - Current
interaction status.

The virtual doctor is an AI assistant, not a licensed medical
professional.

## 4.5 Multilingual Support

AAROGYA LINK aims to support all major Indian languages.

Initial development and demonstration languages:

-   English.
-   Hindi.
-   Marathi.

The architecture must allow additional Indian languages to be
introduced.

### Requirements

-   Language selection.
-   Speech recognition.
-   Language translation where required.
-   AI responses in the preferred language.
-   Text-to-speech responses.
-   Multilingual consultation history.

Language support must be tested rather than assumed to work equally well
across every language and dialect.

## 4.6 Voice Interaction

The platform must support voice-based communication.

### Voice Input

-   Request microphone permission.
-   Capture patient speech.
-   Convert speech into text.
-   Process the text through the AI engine.

### Voice Output

-   Convert AI-generated responses into speech.
-   Play responses in the patient's selected language.
-   Synchronize speaking and listening video states.

### Interaction States

-   Listening.
-   Processing.
-   Speaking.
-   Muted.
-   Error.

## 4.7 Camera and Image Upload

Patients must be able to provide visual information during
consultations.

### Supported Methods

1.  Live camera interaction.
2.  Camera capture.
3.  Existing image upload.

### Requirements

-   Request camera permission.
-   Display camera preview.
-   Capture images.
-   Allow image preview before submission.
-   Allow image removal or replacement.
-   Submit images for AI-assisted visual observation.
-   Associate uploaded images with the active consultation.

### AI Vision Responsibilities

The vision model may: - Describe visible features. - Identify image
characteristics that may warrant attention. - Provide cautious visual
observations. - Help generate a consultation summary.

The vision model must not independently diagnose diseases or prescribe
medication.

## 4.8 Patient Profile Module

Users can access their profile through the top-right profile icon.

### Personal Information

-   Full name.
-   Email.
-   Age or date of birth.
-   Gender.
-   Preferred language.

### Optional Health Information

-   Height.
-   Weight.
-   Blood group.
-   Emergency contact.
-   Known allergies.
-   Existing medical conditions.

### Requirements

-   Medical profile fields must be optional.
-   Users can update their information.
-   Users can save profile changes.
-   Patient information must be protected.
-   Patient-reported information must be distinguishable from clinically
    verified information.

## 4.9 Consultation Report Module

After a consultation, the AI assistant generates a structured report.

### Report Contents

-   Consultation ID.
-   Patient information.
-   Consultation date and time.
-   Preferred language.
-   Reported symptoms.
-   Symptom duration.
-   Relevant medical history.
-   AI-generated summary.
-   Visual observations, if applicable.
-   Uncertainties and limitations.
-   Escalation flags.
-   Doctor review status.

### Report Status

-   Pending Review.
-   Under Clinical Review.
-   Reviewed.
-   Referral Required.
-   Follow-up Required.

AI-generated reports must be clearly distinguished from doctor-reviewed
clinical records.

## 4.10 Doctor Dashboard

Provide a separate interface for authorized healthcare professionals.

### Dashboard Features

-   Patient consultation list.
-   Pending consultation reports.
-   Patient information.
-   Consultation history.
-   Uploaded images.
-   AI-generated summaries.
-   Clinical review interface.
-   Referral management.
-   Follow-up tracking.

Only authorized doctors should be able to access clinical review
functionality.

# 5. Offline-First Functionality

Offline support is a major requirement of AAROGYA LINK.

The application must remain useful when internet connectivity is
unavailable.

## 5.1 Offline Capabilities

-   Access previously cached application screens.
-   Capture patient information.
-   Record symptoms.
-   Store consultation information locally.
-   Capture and store images.
-   Queue pending consultations.
-   Use locally available AI services where supported.

## 5.2 Local AI Processing

Use Ollama to run locally installed AI models.

### Main LLM

**Model:** Qwen2.5:7B

Responsibilities: - Conversational interaction. - Follow-up questions. -
Symptom summarization. - Structured report generation.

### Vision LLM

**Model:** Qwen2.5-VL:3B

Responsibilities: - Image understanding. - Preliminary visual
observations. - Image-based consultation assistance.

### Offline AI Limitations

Local inference depends on available hardware and downloaded models.

Speech recognition and text-to-speech must also have locally available
models to operate offline.

Camera capture can work offline, but cloud-based visual processing
cannot.

## 5.3 Data Synchronization

When internet connectivity returns:

1.  Detect network availability.
2.  Identify pending local records.
3.  Synchronize consultation data.
4.  Upload associated images securely.
5.  Prevent duplicate submissions.
6.  Update synchronization status.
7.  Make authorized records available to doctors.

The application must handle synchronization failures and retry safely.

# 6. AI Architecture

AAROGYA LINK uses a hybrid AI architecture.

### Local LLM

Ollama + Qwen2.5:7B

### Local Vision Model

Ollama + Qwen2.5-VL:3B

### Speech Recognition

Explore multilingual speech recognition models such as AI4Bharat
IndicConformer or Whisper.

### Translation

Explore AI4Bharat IndicTrans2.

### Text-to-Speech

Explore AI4Bharat Indic-TTS or other suitable multilingual TTS models.

### Backend Orchestration

FastAPI will manage: - Model communication. - Consultation sessions. -
Patient context. - AI responses. - Image processing. - Report
generation. - Safety checks.

All model calls must pass through the backend.

# 7. Technology Stack

## Frontend

-   React.js.
-   Vite.
-   Tailwind CSS.
-   JavaScript.
-   Lucide Icons.

## Backend

-   Python.
-   FastAPI.
-   Pydantic.

## Database

-   MySQL.

## Local AI

-   Ollama.
-   Qwen2.5:7B.
-   Qwen2.5-VL:3B.

## Offline Storage

-   IndexedDB.
-   Service Workers.
-   Progressive Web App (PWA).

## Media

-   Browser Media APIs.
-   Camera API.
-   Microphone API.
-   Video playback.

# 8. Database Requirements

Use MySQL as the primary relational database.

Suggested database tables:

1.  users
2.  patient_profiles
3.  consultations
4.  messages
5.  uploaded_files
6.  medical_reports
7.  doctor_reviews
8.  referrals
9.  follow_ups
10. consent_records

### Database Principles

-   Use appropriate primary and foreign keys.
-   Maintain referential integrity.
-   Use timestamps.
-   Store uploaded image files outside the database and maintain their
    metadata in MySQL.
-   Protect sensitive information.
-   Implement role-based authorization.
-   Maintain an audit trail for important clinical actions.

# 9. UI/UX Design Requirements

## Design Philosophy

AAROGYA LINK must have a modern, minimalist and professional healthcare
interface.

### Color Scheme

-   Primary Green: `#16865B`
-   Dark Green: `#116B49`
-   Light Green: `#E8F5EE`
-   Background: `#F8FAF9`
-   White: `#FFFFFF`
-   Primary Text: `#172B24`
-   Secondary Text: `#718078`
-   Border: `#E4EBE6`

### Design Principles

-   White and green visual identity.
-   Clean layouts.
-   Rounded cards.
-   Subtle shadows.
-   Consistent spacing.
-   Accessible typography.
-   Minimal distractions.
-   Responsive design.

### Design Reference

The approved Google Stitch designs for AAROGYA LINK Text Mode and
Virtual Doctor Mode should be treated as the primary visual references.

The frontend implementation must maintain their overall layout and
visual identity.

Do not independently redesign the application or introduce an unrelated
design system.

# 10. Security and Healthcare Safety

Security and responsible AI usage are mandatory.

### Privacy

-   Obtain consent before processing sensitive patient information.
-   Protect patient records.
-   Restrict access to authorized users.
-   Secure image uploads.
-   Avoid unnecessary personal data collection.

### AI Safety

-   AI must not independently diagnose diseases.
-   AI must not prescribe medication.
-   AI-generated findings must be labelled as preliminary.
-   Emergency warning signs must trigger appropriate escalation
    guidance.
-   Clinical decisions must remain with qualified healthcare
    professionals.
-   Do not fabricate vital readings or clinical observations.
-   Distinguish reported symptoms from AI-generated observations and
    doctor-confirmed findings.

### Emergency Support

The platform must provide clear emergency guidance and a configurable
local escalation workflow.

Do not assume that every region uses the same emergency contact number.

# 11. MVP Scope

The first working prototype should prioritize the following:

### Phase 1 -- Frontend

-   Login.
-   Sign Up.
-   Shared navigation.
-   Text Mode.
-   Virtual Doctor Mode.
-   Male/Female avatar switching.
-   Profile management.

### Phase 2 -- AI Integration

-   Ollama integration.
-   Qwen2.5:7B conversational interaction.
-   Qwen2.5-VL:3B image processing.
-   Structured consultation reports.

### Phase 3 -- Voice and Media

-   Microphone input.
-   Text-to-speech.
-   Multilingual support.
-   Camera capture.
-   Image upload.
-   Avatar video state switching.

### Phase 4 -- Backend and Database

-   FastAPI backend.
-   MySQL integration.
-   Authentication.
-   Patient records.
-   Consultation history.
-   Doctor dashboard.

### Phase 5 -- Offline Functionality

-   PWA support.
-   IndexedDB storage.
-   Offline consultation capture.
-   Synchronization queue.
-   Local AI inference.

# 12. Out of Scope for Initial MVP

The following are not required for the first prototype:

-   Autonomous disease diagnosis.
-   Automatic prescription generation.
-   Fully automated medical treatment decisions.
-   Integration with every hospital or healthcare provider.
-   Guaranteed emergency service dispatch.
-   Full offline cloud doctor consultation.
-   Clinical validation claims without supporting studies.

These may be considered for future development with appropriate clinical
oversight.

# 13. Success Criteria

The MVP will be considered successful when:

1.  A patient can register and log in.
2.  A patient can access Text Mode and Virtual Doctor Mode.
3.  Both modes share consultation context.
4.  The AI can communicate through text.
5.  The AI can process supported image inputs.
6.  The patient can switch between male and female avatars.
7.  Doctor videos switch correctly between listening and speaking
    states.
8.  The patient can maintain an optional health profile.
9.  The system can generate a structured consultation report.
10. Consultation information can be saved in MySQL.
11. Authorized doctors can review submitted consultations.
12. Basic patient intake and data storage work without internet.
13. Pending records synchronize when connectivity returns.

# 14. Final Product Definition

AAROGYA LINK is a multilingual, AI-assisted healthcare access and
coordination platform.

Its primary differentiator is the combination of:

-   Conversational AI.
-   Virtual doctor interaction.
-   Multilingual voice communication.
-   Visual input through cameras and image uploads.
-   Structured patient consultation reports.
-   Qualified doctor involvement.
-   Offline-first functionality.

The goal is to make the initial healthcare journey simpler, more
accessible and more connected for rural and remote communities.

**AAROGYA LINK -- Your Health. Your Language. Your Care.**


## Authentication Provider Update

Firebase Authentication is the selected authentication provider. React uses the Firebase Web SDK, and FastAPI verifies Firebase ID tokens with the Firebase Admin SDK. MySQL remains the application database and stores the Firebase UID as the unique identity mapping; passwords are not stored in MySQL.
