
-- This migration adds the tables needed for the DreamSwap feature

-- Add time tracking fields to the existing swap_sessions table
ALTER TABLE public.swap_sessions
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_earned INTEGER DEFAULT 0;

-- Create a sessions_messages table for storing chat messages during sessions
CREATE TABLE IF NOT EXISTS public.session_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.swap_sessions(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add Row Level Security (RLS) to session_messages table
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy for session_messages (only session participants can read/write)
CREATE POLICY "Users can access messages for their sessions" ON public.session_messages
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.swap_sessions
    WHERE swap_sessions.id = session_messages.session_id
    AND (swap_sessions.requester_id = auth.uid() OR swap_sessions.recipient_id = auth.uid())
  )
);

-- Update the profiles table to add fields needed for DreamSwap
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dream_mentor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mentor_bio TEXT,
ADD COLUMN IF NOT EXISTS total_hours_taught NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours_learned NUMERIC DEFAULT 0;

-- Create a scheduled_sessions table to track upcoming sessions
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) NOT NULL,
  learner_id UUID REFERENCES auth.users(id) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60 NOT NULL,
  skill_name TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add Row Level Security (RLS) to scheduled_sessions table
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy for scheduled_sessions
CREATE POLICY "Users can view their own sessions" ON public.scheduled_sessions
USING (teacher_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY "Users can create their sessions" ON public.scheduled_sessions
FOR INSERT WITH CHECK (teacher_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.scheduled_sessions
FOR UPDATE USING (teacher_id = auth.uid() OR learner_id = auth.uid());

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  badge_id UUID REFERENCES public.badges(id) NOT NULL,
  awarded_by UUID REFERENCES auth.users(id),
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Add Row Level Security (RLS) to user_badges table
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy for user_badges
CREATE POLICY "Users can view all badges" ON public.user_badges
FOR SELECT USING (true);

CREATE POLICY "Users can award badges" ON public.user_badges
FOR INSERT WITH CHECK (awarded_by = auth.uid());

-- Function to rate a user after a session
CREATE OR REPLACE FUNCTION rate_session_user(
  p_session_id UUID,
  p_rated_user UUID,
  p_rating INT,
  p_comment TEXT,
  p_badges TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_review_id UUID;
BEGIN
  -- Verify the user is part of the session
  IF NOT EXISTS (
    SELECT 1 FROM swap_sessions 
    WHERE id = p_session_id 
    AND (requester_id = auth.uid() OR recipient_id = auth.uid())
    AND (requester_id = p_rated_user OR recipient_id = p_rated_user)
  ) THEN
    RAISE EXCEPTION 'You can only rate users from sessions you participated in';
  END IF;
  
  -- Create the review
  INSERT INTO reviews (
    reviewer_id,
    reviewed_id,
    session_id,
    rating,
    review_text,
    badges
  ) VALUES (
    auth.uid(),
    p_rated_user,
    p_session_id,
    p_rating,
    p_comment,
    p_badges
  )
  RETURNING id INTO v_review_id;
  
  RETURN v_review_id;
END;
$$;
