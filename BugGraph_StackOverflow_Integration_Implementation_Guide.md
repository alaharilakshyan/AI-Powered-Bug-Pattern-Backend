# BugGraph — Stack Overflow Knowledge Integration
## Complete Backend Architecture, Implementation Roadmap, and Verification Checklist

**Project:** BugGraph — AI-Powered Bug Pattern Backend  
**Repository:** https://github.com/alaharilakshyan/AI-Powered-Bug-Pattern-Backend.git  
**Inspected branch:** `feature/cli-workstation`  
**Knowledge source:** Stack Overflow pilot dataset supplied as `buggraph-stackoverflow-bundle.zip`  
**Document purpose:** An implementation-ready guide for integrating the pilot Q&A dataset into BugGraph as a searchable, attributable knowledge source, connecting it to the existing debugging workflow, and verifying the implementation end to end.

---

# 1. Project objective

The goal is to make BugGraph use the supplied Stack Overflow pilot dataset to retrieve relevant, real-world developer questions and answers when a developer submits an error, code snippet, or debugging request.

The system should:

1. Accept a developer's error message, programming language, framework or technology context, and optional code snippet.
2. Normalize and analyse the submitted information.
3. Search the Stack Overflow knowledge dataset for relevant questions and answers.
4. Rank the best matches using meaningful retrieval signals rather than fabricated similarity percentages.
5. Return the matching question and selected answer content with original URLs, author attribution, source information, and license metadata.
6. Optionally pass the retrieved evidence to BugGraph's existing AI analysis layer so that the AI can produce a diagnosis grounded in the retrieved material.
7. Display the AI diagnosis separately from the related Stack Overflow knowledge in the frontend.
8. Handle weak or absent matches honestly rather than inventing a solution.

**This is a retrieval and knowledge-integration task, not a model-training task.** The pilot JSON is a knowledge source. Do not train or fine-tune a model on it as part of this implementation. The dataset is small enough to load and index in memory initially.

## 1.1 Expected end-user experience

A developer submits something similar to:

```json
{
  "error": "TypeError: Cannot read properties of undefined",
  "language": "javascript",
  "framework": "react",
  "code": "const name = user.profile.name;"
}
```

BugGraph should then:

- Identify useful terms such as `TypeError`, `undefined`, `javascript`, and `react`.
- Search the local Stack Overflow knowledge index.
- Rank relevant questions.
- Return a small number of useful matches, such as the top five, when they meet a relevance threshold.
- Preserve the original Stack Overflow question and answer URLs.
- Display author names and license metadata where supplied.
- Provide an honest no-match or low-confidence response if the retrieved results are not sufficiently relevant.
- Continue to use the existing AI analysis flow where that flow is available and appropriate.

The Stack Overflow result is supporting evidence. It is not automatically the final diagnosis for the developer's exact code.

---

# 2. What is already available

## 2.1 Supplied dataset

The supplied archive is:

```text
buggraph-stackoverflow-bundle.zip
```

The archive contains a pilot Stack Overflow dataset, raw API snapshots, processed JSON files, a website-oriented export, and scripts for ingestion/export.

The inspected dataset summary is:

| Item | Observed value |
|---|---:|
| Questions | 179 |
| Raw source answers | 5,786 |
| Selected answers in website export | 536 |
| Selected answers per question | Up to 3 |
| Approximate website export size | 1.65 MB |
| Questions with at least one answer | 179 |
| Questions with an accepted answer | 159 |

The export selects answers with the accepted answer first, then prioritizes higher score, with recency used as a tie-breaker. Do not assume that the selected answers represent every answer available on Stack Overflow.

### Common tags in the pilot

The most frequent tags observed include:

| Tag | Question count |
|---|---:|
| `java` | 57 |
| `javascript` | 52 |
| `spring` | 30 |
| `python` | 30 |
| `reactjs` | 30 |
| `sql` | 30 |
| `sql-server` | 13 |
| `arrays` | 9 |
| `t-sql` | 9 |
| `string` | 8 |
| `loops` | 6 |
| `spring-mvc` | 6 |
| `annotations` | 6 |
| `mysql` | 6 |

Counts describe this pilot export, not the complete Stack Overflow platform. The pilot is deliberately limited and should not be presented as an exhaustive programming knowledge base.

## 2.2 Relevant files in the supplied archive

The archive includes these important paths:

```text
README.md
data/
  stackoverflow/
    README_FOR_PARTNER.md
    processed/
      questions.json
      answers.json
    raw/
      ...
    website-upload.json
src/
  data/
    stackoverflow/
      index.js
      api.js
      storage.js
      exportWebsiteData.js
package.json
```

### File responsibilities

| File | Purpose |
|---|---|
| `data/stackoverflow/processed/questions.json` | Processed question records |
| `data/stackoverflow/processed/answers.json` | Processed answer records |
| `data/stackoverflow/website-upload.json` | Consolidated export intended for the website/demo integration |
| `data/stackoverflow/raw/` | Raw API snapshots for archival/reprocessing |
| `src/data/stackoverflow/index.js` | Ingestion entry point and tag/query configuration |
| `src/data/stackoverflow/api.js` | Stack Exchange API interaction |
| `src/data/stackoverflow/storage.js` | Dataset persistence/storage support for the ingestion process |
| `src/data/stackoverflow/exportWebsiteData.js` | Builds the website-oriented consolidated JSON |
| `data/stackoverflow/README_FOR_PARTNER.md` | Partner integration instructions |
| `package.json` | Ingestion and export scripts |

The inspected package scripts include:

```bash
npm run ingest:stackoverflow
npm run export:website-data
```

The ingestion configuration was observed to use Stack Exchange API v2.3 and default tags including:

```text
java, python, javascript, reactjs, spring, sql
```

The default ingestion configuration was observed to cap collection at approximately 30 questions per tag. Verify the current scripts and configuration in the actual working copy before changing them.

**Important:** Keep the raw snapshots for archival/reprocessing. Do not upload the raw archive or raw snapshots to the browser. Use the consolidated website export for the initial integration.

## 2.3 License and attribution facts

The inspected question license distribution was:

| Question license | Count |
|---|---:|
| CC BY-SA 4.0 | 146 |
| CC BY-SA 3.0 | 23 |
| CC BY-SA 2.5 | 1 |
| Missing/null | 9 |

The inspected answer license distribution was:

| Answer license | Count |
|---|---:|
| CC BY-SA 4.0 | 404 |
| CC BY-SA 3.0 | 123 |
| CC BY-SA 2.5 | 9 |

All inspected selected answers had a license value. Nine question records had a missing question license value.

Do not invent or infer a missing license. For a record with a missing question license, refresh the metadata from the source if possible. Until confirmed, show only a short match with a link if that is consistent with the project's legal review and the source's applicable terms; do not present a guessed license.

For displayed Stack Overflow content, preserve at least:

- Original question URL.
- Original answer URL, where an answer is displayed.
- Question author.
- Answer author, where an answer is displayed.
- Source identification as Stack Overflow.
- License field exactly as supplied/verified.
- Appropriate attribution and links to the original material.

