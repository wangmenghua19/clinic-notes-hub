from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SQLEnum, func, LargeBinary
from sqlalchemy.orm import declarative_base
import enum

Base = declarative_base()

class ResourceCategory(str, enum.Enum):
    CLINICAL_TEACHING = "临床带教"
    DOCTOR_PATIENT_COMMUNICATION = "医患沟通"
    PATHOLOGY_PHOTO = "病理照片"
    LITERATURE_NOTE = "文献笔记"

class MediaType(str, enum.Enum):
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"
    DOC = "DOC"

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    # type can be 'group' or 'tag' to match frontend structure
    type = Column(String(20), default="tag") 

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    # Changed from Enum to String to support dynamic categories
    category = Column(String(50), nullable=False)
    media_type = Column(SQLEnum(MediaType), nullable=False)
    file_url = Column(String(500), nullable=False)
    size = Column(Integer, default=0)
    duration = Column(Integer, nullable=True) # Seconds
    key_points = Column(Text, nullable=True)
    patient_anonymized = Column(Boolean, default=False)
    transcript = Column(Text, nullable=True)
    content = Column(LargeBinary, nullable=True) # Binary content of the file
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, nullable=False, index=True)
    share_token = Column(String(64), unique=True, nullable=False, index=True)
    expiry_hours = Column(Integer, default=24)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    access_count = Column(Integer, default=0)
