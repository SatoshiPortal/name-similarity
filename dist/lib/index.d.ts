export interface NameMatchConfig {
    setScoreWeight: number;
    fuzzyScoreWeight: number;
    approvalThreshold: number;
    tokenPartialLengthThreshold: number;
    levenshteinThreshold: number;
    excludedWords: string[];
}
declare function areNamesSimilar(names1: string | string[], names2: string | string[], config?: Partial<NameMatchConfig>): boolean;
declare function normalizeName(name: string, config?: NameMatchConfig): string[];
declare function compareTokenSets(tokens1: string[], tokens2: string[]): number;
declare function compareFuzzyTokens(tokens1: string[], tokens2: string[], config?: NameMatchConfig): number;
export { areNamesSimilar, compareTokenSets, compareFuzzyTokens, normalizeName };
//# sourceMappingURL=index.d.ts.map