The project should review the Stack Exchange/Stack Overflow attribution and license requirements before production release. This implementation guide is an engineering checklist, not legal advice.

---

# 3. What was found in the existing BugGraph repository

The inspected repository branch is:

```text
feature/cli-workstation
```

The branch contains CLI/workstation-side code. It should not be assumed to be the complete production backend implementation.

Relevant files observed include:

```text
bin/buggraph.js
src/api.js
src/commands/solve.js
src/commands/explain.js
src/commands/fix.js
src/commands/debug.js
src/commands/similarity.js
src/ui/server.js
src/config.js
src/sanitizer.js
src/security.js
```

## 3.1 Existing CLI/workstation responsibilities

| File | Existing area to understand |
|---|---|
| `bin/buggraph.js` | CLI entry point and command registration |
| `src/api.js` | Client that communicates with the remote backend |
| `src/commands/solve.js` | Existing solve command flow |
| `src/commands/explain.js` | Explanation command |
| `src/commands/fix.js` | Fix-oriented command |
| `src/commands/debug.js` | Debugging command |
| `src/commands/similarity.js` | Similarity command; currently uses predefined patterns/static values |
| `src/ui/server.js` | Local workstation HTTP server and local endpoints |
| `src/config.js` | CLI/workstation configuration |
| `src/sanitizer.js` | Existing sanitization-related logic |
| `src/security.js` | Existing security-related logic |

## 3.2 Important gaps and integration risks

### Gap A — No verified production knowledge API in the inspected branch

The inspected branch did not establish that a production database-backed endpoint such as `/api/solutions/search` or `/api/bugs` already exists.

Before implementing the API, identify the actual backend server repository, branch, framework, and entry point. The CLI/workstation repository and production backend may be separate projects.

Do not create a second competing backend inside the CLI project merely because the production backend was not present in the inspected branch.

### Gap B — Similarity command is not a real retrieval engine

The current `src/commands/similarity.js` was observed to rely on predefined patterns and static similarity figures, for example values such as 94.8%, 98.2%, and 91.5%.

These are not measured retrieval scores and must not be represented as genuine model confidence or similarity results.

Replace the hardcoded matching logic with a call to the actual knowledge-retrieval service/API. If a numerical relevance score is displayed, define it as an internal ranking score, not a probability or calibrated confidence percentage.

### Gap C — Existing API path mismatch to resolve

The inspected CLI API client in `src/api.js` calls a remote solve path similar to:

```text
/api/debug/solve
```

The local workstation server in `src/ui/server.js` exposes a local path similar to:

```text
/api/solve
```

These serve different roles. Map the actual request flow before editing. Do not assume the remote API client and local workstation server are interchangeable.

### Gap D — Existing AI analysis must be preserved

The Stack Overflow retrieval service should enhance the existing debugging workflow, not silently replace it.

The previous architecture discussion used a placeholder name such as:

```js
runExistingAIAnalysis()
```

This is an illustrative integration point, not a verified function name in the repository. Find the real existing AI/inference function in the backend before wiring it in.

### Gap E — HTML content must not be rendered unsafely

The export contains `body_html` fields. Treat these as untrusted HTML.

Do not directly inject raw `body_html` into the frontend. Use a trusted sanitizer with a restrictive allowlist, or convert content to plain text for indexing and display. Sanitization must be applied at the appropriate trust boundary, and frontend rendering should remain safe even if backend sanitization is present.

---

# 4. Target architecture

The recommended first implementation is a backend-owned knowledge retrieval layer. The frontend should not be responsible for loading or searching the production knowledge dataset.

## 4.1 High-level request flow

```text
Developer / Frontend / CLI
          |
          v
   BugGraph API endpoint
          |
          v
   Request validation
          |
          v
   Input normalization
          |
          v
   Debug / Knowledge service
          |
          +------------------------------+
          |                              |
          v                              v
 Existing AI analysis             Knowledge Retriever
 (existing flow)                         |
          |                              v
          |                       In-memory knowledge index
          |                              |
          |                              v
          |                       Candidate retrieval
          |                              |
          |                              v
          |                       Ranking and filtering
          |                              |
          +---------------+--------------+
                          |
                          v
                 Response composition
                          |
                          v
                Frontend / CLI response
                          |
                          v
       AI Diagnosis + Related Knowledge results
```

The exact order of AI analysis and retrieval can be adjusted to suit the existing backend. The important design requirement is that the retrieval layer returns evidence that can be shown and/or passed to the AI analysis layer. The AI must not fabricate Stack Overflow sources.

## 4.2 Recommended backend folder structure

Adapt this structure to the actual backend framework and conventions. It is a logical target, not a claim that these files already exist.

```text
backend/
├── data/
│   └── stackoverflow/
│       └── website-upload.json
│
├── src/
│   ├── routes/
│   │   └── solutionRoutes.js
│   │
│   ├── controllers/
│   │   └── solutionController.js
│   │
│   ├── services/
│   │   ├── debugService.js
│   │   └── solutionSearchService.js
│   │
│   ├── knowledge/
│   │   ├── stackoverflowLoader.js
│   │   ├── textNormalizer.js
│   │   ├── htmlToText.js
│   │   ├── knowledgeIndexer.js
│   │   ├── knowledgeRetriever.js
│   │   ├── knowledgeRanker.js
│   │   └── knowledgeTypes.js
│   │
│   ├── middleware/
│   │   └── validateSolutionSearch.js
│   │
│   ├── utils/
│   │   └── sanitizeContent.js
│   │
│   └── app.js
│
└── tests/
    ├── knowledge/
    │   ├── stackoverflowLoader.test.js
    │   ├── textNormalizer.test.js
    │   ├── knowledgeRetriever.test.js
    │   └── knowledgeRanker.test.js
    │
    └── api/
        └── solutionSearch.test.js
```

If the existing backend uses a different naming convention, preserve that convention. Do not create duplicate route, controller, or service layers just to match this diagram.

## 4.3 Responsibilities of each new module

| Module | Responsibility |
|---|---|
| `stackoverflowLoader.js` | Read and validate the consolidated JSON once; cache parsed data |
| `htmlToText.js` | Convert question/answer HTML to safe plain text for indexing |
| `textNormalizer.js` | Normalize case, punctuation, whitespace, and tokens |
| `knowledgeIndexer.js` | Build searchable in-memory records/index structures |
| `knowledgeRetriever.js` | Find candidate questions from the normalized request |
| `knowledgeRanker.js` | Score and order candidates using explicit ranking signals |
| `knowledgeTypes.js` | Document or define normalized question/answer/result shapes |
| `solutionSearchService.js` | Coordinate validation, retrieval, ranking, and response shaping |
| `solutionController.js` | Convert HTTP request to service call and map errors to HTTP responses |
| `solutionRoutes.js` | Register the API endpoint |
| `debugService.js` | Integrate retrieved evidence with the existing AI debugging flow |
| `validateSolutionSearch.js` | Validate request body and input sizes/types |
| `sanitizeContent.js` | Ensure displayed content is safe under the chosen rendering strategy |

