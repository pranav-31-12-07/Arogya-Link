# AAROGYA LINK

## UI/UX Design System and Frontend Design Specification

**Project:** AAROGYA LINK\
**Document:** Design Specification\
**Version:** 1.0\
**Status:** Initial approved visual direction\
**Related document:** `prd.md`

------------------------------------------------------------------------

# 1. Design Overview

AAROGYA LINK is a multilingual, AI-assisted healthcare platform. Its
interface must feel welcoming, trustworthy, accessible and easy to use
for patients with different levels of digital literacy.

The application has two primary interaction modes:

1.  **Text Mode** -- conversational text interface with image upload and
    microphone input.
2.  **Virtual Doctor Mode** -- animated doctor avatar interface with
    microphone, camera and image upload controls.

Both modes are part of the SAME application and must share one
consistent design system.

## 1.1 Core Design Principles

-   White and green visual identity.
-   Minimal, clean and professional healthcare aesthetic.
-   Consistent navigation across all authenticated screens.
-   Clear visual hierarchy and readable typography.
-   Large, easy-to-understand controls.
-   Responsive desktop and mobile layouts.
-   Avoid unnecessary dashboards, charts and decorative elements.
-   Prioritize the patient conversation and virtual doctor experience.

## 1.2 Design Reference Rule

The approved Google Stitch designs for **Text Mode Consultation** and
**Virtual Doctor Consultation** are the primary visual references.

Frontend implementation must follow these references closely.

Do not redesign the application independently. Do not create unrelated
page styles. If a component is not shown in the references, design it
using the same established visual language.

All screens, including Login, Sign Up, Text Mode, Virtual Doctor Mode
and Profile, must look like pages of one unified product.

------------------------------------------------------------------------

# 2. Brand Identity

## 2.1 Product Name

**AAROGYA LINK**

## 2.2 Tagline

**Your Health. Your Language. Your Care.**

## 2.3 Brand Personality

-   Trustworthy
-   Calm
-   Friendly
-   Accessible
-   Professional
-   Human-centred
-   Technology-enabled, but not intimidating

------------------------------------------------------------------------

# 3. Color System

Use a WHITE AND GREEN color scheme throughout the application.

## 3.1 Core Colors

  -----------------------------------------------------------------------
  Token                   Hex                     Usage
  ----------------------- ----------------------- -----------------------
  Primary Green           `#16865B`               Primary buttons, active
                                                  navigation, key actions

  Dark Green              `#116B49`               Hover states, emphasis,
                                                  headings where
                                                  appropriate

  Light Green             `#E8F5EE`               Soft panels, selected
                                                  states, supporting
                                                  surfaces

  Background              `#F8FAF9`               Main page background

  White                   `#FFFFFF`               Cards, navigation and
                                                  input surfaces

  Primary Text            `#172B24`               Main headings and body
                                                  text

  Secondary Text          `#718078`               Supporting text, labels
                                                  and metadata

  Border                  `#E4EBE6`               Card borders,
                                                  separators and input
                                                  outlines
  -----------------------------------------------------------------------

## 3.2 Semantic Colors

  Token           Usage
  --------------- ------------------------------------------
  Success Green   Successful actions and completed states
  Warning Amber   Caution and pending states
  Error Red       Errors and urgent warning indicators
  Neutral Gray    Disabled controls and secondary metadata

Use semantic colors sparingly. Red should be reserved for meaningful
warnings and errors, not general decoration.

## 3.3 Color Usage Rules

-   Green is the primary brand accent.
-   Main surfaces should remain white or very light neutral.
-   Use pale green for selected states and supporting panels.
-   Maintain sufficient contrast for readable text.
-   Do not introduce blue or purple as competing primary brand colors.
-   Do not use strong gradients unless specifically approved.

------------------------------------------------------------------------

# 4. Typography

Use a clean, highly readable sans-serif font family.

Recommended: - Inter - Alternatively, a comparable modern sans-serif
font.

Typography hierarchy:

  Element           Treatment
  ----------------- ----------------------------------
  Page heading      Large, bold, dark text
  Section heading   Medium-large, semibold
  Body text         Regular, comfortable line height
  Supporting text   Smaller, muted
  Button labels     Medium or semibold
  Metadata          Small and muted

Use consistent font weights and line heights. Avoid overly decorative
typography.

------------------------------------------------------------------------

# 5. Layout and Spacing

## 5.1 General Layout

-   Use a consistent page container.
-   Maintain comfortable whitespace.
-   Align content to a clear grid.
-   Avoid excessive card nesting.
-   Use consistent spacing between related elements.
-   Keep important actions visible and easy to reach.

## 5.2 Spacing Scale

Use a consistent spacing scale based on multiples of 4px.

Suggested values: - 4px -- very small inline spacing. - 8px -- compact
spacing. - 12px -- control spacing. - 16px -- standard component
spacing. - 24px -- section spacing. - 32px -- large section spacing. -
48px -- major page spacing.

## 5.3 Shape and Elevation

