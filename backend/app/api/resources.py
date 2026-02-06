from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import os
import io

from app.core.config import get_db
from app.core.privacy import PrivacyDetector
from app.models.database import LearningResource, MediaType
from app.schemas.schemas import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ShareLinkCreate,
    ShareLinkResponse,
    PrivacyAlert,
)

router = APIRouter(prefix="/api/resources", tags=["resources"])

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=ResourceResponse)
async def create_resource(
    title: str = Form(...),
    category: str = Form(...),
    media_type: MediaType = Form(...),
    key_points: Optional[str] = Form(None),
    patient_anonymized: bool = Form(False),
    transcript: Optional[str] = Form(""),
    duration: Optional[int] = Form(None),
    file: UploadFile = File(...),
    compress: Optional[str] = Form("false"),
    db: Session = Depends(get_db)
):
    print(f"Received upload request: title={title}, category={category}, media_type={media_type}")
    risk_level, alerts = PrivacyDetector.check_title(title)
    
    if risk_level == PrivacyDetector.RISK_HIGH:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "检测到可能的患者隐私信息，请检查并脱敏后再上传",
                "alerts": alerts,
                "suggestion": PrivacyDetector.suggest_anonymized_title(title)
            }
        )

    # Read file content into memory
    file_content = await file.read()
    file_size = len(file_content)
    
    print(f"DEBUG: Saving file to DB with pseudo-path")
    # Store pseudo-path or empty for compatibility
    file_path = f"db://{secrets.token_hex(8)}_{file.filename}"

    # Optional server-side compression for video
    def _to_bool(val: Optional[str]) -> bool:
        if val is None:
            return False
        return str(val).strip().lower() in {"true", "1", "on", "yes"}
    compress_flag = _to_bool(compress)

    if compress_flag and media_type == MediaType.VIDEO:
        try:
            import shutil, tempfile, subprocess
            if shutil.which("ffmpeg") is None:
                print("FFmpeg not found, skipping server-side compression")
            else:
                with tempfile.TemporaryDirectory() as tmpdir:
                    in_path = os.path.join(tmpdir, "input.mp4")
                    out_path = os.path.join(tmpdir, "output.mp4")
                    with open(in_path, "wb") as f_in:
                        f_in.write(file_content)
                    # Transcode: 720p, H.264 + AAC, ~2Mbps
                    cmd = [
                        "ffmpeg", "-y", "-i", in_path,
                        "-vf", "scale=-2:720",
                        "-c:v", "libx264", "-preset", "veryfast", "-b:v", "2000k",
                        "-c:a", "aac", "-b:a", "128k",
                        out_path
                    ]
                    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    with open(out_path, "rb") as f_out:
                        file_content = f_out.read()
                        file_size = len(file_content)
        except Exception as e:
            print(f"Compression failed: {e}")
    
    resource = LearningResource(
        title=title,
        category=category,
        media_type=media_type,
        file_url=file_path,
        size=file_size,
        duration=duration,
        key_points=key_points,
        patient_anonymized=patient_anonymized,
        transcript=transcript or "",
        content=file_content # Save to DB
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    
    return resource

@router.get("/{resource_id}/content")
async def get_resource_content(
    resource_id: int,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Determine Content-Type
    content_type = "application/octet-stream"
    if resource.media_type == MediaType.IMAGE:
        content_type = "image/jpeg"
    elif resource.media_type == MediaType.VIDEO:
        content_type = "video/mp4"
    elif resource.media_type == MediaType.AUDIO:
        content_type = "audio/mpeg"
    elif resource.media_type == MediaType.DOC:
        content_type = "application/pdf"

    if not resource.content:
        # Fallback for old files on disk?
        # If file_url starts with /uploads, try to read from disk
        if resource.file_url and not resource.file_url.startswith("db://"):
             # It's a legacy file path
             file_path = os.path.join("backend", resource.file_url.lstrip("/"))
             if os.path.exists(file_path):
                 def iterfile():
                     with open(file_path, mode="rb") as file_like:
                         yield from file_like
                 return StreamingResponse(iterfile(), media_type=content_type)
        
        raise HTTPException(status_code=404, detail="File content not found in DB")
    
    # Serve from DB content with Range support
    file_size = len(resource.content)
    
    if range:
        try:
            start_str, end_str = range.replace("bytes=", "").split("-")
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
            
            if start >= file_size:
                 return Response(status_code=416) # Range Not Satisfiable
                 
            chunk_size = end - start + 1
            # Slice the bytes
            data = resource.content[start:end+1]
            
            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
            }
            
            return Response(
                content=data,
                status_code=206,
                headers=headers,
                media_type=content_type
            )
        except ValueError:
            pass # Fallback to full content if range parsing fails

    return Response(
        content=resource.content, 
        media_type=content_type,
        headers={"Accept-Ranges": "bytes"}
    )

@router.get("", response_model=List[ResourceResponse])
async def get_resources(
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    timeline_mode: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(LearningResource)
    
    if category:
        query = query.filter(LearningResource.category == category)
    
    if start_date:
        query = query.filter(LearningResource.created_at >= start_date)
    
    if end_date:
        query = query.filter(LearningResource.created_at <= end_date)
    
    resources = query.order_by(LearningResource.created_at.desc()).all()
    
    return resources

@router.get("/timeline")
async def get_timeline(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func, extract, cast, Date
    
    # Use cast to Date for cross-database compatibility (SQLite/PostgreSQL)
    date_col = cast(LearningResource.created_at, Date)
    
    query = db.query(
        date_col.label('date'),
        func.count().label('count')
    ).group_by(
        date_col
    ).order_by('date')
    
    if year:
        query = query.filter(extract('year', LearningResource.created_at) == year)
    if month:
        query = query.filter(extract('month', LearningResource.created_at) == month)
    
    timeline = query.all()
    
    return [{"date": row.date, "count": row.count} for row in timeline]

@router.get("/timeline/{date}")
async def get_resources_by_date(
    date: str,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    target_date = datetime.strptime(date, '%Y-%m-%d')
    next_date = target_date + timedelta(days=1)
    
    resources = db.query(LearningResource).filter(
        LearningResource.created_at >= target_date,
        LearningResource.created_at < next_date
    ).order_by(LearningResource.created_at.desc()).all()
    
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db)
):
    resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    update_data: ResourceUpdate,
    db: Session = Depends(get_db)
):
    resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    if update_data.title:
        risk_level, alerts = PrivacyDetector.check_title(update_data.title)
        if risk_level == PrivacyDetector.RISK_HIGH:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "检测到可能的患者隐私信息",
                    "alerts": alerts,
                    "suggestion": PrivacyDetector.suggest_anonymized_title(update_data.title)
                }
            )
        
        resource.title = update_data.title
    
    if update_data.category:
        resource.category = update_data.category
    
    if update_data.key_points is not None:
        resource.key_points = update_data.key_points
    
    if update_data.patient_anonymized is not None:
        resource.patient_anonymized = update_data.patient_anonymized
    
    if update_data.transcript is not None:
        resource.transcript = update_data.transcript
    
    db.commit()
    db.refresh(resource)
    
    return resource

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db)
):
    resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    db.delete(resource)
    db.commit()
    
    return {"message": "删除成功"}

@router.post("/check-privacy")
async def check_privacy(
    title: str,
    content: Optional[str] = None
) -> PrivacyAlert:
    title_risk, title_alerts = PrivacyDetector.check_title(title)
    
    content_risk = PrivacyDetector.RISK_LOW
    content_alerts = []
    if content:
        content_risk, content_alerts = PrivacyDetector.check_content(content)
    
    all_alerts = title_alerts + content_alerts
    
    if title_risk == PrivacyDetector.RISK_HIGH or content_risk == PrivacyDetector.RISK_HIGH:
        risk_level = "high"
    elif title_risk == PrivacyDetector.RISK_MEDIUM or content_risk == PrivacyDetector.RISK_MEDIUM:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return PrivacyAlert(
        contains_patient_name=risk_level != PrivacyDetector.RISK_LOW,
        alert_message="请检查以下隐私风险" if all_alerts else "未检测到明显隐私风险",
        suggestions=all_alerts
    )
