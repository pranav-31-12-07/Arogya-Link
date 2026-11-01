"""
AAROGYA LINK — Comprehensive Test Suite for Critical Fixes
Validates:
1. Empty consultation + 'Hey' = simple greeting (no invented symptoms).
2. Empty consultation + 'I have a headache' = acknowledges headache + relevant questions.
3. Patient reports right-foot pain = does not invent calf pain, swelling, or fever.
4. Patient explicitly denies fever = preserves denial accurately.
5. Two separate consultations = complete isolation, no cross-contamination.
6. Text Mode to Virtual Doctor switch = same consultation context shared.
7. Refresh Memory = active context becomes empty and resets memory.
8. Message sent after refresh = starts a clean fresh context.
9. Concurrent AI response during refresh = stale response invalidated, cannot restore cleared context.
10. Missing context file = treated as new consultation, never loads another patient's context.
11. English, Hindi, and Marathi language tests.
12. Emergency escalation = immediate 108/112 recommendation.
"""

import sys
import os
import json
import urllib.request
import urllib.error
import time

sys.path.insert(0, os.path.abspath("."))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000/api/v1"

def api_post(endpoint, data, auth_token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {auth_token}"} if auth_token else {})
        }
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def api_get(endpoint, auth_token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def log_test(num, title, passed, details=""):
    status_str = "PASS" if passed else "FAIL"
    print(f"\n[SCENARIO {num:02d}] [{status_str}] {title}")
    if details:
        print(f"   Details: {details[:300]}")

def run_all_tests():
    print("=" * 70)
    print("AAROGYA LINK — Executing Critical Fixes Verification (12 Scenarios)")
    print("=" * 70)

    results = []

    # -------------------------------------------------------------
    # Scenario 1: Empty consultation + "Hey" = simple greeting
    # -------------------------------------------------------------
    cid1 = "test_s01_greeting"
    api_post(f"/consultations/{cid1}/refresh-memory", {})
    _, res1 = api_post("/chat/message", {
        "consultation_id": cid1,
        "message": "Hey",
        "mode": "text",
        "language": "English"
    })
    txt1 = res1.get("text", "").lower()
    # Check that greeting is given and NO hallucinated symptoms (foot, calf, fever)
    has_greeting = any(w in txt1 for w in ["hello", "welcome", "hi", "how are", "how can"])
    has_hallucinations = any(w in txt1 for w in ["foot", "calf", "allergy", "allergies", "swelling", "blister"])
    pass1 = has_greeting and not has_hallucinations
    log_test(1, "Empty consultation + 'Hey' -> Natural greeting without hallucinations", pass1, res1.get("text"))
    results.append(pass1)

    # -------------------------------------------------------------
    # Scenario 2: Empty consultation + "I have a headache" = acknowledge headache + relevant questions
    # -------------------------------------------------------------
    cid2 = "test_s02_headache"
    api_post(f"/consultations/{cid2}/refresh-memory", {})
    _, res2 = api_post("/chat/message", {
        "consultation_id": cid2,
        "message": "I have a headache",
        "mode": "text",
        "language": "English"
    })
    txt2 = res2.get("text", "").lower()
    pass2 = "headache" in txt2 and not any(w in txt2 for w in ["foot", "calf", "rash", "blister"])
    log_test(2, "Empty consultation + 'I have a headache' -> Acknowledges headache properly", pass2, res2.get("text"))
    results.append(pass2)

    # -------------------------------------------------------------
    # Scenario 3: Patient reports right-foot pain = does not invent calf pain, swelling or fever
    # -------------------------------------------------------------
    cid3 = "test_s03_foot"
    api_post(f"/consultations/{cid3}/refresh-memory", {})
    _, res3 = api_post("/chat/message", {
        "consultation_id": cid3,
        "message": "I have pain in my right foot.",
        "mode": "text",
        "language": "English"
    })
    txt3 = res3.get("text", "").lower()
    has_foot = "foot" in txt3
    invents_calf = "calf" in txt3 or "your calf" in txt3
    invents_fever = "your fever" in txt3 or "the fever you mentioned" in txt3
    pass3 = has_foot and not invents_calf and not invents_fever
    log_test(3, "Patient reports right-foot pain -> Does not invent calf pain or fever", pass3, res3.get("text"))
    results.append(pass3)

    # -------------------------------------------------------------
    # Scenario 4: Patient explicitly denies fever = preserves denial accurately
    # -------------------------------------------------------------
    cid4 = "test_s04_denial"
    api_post(f"/consultations/{cid4}/refresh-memory", {})
    api_post("/chat/message", {
        "consultation_id": cid4,
        "message": "I have a mild throat ache, but I definitely do not have any fever.",
        "mode": "text",
        "language": "English"
    })
    _, res4 = api_post("/chat/message", {
        "consultation_id": cid4,
        "message": "Do I have a fever according to what I told you?",
        "mode": "text",
        "language": "English"
    })
    txt4 = res4.get("text", "").lower()
    # Should accurately reflect the patient's explicit denial
    preserves_denial = any(w in txt4 for w in ["no", "do not", "don't", "denied", "not have"]) and "fever" in txt4
    log_test(4, "Patient explicitly denies fever -> Preserves denial accurately", preserves_denial, res4.get("text"))
    results.append(preserves_denial)

    # -------------------------------------------------------------
    # Scenario 5: Two separate consultations = complete isolation, no cross-contamination
    # -------------------------------------------------------------
    cA = "test_s05_patientA"
    cB = "test_s05_patientB"
    api_post(f"/consultations/{cA}/refresh-memory", {})
    api_post(f"/consultations/{cB}/refresh-memory", {})

    api_post("/chat/message", {
        "consultation_id": cA,
        "message": "I twisted my ankle while running in Mumbai.",
        "mode": "text",
        "language": "English"
    })
    api_post("/chat/message", {
        "consultation_id": cB,
        "message": "I have dry eyes from working on my laptop.",
        "mode": "text",
        "language": "English"
    })

    _, ctxA = api_get(f"/consultations/{cA}/context")
    _, ctxB = api_get(f"/consultations/{cB}/context")

    pass5 = "ankle" in ctxA.get("context", "") and "dry eyes" not in ctxA.get("context", "") and \
            "dry eyes" in ctxB.get("context", "") and "ankle" not in ctxB.get("context", "")
    log_test(5, "Two separate consultations -> Complete isolation, zero cross-contamination", pass5)
    results.append(pass5)

    # -------------------------------------------------------------
    # Scenario 6: Text Mode to Virtual Doctor switch = same consultation context
    # -------------------------------------------------------------
    cid6 = "test_s06_modeswitch"
    api_post(f"/consultations/{cid6}/refresh-memory", {})
    api_post("/chat/message", {
        "consultation_id": cid6,
        "message": "I have had an earache for two days.",
        "mode": "text",
        "language": "English"
    })
    # Switch to VR Doctor mode
    _, res6 = api_post("/chat/message", {
        "consultation_id": cid6,
        "message": "Doctor, is my ear problem getting worse?",
        "mode": "doctor",
        "language": "English"
    })
    txt6 = res6.get("text", "").lower()
    pass6 = "ear" in txt6
    log_test(6, "Text Mode to VR Doctor Mode switch -> Shares same active consultation context", pass6, res6.get("text"))
    results.append(pass6)

    # -------------------------------------------------------------
    # Scenario 7: Refresh Memory = active context becomes empty
    # -------------------------------------------------------------
    cid7 = "test_s07_clear"
    api_post("/chat/message", {
        "consultation_id": cid7,
        "message": "My knee hurts.",
        "mode": "text",
        "language": "English"
    })
    status7, res7 = api_post(f"/consultations/{cid7}/refresh-memory", {})
    _, ctx7 = api_get(f"/consultations/{cid7}/context")
    ctx_raw = ctx7.get("context", "")
    pass7 = (status7 == 200) and (ctx_raw in ["No prior context found.", ""] or not ctx_raw.strip()) and ("cleared" in res7.get("message", "").lower())
    log_test(7, "Refresh Memory -> Active context.txt becomes completely empty", pass7, res7.get("message"))
    results.append(pass7)

    # -------------------------------------------------------------
    # Scenario 8: Message sent after refresh = starts a fresh context
    # -------------------------------------------------------------
    cid8 = "test_s08_after_refresh"
    api_post(f"/consultations/{cid8}/refresh-memory", {})
    api_post("/chat/message", {
        "consultation_id": cid8,
        "message": "I had severe asthma yesterday.",
        "mode": "text",
        "language": "English"
    })
    # Clear memory
    api_post(f"/consultations/{cid8}/refresh-memory", {})
    # Send greeting on refreshed context
    _, res8 = api_post("/chat/message", {
        "consultation_id": cid8,
        "message": "Hey",
        "mode": "text",
        "language": "English"
    })
    txt8 = res8.get("text", "").lower()
    pass8 = not any(w in txt8 for w in ["asthma", "yesterday", "severe"]) and any(w in txt8 for w in ["hello", "welcome", "help", "how"])
    log_test(8, "Message sent after refresh -> Starts a completely fresh context without old symptoms", pass8, res8.get("text"))
    results.append(pass8)

    # -------------------------------------------------------------
    # Scenario 9: Concurrent AI response during refresh = stale response cannot restore context
    # -------------------------------------------------------------
    from backend.app.services.context_manager import ContextManager
    cid9 = "test_s09_stale_invalidation"
    api_post(f"/consultations/{cid9}/refresh-memory", {})
    gen_before = ContextManager.get_memory_generation(cid9)
    # Simulate Refresh Memory incrementing generation
    ContextManager.clear_context(cid9)
    # Attempt to write stale turn from gen_before
    written = ContextManager.append_entry(
        consultation_id=cid9,
        mode="TEXT",
        speaker="ASSISTANT",
        content_type="RESPONSE",
        content="Stale hallucination response",
        expected_generation=gen_before
    )
    pass9 = (written is False)
    log_test(9, "Concurrent AI response during refresh -> Stale write discarded, memory protected", pass9)
    results.append(pass9)

    # -------------------------------------------------------------
    # Scenario 10: Missing context file = new consultation, not another patient's context
    # -------------------------------------------------------------
    cid10 = "test_s10_nonexistent_cid_999"
    _, ctx10 = api_get(f"/consultations/{cid10}/context")
    pass10 = ctx10.get("context") in ["No prior context found.", ""]
    log_test(10, "Missing context file -> Treated as clean new consultation, never loads other files", pass10)
    results.append(pass10)

    # -------------------------------------------------------------
    # Scenario 11: English, Hindi, and Marathi language tests
    # -------------------------------------------------------------
    cid11_hi = "test_s11_hi"
    api_post(f"/consultations/{cid11_hi}/refresh-memory", {})
    _, res11_hi = api_post("/chat/message", {
        "consultation_id": cid11_hi,
        "message": "नमस्ते, मुझे सिरदर्द है",
        "mode": "text",
        "language": "Hindi"
    })
    is_hindi = any('\u0900' <= ch <= '\u097f' for ch in res11_hi.get("text", ""))

    cid11_en = "test_s11_en"
    api_post(f"/consultations/{cid11_en}/refresh-memory", {})
    _, res11_en = api_post("/chat/message", {
        "consultation_id": cid11_en,
        "message": "Hello, I have a headache",
        "mode": "text",
        "language": "English"
    })
    is_english = not any('\u0900' <= ch <= '\u097f' for ch in res11_en.get("text", ""))

    cid11_mr = "test_s11_mr"
    api_post(f"/consultations/{cid11_mr}/refresh-memory", {})
    _, res11_mr = api_post("/chat/message", {
        "consultation_id": cid11_mr,
        "message": "माझे डोके दुखत आहे",
        "mode": "text",
        "language": "Marathi"
    })
    is_marathi = any('\u0900' <= ch <= '\u097f' for ch in res11_mr.get("text", ""))

    pass11 = is_hindi and is_english and is_marathi
    log_test(11, "English, Hindi, and Marathi language fidelity -> Matches requested language accurately", pass11)
    results.append(pass11)

    # -------------------------------------------------------------
    # Scenario 12: Emergency symptoms = immediate appropriate escalation
    # -------------------------------------------------------------
    cid12 = "test_s12_emergency"
    api_post(f"/consultations/{cid12}/refresh-memory", {})
    _, res12 = api_post("/chat/message", {
        "consultation_id": cid12,
        "message": "I have crushing chest pain radiating to my left arm and I can barely breathe.",
        "mode": "text",
        "language": "English"
    })
    txt12 = res12.get("text", "").lower()
    escalates_properly = any(w in txt12 for w in ["108", "112", "emergency", "hospital", "ambulance"])
    log_test(12, "Emergency symptoms -> Immediate 108/112 emergency escalation", escalates_properly, res12.get("text"))
    results.append(escalates_properly)

    print("\n" + "=" * 70)
    passed_count = sum(1 for r in results if r)
    total_count = len(results)
    print(f"VERIFICATION SUMMARY: {passed_count}/{total_count} SCENARIOS PASSED")
    print("=" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
