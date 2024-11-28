import levenshtein from 'fast-levenshtein';

declare module 'fast-levenshtein' {
    interface LevenshteinOptions {
        useCollator?: boolean;
        replacementCost?: number;
    }

    const levenshtein: {
        get(str1: string, str2: string, options?: LevenshteinOptions): number;
    };

    export default levenshtein;
} 

interface NameMatchConfig {
  setScoreWeight: number;        // Weight for exact token matches (0-1)
  fuzzyScoreWeight: number;      // Weight for fuzzy token matches (0-1)
  approvalThreshold: number;     // Minimum score to consider names similar (0-1)
  tokenPartialLengthThreshold: number;  // Minimum length for partial token matching
  levenshteinThreshold: number;  // Maximum Levenshtein distance for fuzzy matches
  excludedWords: string[];       // Words to ignore during comparison
}

const defaultConfig: NameMatchConfig = {
  setScoreWeight: 0.6,
  fuzzyScoreWeight: 0.4,
  approvalThreshold: 0.66,
  tokenPartialLengthThreshold: 3,
  levenshteinThreshold: 2,
  excludedWords: [
    // English titles
    'mr', 'mrs', 'ms', 'dr', 'miss', 'mister', 'esq',
    
    // French titles
    'monsieur', 'madame', 'mademoiselle', 'mle',
    'mme', 'mlle', // Common French abbreviations
    
    // Spanish/Portuguese titles
    'senor', 'senora', 'senorita', 'don', 'dona',
    'sr', 'sra', 'srta', // Spanish abbreviations
    
    // Other titles, french
    'ei', 'et',
    
    // English business entities
    'llc', 'llp', 'inc', 'corp',
    'incorporated',
    'corporation',
    'limited liability company',
    'limited liability partnership',
    
    // Spanish/Latin American business entities
    'sa', 'srl',
    'sociedad anonima',
    'sociedad de responsabilidad limitada',
    
    // French business entities
    // accents are normalized away already
    'sas', 'sarl', 'eurl', 'sa', 'sasu',
    'societe anonyme',
    'societe par actions simplifiee',
    'societe a responsabilite limitee',
    'entreprise unipersonnelle a responsabilite limitee',
    
    // Other European business entities
    'ag', 'gmbh', 'kg', 'ug', // German
    'bv', 'nv', // Dutch
    'spa', 'srl', // Italian
    'oy', 'ab', // Finnish
    'as', // Norwegian/Danish
    'ab', // Swedish
  ],
};

function areNamesSimilar(
  names1: string | string[],
  names2: string | string[],
  config: Partial<NameMatchConfig> = {}
): boolean {
  if (!names1 || !names2) return false;

  const finalConfig: NameMatchConfig = { ...defaultConfig, ...config };
  
  // Convert inputs to arrays of strings
  const array1: string[] = Array.isArray(names1) ? names1.map(String) : [String(names1)];
  const array2: string[] = Array.isArray(names2) ? names2.map(String) : [String(names2)];

  return array1.some(name1 => 
    array2.some(name2 => isNameSimilar(name1, name2, finalConfig))
  );
}

function isNameSimilar(
  name1: string,
  name2: string,
  config: NameMatchConfig
): boolean {
  if (!name1 || !name2) return false;

  const tokens1: string[] = normalizeName(name1, config);
  const tokens2: string[] = normalizeName(name2, config);
  
  const setScore: number = compareTokenSets(tokens1, tokens2);
  const fuzzyScore: number = compareFuzzyTokens(tokens1, tokens2, config);
  
  const combinedScore: number = (
    setScore * config.setScoreWeight + 
    fuzzyScore * config.fuzzyScoreWeight
  );

  return combinedScore >= config.approvalThreshold;
}

function normalizeName(
  name: string,
  config: NameMatchConfig = defaultConfig
): string[] {
  if (!name) return [];

  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe')
    .replace(/[ø]/g, 'o')
    .replace(/[ß]/g, 'ss')
    .replace(/([a-z])'([a-z])/g, '$1$2')
    .replace(/[-'_]/g, ' ')
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(token => !config.excludedWords.includes(token))
    .filter(Boolean)
    .sort();
}

function compareTokenSets(tokens1: string[], tokens2: string[]): number {
  const set1: Set<string> = new Set(tokens1);
  const set2: Set<string> = new Set(tokens2);
  
  const commonTokens: string[] = Array.from(set1).filter(token => set2.has(token));
  return commonTokens.length / Math.min(set1.size, set2.size) || 0;
}

function isFuzzyMatch(
  token1: string,
  token2: string,
  config: NameMatchConfig = defaultConfig
): boolean {
  const minLength: number = config.tokenPartialLengthThreshold;
  
  if (token1.length >= minLength && token2.length >= minLength) {
    const truncLength: number = Math.min(token1.length, token2.length);
    const truncated1: string = token1.substring(0, truncLength);
    const truncated2: string = token2.substring(0, truncLength);
    
    if (levenshtein.get(truncated1, truncated2) <= config.levenshteinThreshold) {
      return true;
    }
  }
  
  return levenshtein.get(token1, token2) <= config.levenshteinThreshold;
}

function compareFuzzyTokens(
  tokens1: string[],
  tokens2: string[],
  config: NameMatchConfig = defaultConfig
): number {
  const matches: string[] = tokens1.filter(token1 =>
    tokens2.some(token2 => isFuzzyMatch(token1, token2, config))
  );
  
  return matches.length / Math.max(tokens1.length, tokens2.length) || 0;
}

export { areNamesSimilar, compareTokenSets, compareFuzzyTokens, normalizeName }; 