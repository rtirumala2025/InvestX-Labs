import { supabase } from './config';

const AVATAR_BUCKET = 'avatars';

export const getAvatarPublicUrl = (path) => {
  if (!path) return null;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
};

export const uploadAvatar = async (userId, file) => {
  if (!userId || !file) {
    throw new Error('User and file are required to upload avatar');
  }

  const fileExt = file.name?.split('.').pop()?.toLowerCase() || 'png';
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${fileExt}`
    });

  if (error) {
    throw error;
  }

  return {
    path: filePath,
    url: getAvatarPublicUrl(filePath)
  };
};