Keep modules focused. Do not put all retrieval, HTTP, AI, and HTML-sanitization logic into one large file.

---

# 5. Dataset placement and loading

## 5.1 Put the correct export in the backend

For the first backend implementation, copy:

```text
data/stackoverflow/website-upload.json
```

to the backend project's data directory:

```text
backend/data/stackoverflow/website-upload.json
```

Use the real location appropriate to the actual backend repository. Do not place raw API snapshots in a public frontend directory.

## 5.2 Loader requirements

The loader must:

1. Resolve the dataset path from a stable project-relative path, not from the process's current working directory if that can vary.
2. Read the JSON file.
3. Parse it once at application startup or on first use.
4. Validate the top-level schema and required fields.
5. Validate each question and its answer collection sufficiently to avoid runtime crashes.
6. Normalize records into a consistent internal structure.
7. Cache the result in memory.
8. Expose a clear health/status result for tests and diagnostics.
9. Fail clearly if the file is missing or malformed. Do not silently return an empty knowledge base.
10. Avoid re-reading and reparsing the entire JSON file on every API request.

The pilot export is approximately 1.65 MB, so loading and indexing it in memory is reasonable for the first version.

### Example loader shape

This is an implementation sketch. Adapt the exact fields to the real JSON schema and existing backend module system.

```js
// src/knowledge/stackoverflowLoader.js

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

let cachedKnowledge = null;

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const datasetPath = path.resolve(
  currentDirectory,
  "../../data/stackoverflow/website-upload.json"
);

export async function loadStackOverflowKnowledge() {
  if (cachedKnowledge) {
    return cachedKnowledge;
  }

  const raw = await fs.readFile(datasetPath, "utf8");
  const parsed = JSON.parse(raw);

  validateDataset(parsed);

  cachedKnowledge = normalizeDataset(parsed);
  return cachedKnowledge;
}

function validateDataset(dataset) {
  if (!dataset || typeof dataset !== "object") {
    throw new Error("Stack Overflow dataset must be a JSON object.");
  }

  // Add checks for the actual schema_version, questions array,
  // metadata, and required question/answer fields.
}

function normalizeDataset(dataset) {
  // Convert the actual export schema into the internal record shape.
  // Preserve original URLs, authors, IDs, tags, scores, dates and licenses.
  return dataset;
}
```

Do not copy this sketch blindly. First inspect the exact top-level and nested structure of `website-upload.json`; the loader's validation and normalization must match that schema.

## 5.3 Recommended normalized internal record

Create an internal representation that makes question and answer data easy to search and display. Example:

```js
{
  source: "stackoverflow",
  questionId: 123456,
  title: "Example question title",
  bodyText: "Plain text extracted from the question body",
  bodyHtml: "<p>Original source HTML, retained only if required</p>",
  tags: ["javascript", "reactjs"],
  questionUrl: "https://stackoverflow.com/questions/...",
  questionAuthor: {
    name: "Original author",
    profileUrl: "https://stackoverflow.com/users/..."
  },
  questionScore: 10,
  questionLicense: "CC BY-SA 4.0",
  answers: [
    {
      answerId: 987654,
      bodyText: "Plain text extracted from the answer body",
      bodyHtml: "<p>Original answer HTML, retained only if required</p>",
      answerUrl: "https://stackoverflow.com/a/...",
      author: {
        name: "Answer author",
        profileUrl: "https://stackoverflow.com/users/..."
      },
      score: 15,
      isAccepted: true,
      license: "CC BY-SA 4.0"
    }
  ]
}
```

This is a target internal shape, not a promise that the source JSON uses these exact property names. Map the real export fields into this representation without losing provenance.

### Preserve these fields

- Stack Overflow question ID.
- Question title.
- Question body, preferably a plain-text indexing form.
- Original HTML only if it is required for safe rendering.
- Tags.
- Question URL.
- Question author name/profile URL.
- Question score.
- Creation/last-activity dates if supplied and useful.
- Question license.
- Selected answer IDs.
- Answer body.
- Answer URL.
- Answer author name/profile URL.
- Answer score.
- Accepted-answer flag.
- Answer license.
- Source identifier and dataset version/metadata.

---

# 6. HTML handling and safe text extraction

This is a critical implementation detail.

The dataset contains HTML fields such as `body_html`. HTML markup should not be treated as natural-language search text, and raw HTML must not be rendered without sanitization.

## 6.1 For indexing

Convert HTML to plain text before tokenization. A robust HTML parser is preferred over a simple regular expression because HTML can contain:

- Nested tags.
- Entities such as `&amp;` and `&lt;`.
- Code blocks.
- Inline code.
- Links.
- Lists.
- Formatting tags.
- Script/style elements in malformed or unexpected input.

For indexing, retain useful text from titles, paragraphs, lists, and code snippets, but consider separating code tokens from prose tokens so code does not drown out the actual error message.

Suggested fields:

```js
{
  titleText: "...",
  bodyText: "...",
  codeText: "...",
  tags: [...]
}
```

## 6.2 For display

Choose one of these strategies:

**Preferred simple first version:** Convert HTML to plain text and display the plain text. This avoids complex rich-HTML rendering.

**If rich formatting is needed:** Sanitize HTML using a trusted sanitizer with a restrictive allowlist. Remove scripts, event-handler attributes, dangerous URLs, embedded objects, and unsupported elements. Only render the sanitized result.

Do not rely on a regex-only HTML sanitizer. Do not assume that backend sanitization makes unsafe frontend rendering acceptable.

## 6.3 HTML safety verification

- [ ] Question body is converted to plain text before indexing.
- [ ] Answer body is converted to plain text before indexing.
- [ ] HTML entities are decoded correctly.
- [ ] Code examples remain understandable and are not merged into unrelated prose.
- [ ] Raw HTML is never inserted directly into the DOM.
- [ ] If rich HTML is used, a trusted sanitizer is configured and tested.
- [ ] Test content containing `<script>`, event handlers, and `javascript:` URLs is neutralized.
- [ ] Search indexing does not give high weight to tag names such as `div`, `span`, or `code`.

---

# 7. Retrieval and ranking design

## 7.1 First version: transparent keyword retrieval

Start with a deterministic keyword retrieval engine. It is easier to debug, test, explain, and run locally than a model-training pipeline.

The first version should:

1. Normalize the incoming error text.
2. Extract meaningful terms from the error message.
3. Extract useful terms from the language/framework fields.
4. Extract selected terms from the code snippet, with lower weight than the error message.
5. Search the indexed question title, tags, and body text.
6. Calculate a ranking score using defined weights.
7. Apply language/framework compatibility signals when available.
8. Sort candidates by score.
9. Apply a minimum relevance threshold.
10. Return at most a configurable number of results, initially five.

## 7.2 Normalize the developer input

Normalize:

- Case.
- Repeated whitespace.
- Common punctuation.
- Stack-trace line numbers and unstable file paths where appropriate.
- Repeated tokens.
- Common stop words.

