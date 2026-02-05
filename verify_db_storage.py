import sqlite3
import os
import sys

# 设置数据库路径
DB_PATH = os.path.join("backend", "medstudy.db")

def verify_storage():
    print(f"正在检查数据库: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("错误: 找不到数据库文件！")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 查询最近的5条记录
        query = """
        SELECT id, title, file_url, length(content) as content_size, created_at 
        FROM learning_resources 
        ORDER BY id DESC 
        LIMIT 5
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        print("\n=== 数据库存储验证报告 ===")
        print(f"{'ID':<5} | {'标题':<20} | {'存储位置标识 (file_url)':<30} | {'数据库内大小 (Bytes)':<20} | {'创建时间'}")
        print("-" * 110)
        
        db_storage_count = 0
        
        for row in rows:
            id, title, file_url, content_size, created_at = row
            
            # 处理可能的 None 值
            content_size_str = f"{content_size:,}" if content_size is not None else "NULL (0)"
            is_in_db = content_size is not None and content_size > 0
            
            print(f"{id:<5} | {title[:18]:<20} | {file_url[:28]:<30} | {content_size_str:<20} | {created_at}")
            
            if is_in_db:
                db_storage_count += 1
                
        print("-" * 110)
        
        if db_storage_count > 0:
            print(f"\n✅ 验证成功: 发现 {db_storage_count} 个文件的数据直接存储在数据库的 'content' 字段中。")
            print("   注意观察 '存储位置标识'，如果以 'db://' 开头，说明是新上传的文件，完全没有经过硬盘。")
        else:
            print("\n⚠️  注意: 尚未发现存储在数据库中的文件内容。请尝试上传一个新文件后再运行此验证。")
            
        conn.close()
        
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == "__main__":
    verify_storage()
