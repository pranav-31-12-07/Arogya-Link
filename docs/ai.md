# AAROGYA LINK

## AI Architecture and Implementation Specification

**Document:** `ai.md`\
**Version:** 1.0\
**Status:** Proposed implementation specification\
**Runtime:** Ollama\
**Backend orchestration:** FastAPI

------------------------------------------------------------------------

# 1. Purpose

This document defines how AAROGYA LINK uses its AI models across Text,
Speech-to-Speech and Video interaction modes.

The core requirement is that all interaction modes share the same
consultation context. When a patient switches modes, the next model must
receive the relevant conversation history and observations so the
interaction can continue without asking the patient to repeat
everything.

The AI supports healthcare intake, communication and documentation. It
must not independently diagnose, prescribe medication or replace
qualified clinical review.

------------------------------------------------------------------------

# 2. Confirmed Model Allocation

  ------------------------------------------------------------------------
  Interaction mode   Model             Input             Output
  ------------------ ----------------- ----------------- -----------------
  Text-to-Text       `qwen2.5:7b`      Text              Text

  Speech-to-Speech   `qwen2.5:7b`      Transcribed       Response text,
                                       speech text       then generated
                                                         speech

  Video / Visual     `qwen2.5vl:3b`    Selected video    Textual visual
  Input                                frames or images, observations
                                       plus text/context 
  ------------------------------------------------------------------------

Both models are served through Ollama. The browser must not call Ollama
directly. All model calls go through FastAPI.

## 2.1 Text-to-Text

Flow:

``` text
Patient types a message
        |
        v
React frontend
        |
        v
FastAPI
        |
        v
Load consultation context
        |
        v
Ollama: qwen2.5:7b
        |
        v
Validate response
        |
        v
Save user message and assistant response
        |
        v
Update consultation context
        |
        v
Return response to frontend
```

## 2.2 Speech-to-Speech

The selected Qwen model is still `qwen2.5:7b`. Speech input and output
are handled by speech services around the language model.

``` text
Patient speaks
      |
      v
Microphone audio capture
      |
      v
Speech-to-text (ASR)
      |
      v
Transcribed text
      |
      v
FastAPI loads shared context
      |
      v
Ollama: qwen2.5:7b
      |
      v
Response text
      |
      v
Text-to-speech (TTS)
      |
      v
Audio playback
```

The transcription and generated assistant text must also be recorded in
the consultation history and included in the shared context.

Speech recognition, translation and text-to-speech are separate
services. `qwen2.5:7b` is the language model for the conversational
response; it is not the ASR or TTS engine.

## 2.3 Video / Visual Input

Use `qwen2.5vl:3b` for image and selected video-frame understanding.

``` text
Patient enables camera or selects video
      |
      v
Explicit permission and capture
      |
      v
Select suitable frame(s)
      |
      v
FastAPI validates media
      |
      v
Ollama: qwen2.5vl:3b
      |
      v
Visual observations
      |
      v
Validate and label as AI observations
      |
      v
Save observations to consultation history
      |
      v
Update shared context
```

Do not assume the model is processing a continuous real-time video
stream. For the initial implementation, capture selected frames or still
images at controlled points and submit them for analysis. Continuous
video analysis can be evaluated later.

------------------------------------------------------------------------

# 3. Shared Consultation Context

## 3.1 Core Requirement

Maintain a `context.txt` file for each consultation.

It must be updated with the relevant interaction history and AI
responses so that Text, Speech-to-Speech and Video modes can continue
from the same context.

**Never use one shared global context file for all patients.** Each
consultation must have its own isolated context to prevent cross-patient
data leakage.

## 3.2 Recommended Storage Layout

Use a server-controlled storage location. Do not expose the file path to
the browser.

``` text
storage/
└── consultations/
    ├── <consultation_uuid_1>/
    │   ├── context.txt
    │   └── media/
    ├── <consultation_uuid_2>/
    │   ├── context.txt
    │   └── media/
    └── <consultation_uuid_3>/
        ├── context.txt
        └── media/
```

