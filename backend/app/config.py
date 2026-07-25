import json
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field

CONFIG_PATH = Path(__file__).resolve().parent.parent / ".qwen_tts_web.json"

DEFAULT_CONFIG = {
    "customvoice_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "voicedesign_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-VoiceDesign",
    "clone_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-Base",
    "tokenizer_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-Tokenizer",
    "output_dir": r"E:\个人项目\qwen3-tts\output",
    "device": "cuda:0",
    "dtype": "bfloat16",
    "attn_impl": "sdpa",
}

class AppConfig(BaseModel):
    customvoice_model: str = DEFAULT_CONFIG["customvoice_model"]
    voicedesign_model: str = DEFAULT_CONFIG["voicedesign_model"]
    clone_model: str = DEFAULT_CONFIG["clone_model"]
    tokenizer_model: str = DEFAULT_CONFIG["tokenizer_model"]
    output_dir: str = DEFAULT_CONFIG["output_dir"]
    device: str = DEFAULT_CONFIG["device"]
    dtype: str = DEFAULT_CONFIG["dtype"]
    attn_impl: str = DEFAULT_CONFIG["attn_impl"]

    def to_dict(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_dict(cls, d: dict) -> "AppConfig":
        valid = {k: v for k, v in d.items() if k in cls.model_fields}
        return cls(**valid)


def load_config() -> AppConfig:
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return AppConfig.from_dict(json.load(f))
        except Exception:
            pass
    return AppConfig()


def save_config(cfg: AppConfig) -> None:
    try:
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg.to_dict(), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[WARN] 配置保存失败: {e}")