Do not remove meaningful programming terms, operators, exception names, identifiers, or framework names.

Preserve useful error phrases such as:

```text
TypeError
NullPointerException
Cannot read properties of undefined
IndexError
ModuleNotFoundError
SQL syntax error
```

Consider extracting the exception class and key message phrase separately.

## 7.3 Do not let code drown out the error

A long code sample can contain hundreds of tokens. If all tokens receive equal weight, generic code terms may dominate the error message.

Use separate signal groups:

- Error message tokens: highest importance.
- Exception/class name: highest importance.
- Language/framework: strong compatibility signal.
- Question title: strong match signal.
- Question tags: strong match signal.
- Question body prose: medium match signal.
- Code tokens: lower match signal.
- Popularity/accepted-answer status: tie-breakers or small ranking boosts, not proof of correctness.

## 7.4 Suggested initial ranking model

A transparent first-pass score can combine:

```text
total score =
  error-term matches
  + exception-name matches
  + title matches
  + tag matches
  + body-text matches
  + language/framework compatibility
  + small accepted-answer/popularity tie-breakers
```

An example set of weights to start experimentation:

| Signal | Suggested initial weight |
|---|---:|
| Exact exception/error phrase in title | 10 |
| Error token in title | 5 |
| Exact error token in body | 3 |
| Matching language tag | 4 |
| Matching framework tag | 4 |
| Other matching tag | 2 |
| Body prose token match | 1 |
| Code token match | 0.5 |
| Accepted answer exists | Small tie-breaker |
| Question/answer score | Small tie-breaker |

These are starting weights, not empirically validated values. Tune them using test queries and labelled relevance judgments.

Avoid double-counting the same token excessively. Normalize scores if necessary so questions with long bodies do not automatically dominate short, precise questions.

## 7.5 Language and framework filtering

If a request specifies a language or framework:

- Prefer questions whose tags match that language/framework.
- Do not require a tag that does not exist in the pilot dataset.
- If strict filtering returns no results, perform a broader fallback search and mark the result as a broader match.
- Do not claim that a JavaScript result is a React-specific solution unless the record supports that claim.
- Avoid filtering out a useful generic error question solely because its tags omit the supplied framework.

## 7.6 Stop words and programming vocabulary

Use a stop-word list, but keep programming-relevant words. Do not remove tokens such as:

```text
undefined, null, async, await, promise, import, export,
exception, error, array, object, index, query, join,
component, state, props, dependency, memory
```

Consider a small synonym/alias map only when there is a clear technical equivalence. Do not over-normalize different errors into the same term.

## 7.7 Thresholds and no-match behavior

Do not return five irrelevant records simply because five records exist.

- Set a minimum score/relevance threshold.
- Make the threshold configurable.
- If no candidate clears the threshold, return an empty result list with a clear no-match status.
- If only one or two candidates qualify, return only those candidates.
- Distinguish `no_matches` from `dataset_unavailable` and `search_failed`.
- Do not represent the raw ranking score as a calibrated probability.
- Do not claim a retrieved answer will definitely fix the submitted code.

## 7.8 Illustrative retrieval pseudocode

This is an architectural sketch. It is not production-ready code and must be adapted to the real export schema.

```js
export function retrieveCandidates(request, indexedQuestions) {
  const query = normalizeRequest(request);

  const candidates = indexedQuestions.map((question) => {
    const score = calculateRelevanceScore(query, question);

    return {
      question,
      score
    };
  });

  return candidates
    .filter((item) => item.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}
```

A scoring function should be independently testable:

```js
export function calculateRelevanceScore(query, question) {
  let score = 0;

  // Apply separately weighted signals:
  // - exact error phrase
  // - exception name
  // - title token overlap
  // - tags
  // - body prose
  // - code tokens at a lower weight
  // - language/framework compatibility
  // - small tie-breakers

  return score;
}
```

Do not copy the previous simplistic example that tokenized `body_html` directly. The body must first be converted to plain text. Do not tokenize the entire code sample with the same weight as the error message.

## 7.9 Later improvement: BM25 / TF-IDF

After the baseline works, improve retrieval with BM25 or TF-IDF.

Potential progression:

1. Deterministic weighted keyword matching.
2. BM25 or TF-IDF over title, tags, body prose, and code fields.
3. Query expansion for known exception aliases.
4. Optional embeddings for semantic retrieval.
5. Hybrid ranking combining lexical and semantic scores.

Do not add embeddings before the basic retrieval and evaluation pipeline is reliable. The pilot is small; simple keyword retrieval is sufficient to establish the end-to-end feature.

---

# 8. API contract

The partner integration notes describe a production search endpoint using:

```http
POST /api/solutions/search
```

The endpoint should accept an error description, language, and optional code. Framework/context can be added if supported by the product requirements.

## 8.1 Example request

```http
POST /api/solutions/search
Content-Type: application/json
```

```json
{
  "error": "TypeError: Cannot read properties of undefined",
  "language": "javascript",
  "framework": "react",
  "code": "const name = user.profile.name;"
}
```

## 8.2 Validation requirements

Validate:

- `error` is present and a non-empty string.
- `language` is present if required by the API contract; otherwise treat it as optional.
- `framework` is optional and must be a string when supplied.
- `code` is optional and must be a string when supplied.
- Maximum lengths are enforced to prevent abusive or accidental oversized payloads.
- Unknown fields are either rejected or safely ignored according to the existing API convention.
- Request content type is appropriate.
- Inputs are treated as untrusted data.

Return a clear `400 Bad Request` for invalid input.

## 8.3 Example successful response

Use a stable response shape similar to:

```json
{
  "status": "success",
  "query": {
    "language": "javascript",
    "framework": "react"
  },
  "matches": [
    {
      "source": "stackoverflow",
      "questionId": 123456,
      "title": "Example question title",
      "questionUrl": "https://stackoverflow.com/questions/...",
      "questionAuthor": {
        "name": "Original question author",
        "profileUrl": "https://stackoverflow.com/users/..."
      },
      "questionLicense": "CC BY-SA 4.0",
      "tags": ["javascript", "reactjs"],
      "relevanceScore": 18.5,
      "answers": [
        {
          "answerId": 987654,
          "bodyText": "Relevant answer text",
          "answerUrl": "https://stackoverflow.com/a/...",
          "author": {
            "name": "Answer author",
            "profileUrl": "https://stackoverflow.com/users/..."
          },
          "score": 15,
          "isAccepted": true,
          "license": "CC BY-SA 4.0"
        }
      ]
    }
  ],
  "meta": {
    "dataset": "stackoverflow-pilot",
    "datasetVersion": 1,
    "resultCount": 1,
    "maxResults": 5
  }
}
```

The IDs, titles, URLs, authors, tags, scores, and license values above are illustrative. The implementation must populate them from the actual dataset, not hardcode these example values.

If a question or answer has no license value, preserve null/unknown rather than inventing one.

## 8.4 Example no-match response