The actual storage root must be configured through environment variables
and must not be committed to Git.

## 3.3 Context File Format

Use a consistent, readable format. Every entry should include a
timestamp, interaction mode, speaker and content type.

Example:

``` text
AAROGYA LINK - CONSULTATION CONTEXT
Consultation ID: <consultation_uuid>
Context Version: 1

[2026-10-31 10:00:00 UTC]
Mode: TEXT
Speaker: PATIENT
Type: MESSAGE
Content:
I have had a headache since yesterday.

[2026-10-31 10:00:05 UTC]
Mode: TEXT
Speaker: ASSISTANT
Type: RESPONSE
Content:
I can help collect some information. Where is the headache located?

[2026-10-31 10:01:10 UTC]
Mode: SPEECH_TO_SPEECH
Speaker: PATIENT
Type: TRANSCRIPTION
Content:
It is mostly on the right side.

[2026-10-31 10:01:16 UTC]
Mode: SPEECH_TO_SPEECH
Speaker: ASSISTANT
Type: RESPONSE
Content:
Thank you. When did it begin, and how severe is it?

[2026-10-31 10:02:00 UTC]
Mode: VIDEO
Speaker: SYSTEM
Type: VISUAL_OBSERVATION
Content:
A frame was submitted for visual analysis. See the associated protected media record and model observation.
```

This is illustrative test content, not a clinical recommendation or
diagnosis.

## 3.4 What Must Be Recorded

Record relevant events such as:

-   Patient text messages.
-   Speech transcriptions.
-   Assistant text responses.
-   Video/image observations produced by the vision model.
-   Relevant mode changes.
-   Relevant system events, such as a failed model request, when useful
    for continuity.

Avoid adding unnecessary personal information or raw sensitive media
content to `context.txt`.

For media, store a protected reference and a concise description or
validated observation rather than embedding base64 image/audio data in
the text file.

## 3.5 Source of Truth

MySQL is the authoritative source for persisted consultation messages,
observations and metadata.

`context.txt` is a consultation-specific context artifact used to
assemble model input.

Recommended write sequence:

1.  Validate the incoming event.
2.  Save the event to MySQL.
3.  Update or rebuild the consultation context from the persisted
    records.
4.  Prepare model input from the updated context.
5.  Call the selected model.
6.  Validate the model response.
7.  Save the assistant response to MySQL.
8.  Update the context again.
9.  Return the response to the client.

If context-file writing fails, do not silently lose the conversation.
Keep the persisted MySQL event and mark context generation as pending
for retry.

For reliable operation, use a context version or event sequence number
so concurrent requests do not overwrite each other's updates.

------------------------------------------------------------------------

# 4. Model Switching

## 4.1 Shared Context Flow

``` mermaid
flowchart TD
    A[Patient interaction]
    B{Selected mode}
    C[Text request]
    D[Speech transcription]
    E[Video frame / image]
    F[Load consultation context]
    G[Qwen2.5:7B]
    H[Qwen2.5-VL:3B]
    I[Validate result]
    J[Persist event and response in MySQL]
    K[Update context.txt]
    L[Return result]

    A --> B
    B -->|Text| C
    B -->|Speech-to-Speech| D
    B -->|Video| E
    C --> F
    D --> F
    E --> F
    F -->|Text or speech| G
    F -->|Video or image| H
    G --> I
    H --> I
    I --> J --> K --> L
```

## 4.2 Example Mode Switch

1.  Patient starts in Text Mode and describes symptoms.
2.  `qwen2.5:7b` responds.
3.  Both turns are persisted and added to the consultation context.
4.  Patient switches to Speech-to-Speech.
5.  The speech service transcribes the next utterance.
6.  FastAPI loads the same consultation context.
7.  `qwen2.5:7b` receives the context and the new transcription.
8.  The response is converted to speech.
9.  The transcription and assistant response are persisted and added to
    the same context.
10. Patient switches to Video Mode.
11. FastAPI loads the same context and sends relevant context plus
    selected frames to `qwen2.5vl:3b`.
