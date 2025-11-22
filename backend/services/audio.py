import speech_recognition as sr
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AudioService:
    def __init__(self):
        # Initialize the recognizer
        self.recognizer = sr.Recognizer()
        # Adjust sensitivity (lower = more sensitive)
        self.recognizer.energy_threshold = 300 
        self.recognizer.pause_threshold = 0.8 # Wait 0.8s of silence to consider "done"

    def listen_and_transcribe(self):
        """
        Listens to the microphone and transcribes audio using OpenAI Whisper.
        Returns: String (The transcribed text) or None
        """
        print("🎤 Listening... (Speak now)")
        
        try:
            # 1. Capture Audio from Microphone
            with sr.Microphone() as source:
                # Auto-adjust for ambient noise (takes 1 second)
                # 自动适应环境噪音
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # Listen until silence is detected
                # 开始录音，直到检测到静音
                audio_data = self.recognizer.listen(source, timeout=10, phrase_time_limit=15)
                print("⏳ Transcribing...")

            # 2. Save temporary file (Whisper needs a file)
            # 保存临时 wav 文件
            temp_filename = "temp_audio.wav"
            with open(temp_filename, "wb") as f:
                f.write(audio_data.get_wav_data())

            # 3. Send to OpenAI Whisper API
            # 调用 OpenAI Whisper 模型进行语音转文字
            with open(temp_filename, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file
                )
            
            # 4. Clean up and return
            text = transcript.text
            print(f"🗣️ You said: {text}")
            
            # Delete temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
            return text

        except sr.WaitTimeoutError:
            print("Start listening timed out (No speech detected).")
            return None
        except Exception as e:
            print(f"❌ Audio Error: {e}")
            return None

# Simple test block
if __name__ == "__main__":
    service = AudioService()
    service.listen_and_transcribe()