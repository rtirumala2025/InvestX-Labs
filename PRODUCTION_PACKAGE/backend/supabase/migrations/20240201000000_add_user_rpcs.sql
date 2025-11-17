-- Add user profile and preferences RPC functions

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile JSONB;
BEGIN
    -- Check if the requesting user is the same as the requested user or an admin
    IF p_user_id <> auth.uid() AND NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You can only view your own profile';
    END IF;

    -- Get user profile from auth.users and join with any additional profile data
    SELECT 
        jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'email_confirmed', u.email_confirmed_at IS NOT NULL,
            'created_at', u.created_at,
            'last_sign_in', u.last_sign_in_at,
            'metadata', u.raw_user_meta_data
        )
    INTO user_profile
    FROM auth.users u
    WHERE u.id = p_user_id;

    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN user_profile;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting user profile: %', SQLERRM;
END;
$$;

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id UUID,
    p_profile_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_user JSONB;
BEGIN
    -- Check if the requesting user is the same as the user being updated
    IF p_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You can only update your own profile';
    END IF;

    -- Update user metadata
    UPDATE auth.users
    SET 
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'updated_at', NOW(),
            'updated_by', auth.uid()::text
        ) || 
        p_profile_updates
    WHERE id = p_user_id
    RETURNING 
        jsonb_build_object(
            'id', id,
            'email', email,
            'metadata', raw_user_meta_data
        ) INTO updated_user;

    IF updated_user IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user', updated_user
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating user profile: %', SQLERRM;
END;
$$;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_prefs JSONB;
BEGIN
    -- Check if the requesting user is the same as the requested user or an admin
    IF p_user_id <> auth.uid() AND NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You can only view your own preferences';
    END IF;

    -- Get user preferences
    SELECT 
        COALESCE(up.preferences, '{}'::jsonb) || 
        jsonb_build_object(
            'user_id', p_user_id,
            'last_updated', up.updated_at
        )
    INTO user_prefs
    FROM public.user_preferences up
    WHERE up.user_id = p_user_id;

    -- Return empty preferences if none exist yet
    RETURN COALESCE(user_prefs, jsonb_build_object('user_id', p_user_id));
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting user preferences: %', SQLERRM;
END;
$$;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences(
    p_user_id UUID,
    p_preferences JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_prefs JSONB;
BEGIN
    -- Check if the requesting user is the same as the user being updated
    IF p_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You can only update your own preferences';
    END IF;

    -- Validate preferences (add any specific validations needed)
    IF p_preferences IS NULL THEN
        RAISE EXCEPTION 'Preferences cannot be null';
    END IF;

    -- Insert or update preferences
    INSERT INTO public.user_preferences (user_id, preferences, updated_at)
    VALUES (p_user_id, p_preferences, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferences = p_preferences,
        updated_at = NOW()
    RETURNING 
        jsonb_build_object(
            'user_id', user_id,
            'preferences', preferences,
            'last_updated', updated_at
        ) INTO updated_prefs;

    RETURN jsonb_build_object(
        'success', true,
        'preferences', updated_prefs
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating user preferences: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_preferences(UUID, JSONB) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_user_profile IS 'Retrieves the profile of a user by their ID. Users can only view their own profile unless they are admins.';
COMMENT ON FUNCTION public.update_user_profile IS 'Updates the profile of a user. Users can only update their own profile.';
COMMENT ON FUNCTION public.get_user_preferences IS 'Retrieves the preferences of a user. Users can only view their own preferences unless they are admins.';
COMMENT ON FUNCTION public.update_user_preferences IS 'Updates the preferences of a user. Users can only update their own preferences.';

-- Update the schema version
COMMENT ON DATABASE postgres IS 'Schema updated: Added user profile and preferences RPC functions';

-- Notify any listening clients about the schema update
NOTIFY pgrst, 'reload schema';
