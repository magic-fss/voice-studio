import os
import base64
import tempfile
import requests
from pathlib import Path
from typing import List, Tuple, Optional
from urllib.parse import urlparse
import soundfile as sf

from .model_manager import ModelCache
from ..config import AppConfig


def is_valid_audio_source(src: str) -> bool:
    if not src:
        return False
    if Path(src).exists():
        return True
    parsed = urlparse(src)
    if parsed.scheme in ("http", "https"):
        return True
    if len(src) > 100 and src.strip().endswith("="):
        return True
    return False


def resolve_audio_source(src: str, temp_dir: Path) -> Path:
    if Path(src).exists():
        return Path(src)
    parsed = urlparse(src)
    if parsed.scheme in ("http", "https"):
        resp = requests.get(src, timeout=30)
        resp.raise_for_status()
        ext = Path(parsed.path).suffix or ".wav"
        out = temp_dir / f"dl_{os.urandom(4).hex()}{ext}"
        out.write_bytes(resp.content)
        return out
    if len(src) > 100 and src.strip().endswith("="):
        data = base64.b64decode(src.strip())
        out = temp_dir / f"b64_{os.urandom(4).hex()}.wav"
        out.write_bytes(data)
        return out
    raise ValueError(f"无法解析音频源: {src}")


def ensure_dir(path: str) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


class TTSService:
    def __init__(self, cfg: AppConfig):
        self.cfg = cfg

    def _get_model(self, model_path: str, desc: str):
        return ModelCache.load(
            model_path,
            self.cfg.device,
            self.cfg.dtype,
            self.cfg.attn_impl,
            desc,
        )

    def generate_custom_voice(
        self,
        texts: List[str],
        speaker: str,
        language: Optional[str] = None,
        instruct: Optional[str] = None,
    ) -> List[Path]:
        model = self._get_model(self.cfg.customvoice_model, "CustomVoice")
        out_dir = ensure_dir(self.cfg.output_dir)
        lang = language if language and language != "Auto" else None
        inst = instruct if instruct else None
        results: List[Path] = []
        if len(texts) == 1:
            wavs, sr = model.generate_custom_voice(
                text=texts[0],
                language=lang,
                speaker=speaker,
                instruct=inst,
            )
            out_path = out_dir / f"custom_{speaker}_0.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
        else:
            wavs, sr = model.generate_custom_voice(
                text=texts,
                language=[lang] * len(texts),
                speaker=[speaker] * len(texts),
                instruct=[inst] * len(texts),
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"custom_{speaker}_batch_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
        return results

    def generate_voice_design(
        self,
        texts: List[str],
        language: str,
        instruct: str,
    ) -> List[Path]:
        model = self._get_model(self.cfg.voicedesign_model, "VoiceDesign")
        out_dir = ensure_dir(self.cfg.output_dir)
        results: List[Path] = []
        if len(texts) == 1:
            wavs, sr = model.generate_voice_design(
                text=texts[0],
                language=language,
                instruct=instruct,
            )
            out_path = out_dir / "voice_design_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
        else:
            wavs, sr = model.generate_voice_design(
                text=texts,
                language=[language] * len(texts),
                instruct=[instruct] * len(texts),
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"voice_design_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
        return results

    def generate_voice_clone(
        self,
        texts: List[str],
        ref_audio: str,
        ref_text: str = "",
        x_vector_only: bool = False,
        language: Optional[str] = None,
    ) -> List[Path]:
        model = self._get_model(self.cfg.clone_model, "VoiceClone")
        out_dir = ensure_dir(self.cfg.output_dir)
        temp_dir = ensure_dir(Path(self.cfg.output_dir) / ".temp")
        audio_path = resolve_audio_source(ref_audio, temp_dir)
        prompt_items = model.create_voice_clone_prompt(
            ref_audio=str(audio_path),
            ref_text=ref_text if not x_vector_only else "",
            x_vector_only_mode=x_vector_only,
        )
        lang = language if language and language != "Auto" else None
        results: List[Path] = []
        if len(texts) == 1:
            wavs, sr = model.generate_voice_clone(
                text=texts[0],
                language=lang,
                voice_clone_prompt=prompt_items,
            )
            out_path = out_dir / "voice_clone_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
        else:
            wavs, sr = model.generate_voice_clone(
                text=texts,
                language=[lang] * len(texts),
                voice_clone_prompt=prompt_items,
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"voice_clone_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
        return results

    def design_then_clone(
        self,
        ref_text: str,
        ref_instruct: str,
        ref_language: str,
        target_language: str,
        target_texts: List[str],
    ) -> Tuple[Path, List[Path]]:
        design_model = self._get_model(self.cfg.voicedesign_model, "VoiceDesign")
        clone_model = self._get_model(self.cfg.clone_model, "VoiceClone")
        out_dir = ensure_dir(self.cfg.output_dir)
        ref_path = out_dir / "voice_design_reference.wav"
        ref_wavs, sr = design_model.generate_voice_design(
            text=ref_text,
            language=ref_language,
            instruct=ref_instruct,
        )
        sf.write(str(ref_path), ref_wavs[0], sr)
        prompt_items = clone_model.create_voice_clone_prompt(
            ref_audio=str(ref_path),
            ref_text=ref_text,
        )
        lang = target_language if target_language and target_language != "Auto" else None
        results: List[Path] = []
        if len(target_texts) == 1:
            wavs, sr = clone_model.generate_voice_clone(
                text=target_texts[0],
                language=lang,
                voice_clone_prompt=prompt_items,
            )
            out_path = out_dir / "design_clone_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
        else:
            wavs, sr = clone_model.generate_voice_clone(
                text=target_texts,
                language=[lang] * len(target_texts),
                voice_clone_prompt=prompt_items,
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"design_clone_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
        return ref_path, results
