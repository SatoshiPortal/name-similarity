export interface LevenshteinOptions {
    useCollator?: boolean;
    replacementCost?: number;
}

declare module 'fast-levenshtein' {
    const levenshtein: {
        get(str1: string, str2: string, options?: LevenshteinOptions): number;
    };
    export default levenshtein;
} 