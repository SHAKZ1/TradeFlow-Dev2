import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || '');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

const CLIENT_ID = process.env.GHL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET!;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAccessToken(locationId: string): Promise<string | null> {
  const key = `ghl:${locationId}`;
  const lockKey = `ghl:refresh_lock:${locationId}`;

  // 1. Try to get existing token
  let tokens = await redis.hgetall(key);

  // 2. Check if valid (buffer of 5 minutes)
  if (tokens && tokens.access_token && tokens.expires_at) {
    const now = Date.now();
    if (now < Number(tokens.expires_at) - 300000) {
      return tokens.access_token;
    }
  }

  // 3. Token Expired: ACQUIRE LOCK
  // 'NX' = Only set if not exists. 'EX', 15 = Expire lock in 15s to prevent deadlocks.
  const acquiredLock = await redis.set(lockKey, 'locked', 'EX', 15, 'NX');

  if (!acquiredLock) {
    // If locked, another process is refreshing. Wait and retry fetching from Redis.
    console.log(`🔒 Token refresh locked for ${locationId}. Waiting...`);
    await sleep(1000); // Wait 1s
    tokens = await redis.hgetall(key); // Fetch fresh result
    return tokens?.access_token || null;
  }

  console.log(`🔄 Token Expired for ${locationId}. Refreshing (Lock Acquired)...`);

  try {
    // 4. Refresh Token
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        user_type: 'Location',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Refresh Failed:", data);
      // Do not delete the lock immediately here, let it expire, 
      // or delete it so next retry can happen.
      await redis.del(lockKey); 
      return null;
    }

    const newExpiresAt = Date.now() + (data.expires_in * 1000);
    
    // 5. Save new tokens
    await redis.hset(key, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: newExpiresAt,
    });

    console.log("✅ Token Refreshed & Saved");
    
    // 6. Release Lock
    await redis.del(lockKey);
    
    return data.access_token;

  } catch (error) {
    console.error("Refresh Error:", error);
    await redis.del(lockKey); // Release lock on error
    return null;
  }
}

export async function saveInitialTokens(locationId: string, data: any) {
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await redis.hset(`ghl:${locationId}`, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  });
  console.log("💾 Initial Tokens Saved to Redis for:", locationId);
}