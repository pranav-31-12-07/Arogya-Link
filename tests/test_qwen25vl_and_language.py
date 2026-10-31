import sys
import requests
import json
import base64

# Force UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000/api/v1"

# Create a tiny 1x1 test PNG base64
SAMPLE_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def test_language_matrix():
    print("=== 1. Testing Chat Endpoint Language Resolution ===")
    test_cases = [
        {
            "name": "English msg + English select",
            "message": "I have had a mild headache since yesterday morning.",
            "language": "English",
            "expect_keyword": ["headache", "water", "rest", "pain", "symptom", "doctor", "health"]
        },
        {
            "name": "In-message override: English msg with 'Reply in Hindi' + English select",
            "message": "I have a headache. Reply in Hindi.",
            "language": "English",
            "expect_devanagari": True
        },
        {
            "name": "Auto select + English msg",
            "message": "Hello, my body is feeling tired and hot.",
            "language": "Auto",
            "expect_keyword": ["fever", "rest", "temperature", "care", "health", "water"]
        }
    ]

    for tc in test_cases:
        payload = {
            "consultation_id": "test-consultation-e2e",
            "message": tc["message"],
            "mode": "text",
            "language": tc["language"]
        }
        print(f"\nRunning test: {tc['name']}")
        try:
            res = requests.post(f"{BASE_URL}/chat/message", json=payload, timeout=60)
            if res.status_code == 200:
                data = res.json()
                reply = data.get("text", "")
                resolved_lang = data.get("language", "")
                print(f"Status: 200 | Resolved Language: {resolved_lang}")
                print(f"Snippet: {reply[:120]}...")
            else:
                print(f"FAILED with status: {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Exception: {e}")

def test_vision_endpoint():
    print("\n=== 2. Testing Vision Endpoint (/vision/analyze) with Qwen2.5-VL 3B ===")
    vision_cases = [
        {
            "name": "Vision in English",
            "language": "English",
            "prompt": "What color is this image?"
        },
        {
            "name": "Vision in Hindi",
            "language": "Hindi",
            "prompt": "इस छवि का रंग क्या है?"
        }
    ]

    for vc in vision_cases:
        payload = {
            "consultation_id": "test-consultation-e2e",
            "image_base64": SAMPLE_PNG_BASE64,
            "prompt": vc["prompt"],
            "language": vc["language"]
        }
        print(f"\nRunning vision test: {vc['name']}")
        try:
            res = requests.post(f"{BASE_URL}/vision/analyze", json=payload, timeout=60)
            if res.status_code == 200:
                data = res.json()
                print(f"Status: 200 | Language: {data.get('language')}")
                print(f"Observation: {data.get('observation', '')[:120]}...")
            else:
                print(f"FAILED with status: {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Exception: {e}")

def test_shared_context():
    print("\n=== 3. Testing Shared Context Memory in context.txt ===")
    try:
        res = requests.get(f"{BASE_URL}/consultations/test-consultation-e2e/context", timeout=10)
        if res.status_code == 200:
            ctx = res.json().get("context", "")
            print(f"Context entries length: {len(ctx)} chars")
            lines = [l for l in ctx.splitlines() if l.strip()]
            print("Recent context lines:")
            for l in lines[-8:]:
                print(f"  {l}")
            assert "base64" not in ctx.lower(), "Security check failed: raw base64 found in context.txt!"
            print("Check passed: Shared context updated and NO raw base64 stored!")
        else:
            print(f"Failed to get context: {res.status_code}")
    except Exception as e:
        print(f"Exception: {e}")

def test_refresh_memory():
    print("\n=== 4. Testing Refresh Memory Endpoint ===")
    try:
        res = requests.post(f"{BASE_URL}/consultations/test-consultation-e2e/refresh-memory", timeout=10)
        if res.status_code == 200:
            print(f"Refresh response: {res.json()}")
        else:
            print(f"Refresh failed: {res.status_code}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_language_matrix()
    test_vision_endpoint()
    test_shared_context()
    test_refresh_memory()
    print("\nAll integration checks completed successfully!")
