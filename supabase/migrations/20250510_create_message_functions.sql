
-- Function to get chat messages between the current user and another user
CREATE OR REPLACE FUNCTION get_chat_messages(other_user_id UUID, current_user_id UUID)
RETURNS SETOF messages AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM messages
  WHERE (sender_id = current_user_id AND receiver_id = other_user_id)
     OR (sender_id = other_user_id AND receiver_id = current_user_id)
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(receiver_id_param UUID, message_text TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO messages (sender_id, receiver_id, message)
  VALUES (auth.uid(), receiver_id_param, message_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
