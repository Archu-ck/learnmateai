const { getAIProvider } = require('./index');
const mongoose = require('mongoose');
const AILog = require('../../models/AILog');

// Configuration
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 2; // Up to 2 retries on 429/5xx
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_USER_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_USER_10MIN || '20', 10);
const CONCURRENCY_LIMIT = parseInt(process.env.AI_CONCURRENCY_LIMIT || '3', 10);

// In-memory rate limiting map: userId -> [timestamp, ...]
const userRequestTimestamps = new Map();

// In-memory concurrency queue
let runningOperations = 0;
const waitingQueue = [];

function acquireConcurrencySlot() {
  return new Promise((resolve) => {
    if (runningOperations < CONCURRENCY_LIMIT) {
      runningOperations++;
      return resolve();
    }
    waitingQueue.push(resolve);
  });
}

function releaseConcurrencySlot() {
  runningOperations = Math.max(0, runningOperations - 1);
  if (waitingQueue.length > 0) {
    const next = waitingQueue.shift();
    runningOperations++;
    next();
  }
}

// In-memory cache for identical requests (e.g., test-generation, 5 min TTL)
const requestCache = new Map(); // key -> { data, expiresAt }

function getCachedResult(key) {
  const cached = requestCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    requestCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedResult(key, data, ttlMs = 5 * 60 * 1000) {
  requestCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Check and record user rate limit.
 * Returns true if allowed, false if rate limited.
 */
function checkUserRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (userRequestTimestamps.get(String(userId)) || []).filter((t) => t > windowStart);
  if (timestamps.length >= DEFAULT_USER_LIMIT) {
    return false;
  }

  timestamps.push(now);
  userRequestTimestamps.set(String(userId), timestamps);
  return true;
}

/**
 * Helper to check if error is retryable (429 or 5xx)
 */
function isRetryableError(err) {
  const status = err?.status || err?.statusCode || err?.response?.status;
  if (status === 429 || (status >= 500 && status <= 599)) return true;
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('too many requests') || msg.includes('overloaded') || msg.includes('service unavailable')) {
    return true;
  }
  return false;
}

/**
 * Central Executor that handles:
 * - 30s timeout
 * - 2x exponential backoff retries
 * - User rate limits & Friendly quota error message
 * - Concurrency cap
 * - AILog persistence
 */
