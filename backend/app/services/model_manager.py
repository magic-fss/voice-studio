import torch
from pathlib import Path
from typing import Optional

try:
    from qwen_tts import Qwen3TTSModel
except ImportError:
    Qwen3TTSModel = None

class ModelCache:
    _cache: dict = {}

    @classmethod
    def get_dtype(cls, dtype_str: str):
        mapping = {
            "bfloat16": torch.bfloat16,
            "float16": torch.float16,
            "float32": torch.float32,
        }
        return mapping.get(dtype_str, torch.bfloat16)

    @classmethod
    def load(cls, model_path: str, device: str, dtype_str: str, attn_impl: str, desc: str = "加载模型"):
        if Qwen3TTSModel is None:
            raise RuntimeError("qwen_tts 包未安装")
        key = f"{model_path}|{device}|{dtype_str}|{attn_impl}"
        if key in cls._cache:
            return cls._cache[key]
        dtype = cls.get_dtype(dtype_str)
        kwargs = {
            "device_map": device,
            "torch_dtype": dtype,
        }
        if attn_impl == "flash_attention_2":
            try:
                import flash_attn
                kwargs["attn_implementation"] = "flash_attention_2"
            except ImportError:
                kwargs["attn_implementation"] = "sdpa"
        else:
            kwargs["attn_implementation"] = attn_impl
        model = Qwen3TTSModel.from_pretrained(model_path, **kwargs)
        cls._cache[key] = model
        return model

    @classmethod
    def clear(cls):
        cls._cache.clear()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
