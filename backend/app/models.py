from typing import List, Optional
from pydantic import BaseModel

class CustomVoiceRequest(BaseModel):
    speaker: str
    language: str = "Auto"
    instruct: str = ""
    texts: List[str]

class VoiceDesignRequest(BaseModel):
    language: str = "English"
    instruct: str = ""
    texts: List[str]

class VoiceCloneRequest(BaseModel):
    ref_audio: str
    ref_text: str = ""
    x_vector_only: bool = False
    language: str = "Auto"
    texts: List[str]

class DesignThenCloneRequest(BaseModel):
    ref_text: str
    ref_instruct: str = ""
    ref_language: str = "English"
    target_language: str = "Auto"
    target_texts: List[str]

class GenerateResponse(BaseModel):
    success: bool
    files: List[str]
    message: str = ""

class ConfigUpdateRequest(BaseModel):
    customvoice_model: Optional[str] = None
    voicedesign_model: Optional[str] = None
    clone_model: Optional[str] = None
    tokenizer_model: Optional[str] = None
    output_dir: Optional[str] = None
    device: Optional[str] = None
    dtype: Optional[str] = None
    attn_impl: Optional[str] = None

class SpeakerInfo(BaseModel):
    name: str
    description: str
    language: str

class LanguageInfo(BaseModel):
    key: str
    label: str
