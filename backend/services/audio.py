import speech_recognition as sr
import os
import sys
import io
import re
import requests
from dotenv import load_dotenv

# 全局 state 引用（与 matcher.py 相同的机制）
_global_state = None

def set_audio_global_state(state):
    """从 main.py 设置全局 state 引用"""
    global _global_state
    _global_state = state

def get_base_path():
    """获取程序运行的基础路径，支持开发和打包环境"""
    if getattr(sys, 'frozen', False):
        # 打包后的 exe 运行时
        return os.path.dirname(sys.executable)
    else:
        # 开发环境
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 加载 .env 文件（支持打包后的路径）
env_path = os.path.join(get_base_path(), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded .env from: {env_path}")
else:
    load_dotenv()  # 尝试从默认位置加载
    print(f"⚠️ .env not found at {env_path}, using default")

# 获取 Render 云端 URL
RENDER_URL = os.getenv("RENDER_URL", "https://recallai-d9sc.onrender.com")

class AudioService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
        # --- 你的稳健设置 ---
        self.recognizer.pause_threshold = 0.8
        self.recognizer.energy_threshold = 300 
        self.recognizer.dynamic_energy_threshold = True 
        
        # --- ✨ 新增：初始化时自动查找设备 ---
        self.target_device_index = self._find_device_index()
        
        # --- 🌐 云端化：用户 Token (需要从外部设置) ---
        self.user_token = None
    
    def set_token(self, token: str):
        """设置用户 Token，用于云端 API 鉴权"""
        self.user_token = token
    
    def reload_device(self):
        """重新读取设备配置（用于切换麦克风/CABLE）"""
        print("🔄 Reloading audio device configuration...")
        self.target_device_index = self._find_device_index()
        device_status = f"Index {self.target_device_index}" if self.target_device_index is not None else "Default Mic"
        print(f"✅ Audio device updated to: [{device_status}]")
        
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

            # 🌐 使用云端 API (Render) 进行转录
            if not self.user_token:
                print("❌ No user token set! Please call set_token() first")
                return None
            
            try:
                import time
                start_time = time.time()
                
                # 准备文件和请求头
                files = {'file': ('audio.wav', audio_file, 'audio/wav')}
                headers = {'Authorization': f'Bearer {self.user_token}'}
                
                print(f"📤 Sending audio to cloud API ({RENDER_URL})...")
                
                # 发送请求到 Render 云端 (增加超时时间到60秒，适应国际网络延迟)
                response = requests.post(
                    f"{RENDER_URL}/v1/proxy/transcribe",
                    files=files,
                    headers=headers,
                    timeout=60  # ✨ 增加到60秒，适应中国等地区的网络延迟
                )
                
                elapsed = time.time() - start_time
                print(f"⏱️ Cloud API response time: {elapsed:.2f}s")
                
                if response.status_code != 200:
                    if _global_state is not None:
                        _global_state.cloud_api_error = {"status": response.status_code, "message": response.text}
                    return None
                
                result = response.json()
                text = result.get("text", "").strip()
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Request Error: {e}")
                return None
            except Exception as e:
                print(f"❌ Unexpected Error: {e}")
                return None

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