12. Validated visual observations are persisted and added to the same
    context.
13. If the patient returns to Text Mode, `qwen2.5:7b` receives the
    updated consultation context, including the visual observations.

The consultation ID remains the same throughout the mode switches.

------------------------------------------------------------------------

# 5. Context Assembly for Model Requests

Do not blindly send an unlimited `context.txt` file to every model
request.

The backend context builder should:

1.  Identify the authenticated patient and authorized consultation.
2.  Load the relevant persisted conversation events.
3.  Load the consultation's context artifact or rebuild it if stale.
4.  Include the most relevant recent turns.
5.  Include a concise running summary when the history becomes long.
6.  Include relevant patient-provided profile information only when
    permitted and necessary.
7.  Clearly label AI-generated observations and unverified information.
8.  Include the current user input or selected media.
9.  Apply model-specific input limits.

The context file is the shared continuity artifact, not a substitute for
prompt construction or access control.

## 5.1 Suggested Context Sections

``` text
CONSULTATION METADATA
- Consultation ID
- Preferred language
- Current interaction mode

PATIENT-PROVIDED INFORMATION
- Information shared by the patient in this consultation

CONVERSATION HISTORY
- Timestamped patient and assistant turns

VISUAL OBSERVATIONS
- AI-generated descriptions linked to protected media records

RUNNING SUMMARY
- Concise summary of the consultation so far

CURRENT REQUEST
- The latest text, transcription or visual-analysis task
```

The running summary must not convert uncertain AI observations into
confirmed facts.

------------------------------------------------------------------------

# 6. Prompt and Response Design

## 6.1 Text Model Prompt

The prompt sent to `qwen2.5:7b` should include:

-   The assistant's role and limitations.
-   The supported language and response-language requirement.
-   Relevant consultation context.
-   Clear distinction between patient statements and AI-generated
    observations.
-   The latest user message.
-   Instructions to ask relevant follow-up questions.
-   Instructions not to diagnose or prescribe.
-   Emergency escalation instructions based on a separately approved
    protocol.

Do not rely on the model alone to decide whether an emergency exists.
Use clinician-approved escalation rules and clear safety messaging.

## 6.2 Vision Model Prompt

The prompt sent to `qwen2.5vl:3b` should:

-   Request descriptions of visible features only.
-   Ask the model to state uncertainty and image limitations.
-   Prohibit unsupported diagnostic conclusions.
-   Avoid inferring medical history from appearance.
-   Distinguish what is visible from what is not assessable.
-   Return concise structured observations for review.

## 6.3 Suggested Structured Vision Result

``` json
{
  "observation_type": "visual_observation",
  "description": "Brief description of visible features",
  "limitations": [
    "Image quality may affect observation",
    "A photograph cannot establish a diagnosis"
  ],
  "requires_clinician_review": true
}
```

This is a proposed application response schema, not a guarantee of model
accuracy. Validate the output before saving it.

## 6.4 Suggested Structured Text Result

``` json
{
  "response_text": "Patient-facing response",
  "language": "en",
  "follow_up_question": "A relevant next question, if needed",
  "safety_notice": null
}
```

The backend should validate the structure and safely handle malformed or
incomplete model output.

------------------------------------------------------------------------

# 7. Speech Services

`qwen2.5:7b` is used for the language conversation. Separate components
are needed for audio input and output.

## 7.1 Speech Recognition

Evaluate suitable ASR models for Marathi, Hindi and English, including
AI4Bharat IndicConformer or Whisper-based options.

Responsibilities:

-   Convert patient speech to text.
-   Preserve the original transcription.
-   Record language metadata where available.
-   Indicate low-confidence or failed transcription.
-   Allow correction when practical.

## 7.2 Translation

Evaluate IndicTrans2 or another suitable translation component if
translation is needed between the patient's language and the model's
supported working language.

Preserve the original transcription and, where used, the translated text
as separate fields. Do not silently replace the patient's original
words.

## 7.3 Text-to-Speech

Evaluate Indic-TTS or another tested multilingual TTS service.

