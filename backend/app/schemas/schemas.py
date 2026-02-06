from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ResourceCategory(str, Enum):
    CLINICAL_TEACHING = "临床带教"
    DOCTOR_PATIENT_COMMUNICATION = "医患沟通"
    PATHOLOGY_PHOTO = "病理照片"
    LITERATURE_NOTE = "文献笔记"

class MediaType(str, Enum):
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"
    DOC = "DOC"

class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str
    media_type: MediaType
    key_points: Optional[str] = None
    patient_anonymized: bool = False
    transcript: Optional[str] = None

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    key_points: Optional[str] = None
    patient_anonymized: Optional[bool] = None
    transcript: Optional[str] = None

class ResourceResponse(BaseModel):
    id: int
    title: str
    category: str
    media_type: MediaType
    file_url: str
    size: int = 0
    duration: Optional[int] = None
    key_points: Optional[str]
    patient_anonymized: bool
    transcript: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    @model_validator(mode='after')
    def transform_file_url(self):
        if self.file_url and self.file_url.startswith("db://"):
            self.file_url = f"/api/resources/{self.id}/content"
        return self

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    type: str = "tag"

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True

class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class ShareLinkCreate(BaseModel):
    resource_id: int
    expiry_hours: float = Field(default=24, ge=0.1)

class ShareLinkResponse(BaseModel):
    id: int
    resource_id: int
    share_token: str
    expiry_hours: int
    created_at: datetime
    expires_at: datetime
    access_count: int = 0

class PrivacyAlert(BaseModel):
    contains_patient_name: bool
    alert_message: str
    suggestions: List[str]

class TimelineEntry(BaseModel):
    date: str
    resources: List[ResourceResponse]
