import sys

file_path = "/Users/yashgupta/Signal-clone/frontend/src/context/SocketContext.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add group_updated handler
old_handler = """      } else if (data.type === "reaction_update") {"""

new_handler = """      } else if (data.type === "group_updated") {
        setRefreshConversationsTrigger(prev => prev + 1);
        
        // If we are currently viewing this conversation, we should also trigger something.
        // Actually, setRefreshConversationsTrigger will cause ConversationList to update.
        // If we were removed, ConversationList will fetch and might not find it, and we might need to clear activeConversation.
        // We'll let ConversationList or a higher level component handle clearing activeConversation if it's no longer valid.
      } else if (data.type === "reaction_update") {"""

if 'data.type === "group_updated"' not in content:
    content = content.replace(old_handler, new_handler)
    
with open(file_path, "w") as f:
    f.write(content)
print("SocketContext.tsx patched.")
