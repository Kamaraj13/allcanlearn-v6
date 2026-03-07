# piper_tts_client.py - Enhanced TTS using Piper for high-quality voice synthesis

import subprocess
import os
import time
import platform

def is_macos():
    return platform.system() == "Darwin"

async def speak_text(text, accent, folder="tts_output"):
    """Generate speech audio file using Piper TTS for high quality"""
    os.makedirs(folder, exist_ok=True)
    
    timestamp = int(time.time() * 1000)
    wav_filename = f"{timestamp}.wav"
    wav_filepath = os.path.join(folder, wav_filename)
    
    if is_macos():
        # macOS: fallback to original method
        from app.tts_client import speak_text as original_speak
        return await original_speak(text, accent, folder)
    else:
        # Linux: Use Piper TTS for high quality
        piper_path = os.path.expanduser("~/piper/piper")
        model_path = os.path.expanduser("~/piper/en_US-lessac-medium.onnx")
        
        if not os.path.exists(piper_path):
            # Fallback to espeak-ng if Piper not available
            from app.tts_client import speak_text as fallback_speak
            return await fallback_speak(text, accent, folder)
        
        try:
            # Use Piper for high-quality TTS with echo command
            cmd = f"echo \"{text}\" | {piper_path} --model {model_path} --output_file {wav_filepath}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and os.path.exists(wav_filepath):
                return wav_filename
            else:
                print(f"Piper TTS error: {result.stderr}")
                # Fallback to espeak-ng
                from app.tts_client import speak_text as fallback_speak
                return await fallback_speak(text, accent, folder)
                
        except Exception as e:
            print(f"Piper TTS failed: {e}")
            # Fallback to espeak-ng
            from app.tts_client import speak_text as fallback_speak
            return await fallback_speak(text, accent, folder)
