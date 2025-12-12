import time
from services.audio import AudioService
from services.matcher import MatchService

def main():
    print(" AI Interview Assistant Started! (Press Ctrl+C to stop)")
    print("-------------------------------------------------------")

    # 1. Initialize Services
    ear = AudioService()
    brain = MatchService()

    # 2. Main Loop
    while True:
        # Step A: Listen
        user_text = ear.listen_and_transcribe()

        if user_text:
            # Step B: Think (Match Card)
            print(" Analyzing...")
            matched_card = brain.find_best_match(user_text)

            # Step C: Output Result
            if matched_card:
                print("\n" + "="*40)
                print(f"[OK] MATCH FOUND: {matched_card['topic']}")
                print(f"📝 Content: {matched_card['content'][:100]}...")
                print("="*40 + "\n")
            else:
                print(" No relevant card found.\n")
        
        # Short pause to avoid CPU spamming
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n Exiting...")