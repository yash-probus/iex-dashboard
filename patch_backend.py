import sys

file_path = "/Users/yashgupta/Signal-clone/backend/app/api/conversations.py"
with open(file_path, "r") as f:
    content = f.read()

# Add import
if "from app.core.ws_manager import manager" not in content:
    content = content.replace("import aiosqlite\n", "import aiosqlite\nfrom app.core.ws_manager import manager\n")

# Replace remove_participant
old_remove = """    await db.execute("DELETE FROM participants WHERE conversation_id = ? AND user_id = ?", (conv_id, user_id))
    await db.commit()
    return {"status": "ok"}"""

new_remove = """    await db.execute("DELETE FROM participants WHERE conversation_id = ? AND user_id = ?", (conv_id, user_id))
    await db.commit()
    
    async with db.execute("SELECT user_id FROM participants WHERE conversation_id = ?", (conv_id,)) as cursor:
        participants = await cursor.fetchall()
        for p in participants:
            await manager.send_personal_message({"type": "group_updated", "conversation_id": conv_id}, p["user_id"])
            
    await manager.send_personal_message({"type": "group_updated", "conversation_id": conv_id}, user_id)
            
    return {"status": "ok"}"""
content = content.replace(old_remove, new_remove)

# Replace add_participant
old_add = """    try:
        await db.execute("INSERT INTO participants (conversation_id, user_id, is_admin) VALUES (?, ?, FALSE)", (conv_id, req.user_id))
        await db.commit()
    except aiosqlite.IntegrityError:
        pass # Already a participant
    return {"status": "ok"}"""

new_add = """    try:
        await db.execute("INSERT INTO participants (conversation_id, user_id, is_admin) VALUES (?, ?, FALSE)", (conv_id, req.user_id))
        await db.commit()
        
        async with db.execute("SELECT user_id FROM participants WHERE conversation_id = ?", (conv_id,)) as cursor:
            participants = await cursor.fetchall()
            for p in participants:
                await manager.send_personal_message({"type": "group_updated", "conversation_id": conv_id}, p["user_id"])
                
    except aiosqlite.IntegrityError:
        pass # Already a participant
    return {"status": "ok"}"""
content = content.replace(old_add, new_add)

with open(file_path, "w") as f:
    f.write(content)
print("conversations.py patched.")
