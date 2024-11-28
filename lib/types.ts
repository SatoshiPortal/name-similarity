export interface LevenshteinOptions {
    useCollator?: boolean;
    replacementCost?: number;
}

export interface Levenshtein {
    get(str1: string, str2: string, options?: LevenshteinOptions): number;
} 