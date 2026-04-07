export const ALIAS_MAP: Record<string, string> = {
  "tr": "triệu",
  "k": "nghìn",
  "đt": "điện thoại",
  "sp": "sản phẩm",
  "km": "khuyến mãi",
  "iph": "iphone",
  "ss": "samsung",
  "xl": "xiaomi",
  "op": "oppo",
  "pk": "phụ kiện",
  "sh": "ship",
  "mn": "màn hình",
};

const ACCENT_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'đ': 'd',
  'À': 'a', 'Á': 'a', 'Ạ': 'a', 'Ả': 'a', 'Ã': 'a', 'Â': 'a', 'Ầ': 'a', 'Ấ': 'a', 'Ậ': 'a', 'Ẩ': 'a', 'Ẫ': 'a', 'Ă': 'a', 'Ằ': 'a', 'Ắ': 'a', 'Ặ': 'a', 'Ẳ': 'a', 'Ẵ': 'a',
  'È': 'e', 'É': 'e', 'Ẹ': 'e', 'Ẻ': 'e', 'Ẽ': 'e', 'Ê': 'e', 'Ề': 'e', 'Ế': 'e', 'Ệ': 'e', 'Ể': 'e', 'Ễ': 'e',
  'Ì': 'i', 'Í': 'i', 'Ị': 'i', 'Ỉ': 'i', 'Ĩ': 'i',
  'Ò': 'o', 'Ó': 'o', 'Ọ': 'o', 'Ỏ': 'o', 'Õ': 'o', 'Ô': 'o', 'Ồ': 'o', 'Ố': 'o', 'Ộ': 'o', 'Ổ': 'o', 'Ỗ': 'o', 'Ơ': 'o', 'Ờ': 'o', 'Ớ': 'o', 'Ợ': 'o', 'Ở': 'o', 'Ỡ': 'o',
  'Ù': 'u', 'Ú': 'u', 'Ụ': 'u', 'Ủ': 'u', 'Ũ': 'u', 'Ư': 'u', 'Ừ': 'u', 'Ứ': 'u', 'Ự': 'u', 'Ử': 'u', 'Ữ': 'u',
  'Ỳ': 'y', 'Ý': 'y', 'Ỵ': 'y', 'Ỷ': 'y', 'Ỹ': 'y',
  'Đ': 'd'
};

export function removeAccents(text: string): string {
  return text.split('').map(char => ACCENT_MAP[char] || char).join('');
}

export function normalize(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Replace aliases
  for (const [alias, replacement] of Object.entries(ALIAS_MAP)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'g');
    normalized = normalized.replace(regex, replacement);
  }

  // Remove accents
  normalized = removeAccents(normalized);

  // Remove special characters, keep digits and spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(t => t.length > 0);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple SequenceMatcher ratio implementation
export function fuzzySim(a: string, b: string): number {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  // Simple Levenshtein-based ratio or similar
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

export class TFIDFVectorizer {
  private vocab: Map<string, number> = new Map();
  private idf: number[] = [];
  private maxFeatures: number;

  constructor(maxFeatures = 2000) {
    this.maxFeatures = maxFeatures;
  }

  fit(documents: string[]) {
    const tokenized = documents.map(d => tokenize(d));
    const df: Map<string, number> = new Map();

    tokenized.forEach(tokens => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(w => {
        df.set(w, (df.get(w) || 0) + 1);
      });
    });

    const n = documents.length;
    const sortedWords = Array.from(df.keys()).sort((a, b) => (df.get(b) || 0) - (df.get(a) || 0));
    const selected = sortedWords.slice(0, this.maxFeatures);

    this.vocab = new Map(selected.map((w, i) => [w, i]));
    this.idf = selected.map(w => {
      const count = df.get(w) || 0;
      return Math.log((n + 1) / (count + 1)) + 1.0;
    });
  }

  transform(documents: string[]): number[][] {
    const V = this.vocab.size;
    return documents.map(doc => {
      const tokens = tokenize(doc);
      const tf: Map<string, number> = new Map();
      tokens.forEach(w => tf.set(w, (tf.get(w) || 0) + 1));
      
      const total = Math.max(tokens.length, 1);
      const vector = new Array(V).fill(0);
      
      tf.forEach((cnt, w) => {
        if (this.vocab.has(w)) {
          const j = this.vocab.get(w)!;
          vector[j] = (cnt / total) * this.idf[j];
        }
      });
      return vector;
    });
  }

  fitTransform(documents: string[]): number[][] {
    this.fit(documents);
    return this.transform(documents);
  }

  transformOne(text: string): number[] {
    return this.transform([text])[0];
  }
}