```json
{
  "status": "no_matches",
  "matches": [],
  "meta": {
    "dataset": "stackoverflow-pilot",
    "resultCount": 0,
    "maxResults": 5
  },
  "message": "No sufficiently relevant Stack Overflow matches were found in the current pilot dataset."
}
```

A no-match response is not an API failure. It is a valid search outcome.

## 8.5 Error responses

Use consistent error shapes and appropriate HTTP status codes.

| Situation | Suggested status |
|---|---:|
| Invalid request | 400 |
| Unauthenticated request, if authentication is required | 401 |
| Forbidden request | 403 |
| Dataset unavailable or invalid | 503 |
| Unexpected internal error | 500 |

Do not expose stack traces, file-system paths, secrets, API keys, or internal implementation details to the client.

---

# 9. Backend implementation sequence

Follow these phases in order. Do not start by changing the frontend or training a model.

## Phase 0 — Confirm the actual backend project

**Objective:** Identify where the production API belongs.

Steps:

1. Locate the actual backend server repository or folder.
2. Confirm its branch and framework.
3. Identify the application entry point.
4. Identify existing routes, controllers, and services.
5. Locate the existing AI/inference function used by the solve/debug flow.
6. Locate the existing database and configuration approach, if any.
7. Confirm how the CLI calls the backend.
8. Confirm whether the frontend already has a debugging/solution API client.
9. Map the current route paths and resolve the `/api/debug/solve` versus `/api/solve` distinction.
10. Record the actual files to modify before coding.

**Do not proceed by assuming the CLI repository is the production backend.** The inspected `feature/cli-workstation` branch does not by itself establish the full production backend architecture.

### Phase 0 verification

- [ ] Backend repository and branch are identified.
- [ ] Framework and server entry point are identified.
- [ ] Existing AI/inference function is located.
- [ ] Existing solve/debug request flow is documented.
- [ ] Existing API route paths are documented.
- [ ] CLI-to-backend and frontend-to-backend communication paths are understood.
- [ ] No duplicate backend is being created accidentally.

## Phase 1 — Add and validate the dataset

**Objective:** Make the consolidated pilot JSON available to the backend.

Steps:

1. Copy `website-upload.json` into the backend's private data directory.
2. Keep raw snapshots out of the public frontend bundle.
3. Inspect the actual top-level JSON structure.
4. Inspect question and answer field names.
5. Confirm schema version and dataset metadata.
6. Confirm question IDs and answer IDs are stable.
7. Confirm URLs, authors, tags, scores, and license fields are preserved.
8. Build the loader.
9. Add schema validation.
10. Cache the parsed dataset.
11. Add tests for valid, missing, malformed, and partially invalid data.
12. Expose dataset status in a health/diagnostic path if appropriate.

### Phase 1 verification

- [ ] Backend loads the correct consolidated JSON file.
- [ ] Loader does not depend on an accidental current working directory.
- [ ] Dataset is parsed once and cached.
- [ ] Expected pilot question count is observed (179 for this supplied export).
- [ ] Selected answer count is consistent with the supplied export (536 for this inspected export).
- [ ] Question and answer URLs remain intact.
- [ ] Authors and tags remain intact.
- [ ] License values remain intact, including null values.
- [ ] Missing/malformed dataset causes a clear, observable failure.
- [ ] API does not silently return an empty knowledge base when loading fails.

## Phase 2 — Build text normalization and indexing

**Objective:** Convert the dataset into searchable records.

Steps:

1. Implement HTML-to-text conversion.
2. Decode HTML entities.
3. Preserve code examples separately from prose where possible.
4. Normalize title, body, tags, and answer text.
5. Tokenize the fields separately.
6. Add a programming-aware stop-word list.
7. Preserve important exception and language terms.
8. Build the initial in-memory index.
9. Ensure question metadata and original content are retained for output.
10. Avoid re-indexing on every request.

### Phase 2 verification

- [ ] HTML is not indexed as raw markup.
- [ ] Entities decode correctly.
- [ ] Titles and tags are indexed separately.
- [ ] Body prose and code are not given identical weights by default.
- [ ] Exception names remain searchable.
- [ ] Original content and provenance can still be returned.
- [ ] Index creation occurs once per process or dataset reload.
- [ ] A simple diagnostic reports the number of indexed questions.

## Phase 3 — Implement retrieval and ranking

**Objective:** Return relevant questions rather than static or hardcoded matches.

Steps:

1. Normalize the incoming error request.
2. Extract exception names and important error phrases.
3. Extract language/framework context.
4. Extract code tokens with a lower weight.
5. Implement weighted matching over title, tags, body prose, and code.
6. Implement language/framework preference and broader fallback.
7. Implement deduplication by question ID.
8. Implement deterministic sorting and tie-breaking.
9. Add a configurable minimum score.
10. Add a configurable maximum result count, initially five.
11. Return no-match status if no result meets the threshold.
12. Ensure ranking scores are labelled as internal relevance scores, not confidence probabilities.

### Phase 3 verification

- [ ] A known JavaScript TypeError retrieves relevant JavaScript questions.
- [ ] A Java NullPointerException query prefers Java-tagged records.
- [ ] A SQL error prefers SQL-related records when relevant.
- [ ] A React query can use `reactjs` tags when present.
- [ ] A framework filter can fall back to broader results when strict filtering produces none.
- [ ] Long code snippets do not overwhelm the error message.
- [ ] Duplicate questions are not returned.
- [ ] Irrelevant results below threshold are excluded.
- [ ] Fewer than five results are returned when fewer than five qualify.
- [ ] No-match behavior is stable and does not invent results.
- [ ] The same input produces deterministic ordering when data is unchanged.

## Phase 4 — Add the API endpoint

**Objective:** Expose retrieval through a stable backend API.

Steps:

1. Add the route in the existing backend route structure.
2. Add request validation.
3. Add a controller.
4. Add a service that calls the retriever and ranker.
5. Shape the response using the documented contract.
6. Add error handling.
7. Add logging that avoids logging secrets or unnecessarily large code payloads.
8. Add authentication/rate limiting if required by the existing backend.
9. Add integration tests.
10. Document the endpoint for the frontend and CLI teams.

### Phase 4 verification

- [ ] `POST /api/solutions/search` is registered in the intended backend.
- [ ] Valid request returns `200`.
- [ ] Invalid request returns `400`.
- [ ] No-match request returns a valid no-match response.
- [ ] Dataset failure returns a clear service error, not a false no-match.
- [ ] Response schema is consistent.
- [ ] Original source URLs are included.
- [ ] Authors and license values are included.
- [ ] No internal stack trace or file path leaks to the client.
- [ ] Request size limits are enforced.
- [ ] API tests pass.

## Phase 5 — Integrate retrieval with existing AI debugging

**Objective:** Use retrieved knowledge as evidence in the existing AI diagnosis flow.

Steps:

