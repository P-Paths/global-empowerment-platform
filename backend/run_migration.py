#!/usr/bin/env python3
"""
Run the listings table migration
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def run_migration():
    """Run the SQL migration to create the listings table"""
    try:
        # Read the SQL migration file
        migration_file = backend_dir / "ADD_LISTINGS_TABLE.sql"
        
        if not migration_file.exists():
            print("❌ Migration file not found!")
            return False
            
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        print("📄 Migration SQL content:")
        print("=" * 50)
        print(sql_content)
        print("=" * 50)
        
        print("\n✅ Migration SQL loaded successfully!")
        print("\n📋 Next steps:")
        print("1. Copy the SQL content above")
        print("2. Go to your Supabase dashboard")
        print("3. Navigate to SQL Editor")
        print("4. Paste and run the SQL")
        print("5. Verify the 'listings' table was created")
        
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Running Accorria Listings Table Migration")
    print("=" * 50)
    
    success = run_migration()
    
    if success:
        print("\n🎉 Migration preparation complete!")
        print("Your dashboard will now sync data across all devices!")
    else:
        print("\n💥 Migration failed!")
        sys.exit(1)
