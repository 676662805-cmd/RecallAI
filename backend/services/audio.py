import speech_recognition as sr
import os
import io
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AudioService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
        # --- 回滚关键点 ---
        # 调回 0.8 或 1.0。这是最稳的数值。
        # 意味着：用户说完话后，必须停顿 0.8秒，系统才认为“这句说完了”。
        # 虽然慢一点，但绝对不会切断你的话。
        self.recognizer.pause_threshold = 0.8
        
        self.recognizer.energy_threshold = 300 
        self.recognizer.dynamic_energy_threshold = True # 开启动态调整
        
    def listen_and_transcribe(self):
        print("🎤 Listening... (Speak normally)")
        
        try:
            with sr.Microphone() as source:
                # 稍微给一点时间适应底噪，防误触
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # 这里的 timeout 是指“如果几秒没人说话就退出”，phrase_time_limit 是“单句最长录多久”
                audio_data = self.recognizer.listen(source, timeout=5, phrase_time_limit=20)
                print("⏳ Transcribing...")

            # 内存直传 (保留这个优化，因为它不影响准确率，只提速)
            wav_bytes = audio_data.get_wav_data()
            audio_file = io.BytesIO(wav_bytes)
            audio_file.name = "audio.wav" 

            # 强制英文 (保留这个优化，解决韩语问题)
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                language="en" 
            )
            
            text = transcript.text
            print(f"🗣️ You said: {text}")
            return text

        except sr.WaitTimeoutError:
            return None
        except Exception as e:
            print(f"❌ Audio Error: {e}")
            return None