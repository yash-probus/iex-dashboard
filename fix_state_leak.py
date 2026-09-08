import sys

file_path = "/Users/yashgupta/Signal-clone/frontend/src/context/SocketContext.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add a useEffect to clear state on logout
old_code = """  const refreshConversations = () => {
    setRefreshConversationsTrigger(prev => prev + 1);
  };"""

new_code = """  const refreshConversations = () => {
    setRefreshConversationsTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!token) {
      setActiveConversation(null);
      setMessages([]);
      setReplyingTo(null);
    }
  }, [token]);"""

if "setActiveConversation(null);" not in content:
    content = content.replace(old_code, new_code)
    with open(file_path, "w") as f:
        f.write(content)
    print("Fixed state leak in SocketContext.")
else:
    print("Already fixed.")