Responsibilities:

-   Convert the assistant response to audio.
-   Use the selected response language.
-   Handle unsupported language or voice gracefully.
-   Return playback status to the frontend.

## 7.4 Speech Turn Lifecycle

Suggested states:

``` text
idle
  -> recording
  -> transcribing
  -> waiting_for_ai
  -> generating_audio
  -> speaking
  -> idle
```

If a stage fails, show a recoverable error and preserve the captured
input where safe.

------------------------------------------------------------------------

# 8. Video and Image Processing

## 8.1 Initial MVP Behaviour

For the first version:

-   Ask for camera permission only when needed.
-   Show a visible camera preview.
-   Capture a still image or selected frame.
-   Let the user review and submit it.
-   Send the selected frame to FastAPI.
-   Process it with `qwen2.5vl:3b`.
-   Store the media securely.
-   Save the model's validated observation with its source and
    timestamp.
-   Add a concise observation to the shared consultation context.

## 8.2 Avoid Unbounded Frame Processing

Do not submit every camera frame to the model.

Use explicit capture or controlled frame selection. This reduces
latency, resource usage and unnecessary collection of sensitive imagery.

## 8.3 Provenance

Each observation should retain:

-   Consultation ID.
-   Protected media record ID.
-   Model name.
-   Model/version metadata when available.
-   Timestamp.
-   Observation text.
-   Limitations.
-   Review status.

The doctor interface must distinguish AI observations from
clinician-confirmed findings.

------------------------------------------------------------------------

# 9. FastAPI AI Service Structure

Suggested module layout:

``` text
backend/
└── app/
    ├── ai/
    │   ├── orchestrator.py
    │   ├── context_manager.py
    │   ├── context_builder.py
    │   ├── qwen_text.py
    │   ├── qwen_vision.py
    │   ├── speech_to_text.py
    │   ├── text_to_speech.py
    │   ├── translation.py
    │   ├── response_schemas.py
    │   └── prompts/
    │       ├── text_system.txt
    │       └── vision_system.txt
    ├── services/
    │   └── consultation_service.py
    └── storage/
        └── context_storage.py
```

Keep the Ollama client, context management, speech services and API
routes separate.

------------------------------------------------------------------------

# 10. Ollama Configuration

Use environment-based configuration.

Example `.env.example`:

``` env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=qwen2.5:7b
OLLAMA_VISION_MODEL=qwen2.5vl:3b
CONSULTATION_CONTEXT_ROOT=./storage/consultations
```

The actual `.env` file must not be committed to Git.

The model names must be configurable. Do not hard-code them across
multiple modules.

## 10.1 Model Availability

Before making a request:

-   Check that Ollama is reachable.
-   Check that the requested model is available.
-   Apply request timeouts.
-   Handle model loading delays.
-   Handle memory pressure and inference errors.
-   Return a recoverable application error.
-   Preserve the user's message if inference fails.

The current development machine has limited GPU memory. Benchmark the
text and vision models independently and test model switching. Avoid
assuming both models can remain loaded simultaneously.

------------------------------------------------------------------------

# 11. Context File Reliability and Privacy

## 11.1 Isolation

-   One context file per consultation.
-   Resolve the consultation from the authenticated user's authorized
    records.
-   Never accept an arbitrary filesystem path from the browser.
-   Prevent path traversal.
-   Keep context files outside public static directories.
-   Apply file-system permissions appropriate to the deployment.

## 11.2 Concurrent Updates

Two requests may arrive close together.

Use a per-consultation lock or serialized event-processing mechanism.
Persist events first, then update the context using a version or
sequence number. Do not allow two writes to silently overwrite each
other.

## 11.3 Recovery

If a context file is missing or corrupted:

-   Rebuild it from the authorized MySQL consultation events.
-   Record the rebuild status.
-   Continue only after confirming the context belongs to the requested
    consultation.
-   Do not mix records from different patients.

## 11.4 Retention

Define retention and deletion rules for:

