import speech_recognition as sr
import os
import io
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("⚠️ GROQ_API_KEY not set in environment. AI features will be disabled.")
    client = None
else:
    client = Groq(api_key=api_key)

class AudioService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
        # --- 你的稳健设置 ---
        self.recognizer.pause_threshold = 0.8
        self.recognizer.energy_threshold = 300 
        self.recognizer.dynamic_energy_threshold = True 
        
        # --- ✨ 新增：初始化时自动查找设备 ---
        self.target_device_index = self._find_device_index()
        
    def _find_device_index(self):
        """
        根据 .env 中的 MIC_DEVICE_NAME 查找设备索引
        """
        target_name = os.getenv("MIC_DEVICE_NAME", "Default")
        
        # 如果配置是 Default 或空，使用系统默认
        if not target_name or target_name.lower() == "default":
            print("🎧 Using Default Microphone (System Default)")
            return None
            
        print(f"🔍 Searching for audio device containing: '{target_name}'...")
        
        # 遍历设备列表进行模糊匹配
        try:
            mics = sr.Microphone.list_microphone_names()
            for i, name in enumerate(mics):
                if target_name.lower() in name.lower():
                    print(f"✅ Found Target Device: [Index {i}] {name}")
                    return i
        except Exception as e:
            print(f"⚠️ Error listing microphones: {e}")

        print(f"⚠️ Device '{target_name}' not found! Falling back to Default Mic.")
        return None

    def listen_and_transcribe(self):
        # 显示当前正在监听哪个设备，方便调试
        device_status = f"Index {self.target_device_index}" if self.target_device_index is not None else "Default Mic"
        print(f"🎤 Listening on [{device_status}]... (Using Groq Turbo)")
        
        try:
            # 关键修改：传入 device_index
            with sr.Microphone(device_index=self.target_device_index) as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                # 录音参数
                audio_data = self.recognizer.listen(source, timeout=5, phrase_time_limit=20)
                print("⏳ Transcribing...")

            wav_bytes = audio_data.get_wav_data()
            audio_file = io.BytesIO(wav_bytes)
            audio_file.name = "audio.wav" 

            # 使用 Turbo 模型 + 强制英文
            if client is None:
                print("⚠️ Groq client not available, cannot transcribe")
                return None
                
            transcript = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo", 
                file=audio_file,
                response_format="json",
                language="en" 
            )
            
            text = transcript.text.strip()

            # --- 增强的垃圾词过滤 ---
            # 1. 完全匹配过滤（忽略大小写和标点）
            hallucinations = [
                "thank you", "thanks", "you", "yeah", "yes", "okay", "ok", 
                "um", "uh", "hmm", "mhm", "ah", "oh", "well"
            ]
            
            # 清理后的文本（去除标点符号）
            text_clean = re.sub(r'[^\w\s]', '', text.lower())
            
            # 2. 如果整句话就是垃圾词
            if text_clean in hallucinations:
                print(f"👻 Filtered Hallucination (exact): '{text}'")
                return None
            
            # 3. 如果句子很短（<8个字符）且包含thank/you等关键词
            if len(text) < 8 and any(word in text_clean for word in ["thank", "you", "thanks"]):
                print(f"👻 Filtered Hallucination (short): '{text}'")
                return None
            
            # 4. 如果只有1-2个单词且是常见礼貌用语
            words = text_clean.split()
            if len(words) <= 2 and all(w in hallucinations for w in words):
                print(f"👻 Filtered Hallucination (polite): '{text}'")
                return None

            print(f"🗣️ You said: {text}")
            return text

        except sr.WaitTimeoutError:
            return None
        except Exception as e:
            print(f"❌ Audio Error: {e}")
            return None