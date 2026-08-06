from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List

from ..config import AppConfig, load_config, save_config, CONFIG_PATH
from ..models import (
    CustomVoiceRequest,
    VoiceDesignRequest,
    VoiceCloneRequest,
    DesignThenCloneRequest,
    GenerateResponse,
    ConfigUpdateRequest,
    SpeakerInfo,
    LanguageInfo,
)
from ..services.tts_service import TTSService
from ..services.model_manager import ModelCache

router = APIRouter(prefix="/api")

CUSTOM_VOICE_SPEAKERS = {
    "Vivian":   ("明亮、略带锋芒的年轻女性声音", "中文"),
    "Serena":   ("温暖、温柔的年轻女性声音", "中文"),
    "Uncle_Fu": ("经验丰富的男性嗓音，音色低沉柔和", "中文"),
    "Dylan":    ("年轻的北京男性嗓音，音色清晰自然", "汉语（北京方言）"),
    "Eric":     ("活泼的成都男声，带着一丝沙哑明亮", "中文（四川话）"),
    "Ryan":     ("充满活力的男性声音，节奏感强劲", "英语"),
    "Aiden":    ("阳光的美国男声，中音清晰", "英语"),
    "Ono_Anna": ("活泼的日本女性声音，音色轻盈灵巧", "日语"),
    "Sohee":    ("温暖的韩国女性声音，情感丰富", "朝鲜语"),
}

LANGUAGE_MAP = {
    "Auto": "自动检测",
    "Chinese": "中文",
    "English": "英语",
    "Japanese": "日语",
    "Korean": "韩语",
    "French": "法语",
    "German": "德语",
    "Spanish": "西班牙语",
    "Italian": "意大利语",
    "Russian": "俄语",
    "Arabic": "阿拉伯语",
}


def get_cfg() -> AppConfig:
    return load_config()


@router.get("/config", response_model=AppConfig)
def get_config(cfg: AppConfig = Depends(get_cfg)):
    return cfg


@router.post("/config", response_model=AppConfig)
def update_config(req: ConfigUpdateRequest, cfg: AppConfig = Depends(get_cfg)):
    data = cfg.to_dict()
    for k, v in req.model_dump(exclude_unset=True).items():
        if v is not None:
            data[k] = v
    new_cfg = AppConfig.from_dict(data)
    save_config(new_cfg)
    return new_cfg


@router.get("/speakers", response_model=List[SpeakerInfo])
def get_speakers():
    return [
        SpeakerInfo(name=k, description=v[0], language=v[1])
        for k, v in CUSTOM_VOICE_SPEAKERS.items()
    ]


@router.get("/languages", response_model=List[LanguageInfo])
def get_languages():
    return [LanguageInfo(key=k, label=v) for k, v in LANGUAGE_MAP.items()]


@router.post("/generate/custom-voice", response_model=GenerateResponse)
def custom_voice(req: CustomVoiceRequest, cfg: AppConfig = Depends(get_cfg)):
    try:
        svc = TTSService(cfg)
        files = svc.generate_custom_voice(
            texts=req.texts,
            speaker=req.speaker,
            language=req.language,
            instruct=req.instruct,
        )
        return GenerateResponse(
            success=True,
            files=[str(f) for f in files],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/voice-design", response_model=GenerateResponse)
def voice_design(req: VoiceDesignRequest, cfg: AppConfig = Depends(get_cfg)):
    try:
        svc = TTSService(cfg)
        files = svc.generate_voice_design(
            texts=req.texts,
            language=req.language,
            instruct=req.instruct,
        )
        return GenerateResponse(
            success=True,
            files=[str(f) for f in files],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/voice-clone", response_model=GenerateResponse)
def voice_clone(req: VoiceCloneRequest, cfg: AppConfig = Depends(get_cfg)):
    try:
        svc = TTSService(cfg)
        files = svc.generate_voice_clone(
            texts=req.texts,
            ref_audio=req.ref_audio,
            ref_text=req.ref_text,
            x_vector_only=req.x_vector_only,
            language=req.language,
        )
        return GenerateResponse(
            success=True,
            files=[str(f) for f in files],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/design-then-clone", response_model=GenerateResponse)
def design_then_clone(req: DesignThenCloneRequest, cfg: AppConfig = Depends(get_cfg)):
    try:
        svc = TTSService(cfg)
        ref_path, files = svc.design_then_clone(
            ref_text=req.ref_text,
            ref_instruct=req.ref_instruct,
            ref_language=req.ref_language,
            target_language=req.target_language,
            target_texts=req.target_texts,
        )
        return GenerateResponse(
            success=True,
            files=[str(f) for f in files],
            message=f"参考音频: {ref_path}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/speaker/audio/{speaker_name}")
def get_speaker_audio(speaker_name: str):
    project_root = CONFIG_PATH.parent.parent
    audio_path = project_root / "speaker" / f"custom_{speaker_name}.wav"
    if not audio_path.exists() or not audio_path.is_file():
        raise HTTPException(status_code=404, detail="试音文件不存在")
    return FileResponse(str(audio_path), media_type="audio/wav")


@router.post("/cache/clear")
def clear_cache():
    ModelCache.clear()
    return {"success": True, "message": "模型缓存已清理"}