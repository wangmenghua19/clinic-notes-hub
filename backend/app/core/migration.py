from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.models.database import Base

def check_and_migrate_tables(engine):
    inspector = inspect(engine)
    
    # Check if categories table exists
    if "categories" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("categories")]
        
        # Check for 'type' column
        if "type" not in columns:
            print("Migrating: Adding 'type' column to categories table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE categories ADD COLUMN type VARCHAR(20) DEFAULT 'tag'"))
                conn.commit()
    
    # You can add more migration checks here if needed
    print("Database schema check completed.")