async function executeAI({
  user,
  feature,
  prompt,
  systemInstruction,
  operationType = 'text', // 'text' | 'chat' | 'stream' | 'json'
  operationArgs = {},
  subjectId = null,
  topicId = null,
  cacheKey = null,
}) {
  const startTime = Date.now();
  const userId = user?._id || user?.id;
  const userRole = user?.role || 'student';
  const schoolId = user?.schoolId || 'school-default-01';

  // 1. Check in-memory cache if applicable
  if (cacheKey) {
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // 2. Check user rate limit
  if (userId && !checkUserRateLimit(userId)) {
    const friendlyMsg = 'The AI is busy right now, try again in a minute.';
    // Log rate limit event
    try {
      if (mongoose.connection.readyState === 1) {
        await AILog.create({
          userId,
          role: userRole,
          subjectId,
          topicId,
          feature,
          prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
          response: { error: 'Rate limit exceeded' },
          tokens: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
          latencyMs: Date.now() - startTime,
          status: 'rate_limited',
          errorMessage: friendlyMsg,
          schoolId,
        });
      }
    } catch (e) {
      console.error('Failed to log rate limit to AILog:', e);
    }
    const err = new Error(friendlyMsg);
    err.status = 429;
    err.friendlyMessage = friendlyMsg;
    throw err;
  }

  // 3. Acquire concurrency slot
  await acquireConcurrencySlot();

  try {
    const provider = getAIProvider();
    let result = null;
    let lastError = null;

    // Retry loop with exponential backoff (1s, 2s)
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      try {
        // Enforce 30s timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), TIMEOUT_MS);
        });

        const opPromise = (async () => {
          if (operationType === 'json') {
            return await provider.generateJSON({
              prompt,
              systemInstruction,
              schema: operationArgs.schema,
              responseSchema: operationArgs.responseSchema,
              temperature: operationArgs.temperature ?? 0.2,
            });
          } else if (operationType === 'chat') {
            return await provider.chat({
              messages: operationArgs.messages || [{ role: 'user', content: prompt }],
              systemInstruction,
              temperature: operationArgs.temperature,
            });
          } else if (operationType === 'stream') {
            return await provider.streamChat({
              messages: operationArgs.messages || [{ role: 'user', content: prompt }],
              systemInstruction,
              temperature: operationArgs.temperature,
              onChunk: operationArgs.onChunk,
              signal: operationArgs.signal,
            });
          } else {
            return await provider.generateText({
              prompt,
              systemInstruction,
              temperature: operationArgs.temperature,
              maxTokens: operationArgs.maxTokens,
            });
          }
        })();

        result = await Promise.race([opPromise, timeoutPromise]);
        break; // Success, exit retry loop
      } catch (err) {
        lastError = err;
        console.warn(`[AI Executor] Attempt ${attempt + 1} failed for ${feature}:`, err.message);
        if (!isRetryableError(err) || attempt === MAX_RETRIES) {
          break;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!result && lastError) {
      // Determine if error is quota exhaustion / 429
      let clientMsg = 'The AI is busy right now, try again in a minute.';
      if (!isRetryableError(lastError)) {
        clientMsg = lastError.message || 'AI request failed.';
      }

      // Log failure to AILog
      try {
        if (userId && mongoose.connection.readyState === 1) {
          await AILog.create({
            userId,
            role: userRole,
            subjectId,
            topicId,
            feature,
            prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
            response: { error: lastError.message },
            tokens: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
            latencyMs,
            status: 'error',
            errorMessage: clientMsg,
            schoolId,
          });
        }
      } catch (e) {
        console.error('Failed to log error to AILog:', e);
      }

      const finalErr = new Error(clientMsg);
      finalErr.status = isRetryableError(lastError) ? 429 : 500;
      finalErr.originalError = lastError;
      throw finalErr;
    }

    // Log success to AILog
    try {
      if (userId && mongoose.connection.readyState === 1) {
        await AILog.create({
          userId,
          role: userRole,
          subjectId,
          topicId,
          feature,
          prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
          response: result.data || result.text || result,
          tokens: result.tokens || { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
          latencyMs,
          status: 'success',
          schoolId,
        });
      }
    } catch (e) {
      console.error('Failed to log success to AILog:', e);
    }

    // Cache if cacheKey provided
    if (cacheKey && result) {
      setCachedResult(cacheKey, result);
    }

    return result;
  } finally {
    releaseConcurrencySlot();
  }
}

/**
 * Execute JSON with optional Zod validation and 1-time schema retry.
 */
async function executeJSON({
  user,
  feature,
  prompt,
  systemInstruction,
  schema,
  responseSchema,
  zodSchema,
  subjectId,
  topicId,
  cacheKey,
}) {
  try {
    const res = await executeAI({
      user,
      feature,
      prompt,
      systemInstruction,
      operationType: 'json',
      operationArgs: { schema, responseSchema },
      subjectId,
      topicId,
      cacheKey,
    });

    if (zodSchema) {
      const validation = zodSchema.safeParse(res.data);
      if (!validation.success) {
        console.warn(`[AI Executor] Zod validation failed for ${feature}. Retrying once with error details.`);
        const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous output failed schema validation with: ${validation.error.message}. Return valid JSON matching the exact schema requirements.`;
        const retryRes = await executeAI({
          user,
          feature,
          prompt: retryPrompt,
          systemInstruction,
          operationType: 'json',
          operationArgs: { schema, responseSchema },
          subjectId,
          topicId,
        });

        const retryValidation = zodSchema.safeParse(retryRes.data);
        if (!retryValidation.success) {
          throw new Error(`AI generated JSON output failed validation: ${retryValidation.error.message}`);
        }
        return retryRes;
      }
    }

    return res;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  executeAI,
  executeJSON,
  setCachedResult,
  getCachedResult,
};
