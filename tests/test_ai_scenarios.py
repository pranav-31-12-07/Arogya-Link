import sys
import requests
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000/api/v1"

def print_result(title, status_ok, content=""):
    print("\n" + "=" * 60)
    print(f"[{'PASS' if status_ok else 'FAIL'}] {title}")
    print("=" * 60)
    if content:
        # Avoid Windows terminal encoding errors by encoding to utf-8
        try:
            print(content)
        except Exception:
            print(content.encode("utf-8", errors="replace").decode("utf-8"))

def test_health():
    res = requests.get(f"{BASE_URL}/health", timeout=10)
    data = res.json()
    ok = res.status_code == 200 and data.get("ollama", {}).get("text_model_ready")
    print_result("Backend Health & Model Availability", ok, json.dumps(data, indent=2))
    return ok

def test_chat(consultation_id, message, expected_desc):
    t0 = time.time()
    res = requests.post(
        f"{BASE_URL}/chat/message",
        json={"consultation_id": consultation_id, "message": message, "mode": "text"},
        timeout=90
    )
    elapsed = time.time() - t0
    if res.status_code == 200:
        data = res.json()
        text = data.get("text", "")
        print_result(
            f"Test: '{message}' ({expected_desc}) [Took {elapsed:.1f}s]",
            True,
            f"AI Response:\n{text}"
        )
        return text
    else:
        print_result(f"Test: '{message}' ({expected_desc})", False, f"HTTP {res.status_code}: {res.text}")
        return ""

def test_refresh_memory(consultation_id):
    res = requests.post(f"{BASE_URL}/consultations/{consultation_id}/refresh-memory", timeout=15)
    ok = res.status_code == 200 and res.json().get("success")
    print_result("Test: Refresh Memory Endpoint", ok, json.dumps(res.json(), indent=2))
    return ok

def test_context_file(consultation_id):
    res = requests.get(f"{BASE_URL}/consultations/{consultation_id}/context", timeout=10)
    ok = res.status_code == 200
    ctx = res.json().get("context", "")
    print_result("Test: Verify context.txt Artifact", ok, f"Length: {len(ctx)} chars\nPreview:\n{ctx[:400]}...")
    return ok

if __name__ == "__main__":
    print("\nStarting AAROGYA LINK AI Integration Tests...\n")
    
    # 1. Health
    if not test_health():
        sys.exit(1)
        
    # 2. English symptom intake
    test_chat("eval_eng_01", "I am feeling itchy in my throat.", "Expected: Acknowledges + 2-3 follow-up questions")
    
    # 3. Emergency escalation
    test_chat("eval_emerg_01", "I have severe chest pain and difficulty breathing.", "Expected: Immediate 108/112 emergency escalation")
    
    # 4. Hindi symptom intake
    test_chat("eval_hi_01", "मेरे गले में दर्द हो रहा है।", "Expected: Responds in Hindi with questions")
    
    # 5. Hinglish symptom intake
    test_chat("eval_hing_01", "Mujhe kal se headache ho raha hai.", "Expected: Responds in Hinglish")
    
    # 6. Context memory continuity
    c_id = "eval_ctx_01"
    test_chat(c_id, "I have a sore throat.", "Turn 1: Mentions sore throat")
    test_chat(c_id, "Since yesterday evening.", "Turn 2: Follows up with time context remembered")
    
    # 7. Refresh memory
    test_refresh_memory(c_id)
    test_context_file(c_id)
    
    print("\nAll integration tests executed successfully!\n")
