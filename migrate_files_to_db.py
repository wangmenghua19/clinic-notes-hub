import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.database import LearningResource, Base
# Override database URL to target the one in backend directory
DATABASE_URL = "sqlite:///backend/medstudy.db"

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Add 'content' column if not exists
    print("Checking for 'content' column...")
    try:
        session.execute(text("SELECT content FROM learning_resources LIMIT 1"))
        print("'content' column already exists.")
    except Exception:
        print("'content' column missing. Adding it...")
        # SQLite doesn't support adding BLOB column easily via simple alter if it has constraints, 
        # but adding a nullable column is fine.
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE learning_resources ADD COLUMN content BLOB"))
                conn.commit()
            print("Added 'content' column.")
        except Exception as e:
            print(f"Failed to add column: {e}")
            return

    # 2. Migrate files
    print("Migrating files to database...")
    resources = session.query(LearningResource).all()
    count = 0
    for r in resources:
        if r.content is not None:
            continue # Already migrated
            
        # Parse file path from URL
        # URL is like /uploads/filename.ext or http://localhost.../uploads/filename.ext
        # We need the local path.
        # Assuming r.file_url stores '/uploads/xxxx' or relative path
        
        file_url = r.file_url
        filename = os.path.basename(file_url)
        
        # Local path
        file_path = os.path.join("backend", "uploads", filename)
        
        if os.path.exists(file_path):
            print(f"Reading file: {file_path}")
            try:
                with open(file_path, "rb") as f:
                    file_data = f.read()
                    r.content = file_data
                    count += 1
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        else:
            print(f"File not found: {file_path}")

    if count > 0:
        session.commit()
        print(f"Successfully migrated {count} files to database.")
    else:
        print("No files needed migration.")

    session.close()

if __name__ == "__main__":
    migrate()
