
-- Function to get messages between two users (without exposing messages table directly)
CREATE OR REPLACE FUNCTION public.get_chat_messages(
  other_user_id UUID,
  current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, sender_id, receiver_id, message, created_at
  FROM public.messages
  WHERE (sender_id = current_user_id AND receiver_id = other_user_id)
     OR (sender_id = other_user_id AND receiver_id = current_user_id)
  ORDER BY created_at ASC;
$$;

-- Function to send a message (without exposing messages table directly)
CREATE OR REPLACE FUNCTION public.send_message(
  receiver_id_param UUID,
  message_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.messages(sender_id, receiver_id, message)
  VALUES (auth.uid(), receiver_id_param, message_text)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
