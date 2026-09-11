/**
 * Sanitizes input text by redacting sensitive information like API keys,
 * passwords, JWT tokens, and database credentials before payload transmission.
 */

const REDACTION_PATTERNS = [
  // OpenAI / Anthropic / Gemini API Keys
  { name: 'OpenAI/Anthropic API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: 'Google Gemini API Key', regex: /AIzaSy[a-zA-Z0-9_-]{30,35}/g },
  
  // AWS Access Key ID
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
  
  // JWT & Bearer Tokens
  { name: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9\._\-]{20,}/g },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  
  // BugGraph Dev Token
  { name: 'BugGraph Secret Token', regex: /bg_token_[a-zA-Z0-9_-]+/g },

  // Generic Password / Secret Key fields in JSON / env strings
  { name: 'Secret Value String', regex: /(api_key|apikey|secret|password|passwd|auth_token)\s*[:=]\s*["']?([^\s"']+)["']?/gi },

  // RSA / Private Keys
  { name: 'Private Key Block', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g }
];

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Redact DB URIs preserving scheme
  sanitized = sanitized.replace(/(mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/([^:]+):([^@]+)@/gi, '$1://[REDACTED_USER]:[REDACTED_PASS]@');

  // Redact key=val pairs
  sanitized = sanitized.replace(/(api_key|apikey|secret|password|passwd|auth_token)\s*[:=]\s*["']?([^\s"']+)["']?/gi, '$1=[REDACTED_SECRET]');

  // Redact specific regex matches
  for (const { regex } of REDACTION_PATTERNS) {
    sanitized = sanitized.replace(regex, '[REDACTED_SECRET]');
  }

  return sanitized;
}