1. Locate the actual existing AI/inference function.
2. Preserve its current request and response behavior.
3. Call the knowledge retrieval service with the developer's error context.
4. Pass only a limited number of relevant retrieved records to the AI layer.
5. Include the source title, relevant answer text, URL, author, and license metadata in the evidence context.
6. Instruct the AI to distinguish source evidence from its own reasoning.
7. Instruct the AI not to invent Stack Overflow citations or claim a source says something it does not.
8. Keep the final AI diagnosis separate from the raw related-knowledge list.
9. Handle retrieval failure without crashing the existing debugging flow, according to the product's chosen fallback policy.
10. Do not fabricate a retrieval result if the dataset is unavailable.

### Suggested AI context structure

```js
{
  developerInput: {
    error: "...",
    language: "javascript",
    framework: "react",
    code: "..."
  },
  retrievedEvidence: [
    {
      title: "...",
      relevantAnswerText: "...",
      questionUrl: "...",
      answerUrl: "...",
      questionAuthor: "...",
      answerAuthor: "...",
      questionLicense: "...",
      answerLicense: "..."
    }
  ]
}
```

### AI behavior requirements

The AI should:

- Explain whether the retrieved source appears relevant to the submitted error.
- Use retrieved content as supporting evidence, not unquestionable truth.
- Avoid claiming that a different question is identical to the user's issue.
- Mention when no sufficiently relevant source was found.
- Never create fake Stack Overflow links, authors, IDs, or license values.
- Keep its own suggested fix distinguishable from copied/source-derived material.
- Preserve the existing AI behavior when retrieval is unavailable, if the product's fallback policy allows that.

### Phase 5 verification

- [ ] Existing AI debugging still works.
- [ ] Retrieval results reach the AI layer in the intended format.
- [ ] The AI response distinguishes diagnosis from related knowledge.
- [ ] The AI does not fabricate citations.
- [ ] Retrieval failure follows the documented fallback policy.
- [ ] A no-match response does not cause the AI to pretend a source was found.
- [ ] Existing solve/debug regression tests pass.

## Phase 6 — Connect CLI and frontend

**Objective:** Make the new API useful in the actual developer workflow.

### CLI integration

1. Inspect `src/api.js` and the existing solve command.
2. Add or update the API client method for `/api/solutions/search` or the combined solve endpoint chosen by the backend.
3. Keep remote backend calls separate from the local workstation server.
4. Replace the hardcoded matching logic in `src/commands/similarity.js` with actual API-backed results.
5. Reuse existing CLI output formatting conventions.
6. Display a concise list of matches with title, relevance ordering, and source URL.
7. Do not show uncalibrated scores with a `%` sign.
8. Handle API timeouts, authentication failures, no matches, and service unavailability.

### Frontend integration

The frontend should show two separate areas:

**A. AI Diagnosis**
- Error explanation.
- Likely cause.
- Suggested fix.
- Relevant code guidance.
- Any limitations or uncertainty.

**B. Related Knowledge**
- Stack Overflow question title.
- Short relevant answer excerpt.
- Original question link.
- Original answer link, when applicable.
- Question author.
- Answer author.
- Source label: Stack Overflow.
- License metadata.
- Tags or language context when useful.

Do not mix AI-generated diagnosis text with copied Stack Overflow answer text in a way that makes authorship unclear.

### Frontend verification

- [ ] Frontend calls the correct backend endpoint.
- [ ] Loading state is visible.
- [ ] Empty/no-match state is understandable.
- [ ] API error state is understandable.
- [ ] AI Diagnosis and Related Knowledge are visually distinct.
- [ ] Every displayed question has its original question link.
- [ ] Every displayed answer has its original answer link when available.
- [ ] Author attribution is visible.
- [ ] Source is identified as Stack Overflow.
- [ ] License is displayed when known.
- [ ] Missing license is not guessed.
- [ ] HTML is rendered safely or plain text is used.
- [ ] Links are opened safely according to frontend security conventions.
- [ ] The UI works when there are zero, one, or multiple results.

---

# 10. Updating the pilot dataset

The supplied scripts support rebuilding the Stack Overflow export.

The observed commands are:

```bash
npm run ingest:stackoverflow
npm run export:website-data
```

Use the scripts from the dataset bundle's project root, after checking its README and environment requirements.

Recommended update procedure:

1. Review the ingestion configuration and tags.
2. Confirm API credentials/configuration if required.
3. Run ingestion.
4. Check the ingestion output and error logs.
5. Run the website export.
6. Validate the resulting JSON.
7. Compare question and answer counts with the previous version.
8. Check for duplicate IDs.
9. Check for missing URLs, authors, or license metadata.
10. Review the license distribution and missing-license records.
11. Run retrieval regression tests against the updated dataset.
12. Deploy the updated file with a dataset version identifier.
13. Record the ingestion date and source metadata.

Do not automatically deploy a newly generated dataset without validation. A failed or partial ingestion should not overwrite a known-good dataset.

## 10.1 Dataset metadata to track

Track at least:

- Dataset name.
- Schema version.
- Dataset version or build identifier.
- Ingestion timestamp.
- Export timestamp.
- Source/API version.
- Question count.
- Selected answer count.
- Tag/query configuration.
- Any known missing metadata count.
- Validation status.

## 10.2 Weekly review checklist

For each weekly dataset review:

- [ ] Check whether the source dataset has changed.
- [ ] Check ingestion/export logs if a refresh was run.
- [ ] Confirm the dataset is valid JSON.
- [ ] Confirm schema version is supported.
- [ ] Compare question and answer counts.
- [ ] Check for duplicate question/answer IDs.
- [ ] Check broken or missing source URLs.
- [ ] Check missing author attribution.
- [ ] Check missing question/answer licenses.
- [ ] Confirm accepted-answer ordering is preserved.
- [ ] Run known retrieval test queries.
- [ ] Compare top results with the previous dataset version.
- [ ] Record changes and any failures.
- [ ] Do not promote a failed dataset build.

---

# 11. Storage and scaling decisions

## 11.1 Initial version

For the current pilot:

- Store the consolidated JSON in the backend's private data directory.
- Load it once into memory.
- Build an in-memory search index.
- Keep the raw snapshots archived separately.
- Version the dataset.
- Avoid unnecessary infrastructure.

This is appropriate for a pilot of approximately 179 questions and a JSON file of approximately 1.65 MB.

## 11.2 Production growth

If the dataset grows substantially or needs frequent updates, consider:

- PostgreSQL for persistent records and metadata.
- Full-text search indexes for lexical retrieval.
- BM25-compatible search infrastructure.
- A dedicated search engine if scale and query complexity justify it.
- A background ingestion/update job.
- Dataset versioning and rollback.
- Caching of common queries.

Do not introduce a graph database merely because the product is named BugGraph. The supplied pilot is a flat question/answer dataset, not a graph database. A graph layer should be added only when the project has meaningful relationships to model, such as error patterns, dependencies, frameworks, fixes, and recurring root causes.

## 11.3 Optional future graph model

A later graph representation could include nodes such as:

```text
ErrorPattern
Question
Answer
Language
Framework
Library
FixPattern
```

Potential relationships:

```text
ErrorPattern -> RELATED_TO -> Question
Question -> HAS_ANSWER -> Answer
Question -> TAGGED_WITH -> Language
Question -> TAGGED_WITH -> Framework
Answer -> SUGGESTS -> FixPattern
FixPattern -> APPLIES_TO -> Library
```

This is a future extension. Do not block the initial retrieval feature on graph modeling.

---

# 12. Testing strategy

Testing must cover the data pipeline, retrieval quality, API contract, safety, and the existing debugging workflow.

## 12.1 Unit tests

### Loader tests

- Valid dataset loads.
- Dataset is cached.
- Missing file produces a clear error.
- Invalid JSON produces a clear error.
- Invalid schema is rejected.
- Null license fields remain null.
- Original URLs and author fields remain intact.

### HTML/text tests

- HTML tags are removed or sanitized as expected.
- HTML entities decode.
- Code snippets remain understandable.
- Script content is not indexed or rendered.
- Event handlers and unsafe URLs are neutralized in rich rendering mode.

### Normalization tests

- Case normalization works.
- Whitespace normalization works.
- Exception names are preserved.
- Programming vocabulary is not removed by stop words.
- Stack-trace noise is reduced without removing important error terms.

### Retrieval tests

- Exact error phrase receives a high rank.
- Title match beats weak body-only match.
- Matching tags improve ranking.
- Language/framework compatibility works.
- Code tokens have lower influence than error tokens.
- Duplicate records are removed.
- Threshold filtering works.
- No-match result is returned when appropriate.
- Results are deterministic.

### Ranker tests

- Higher relevance signals increase score as expected.
- Accepted-answer status is only a small tie-breaker.
- Popularity does not overwhelm relevance.
- Long body length does not automatically inflate score.
- Scores are not labelled as calibrated confidence.

## 12.2 API integration tests

Test at least:

| Test | Expected result |
|---|---|
| Valid JavaScript error request | 200 with relevant matches, if available |
| Valid Java request | 200 with Java-relevant matches, if available |
| Valid SQL request | 200 with SQL-relevant matches, if available |
| Empty error string | 400 |
| Missing required error field | 400 |
| Oversized request | 400 or 413, according to API convention |
| No relevant result | 200 with `no_matches` |
| Dataset unavailable | Clear service error, e.g. 503 |
| Unexpected internal failure | 500 without leaking internals |

## 12.3 Suggested manual test cases

Use test inputs that match the pilot's coverage:

**Test A — JavaScript TypeError**

```json
{
  "error": "TypeError: Cannot read properties of undefined",
  "language": "javascript",
  "framework": "react",
  "code": "const name = user.profile.name;"
}
```

Expected: JavaScript/React-related questions should rank above unrelated Java or SQL results where relevant records exist.

**Test B — Java NullPointerException**

```json
{
  "error": "java.lang.NullPointerException",
  "language": "java",
  "code": "user.getProfile().getName();"
}
```

Expected: Java-tagged questions should be preferred.

**Test C — SQL syntax problem**

```json
{
  "error": "SQL syntax error near JOIN",
  "language": "sql",
  "code": "SELECT * FROM users JOIN"
}
```

Expected: SQL-related records should be preferred when the pilot contains relevant examples.

**Test D — Unsupported or unrelated query**

```json
{
  "error": "A very specific error not represented in this pilot dataset",
  "language": "unknown"
}
```

Expected: no relevant result if all candidates fall below threshold. Do not force unrelated results into the response.

**Test E — Long code sample**

Supply a long code block with a short, distinctive exception message.

Expected: the distinctive error phrase should remain the dominant retrieval signal.

## 12.4 Retrieval quality metrics

Do not evaluate retrieval only by whether the API returns five records.

Track:

- **Precision@5:** Of the first five returned records, how many are actually relevant?
- **Recall@5:** Of the known relevant records in the test set, how many appear in the first five?
- **Mean Reciprocal Rank (MRR):** How high is the first relevant result?
- **No-match accuracy:** Does the system abstain when the pilot has no useful answer?
- **Latency:** How long does retrieval take?
- **Dataset load time:** How long does startup/index creation take?

Create a small manually labelled test set. For each query, mark which question IDs are relevant. Use the same test set when tuning ranking weights so improvements are measurable rather than subjective.

---

# 13. Security, reliability, and operational requirements

- Treat incoming error messages and code as untrusted input.
- Enforce request-size limits.
- Avoid logging secrets, access tokens, or unnecessary full code snippets.
- Do not execute submitted code as part of retrieval.
- Do not execute code contained in Stack Overflow answers.
- Sanitize displayed HTML.
- Preserve original source URLs and attribution.
- Do not fabricate licenses or source authors.
- Do not expose filesystem paths or raw server exceptions.
- Keep dataset files out of public static directories unless a deliberate public demo requires it.
- Add sensible request timeouts.
- Handle unavailable dataset/index states explicitly.
- Keep the existing AI path functional.
- Use environment variables for secrets; never commit API keys.
- Add tests for malformed and adversarial inputs.
- Make dataset refresh atomic: validate the new export before replacing the currently active version.
- Keep a known-good dataset version for rollback.

---

# 14. Demo-only frontend option versus recommended backend option

There are two possible integration modes.

## Option A — Static frontend demonstration

The partner notes describe a quick demo:

1. Copy `data/stackoverflow/website-upload.json` to the frontend public folder as:

   ```text
   public/data/bug-knowledge.json
   ```

2. Fetch it from:

   ```text
   /data/bug-knowledge.json
   ```

3. Match against title, body text, and tags.
4. Display source links and author attribution.
5. Sanitize `body_html` or convert it to plain text.

This is useful for a quick isolated UI demonstration.

**Limitations:**

- The full dataset is exposed to every browser.
- Search logic runs on the client.
- It does not provide a production backend knowledge service.
- It does not integrate centrally with the existing AI debugging flow.
- It is harder to enforce centralized ranking, rate limits, and dataset access policies.

Use this only when the goal is explicitly a static demo.

## Option B — Backend retrieval service (recommended)

1. Store the JSON in the backend.
2. Load and index it on the server.
3. Expose `POST /api/solutions/search`.
4. Integrate it with the existing debugging service.
5. Return structured matches and source metadata.
6. Display results in the frontend/CLI.

This is the recommended route for the capstone implementation because it creates a reusable service and keeps retrieval logic centralized.

---

# 15. Common mistakes to avoid

1. **Do not train a model on the pilot dataset.** Retrieval is the correct first step.
2. **Do not treat the JSON as a graph database.** It is a Q&A dataset.
3. **Do not put raw snapshots in the browser.** Use the consolidated export on the backend.
4. **Do not tokenize raw `body_html`.** Convert it to plain text first.
5. **Do not give code tokens the same weight as the error message.** Long snippets can drown out useful terms.
6. **Do not keep hardcoded similarity percentages.** Replace them with real retrieval and clearly labelled ranking scores.
7. **Do not claim a ranking score is AI confidence.** It is only a ranking signal unless separately calibrated.
8. **Do not return irrelevant matches just to fill five slots.** Use a threshold and honest no-match behavior.
9. **Do not invent licenses.** Preserve null and refresh metadata when possible.
10. **Do not omit author/source links.** Preserve attribution.
11. **Do not render raw HTML.** Sanitize or display plain text.
12. **Do not replace the existing AI flow.** Add retrieved evidence to it.
13. **Do not assume the CLI branch is the production backend.** Confirm the actual backend repository and route flow first.
14. **Do not confuse the CLI remote API with the local workstation server.** Map their responsibilities and route paths.
15. **Do not build a complex database/search stack prematurely.** The current pilot works with an in-memory index.
16. **Do not deploy a refreshed dataset without validation and regression tests.**

