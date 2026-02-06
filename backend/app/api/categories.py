
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_db
from app.models.database import Category, LearningResource
from app.schemas.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    # If no categories exist, seed them? 
    # Or frontend handles it? 
    # Let's return empty list if none.
    return categories

@router.post("", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        # If category exists, return it instead of error (Idempotency)
        return existing
    
    new_category = Category(
        name=category.name,
        type=category.type
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.delete("/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    # Prevent duplicate names
    existing = db.query(Category).filter(Category.name == update.name, Category.id != category_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="与现存已有目录重名")
    old_name = category.name
    category.name = update.name
    db.commit()
    db.refresh(category)
    # Cascade update resources using old category name
    db.query(LearningResource).filter(LearningResource.category == old_name).update(
        {LearningResource.category: update.name}
    )
    db.commit()
    return category

@router.put("/ops/rename-by-name")
async def rename_category(
    old_name: str,
    new_name: str,
    db: Session = Depends(get_db)
):
    if old_name == new_name:
        return {"message": "名称未变化"}
    # Check duplicate
    existing = db.query(Category).filter(Category.name == new_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="与现存已有目录重名")
    # If there's a record for old_name, rename it; else create a new one for new_name
    record = db.query(Category).filter(Category.name == old_name).first()
    if record:
        record.name = new_name
        db.commit()
        db.refresh(record)
    else:
        new_record = Category(name=new_name, type="tag")
        db.add(new_record)
        db.commit()
    # Cascade update resources
    db.query(LearningResource).filter(LearningResource.category == old_name).update(
        {LearningResource.category: new_name}
    )
    db.commit()
    return {"message": "重命名完成"}
