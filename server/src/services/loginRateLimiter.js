// Failed login attempts tracker: email -> { count, firstFailedAt, blockedUntil }
const failedAttempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(email) {
  if (!email) return false;
  const key = email.toLowerCase().trim();
  const entry = failedAttempts.get(key);
  if (!entry) return false;

  const now = Date.now();
  // Check if window has expired
  if (now - entry.firstFailedAt > WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry || (now - entry.firstFailedAt > WINDOW_MS)) {
    failedAttempts.set(key, { count: 1, firstFailedAt: now });
  } else {
    entry.count += 1;
  }
}

function resetFailedAttempts(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  failedAttempts.delete(key);
}

function getRemainingTimeMinutes(email) {
  if (!email) return 0;
  const key = email.toLowerCase().trim();
  const entry = failedAttempts.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.firstFailedAt;
  const remaining = Math.max(0, WINDOW_MS - elapsed);
  return Math.ceil(remaining / (60 * 1000));
}

module.exports = {
  isRateLimited,
  recordFailedAttempt,
  resetFailedAttempts,
  getRemainingTimeMinutes,
};
