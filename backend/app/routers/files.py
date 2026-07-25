import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from ..config import load_config

router = APIRouter(prefix="/api/files")


def get_output_dir() -> Path:
    cfg = load_config()
    p = Path(cfg.output_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    out_dir = get_output_dir() / "uploads"
    out_dir.mkdir(exist_ok=True)
    dest = out_dir / (file.filename or "unnamed")
    content = await file.read()
    dest.write_bytes(content)
    return {"success": True, "path": str(dest), "filename": dest.name}


@router.get("/list")
def list_files():
    out_dir = get_output_dir()
    files = []
    for p in sorted(out_dir.glob("*.wav")):
        stat = p.stat()
        files.append({
            "name": p.name,
            "path": str(p),
            "size": stat.st_size,
            "modified": stat.st_mtime,
        })
    return {"files": files}


@router.get("/download/{filename}")
def download_file(filename: str):
    out_dir = get_output_dir()
    file_path = out_dir / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(str(file_path), media_type="audio/wav", filename=filename)


@router.delete("/delete/{filename}")
def delete_file(filename: str):
    out_dir = get_output_dir()
    file_path = out_dir / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")
    os.remove(file_path)
    return {"success": True}
