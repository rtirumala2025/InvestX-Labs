import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const DEFAULT_TTL = 60 * 15; // 15 minutes

export const cache = {
  async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('*')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return JSON.parse(data.value);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + ttl);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value: JSON.stringify(value),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async invalidate(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }
};

export function withCache(ttl = DEFAULT_TTL) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }
      
      logger.debug(`Cache miss for ${cacheKey}`);
      const result = await originalMethod.apply(this, args);
      
      if (result) {
        await cache.set(cacheKey, result, ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
}
