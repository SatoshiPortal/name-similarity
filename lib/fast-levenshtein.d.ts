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