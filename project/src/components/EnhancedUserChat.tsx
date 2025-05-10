
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Video, Phone, Monitor, Loader2, Send, User } from "lucide-react";
import { format } from "date-fns";
import VideoCallInterface from "@/components/VideoCallInterface";

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
};

type ContactType = {
  id: string;
  username: string;
  avatar_url: string | null;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  online?: boolean;
};

const EnhancedUserChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<ContactType | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // For real-time updates
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetchMutualFollowers();
      subscribeToMessages();
    }
    
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user]);
  
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      const selectedContact = contacts.find(contact => contact.id === activeChat) || null;
      setActiveChatUser(selectedContact);
    }
  }, [activeChat, contacts]);
  
  useEffect(() => {
    // Filter contacts based on search term
    if (searchTerm) {
      const filtered = contacts.filter(contact => 
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const subscribeToMessages = () => {
    if (!user) return;
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          handleNewMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();
      
    setRealtimeChannel(channel);
  };
  
  const handleNewMessage = (newMessage: ChatMessage) => {
    // If chat with sender is active, add to messages
    if (activeChat === newMessage.sender_id) {
      setMessages(prev => [...prev, newMessage]);
    } 
    
    // Update last message for contact
    setContacts(prev => 
      prev.map(contact => {
        if (contact.id === newMessage.sender_id) {
          return {
            ...contact,
            last_message: newMessage.message,
            last_message_time: newMessage.created_at,
            unread_count: (contact.unread_count || 0) + 1
          };
        }
        return contact;
      })
    );
    
    // Show toast notification
    if (activeChat !== newMessage.sender_id) {
      const sender = contacts.find(c => c.id === newMessage.sender_id);
      toast({
        title: `New message from ${sender?.username || 'Someone'}`,
        description: newMessage.message.length > 30 
          ? `${newMessage.message.substring(0, 30)}...` 
          : newMessage.message
      });
    }
  };

  const fetchMutualFollowers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get users who the current user follows
      const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
        
      if (followingError) throw followingError;
      
      const followingIds = following.map(f => f.following_id);
      
      // Get users who follow the current user
      const { data: followers, error: followersError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user.id);
        
      if (followersError) throw followersError;
      
      const followerIds = followers.map(f => f.follower_id);
      
      // Find mutual followers (users who both follow and are followed by the current user)
      const mutualIds = followingIds.filter(id => followerIds.includes(id));
      
      if (mutualIds.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get profile information for mutual followers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', mutualIds);
        
      if (profilesError) throw profilesError;
      
      const contactsWithLastMessage: ContactType[] = await Promise.all(
        profiles.map(async (profile) => {
          // Get last message between users
          const { data: lastMessages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (messagesError) {
            console.error('Error fetching last message:', messagesError);
            return {
              ...profile,
              last_message: undefined,
              last_message_time: undefined,
              unread_count: 0,
              online: Math.random() > 0.5 // Simulate online status for demo
            };
          }
          
          if (lastMessages && lastMessages.length > 0) {
            return {
              ...profile,
              last_message: lastMessages[0].message,
              last_message_time: lastMessages[0].created_at,
              unread_count: 0, // For a real app, fetch actual unread count
              online: Math.random() > 0.5 // Simulate online status for demo
            };
          }
          
          return {
            ...profile,
            online: Math.random() > 0.5 // Simulate online status for demo
          };
        })
      );
      
      setContacts(contactsWithLastMessage);
      setFilteredContacts(contactsWithLastMessage);
      
      // If we have contacts, set the first one as active
      if (contactsWithLastMessage.length > 0 && !activeChat) {
        setActiveChat(contactsWithLastMessage[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching mutual followers:', error);
      toast({
        title: 'Failed to load contacts',
        description: 'Please try refreshing the page',
        variant: 'destructive'
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
      
      // Mark messages as read (in a real app)
      // This would update a read_status field
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Failed to load messages',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      });
    }
  };
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !activeChat || !user) return;
    
    try {
      setSending(true);
      
      // Direct insert instead of RPC for better type safety
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChat,
          message: message.trim()
        });
      
      if (error) throw error;
      
      // Local optimistic update
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender_id: user.id,
        receiver_id: activeChat,
        message: message.trim(),
        created_at: new Date().toISOString()
      }]);
      
      // Clear input
      setMessage("");
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };
  
  const startCall = (video: boolean) => {
    if (!activeChatUser) return;
    
    setIsVideoCall(video);
    setIsCallActive(true);
    
    toast({
      title: `${video ? 'Video' : 'Audio'} call started`,
      description: `Connected with ${activeChatUser.username}`,
    });
  };
  
  const endCall = () => {
    setIsCallActive(false);
    setIsScreenSharing(false);
    
    toast({
      title: 'Call ended',
      description: 'The call has ended',
    });
  };
  
  const toggleScreenSharing = () => {
    setIsScreenSharing(!isScreenSharing);
    
    toast({
      title: isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started',
    });
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Please log in to use the chat feature</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p>Loading your conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isCallActive) {
    return (
      <VideoCallInterface
        isVideoCall={isVideoCall}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isVideoEnabled={isVideoEnabled}
        setIsVideoEnabled={setIsVideoEnabled}
        isScreenSharing={isScreenSharing}
        toggleScreenSharing={toggleScreenSharing}
        endCall={endCall}
        peerName={activeChatUser?.username || "User"}
        peerAvatar={activeChatUser?.avatar_url || ""}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Contacts List */}
          <div className="border-r">
            <div className="p-4">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            
            <ScrollArea className="h-[540px]">
              <div className="px-2">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'No contacts match your search' : 'No mutual followers found'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Follow users and have them follow you back to enable chat
                    </p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      onClick={() => setActiveChat(contact.id)}
                      className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-accent ${
                        activeChat === contact.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={contact.avatar_url || ""} />
                          <AvatarFallback>
                            {contact.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between">
                          <p className="font-medium truncate">{contact.username}</p>
                          {contact.last_message_time && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(contact.last_message_time), 'p')}
                            </span>
                          )}
                        </div>
                        {contact.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.last_message}
                          </p>
                        )}
                      </div>
                      {contact.unread_count && contact.unread_count > 0 && (
                        <Badge className="ml-2">{contact.unread_count}</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Chat Area */}
          <div className="col-span-1 md:col-span-2 flex flex-col h-full">
            {activeChat && activeChatUser ? (
              <>
                {/* Chat Header */}
                <div className="border-b p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activeChatUser.avatar_url || ""} />
                      <AvatarFallback>
                        {activeChatUser.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                      <p className="font-medium">{activeChatUser.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeChatUser.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startCall(false)}
                      title="Audio Call"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startCall(true)}
                      title="Video Call"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isCurrentUser = msg.sender_id === user.id;
                        return (
                          <div 
                            key={msg.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{msg.message}</p>
                              <p className={`text-xs ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right mt-1`}>
                                {format(new Date(msg.created_at), 'p')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <form onSubmit={sendMessage} className="border-t p-4 flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={sending || !message.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-center">
                <div>
                  <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a contact to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedUserChat;
