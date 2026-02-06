from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
import secrets

from app.core.config import get_db
from app.models.database import LearningResource, ShareLink
from app.schemas.schemas import ShareLinkCreate, ShareLinkResponse, ResourceResponse

router = APIRouter(prefix="/api/shares", tags=["shares"])

@router.post("", response_model=ShareLinkResponse)
async def create_share_link(
    share_data: ShareLinkCreate,
    db: Session = Depends(get_db)
):
    resource = db.query(LearningResource).filter(LearningResource.id == share_data.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    share_token = secrets.token_urlsafe(16)
    # Use timezone-aware UTC time
    expires_at = datetime.now(timezone.utc) + timedelta(hours=share_data.expiry_hours)
    
    share_link = ShareLink(
        resource_id=share_data.resource_id,
        share_token=share_token,
        expiry_hours=share_data.expiry_hours,
        expires_at=expires_at,
        access_count=0
    )
    
    db.add(share_link)
    db.commit()
    db.refresh(share_link)
    
    return share_link

@router.get("/{token}")
async def get_shared_resource(
    token: str,
    db: Session = Depends(get_db)
):
    share_link = db.query(ShareLink).filter(ShareLink.share_token == token).first()
    
    if not share_link:
        raise HTTPException(status_code=404, detail="分享链接不存在或已失效")
    
    # Handle timezone comparison safely
    now = datetime.now(timezone.utc)
    expires_at = share_link.expires_at
    
    # Ensure expires_at is timezone-aware
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if now > expires_at:
        raise HTTPException(status_code=410, detail="分享链接已过期")
    
    resource = db.query(LearningResource).filter(LearningResource.id == share_link.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    share_link.access_count += 1
    db.commit()
    
    return {
        "resource": ResourceResponse.model_validate(resource),
        "disclaimer": "此资料仅供学术探讨，严禁外传",
        "share_info": {
            "expires_at": share_link.expires_at,
            "access_count": share_link.access_count
        }
    }

@router.delete("/{token}")
async def revoke_share_link(
    token: str,
    db: Session = Depends(get_db)
):
    share_link = db.query(ShareLink).filter(ShareLink.share_token == token).first()
    if share_link:
        db.delete(share_link)
        db.commit()
        return {"message": "分享链接已撤销"}
    raise HTTPException(status_code=404, detail="分享链接不存在")

@router.get("", response_model=list[ShareLinkResponse])
async def list_share_links(db: Session = Depends(get_db)):
    return db.query(ShareLink).all()