-   Use moderately rounded cards and controls.
-   Use pill-shaped treatment for the mode switch and selected chips
    where shown.
-   Use subtle borders.
-   Use soft, restrained shadows.
-   Avoid excessive glassmorphism or heavy visual effects.

------------------------------------------------------------------------

# 6. Shared Application Navigation

The authenticated application uses one shared top navigation bar.

## 6.1 Navbar Structure

### Left

-   AAROGYA LINK brand name/logo.
-   Tagline where space permits.

### Centre

A floating, pill-shaped mode switch with two options:

-   Text
-   Virtual Doctor

The active mode must be clearly highlighted using the primary green
color.

### Right

-   Language selector.
-   Profile icon.

## 6.2 Navbar Behaviour

-   Keep the navbar consistent in Text Mode and Virtual Doctor Mode.
-   Switching modes must not clear the current consultation.
-   Preserve the current conversation context when changing modes.
-   The active mode must be visually obvious.
-   On smaller screens, collapse or adapt controls without horizontal
    overflow.

------------------------------------------------------------------------

# 7. Text Mode Design

Text Mode is a minimal conversational interface.

## 7.1 Main Layout

-   Shared top navigation.
-   Central conversation area.
-   Welcome heading when no conversation exists.
-   Optional suggested symptom prompts.
-   Patient messages aligned to the right.
-   AI responses aligned to the left.
-   Message composer fixed near the bottom of the conversation area.

## 7.2 Empty State

When the user starts a new consultation, show:

**Heading:**\
"How can I help you today?"

**Supporting text:**\
"Describe how you're feeling in your own words or language. I'm here to
listen and support your care."

Optional suggestion chips may be shown as examples. They must not imply
a diagnosis.

## 7.3 Chat Messages

### Patient Message

-   Right aligned.
-   Soft green background.
-   Dark readable text.
-   Rounded corners.
-   Optional timestamp and delivery status.

### AI Message

-   Left aligned.
-   White card or clean neutral surface.
-   Clear assistant identity.
-   Readable paragraphs and structured sections.
-   Optional timestamp.

### AI Message Actions

Provide: - Copy response. - Listen to response / text-to-speech. -
Relevant status information.

The Copy action must copy the actual response text and provide visible
feedback.

## 7.4 Message Composer

The composer remains near the bottom of the conversation area.

Include: - Text input. - Image upload/attachment control. - Microphone
control. - Send button.

Placeholder:

`Type your symptoms in your preferred language...`

Requirements: - Clear focus state. - Disabled state when appropriate. -
Loading state while submitting. - Support multiline input. - Keep
controls accessible on mobile. - Do not allow the composer to overlap
messages.

## 7.5 Conversation Continuity

Text Mode and Virtual Doctor Mode share one active consultation.

Switching modes must preserve: - Messages. - Consultation ID. - Patient
context. - Uploaded attachment references. - Current consultation
status.

------------------------------------------------------------------------

# 8. Virtual Doctor Mode Design

Virtual Doctor Mode is the signature visual experience of AAROGYA LINK.

It should feel like a simple, focused virtual consultation rather than a
complex hospital dashboard.

## 8.1 Main Layout

Use three primary areas:

### Left Area -- Doctor Selection

Provide two selectable avatar options:

-   Male Doctor.
-   Female Doctor.

Each option should have a small avatar thumbnail and a clear selected
state.

The selected doctor identity must remain consistent across listening and
speaking videos.

### Centre Area -- Doctor Video

-   Large central video container.
-   Display the selected doctor's video.
-   Use the provided generated video assets.
-   Show doctor/AI assistant name below or overlaid in a restrained way.
-   Display the current interaction status.
-   Provide a patient camera preview when the camera is active.

The doctor video must be the primary visual focus.

### Right Area -- Consultation Controls

Provide clearly labelled controls for:

-   Microphone mute/unmute.
-   Camera enable/disable.
-   Image upload.

Controls should be large enough to use comfortably and should have
visible active, inactive, hover, focus and disabled states.

## 8.2 Doctor Video Assets

The project will contain four generated video assets:

  Avatar   State       Suggested asset name
  -------- ----------- ------------------------
  Male     Speaking    `male-speaking.mp4`
  Male     Listening   `male-listening.mp4`
  Female   Speaking    `female-speaking.mp4`
  Female   Listening   `female-listening.mp4`

Suggested location:

`frontend/public/videos/`

## 8.3 Avatar State Behaviour

  Application state             Avatar video
  ----------------------------- ------------------------------------------------------
  Patient is speaking           Listening video
  AI response is being played   Speaking video
  AI is processing              Listening video with processing indicator
  Microphone muted              Listening/idle state with muted indicator
  Error                         Show a clear error state without misleading activity

Do not switch to the speaking video merely because a response is being
generated. Switch when the generated audio is actually being played.

Use the same dimensions and visual framing for both video states.

## 8.4 Camera Behaviour

When the user enables the camera:

-   Request browser camera permission.
-   Display a local camera preview.
-   Provide a clear camera-active indicator.
-   Allow the user to disable the camera.
-   Do not transmit video or images without explicit user action and
    consent.

The user must also be able to capture a still image or upload an
existing image.

## 8.5 Subtitles and Conversation Status

Provide a restrained subtitle/transcript area near the doctor video.

It may display: - Patient speech transcription. - AI spoken response
text. - Current interaction status.

Clearly distinguish user-reported information from AI-generated
observations.

------------------------------------------------------------------------

# 9. Profile Design

The profile icon appears in the top-right area of the shared navbar.

Clicking it opens a dropdown or profile panel.

## 9.1 Profile Dropdown

Include: - User avatar. - Full name. - Email. - View/Edit Profile. -
Settings, if implemented. - Logout.

## 9.2 Profile Page or Panel

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

Medical information must be optional and consent-based.

Clearly label which information is user-provided and which information,
if any, has been clinically verified.

------------------------------------------------------------------------

# 10. Authentication Screens

Login and Sign Up must use the same brand identity and component styling
as the authenticated application.

## 10.1 Login

Include: - AAROGYA LINK logo. - Welcome heading. - Email field. -
Password field. - Show/hide password control. - Remember me option. -
Forgot password link. - Primary Login button. - Sign Up link.

## 10.2 Sign Up

Include: - Full name. - Email. - Password. - Confirm password. - Terms
and conditions consent. - Create Account button. - Login link.

Do not request optional medical profile information during registration.

------------------------------------------------------------------------

# 11. Responsive Behaviour

The application must support desktop, tablet and mobile layouts.

## 11.1 Desktop

-   Full shared navbar.
-   Spacious conversation layout.
-   Three-area Virtual Doctor layout.
-   Large doctor video.
-   Controls visible without crowding the video.

## 11.2 Tablet

-   Reduce outer spacing.
-   Keep the doctor video prominent.
-   Adapt the left and right control areas.
-   Preserve usable navigation.

## 11.3 Mobile

-   Compact navigation.
-   No horizontal scrolling.
-   Text composer remains easy to reach.
-   Doctor video takes priority.
-   Doctor selection and controls may move into compact rows or panels.
-   Buttons must be touch-friendly.
-   Camera preview must fit the available width.

Do not simply shrink the desktop layout. Reflow components
appropriately.

------------------------------------------------------------------------

# 12. Interaction and Component States

Every interactive component must define relevant states.

Examples:

-   Default.
-   Hover.
-   Focus.
-   Active/Selected.
-   Disabled.
-   Loading.
-   Error.
-   Success.

Important interactions:

-   Text/Virtual Doctor mode switching.
-   Male/Female avatar switching.
-   Microphone mute/unmute.
-   Camera enable/disable.
-   Image upload and preview.
-   Message submission.
-   Copy response.
-   Profile dropdown open/close.
-   Login and logout.

Controls must perform real actions when implemented. Do not include
decorative buttons that appear functional but do nothing.

------------------------------------------------------------------------

# 13. Accessibility and Usability

-   Use readable text sizes.
-   Maintain sufficient contrast.
-   Provide visible focus indicators.
-   Use labels for icon-only buttons.
-   Provide clear permission explanations for microphone and camera
    access.
-   Use understandable error messages.
-   Avoid relying on color alone to communicate status.
-   Keep language selection easy to find.
-   Make the interface usable for people with limited digital
    experience.

------------------------------------------------------------------------

# 14. Frontend Implementation Guidance

Recommended frontend stack:

-   React.
-   Vite.
-   Tailwind CSS.
-   JavaScript.
-   Lucide icons.

Use reusable components for: - `AppNavbar` - `ModeSwitcher` -
`LanguageSelector` - `ProfileDropdown` - `ChatMessage` -
`ChatComposer` - `ImageUploader` - `MicrophoneButton` -
`DoctorSelector` - `DoctorVideo` - `ConsultationControls` -
`CameraPreview`

Keep components modular and avoid duplicating shared UI.

Do not hardcode fake clinical results or fabricated vital readings into
production components.

Use clearly labelled mock data only during development.

------------------------------------------------------------------------

# 15. Final Design Acceptance Criteria

The design implementation is acceptable when:

1.  Text Mode and Virtual Doctor Mode clearly belong to the same
    application.
2.  Both modes use the same navbar and profile access.
3.  The white-and-green design system is consistent.
4.  Text Mode has a clean chat interface and fixed composer.
5.  AI responses have working copy and playback actions when
    implemented.
6.  Virtual Doctor Mode has a prominent central video.
7.  Male and female avatars can be selected.
8.  Listening and speaking videos switch according to actual interaction
    state.
9.  Microphone, camera and upload controls have clear states.
10. Profile details are accessible and medical fields remain optional.
11. Login and Sign Up match the application design.
12. Desktop and mobile layouts are usable.
13. The interface follows the approved Stitch reference designs.

**Final instruction:** Consistency is more important than adding
decorative features. Preserve the approved AAROGYA LINK visual direction
across every screen and every implementation phase.
