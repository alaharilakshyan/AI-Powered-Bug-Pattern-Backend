import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate paths to support both root data/ location and relative imports
const candidatePaths = [
  path.resolve(__dirname, '../../../data/stackoverflow/website-upload.json'),
  path.resolve(process.cwd(), 'data/stackoverflow/website-upload.json'),
  path.resolve(__dirname, 'data/website-upload.json'),
  path.resolve(__dirname, '../../Testcase/data/website-upload.json')
];

function resolveDatasetPath() {
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidatePaths[0];
}

const DATA_FILE = resolveDatasetPath();

// Stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
  'error', 'warning', 'issue', 'problem', 'fix', 'help', 'code', 'line', 'using', 'get', 'got'
]);

/**
 * Strips hostile tags, event handlers, and javascript: protocols from HTML.
 */
export function sanitizeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  let clean = rawHtml;

  // 1. Strip script, style, iframe, object, embed tags entirely
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Strip inline event handlers (e.g. onload, onerror, onclick)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Strip javascript: and vbscript: URIs
  clean = clean.replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'src=""');

  // 4. Force safe external link targets
  clean = clean.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    if (!attrs.includes('rel=')) {
      return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
    }
    return match;
  });

  return clean.trim();
}

/**
 * Extracts plain text code blocks from <pre><code> tags.
 */
export function extractCodeBlocks(html) {
  if (!html) return [];
  const blocks = [];
  const codeRegex = /<pre><code(?:\s+class="[^"]*")?>([\s\S]*?)<\/code><\/pre>/gi;
  let match;

  while ((match = codeRegex.exec(html)) !== null) {
    const rawCode = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (rawCode) {
      blocks.push(rawCode);
    }
  }

  return blocks;
}

/**
 * Converts HTML body into plain readable text.
 */
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<pre><code>[\s\S]*?<\/code><\/pre>/gi, ' [CODE_BLOCK] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into normalized search tokens.
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_#+.-]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * In-memory searchable knowledge base holding the Stack Overflow pilot data.
 */
export class StackOverflowKnowledgeEngine {
  constructor(datasetPath = null) {
    this.datasetPath = datasetPath || resolveDatasetPath();
    this.questions = [];
    this.metadata = null;
    this.isLoaded = false;
    this.invertedIndex = new Map();
  }

  /**
   * Initializes and indexes the dataset.
   */
  async load() {
    if (this.isLoaded) return;

    if (!fs.existsSync(this.datasetPath)) {
      throw new Error(`Stack Overflow dataset not found at ${this.datasetPath}`);
    }

    const raw = await fs.promises.readFile(this.datasetPath, 'utf-8');
    const parsed = JSON.parse(raw);

    this.metadata = {
      schemaVersion: parsed.schema_version,
      source: parsed.source,
      questionCount: parsed.question_count,
      selectedAnswers: parsed.selection?.selected_answers || 0,
      generatedAt: parsed.generated_at
    };

    this.questions = parsed.questions || [];
    this._buildInvertedIndex();
    this.isLoaded = true;
  }

