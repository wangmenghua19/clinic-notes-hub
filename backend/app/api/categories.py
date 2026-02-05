
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_db
from app.models.database import Category
from app.schemas.schemas import CategoryCreate, CategoryResponse

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
