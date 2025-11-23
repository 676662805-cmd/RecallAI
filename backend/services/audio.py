import speech_recognition as sr
import os
import io
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class AudioService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
        # 稳健设置
        self.recognizer.pause_threshold = 0.8
        self.recognizer.energy_threshold = 300 
        self.recognizer.dynamic_energy_threshold = True 
        
    def listen_and_transcribe(self):
        print("🎤 Listening... (Using Groq Turbo)")
        
        try:
            with sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                # 录音参数
                audio_data = self.recognizer.listen(source, timeout=5, phrase_time_limit=20)
                print("⏳ Transcribing...")

            wav_bytes = audio_data.get_wav_data()
            audio_file = io.BytesIO(wav_bytes)
            audio_file.name = "audio.wav" 

            # --- 关键修改：使用 Turbo 模型 ---
            transcript = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",  # <--- 已更新为最新可用模型
                file=audio_file,
                response_format="json",
                language="en" # 依然强制英文，防止幻觉
            )
            
            text = transcript.text
            print(f"🗣️ You said: {text}")
            return text

        except sr.WaitTimeoutError:
            return None
        except Exception as e:
            print(f"❌ Audio Error: {e}")
            return None