---

# 16. Final implementation checklist

Use this as the overall project sign-off checklist.

## Architecture and repository

- [ ] Actual backend repository and branch identified.
- [ ] Existing server framework and entry point identified.
- [ ] Existing AI/inference function identified.
- [ ] Existing CLI and frontend request flows mapped.
- [ ] `/api/debug/solve` and `/api/solve` responsibilities clarified.
- [ ] No duplicate backend implementation introduced.

## Dataset

- [ ] `website-upload.json` copied to backend private data directory.
- [ ] Raw snapshots remain archived and are not publicly served.
- [ ] Dataset schema validated.
- [ ] 179 pilot questions accounted for.
- [ ] 536 selected answers accounted for in the inspected export.
- [ ] IDs, URLs, tags, authors, scores, and licenses preserved.
- [ ] Null licenses remain null.
- [ ] Dataset version and ingestion metadata recorded.

## Loader and index

- [ ] Loader uses a stable project-relative path.
- [ ] Dataset is loaded once and cached.
- [ ] Missing/malformed file errors are handled.
- [ ] HTML is converted safely to text for indexing.
- [ ] Code and prose fields are handled separately.
- [ ] Search index is built once and can be diagnosed.

## Retrieval and ranking

- [ ] Error text is normalized.
- [ ] Exception names and key phrases are extracted.
- [ ] Language/framework signals are considered.
- [ ] Title, tags, body prose, and code have distinct weights.
- [ ] Code tokens have lower weight.
- [ ] Duplicate question IDs are removed.
- [ ] Ranking is deterministic.
- [ ] Threshold and maximum result count are configurable.
- [ ] No-match behavior is implemented.
- [ ] No fabricated percentages remain.

## API

- [ ] `POST /api/solutions/search` is registered in the correct backend.
- [ ] Request validation is implemented.
- [ ] Response schema is stable and documented.
- [ ] Source metadata is returned.
- [ ] Error statuses are correct.
- [ ] Dataset failure is distinguishable from no matches.
- [ ] API integration tests pass.

## AI integration

- [ ] Existing AI flow is preserved.
- [ ] Relevant retrieved evidence is passed to the AI layer.
- [ ] AI separates its diagnosis from source-derived content.
- [ ] AI does not invent citations or licenses.
- [ ] Retrieval failure follows a documented fallback policy.
- [ ] Existing debugging regression tests pass.

## CLI and frontend

- [ ] CLI uses actual retrieval results.
- [ ] Hardcoded similarity patterns/percentages are removed or clearly retired.
- [ ] Remote API and local workstation server are not confused.
- [ ] Frontend displays AI Diagnosis separately from Related Knowledge.
- [ ] Question and answer links are present.
- [ ] Author/source/license attribution is visible.
- [ ] HTML is safe.
- [ ] Loading, empty, and error states work.

## Quality and operations

- [ ] Unit tests pass.
- [ ] API tests pass.
- [ ] Manual JavaScript, Java, SQL, long-code, and no-match cases pass.
- [ ] Precision@5 and MRR are measured on labelled queries.
- [ ] No-match accuracy is measured.
- [ ] Latency is measured.
- [ ] Request size limits and safe logging are in place.
- [ ] Dataset refresh is validated before deployment.
- [ ] Rollback to a known-good dataset is possible.

---

# 17. Recommended order of work and milestone definition

Do the work in this order:

| Milestone | Deliverable | Completion condition |
|---|---|---|
| 1. Backend discovery | Confirmed backend location and request flow | Actual backend and AI function identified |
| 2. Dataset loader | Validated in-memory dataset | Backend loads the 179-question pilot and caches it |
| 3. Text/index pipeline | Normalized searchable records | HTML is safely converted and index is built |
| 4. Retrieval engine | Real ranked matches | Known test errors retrieve relevant questions |
| 5. Search API | `POST /api/solutions/search` | API contract and tests pass |
| 6. AI integration | Evidence-aware debugging response | Existing AI uses retrieved evidence without fabricated citations |
| 7. CLI/frontend | Visible related knowledge | Source links and attribution appear correctly |
| 8. Evaluation | Retrieval quality report | Precision@5, MRR, no-match accuracy, and latency measured |
| 9. Dataset operations | Repeatable refresh process | Weekly review and validated update procedure documented |

## First end-to-end milestone

Do not attempt to complete every future enhancement before demonstrating the core feature.

The first successful milestone should be:

1. Start the backend.
2. Load the supplied JSON.
3. Submit a known JavaScript `TypeError`.
4. Retrieve relevant Stack Overflow questions.
5. Return the top qualifying results through the API.
6. Display the question title, source link, author, and license.
7. Verify that an unrelated query returns no matches when appropriate.

Once this works, connect the retrieved evidence to the existing AI diagnosis flow and then integrate the frontend/CLI presentation.

---

# 18. Final technical recommendation

For the current BugGraph pilot, use:

- **Data source:** `website-upload.json`
- **Storage:** Backend private JSON file
- **Loading:** One-time load with in-memory cache
- **Indexing:** Plain-text normalized question/answer fields
- **Retrieval:** Weighted keyword search first
- **Ranking:** Explicit, testable signals with a relevance threshold
- **API:** `POST /api/solutions/search`
- **AI:** Existing AI flow enhanced with retrieved evidence
- **Frontend:** Separate AI Diagnosis and Related Knowledge sections
- **Attribution:** Original Stack Overflow question/answer URLs, authors, source, and license metadata
- **Safety:** HTML sanitization/plain-text display, input validation, safe error handling
- **Evaluation:** Precision@5, MRR, no-match accuracy, and latency
- **Scaling:** BM25/TF-IDF and database-backed search only when the dataset and usage justify them
- **Graph layer:** Optional future extension, not a prerequisite

The most important immediate action is to identify the actual production backend repository and its existing AI/debug service. The inspected `feature/cli-workstation` branch contains the CLI/workstation integration points, but it is not sufficient evidence of the complete production backend. Once that backend is confirmed, implement the loader, retrieval service, and search endpoint there rather than duplicating backend logic in the CLI.

**Definition of done:** A developer can submit an error through BugGraph, the backend searches the pilot knowledge base using real ranking logic, relevant results are returned with correct attribution and license metadata, the existing AI diagnosis remains functional, unsafe HTML is not rendered, and automated/manual tests verify both relevant-match and no-match behavior.

