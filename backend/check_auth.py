"""Fix all user passwords in production DB to work with direct bcrypt."""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

from app.core.config import get_settings
from app.core.security import hash_password, verify_password

settings = get_settings()

# Known users and their expected passwords
USERS = {
    "superadmin@srpailabs.com": settings.effective_super_admin_password,
    "hr@acme.com": "Admin@1234",
    "alice@acme.com": "Employee@1234",
}

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        for email, password in USERS.items():
            result = await conn.execute(
                text("SELECT id, email, password_hash, role, status FROM users WHERE email = :email"),
                {"email": email}
            )
            user = result.first()
            if not user:
                print(f"[SKIP] {email} - not found")
                continue
            
            ok = verify_password(password, user.password_hash)
            if ok:
                print(f"[OK] {email} - password already correct")
            else:
                new_hash = hash_password(password)
                await conn.execute(
                    text("UPDATE users SET password_hash = :h WHERE id = :id"),
                    {"h": new_hash, "id": user.id}
                )
                print(f"[FIXED] {email} - password re-hashed")
    
    await engine.dispose()
    print("Done!")

asyncio.run(main())