-   Conversation records.
-   Context files.
-   Original images and video frames.
-   Audio recordings, if retained.
-   Transcriptions.
-   AI-generated observations.

Do not retain raw audio or video indefinitely by default. Collect and
retain only what is required by the approved workflow and consent
policy.

------------------------------------------------------------------------

# 12. Clinical Safety Rules

AAROGYA LINK is an AI-assisted intake and care-coordination platform,
not an autonomous doctor.

The AI must:

-   Collect patient-reported symptoms and relevant history.
-   Ask clear follow-up questions.
-   Summarize information without changing its meaning.
-   Label model-generated visual descriptions as observations.
-   Communicate uncertainty and limitations.
-   Avoid claiming a confirmed diagnosis.
-   Avoid prescribing medication or dosage.
-   Escalate according to clinician-approved rules.
-   Encourage appropriate professional assessment.

Emergency guidance must not depend on successful AI inference or later
offline synchronization. Approved emergency instructions must be
available through a reliable, separately defined safety workflow.

A clinician must review and make clinical decisions through the
authorized workflow.

------------------------------------------------------------------------

# 13. Testing Plan

## 13.1 Text Model Tests

-   Basic English conversation.
-   Marathi and Hindi conversation after language pipeline integration.
-   Context continuity across multiple turns.
-   Follow-up question relevance.
-   Malformed output handling.
-   Ollama unavailable handling.
-   Long-context handling.

## 13.2 Speech Tests

-   Correct transcription.
-   Marathi, Hindi and English speech.
-   Noisy environment.
-   Low-confidence transcription.
-   TTS output language.
-   Audio playback interruption.
-   Context continuity after switching from text to speech and back.

## 13.3 Vision Tests

-   Supported image formats.
-   Poor lighting and blur.
-   Multiple selected frames.
-   Invalid or oversized uploads.
-   Uncertain observation handling.
-   No unsupported diagnostic claims.
-   Context continuity after switching from text or speech to video.

## 13.4 Context Isolation Tests

-   Two different patients must never share context.
-   Two consultations for one patient must remain separate.
-   Switching modes within one consultation must preserve history.
-   Missing context file must rebuild only from the correct
    consultation.
-   Concurrent events must not overwrite one another.
-   Failed context update must be recoverable from MySQL.

------------------------------------------------------------------------

# 14. Acceptance Criteria

The AI integration is ready for MVP review when:

1.  Text Mode uses `qwen2.5:7b`.
2.  Speech-to-Speech uses `qwen2.5:7b` after speech transcription and
    before TTS.
3.  Video/image analysis uses `qwen2.5vl:3b`.
4.  All model calls go through FastAPI and Ollama.
5.  Every consultation has an isolated `context.txt`.
6.  Text, transcription, assistant responses and validated visual
    observations are recorded in the shared consultation history.
7.  Switching interaction modes preserves the same consultation context.
8.  MySQL remains the source of truth for persisted events.
9.  Context files can be rebuilt from persisted records.
10. Model failures do not silently discard patient input.
11. AI-generated content is clearly distinguished from
    clinician-reviewed information.
12. No model output is represented as a confirmed diagnosis or
    prescription.

------------------------------------------------------------------------

# 15. Final AI Architecture Decision

**Text-to-Text:** `qwen2.5:7b`\
**Speech-to-Speech:** `qwen2.5:7b` with separate ASR and TTS services\
**Video / Visual Input:** `qwen2.5vl:3b`\
**Model runtime:** Ollama\
**Orchestration:** FastAPI\
**Permanent conversation history:** MySQL\
**Shared per-consultation context artifact:** `context.txt`

The same consultation context must follow the patient across Text,
Speech-to-Speech and Video modes. Each consultation's context remains
isolated, securely stored and recoverable from MySQL.


## Authentication Dependency

AI endpoints are protected by FastAPI authentication middleware. The middleware verifies Firebase ID tokens with the Firebase Admin SDK and authorizes the Firebase UID against the MySQL application user before loading any consultation context. The AI context manager must never accept a consultation ID or filesystem path as sufficient proof of access.