  /**
   * Builds an inverted token index for lightning-fast lookups (< 2ms).
   */
  _buildInvertedIndex() {
    this.invertedIndex.clear();

    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      const titleTokens = tokenize(q.title);
      const tagTokens = (q.tags || []).map(t => t.toLowerCase());
      const bodyTokens = tokenize(htmlToPlainText(q.body_html)).slice(0, 50);

      const allTokens = new Set([...titleTokens, ...tagTokens, ...bodyTokens]);

      for (const token of allTokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, []);
        }
        this.invertedIndex.get(token).push(i);
      }
    }
  }

  /**
   * Searches the knowledge base and returns top-N ranked solutions with strict leak prevention.
   *
   * @param {Object} queryParams
   * @param {string} queryParams.error - Error message or stack trace
   * @param {string} [queryParams.language] - Programming language hint (e.g. 'java', 'python')
   * @param {string[]} [queryParams.tags] - Explicit tags
   * @param {string} [queryParams.code] - Problematic code snippet
   * @param {number} [queryParams.limit=3] - Maximum results (bounded between 1 and 5 to prevent data dumping)
   */
  search(queryParams = {}) {
    if (!this.isLoaded) {
      throw new Error('Knowledge engine not initialized. Call load() first.');
    }

    const { error = '', language = '', tags = [], code = '', limit = 3 } = queryParams;
    const cleanError = String(error).trim();
    const cleanLanguage = String(language).toLowerCase().trim();
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).toLowerCase().trim()) : [];
    const cleanCode = String(code).trim();

    // Protection against data dumping: Reject empty queries
    if (!cleanError && !cleanLanguage && cleanTags.length === 0 && !cleanCode) {
      return {
        query: { error: cleanError, language: cleanLanguage, tags: cleanTags },
        totalMatches: 0,
        results: []
      };
    }

    // Strict boundary limit: between 1 and 5 results (never dump all 179 questions)
    const effectiveLimit = Math.max(1, Math.min(5, parseInt(limit, 10) || 3));

    // Combine search signals
    const searchString = `${cleanLanguage} ${cleanTags.join(' ')} ${cleanError} ${cleanCode}`;
    const queryTokens = Array.from(new Set(tokenize(searchString)));

    // Candidate scoring
    const scores = new Map(); // questionIndex -> score

    for (const token of queryTokens) {
      const matchingIndices = this.invertedIndex.get(token) || [];
      for (const idx of matchingIndices) {
        const q = this.questions[idx];
        let tokenScore = 1;

        // Extra weight for language / tag match
        if (q.tags && q.tags.includes(token)) {
          tokenScore += 12;
        }

        // Extra weight for title token match
        if (q.title.toLowerCase().includes(token)) {
          tokenScore += 6;
        }

        scores.set(idx, (scores.get(idx) || 0) + tokenScore);
      }
    }

    // Direct phrase matching bonus
    const lowerError = cleanError.toLowerCase();
    for (const [idx, currentScore] of scores.entries()) {
      const q = this.questions[idx];
      const lowerTitle = q.title.toLowerCase();

      // Substring title match
      if (lowerError && lowerTitle.includes(lowerError)) {
        scores.set(idx, currentScore + 25);
      } else if (lowerTitle.length > 5 && lowerError.includes(lowerTitle)) {
        scores.set(idx, currentScore + 20);
      }

      // Only apply reputation and accepted boost if the question has solid keyword relevance (>= 8)
      if (currentScore >= 8) {
        const voteBoost = Math.log10(Math.max(1, q.score || 0)) * 1.5;
        const acceptedBoost = (q.answers || []).some(a => a.is_accepted) ? 2 : 0;
        scores.set(idx, currentScore + voteBoost + acceptedBoost);
      }
    }

    // Sort by score descending and enforce strong relevance threshold (minimum 12)
    const rankedEntries = Array.from(scores.entries())
      .filter(([_, score]) => score >= 12)
      .sort((a, b) => b[1] - a[1])
      .slice(0, effectiveLimit);

    // Format secure, non-exposing output with full attribution
    const results = rankedEntries.map(([idx, relScore]) => {
      const q = this.questions[idx];
      const bestAnswer = (q.answers || []).find(a => a.is_accepted) || q.answers?.[0] || null;

      const codeSnippets = bestAnswer ? extractCodeBlocks(bestAnswer.body_html) : [];

      return {
        questionId: q.question_id,
        relevanceScore: Math.round(relScore * 10) / 10,
        title: q.title,
        tags: q.tags,
        score: q.score,
        questionUrl: q.url,
        contentLicense: q.content_license || 'CC BY-SA 4.0',
        author: q.author || { display_name: 'Stack Overflow Community', profile_url: null },
        bestAnswer: bestAnswer ? {
          answerId: bestAnswer.answer_id,
          score: bestAnswer.score,
          isAccepted: Boolean(bestAnswer.is_accepted),
          url: bestAnswer.url,
          contentLicense: bestAnswer.content_license || q.content_license || 'CC BY-SA 4.0',
          author: bestAnswer.author || { display_name: 'Stack Overflow Contributor', profile_url: null },
          bodyPlain: htmlToPlainText(bestAnswer.body_html).slice(0, 600) + '...',
          bodyHtmlSanitized: sanitizeHtml(bestAnswer.body_html),
          codeSnippets: codeSnippets.slice(0, 2)
        } : null,
        alternativeAnswersCount: Math.max(0, (q.answers?.length || 0) - 1),
        attributionNotice: 'Source: Stack Overflow / Stack Exchange (Licensed under CC BY-SA)'
      };
    });

    return {
      query: {
        error: cleanError.slice(0, 100),
        language: cleanLanguage,
        tags: cleanTags
      },
      totalMatches: rankedEntries.length,
      limitApplied: effectiveLimit,
      results
    };
  }
}

