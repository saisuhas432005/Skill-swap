import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button"; // Temporarily replace with native button below for testing
import { useToast } from "../hooks/use-toast";
import { Send, UserRound, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

type ChatUser = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
};

const UserChat = () => {
  const { user } = useAuth();
  console.log("User id at component start:", user?.id);
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  console.log("Messages array:", messages);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('chat-updates')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${activeChat},receiver_id=eq.${user?.id}`
        }, (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        })
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeChat, user]);

  useEffect(() => {
    console.log("selectedMessageId changed:", selectedMessageId);
  }, [selectedMessageId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Get users the current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user?.id);
      
      if (followingError) throw followingError;
      
      const followingIds = followingData?.map(f => f.followed_id) || [];
      
      // Get users who follow the current user
      const { data: followerData, error: followerError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('followed_id', user?.id);
      
      if (followerError) throw followerError;
      
      const followerIds = followerData?.map(f => f.follower_id) || [];
      
      // Find mutual follows (users who follow each other)
      const mutualFollowsIds = followingIds.filter(id => followerIds.includes(id));
      
      if (mutualFollowsIds.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get user profiles for these mutual follows
      const { data: userProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', mutualFollowsIds);
      
      if (profilesError) throw profilesError;
      
      setConversations(userProfiles || []);
      
      // Set the first user as active if there's no active chat
      if (userProfiles && userProfiles.length > 0 && !activeChat) {
        setActiveChat(userProfiles[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Failed to load contacts",
        description: "There was a problem loading your contacts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatUserId: string) => {
    try {
      // Use a direct query instead of RPC for better type safety
      const { data: messagesFrom, error: errorFrom } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user?.id)
        .eq('receiver_id', chatUserId);
        
      if (errorFrom) throw errorFrom;
      
      const { data: messagesTo, error: errorTo } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', chatUserId)
        .eq('receiver_id', user?.id);
        
      if (errorTo) throw errorTo;
      
      // Combine and sort messages by timestamp
      const allMessages = [...(messagesFrom || []), ...(messagesTo || [])];
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: "There was a problem loading your messages.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;
    
    try {
      setSending(true);
      
      // Direct insert instead of RPC for better type safety
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id || '',
          receiver_id: activeChat,
          message: message.trim()
        });
      
      if (error) throw error;
      
      // Local optimistic update
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender_id: user?.id || '',
        receiver_id: activeChat,
        message: message.trim(),
        created_at: new Date().toISOString()
      }]);
      
      // Clear the input
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "There was a problem sending your message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "Message deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Failed to delete message",
        description: "There was a problem deleting the message.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <Card className="w-full h-full">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Please log in to use the chat feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Chat with Connections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No mutual connections found.</p>
            <p className="text-sm mt-2">Follow other users and when they follow you back, you'll be able to chat!</p>
          </div>
        ) : (
          <div className="flex h-[calc(70vh-10rem)] md:h-[calc(80vh-10rem)]">
            {/* Contact List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {conversations.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                    activeChat === contact.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setActiveChat(contact.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar_url || ''} />
                    <AvatarFallback>
                      <UserRound className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {contact.full_name || contact.username || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Online
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
              {activeChat ? (
                <>
                  <div className="flex-grow overflow-y-auto p-4 max-h-[60vh]">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
{messages.map((msg) => {
  console.log("Message sender_id:", msg.sender_id, "User id:", user.id);
  console.log("msg.id type:", typeof msg.id, "selectedMessageId type:", typeof selectedMessageId);
  console.log("msg.id value:", msg.id, "selectedMessageId value:", selectedMessageId);
  const isSender = String(msg.sender_id) === String(user.id);
  const isSelected = String(selectedMessageId) === String(msg.id);
  return (
    <div
      key={msg.id}
      className={`flex ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 relative cursor-pointer overflow-visible ${
          isSender
            ? 'bg-spark-purple text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
        onClick={() => {
          console.log("Message clicked:", msg.id, "Currently selected:", selectedMessageId);
          setSelectedMessageId(prevSelectedId => (prevSelectedId === msg.id ? null : msg.id));
          console.log("selectedMessageId after set:", selectedMessageId);
        }}
      >
        <p>{msg.message}</p>
        <p className={`text-xs mt-1 ${
          isSender
            ? 'text-white/70'
            : 'text-gray-500'
        }`}> 
          {formatTime(msg.created_at)}
        </p>
{isSender && isSelected && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      console.log("Delete button clicked for message:", msg.id);
      deleteMessage(msg.id);
      setSelectedMessageId(null);
    }}
    style={{ zIndex: 9999 }}
    className="absolute top-1 right-1 p-2 bg-red-700 hover:bg-red-600 rounded shadow-lg"
    aria-label="Delete message"
    title="Delete message"
  >
    <Trash2 className="h-5 w-5 text-white" />
  </button>
)}
      </div>
    </div>
  );
})}
{/* Test delete button outside messages */}
<button
  onClick={() => alert('Test delete button clicked')}
  className="m-2 p-2 bg-blue-600 text-white rounded"
  type="button"
>
  Test Delete Button Outside
</button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      disabled={sending || !message.trim()}
                      onClick={sendMessage}
                      className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Select a contact to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserChat;
