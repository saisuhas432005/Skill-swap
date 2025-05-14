import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Video, Phone, Loader2, Send, User, ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import VideoCallInterface from "./VideoCallInterface";

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
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // New state to track mobile chat view
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

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
      // Open chat area on mobile when a contact is selected
      setIsMobileChatOpen(true);
    }
  }, [activeChat, contacts]);
  
  useEffect(() => {
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
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const subscribeToMessages = () => {
    if (!user) return;
    
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
    if (activeChat === newMessage.sender_id) {
      setMessages(prev => [...prev, newMessage]);
    } 
    
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
      
      const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
        
      if (followingError) throw followingError;
      
      const followingIds = following.map(f => f.following_id);
      
      const { data: followers, error: followersError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user.id);
        
      if (followersError) throw followersError;
      
      const followerIds = followers.map(f => f.follower_id);
      
      const mutualIds = followingIds.filter(id => followerIds.includes(id));
      
      if (mutualIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', mutualIds);
        
      if (profilesError) throw profilesError;
      
      const contactsWithLastMessage: ContactType[] = await Promise.all(
        profiles.map(async (profile) => {
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
              online: Math.random() > 0.5
            };
          }
          
          if (lastMessages && lastMessages.length > 0) {
            return {
              ...profile,
              last_message: lastMessages[0].message,
              last_message_time: lastMessages[0].created_at,
              unread_count: 0,
              online: Math.random() > 0.5
            };
          }
          
          return {
            ...profile,
            online: Math.random() > 0.5
          };
        })
      );
      
      setContacts(contactsWithLastMessage);
      setFilteredContacts(contactsWithLastMessage);
      
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
      
      const allMessages = [...(messagesFrom || []), ...(messagesTo || [])];
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setMessages(allMessages);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Failed to load messages',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      });
    }
  };
  
  const deleteMessage = async (messageId: string) => {
    try {
      // Supabase expects id to be a UUID string, use as is
      if (typeof messageId !== 'string' || messageId.trim() === '') {
        throw new Error('Invalid message ID');
      }
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSelectedMessageId(null);
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

  const [file, setFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const uploadFileAndSendMessage = async () => {
    if (!file || !activeChat || !user) return;

    try {
      setUploadingFile(true);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `chat_files/${user.id}/${timestamp}.${fileExt}`;

      console.log('Uploading file:', file.name, 'with MIME type:', file.type);

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('chat_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: publicURLData } = supabase.storage
        .from('chat_files')
        .getPublicUrl(filePath);

      if (!publicURLData || !publicURLData.publicUrl) {
        console.error('Failed to get public URL for file:', file.name);
        throw new Error('Failed to get file URL');
      }

      console.log('Public URL:', publicURLData.publicUrl);

      // Send message with file URL and metadata
      const fileMessage = JSON.stringify({
        type: 'file',
        url: publicURLData.publicUrl,
        name: file.name,
        mimeType: file.type,
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChat,
          message: fileMessage,
        })
        .select()
        .single();

      console.log('Inserted file message data:', data, 'error:', error);

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      if (data) {
        setMessages(prev => [...prev, data]);
      }

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file and sending message:', error);
      toast({
        title: 'Failed to send file',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (file) {
      await uploadFileAndSendMessage();
      return;
    }

    if (!message.trim() || !activeChat || !user) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChat,
          message: message.trim(),
        })
        .select()
        .single();

      console.log('Inserted text message data:', data, 'error:', error);

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, data]);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
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
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px] md:h-[calc(100vh-8rem)]">
          {/* Contacts List */}
          <div className={`border-r md:block ${isMobileChatOpen ? 'hidden' : 'block'}`}>
            <div className="p-4">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            
            <ScrollArea className="h-[540px] md:h-[calc(100vh-12rem)]">
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
          <div className={`col-span-1 md:col-span-2 flex flex-col h-full ${isMobileChatOpen ? 'block' : 'hidden'} md:block`}>
            {activeChat && activeChatUser ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden p-2 border-b flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileChatOpen(false)} title="Back to contacts">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <p className="ml-2 font-medium">{activeChatUser.username}</p>
                </div>
                {/* Chat Header */}
                <div className="border-b p-4 flex justify-between items-center hidden md:flex">
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
                <ScrollArea className="flex-1 p-4 overflow-y-auto">
                  <div className="divide-y divide-gray-300 space-y-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isCurrentUser = msg.sender_id === user.id;
                        const isSelected = selectedMessageId === msg.id;
                        return (
                          <div 
                            key={msg.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} py-2`}
                          >
                            <div 
                              className={`max-w-full sm:max-w-[80%] rounded-lg px-4 py-2 break-words relative cursor-pointer ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              } ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                              onClick={() => {
                                setSelectedMessageId(prev => prev === msg.id ? null : msg.id);
                              }}
                            >
                      {(() => {
                        try {
                          const parsed = JSON.parse(msg.message);
                          if (parsed.type === 'file' && parsed.url) {
                            const url = parsed.url;
                            const name = parsed.name || 'file';
                            const mimeType = parsed.mimeType || '';
                            if (mimeType.startsWith('image/')) {
                              return (
                                <img
                                  src={url}
                                  alt={name}
                                  className="max-w-full max-h-60 rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/fallback-image.png';
                                  }}
                                />
                              );
                            } else if (mimeType.startsWith('video/')) {
                              return (
                                <video
                                  controls
                                  src={url}
                                  className="max-w-full max-h-60 rounded"
                                  onError={(e) => {
                                    e.currentTarget.poster = '/fallback-video.png';
                                  }}
                                />
                              );
                            } else if (mimeType === 'application/pdf') {
                              return (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  {name}
                                </a>
                              );
                            } else {
                              return (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  {name}
                                </a>
                              );
                            }
                          }
                        } catch {
                          // Not a JSON message, fall back to text
                        }
                        return <p>{msg.message}</p>;
                      })()}
                      <p className={`text-xs ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right mt-1`}>
                        {format(new Date(msg.created_at), 'p')}
                      </p>
                      {isCurrentUser && isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(msg.id);
                          }}
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
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <form onSubmit={sendMessage} className="border-t p-4 flex space-x-2 sticky bottom-0 bg-background z-10">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending || uploadingFile}
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    accept="image/*,video/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={sending || uploadingFile}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="inline-flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 cursor-pointer px-3 py-1 text-gray-700">
                    📎
                  </label>
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={sending || (!message.trim() && !file) || uploadingFile}
                  >
                    {sending || uploadingFile ? (
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
