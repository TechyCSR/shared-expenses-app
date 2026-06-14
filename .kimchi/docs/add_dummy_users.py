"""
Script to add dummy users to the database for CSV import testing.
These users have special clerk_ids that won't conflict with real Clerk auth.

Run with: python add_dummy_users.py
"""
import os
import sys

# Change to backend directory for proper imports
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))  # .kimchi/docs -> project root
backend_dir = os.path.join(project_root, 'backend')
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from datetime import datetime, timezone

# Dummy users for the CSV - these use a special prefix to avoid Clerk ID conflicts
DUMMY_USERS = [
    {
        "clerk_id": "dummy_aisha",
        "email": "aisha@example.com",
        "full_name": "Aisha",
    },
    {
        "clerk_id": "dummy_rohan",
        "email": "rohan@example.com", 
        "full_name": "Rohan",
    },
    {
        "clerk_id": "dummy_priya",
        "email": "priya@example.com",
        "full_name": "Priya",
    },
    {
        "clerk_id": "dummy_priya_s",
        "email": "priya_s@example.com",
        "full_name": "Priya S",
    },
    {
        "clerk_id": "dummy_meera",
        "email": "meera@example.com",
        "full_name": "Meera",
    },
    {
        "clerk_id": "dummy_dev",
        "email": "dev@example.com",
        "full_name": "Dev",
    },
    {
        "clerk_id": "dummy_kabir",
        "email": "kabir@example.com",
        "full_name": "Kabir",
    },
    {
        "clerk_id": "dummy_sam",
        "email": "sam@example.com",
        "full_name": "Sam",
    },
]


def add_dummy_users():
    """Add dummy users to the database."""
    app = create_app()
    with app.app_context():
        # Check existing dummy users
        existing = {u.clerk_id: u for u in User.query.filter(User.clerk_id.like('dummy_%')).all()}
        
        print(f"Found {len(existing)} existing dummy users")
        
        added = 0
        for user_data in DUMMY_USERS:
            clerk_id = user_data["clerk_id"]
            if clerk_id in existing:
                print(f"  Already exists: {clerk_id} ({user_data['full_name']})")
                continue
                
            user = User(**user_data)
            db.session.add(user)
            print(f"  Added: {clerk_id} ({user_data['full_name']})")
            added += 1
        
        db.session.commit()
        print(f"\nTotal added: {added} dummy users")
        return added


def create_group_with_members():
    """Create a test group with all dummy users as members."""
    app = create_app()
    with app.app_context():
        # Get all dummy users
        users = {u.clerk_id.replace('dummy_', ''): u for u in User.query.filter(User.clerk_id.like('dummy_%')).all()}
        
        print(f"\nFound users: {list(users.keys())}")
        
        # Check if group already exists
        existing_group = Group.query.filter_by(name="Test Household").first()
        
        if existing_group:
            print(f"Group 'Test Household' already exists (ID: {existing_group.id})")
            return existing_group.id
        
        # Create group
        creator = users.get("aisha")
        if not creator:
            print("ERROR: Aisha user not found!")
            return None
            
        group = Group(
            name="Test Household",
            description="Test group for CSV import",
            default_currency="INR",
            created_by=creator.id,
        )
        db.session.add(group)
        db.session.flush()
        
        print(f"Created group 'Test Household' (ID: {group.id})")
        
        # Member join dates - based on CSV context
        join_dates = {
            "aisha": datetime(2026, 1, 1, tzinfo=timezone.utc),
            "rohan": datetime(2026, 1, 1, tzinfo=timezone.utc),
            "priya": datetime(2026, 1, 1, tzinfo=timezone.utc),
            "priya_s": datetime(2026, 2, 18, tzinfo=timezone.utc),  # Joined Feb 18 (row 18)
            "meera": datetime(2026, 1, 1, tzinfo=timezone.utc),
            "dev": datetime(2026, 2, 8, tzinfo=timezone.utc),  # Visited Feb 8 (row 8)
            "sam": datetime(2026, 4, 8, tzinfo=timezone.utc),  # Joined Apr 8 (row "Sam deposit share")
            "kabir": datetime(2026, 3, 11, tzinfo=timezone.utc),  # Day trip Mar 11
        }
        
        # Meera left March 28, 2026 (row "Meera farewell dinner")
        # Dev's first visit was Feb 8-15, then he returned for Goa trip Mar 8-22
        # We track visitors separately - for simplicity, we include them but don't mark left_at
        
        for name, user in users.items():
            joined_at = join_dates.get(name, datetime(2026, 1, 1, tzinfo=timezone.utc))
            
            if name == "meera":
                # Meera left March 28, 2026 - after "Meera farewell dinner"
                member = GroupMember(
                    group_id=group.id,
                    user_id=user.id,
                    joined_at=joined_at,
                    left_at=datetime(2026, 3, 29, tzinfo=timezone.utc),  # Day after farewell dinner
                )
            else:
                # Other members stay
                member = GroupMember(
                    group_id=group.id,
                    user_id=user.id,
                    joined_at=joined_at,
                )
            db.session.add(member)
            print(f"  Added member: {name} (joined: {joined_at.strftime('%Y-%m-%d')})")
        
        db.session.commit()
        print(f"\nGroup created with ID: {group.id}")
        return group.id


if __name__ == "__main__":
    print("=" * 50)
    print("Adding dummy users to database...")
    print("=" * 50)
    
    add_dummy_users()
    
    print("\n" + "=" * 50)
    print("Creating test group...")
    print("=" * 50)
    
    group_id = create_group_with_members()
    if group_id:
        print(f"\nDone! Group ID: {group_id}")
        print("\nYou can now use this group ID to import the CSV.")
    else:
        print("\nFailed to create group!")