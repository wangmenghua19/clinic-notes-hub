import sys
import os
from datetime import datetime, timedelta
import random

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import SessionLocal, init_db
from app.models.database import LearningResource, ResourceCategory, MediaType

def create_mock_data():
    init_db()
    db = SessionLocal()

    # Clear existing data
    db.query(LearningResource).delete()
    db.commit()

    mock_data = [
        {
            "title": "关于拔牙风险沟通的录音",
            "category": ResourceCategory.DOCTOR_PATIENT_COMMUNICATION,
            "media_type": MediaType.AUDIO,
            "file_url": "/uploads/mock_audio_01.mp3",
            "key_points": "重点强调了神经损伤的风险，患者表示理解。",
            "patient_anonymized": True,
            "transcript": "医生：我们现在要进行的是...（此处为自动转录文本）",
            "created_at": datetime.now() - timedelta(days=1)
        },
        {
            "title": "复杂根管治疗案例分析",
            "category": ResourceCategory.CLINICAL_TEACHING,
            "media_type": MediaType.DOC,
            "file_url": "/uploads/root_canal_case.pdf",
            "key_points": "下颌第一磨牙，C形根管处理技巧。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=2)
        },
        {
            "title": "口腔黏膜病变拍摄",
            "category": ResourceCategory.PATHOLOGY_PHOTO,
            "media_type": MediaType.IMAGE,
            "file_url": "/uploads/pathology_01.jpg",
            "key_points": "疑似扁平苔藓，建议活检。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=3)
        },
        {
            "title": "最新种植牙技术文献综述",
            "category": ResourceCategory.LITERATURE_NOTE,
            "media_type": MediaType.DOC,
            "file_url": "/uploads/implant_review.pdf",
            "key_points": "即刻种植的适应症扩展。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=4)
        },
        {
            "title": "实习生牙体预备演示",
            "category": ResourceCategory.CLINICAL_TEACHING,
            "media_type": MediaType.VIDEO,
            "file_url": "/uploads/prep_demo.mp4",
            "key_points": "肩台制备不够平滑，需加强练习。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "title": "术后医嘱录音（标准版）",
            "category": ResourceCategory.DOCTOR_PATIENT_COMMUNICATION,
            "media_type": MediaType.AUDIO,
            "file_url": "/uploads/post_op_instructions.mp3",
            "key_points": "用于发送给患者的标准术后注意事项。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=6)
        },
        {
            "title": "正畸托槽脱落案例",
            "category": ResourceCategory.CLINICAL_TEACHING,
            "media_type": MediaType.IMAGE,
            "file_url": "/uploads/ortho_fail.jpg",
            "key_points": "咬合干扰导致托槽反复脱落。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=7)
        },
        {
            "title": "牙周手术缝合技巧",
            "category": ResourceCategory.CLINICAL_TEACHING,
            "media_type": MediaType.VIDEO,
            "file_url": "/uploads/suture_tech.mp4",
            "key_points": "垂直褥式缝合的演示。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=8)
        },
        {
            "title": "疑难病历讨论记录",
            "category": ResourceCategory.LITERATURE_NOTE,
            "media_type": MediaType.DOC,
            "file_url": "/uploads/case_discussion.docx",
            "key_points": "多学科联合治疗方案。",
            "patient_anonymized": False, # 未脱敏
            "created_at": datetime.now() - timedelta(days=9)
        },
        {
            "title": "儿童涂氟依从性管理",
            "category": ResourceCategory.DOCTOR_PATIENT_COMMUNICATION,
            "media_type": MediaType.VIDEO,
            "file_url": "/uploads/kids_fluoride.mp4",
            "key_points": "使用行为诱导技巧。",
            "patient_anonymized": True,
            "created_at": datetime.now() - timedelta(days=10)
        }
    ]

    for data in mock_data:
        resource = LearningResource(**data)
        db.add(resource)
    
    db.commit()
    print(f"Successfully created {len(mock_data)} mock resources.")
    db.close()

if __name__ == "__main__":
    create_mock_data()
