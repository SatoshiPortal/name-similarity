import { describe, it, expect } from 'vitest';
import { normalizeName, compareTokenSets, compareFuzzyTokens, areNamesSimilar } from '../lib/index.js';

describe('Name matching', () => {
  describe('normalizeName', () => {
    it('should convert to lowercase and remove special characters', () => {
      expect(normalizeName('John-Paul O\'Connor')).toEqual(['john', 'oconnor', 'paul']);
    });

    it('should remove excluded words', () => {
      expect(normalizeName('Mr John Smith')).toEqual(['john', 'smith']);
      expect(normalizeName('Monsieur Jean-Pierre')).toEqual(['jean', 'pierre']);
    });

    it('should handle multiple spaces and empty parts', () => {
      expect(normalizeName('John    Smith')).toEqual(['john', 'smith']);
      expect(normalizeName('  John  Smith  ')).toEqual(['john', 'smith']);
    });

    it('should handle compound names', () => {
      expect(normalizeName('O\'Connor')).toEqual(['oconnor']);
      expect(normalizeName('McDonald')).toEqual(['mcdonald']);
      expect(normalizeName('D\'Angelo')).toEqual(['dangelo']);
    });

    it('should handle spanish names', () => {
      expect(normalizeName('Zuñiga')).toEqual(['zuniga']);
    })
  });

  describe('compareTokenSets', () => {
    it('should return 1 for exact matches', () => {
      expect(compareTokenSets(['john', 'smith'], ['john', 'smith'])).toBe(1);
    });

    it('should handle different order', () => {
      expect(compareTokenSets(['smith', 'john'], ['john', 'smith'])).toBe(1);
    });

    it('should return partial scores for partial matches', () => {
      expect(compareTokenSets(['john', 'smith'], ['john', 'doe'])).toBe(0.5);
    });

    it('should return 0 for no matches', () => {
      expect(compareTokenSets(['john', 'smith'], ['jane', 'doe'])).toBe(0);
    });
  });

  describe('compareFuzzyTokens', () => {
    it('should match tokens with small typos', () => {
      expect(compareFuzzyTokens(['john'], ['jhon'])).toBe(1);
      expect(compareFuzzyTokens(['smith'], ['smyth'])).toBe(1);
    });

    it('should not match tokens with too many differences', () => {
      expect(compareFuzzyTokens(['john'], ['jane'])).toBe(0);
    });

    it('should handle multiple tokens', () => {
      expect(compareFuzzyTokens(['john', 'smith'], ['jhon', 'smyth'])).toBe(1);
      expect(compareFuzzyTokens(['john', 'smith'], ['jhon', 'doe'])).toBe(0.5);
    });

    it('should handle longer compound names with more typos', () => {
      expect(compareFuzzyTokens(['oconnor'], ['occonor'])).toBe(1);
      expect(compareFuzzyTokens(['mcdonald'], ['macdonld'])).toBe(1);
    });

    it('should explain levenshtein threshold of 2', () => {      
      // Distance = 1 (should match)
      expect(compareFuzzyTokens(['smith'], ['smyth'])).toBe(1);  // 1 substitution
      expect(compareFuzzyTokens(['robert'], ['robrt'])).toBe(1); // 1 deletion
      
      // Distance = 2 (should match)
      expect(compareFuzzyTokens(['john'], ['jhon'])).toBe(1);    // 2 edits (transposition)
      expect(compareFuzzyTokens(['nielsen'], ['nilsen'])).toBe(1); // 2 edits
    });
  });

  describe('areNamesSimilar', () => {
    // Exact matches
    it('should match theo name from real world data', () => {
        expect(areNamesSimilar('MONSIEUR MOGENET THEO', 'Theo Mogenet')).toBe(true);
    });

    it('should match theo name from real world data array', () => {
      expect(areNamesSimilar(['MONSIEUR MOGENET THEO'], ['Theo Mogenet', 'Mogenet Theo'])).toBe(true);
    }); 

    it('should match gilles name from real world data', () => {
        expect(areNamesSimilar('EI - CADIGNAN GILLES', 'GILLES EI - CADIGNAN')).toBe(true);
    });

    it('should match gilles name from real world data with accents', () => {
        expect(areNamesSimilar('EI - CADIGNAN GILLES', 'Gilles Bernard Grégory CADIGNAN')).toBe(true);
    });

    it('should match gilles name from real world data with accents array', () => {
      expect(areNamesSimilar('EI - CADIGNAN GILLES', ['Gilles Bernard Grégory CADIGNAN', 'GILLES EI - CADIGNAN'])).toBe(true);
  });

    it('should match julie name from real world data with title', () => {
        expect(areNamesSimilar('MLE JULIE LLABRES', 'Julie Llabres')).toBe(true);
    });

    it('should match exact same names in reverse order', () => {
        expect(areNamesSimilar('John Smith', 'Smith John')).toBe(true);
      });
    
    it('should match exact same names', () => {
      expect(areNamesSimilar('John Smith', 'John Smith')).toBe(true);
    });

    it('should match names with different case', () => {
      expect(areNamesSimilar('john smith', 'JOHN SMITH')).toBe(true);
    });

    // Fuzzy matches
    it('should match names with typos', () => {
      expect(areNamesSimilar('John Smith', 'Jhon Smith')).toBe(true);
    });

    it('should not match names with too many typos', () => {
        expect(areNamesSimilar('John Smith', 'Jhon Smyth')).toBe(false);
    });

    it('should match names with excluded titles', () => {
      expect(areNamesSimilar('Mr John Smith', 'John Smith')).toBe(true);
      expect(areNamesSimilar('Monsieur Jean Pierre', 'Jean Pierre')).toBe(true);
    });

    // Partial matches
    it('should match names with middle names', () => {
      expect(areNamesSimilar('John James Smith', 'John Smith')).toBe(true);
    });

    it('should match with partial name matches', () => {
        expect(areNamesSimilar('Jon Doe', 'Mr Jonathan Doe')).toBe(true);
    })

    // Non-matches
    it('should not match completely different names', () => {
      expect(areNamesSimilar('John Smith', 'Jane Doe')).toBe(false);
    });

    it('should not match completely different names', () => {
        expect(areNamesSimilar('John Smith', 'Jane Smith')).toBe(false);
      });

    it('should not match names with too many differences', () => {
      expect(areNamesSimilar('Jonathan Smith', 'John Doe')).toBe(false);
    });

    // Edge cases
    it('should handle special characters', () => {
      expect(areNamesSimilar('Jean-Pierre', 'Jean Pierre')).toBe(true);
      expect(areNamesSimilar('O\'Connor', 'OConnor')).toBe(true);
    });

    it('should handle extra spaces', () => {
      expect(areNamesSimilar('John   Smith', 'John Smith')).toBe(true);
    });

    it('should handle extra junk', () => {
        expect(areNamesSimilar('  John   Smith   -', 'John Smith')).toBe(true);
      });

    it('should handle relatives', () => {
      expect(areNamesSimilar('Nicole Salminen', 'Lee Salminen')).toBe(false);
      expect(areNamesSimilar('Nicole Arianna Salminen', 'Lee Salminen')).toBe(false);
      expect(areNamesSimilar('Nicole Arianna Salminen', 'Lee David Salminen')).toBe(false);
      expect(areNamesSimilar('Nicole Salminen', 'Lee David Salminen')).toBe(false);
      expect(areNamesSimilar('Eugenio Corea Zuñiga', 'Nadia Zuñiga')).toBe(false);
      expect(areNamesSimilar('Eugenio Zuñiga', 'Nadia Zuñiga')).toBe(false);
      expect(areNamesSimilar('Francis Vincent Pouliot', 'Alex Pouliot')).toBe(false);
      expect(areNamesSimilar('Alex Pouliot', 'Francis Vincent Pouliot')).toBe(false);
    })

    // Array handling
    it('should handle arrays of names correctly', () => {
      expect(areNamesSimilar(['John Smith', 'Johnny Smith'], ['Jon Smith'])).toBe(true);
      expect(areNamesSimilar(['John Smith'], ['Jane Doe', 'John Smith'])).toBe(true);
      expect(areNamesSimilar(['John Smith'], ['Jane Doe', 'Jim Brown'])).toBe(false);
    });

    // Edge cases with empty or invalid inputs
    it('should handle edge cases gracefully', () => {
      expect(areNamesSimilar('', '')).toBe(false);
      expect(areNamesSimilar('' as any, 'John Smith')).toBe(false);
      expect(areNamesSimilar('John Smith', '' as any)).toBe(false);
      expect(areNamesSimilar('' as any, 'John Smith')).toBe(false);
      expect(areNamesSimilar('John Smith', '' as any)).toBe(false);
    });

    // International names
    it('should handle international names with accents', () => {
      expect(areNamesSimilar('José García', 'Jose Garcia')).toBe(true);
      expect(areNamesSimilar('François Müller', 'Francois Mueller')).toBe(true);
      expect(areNamesSimilar('Søren Jørgensen', 'Soren Jorgensen')).toBe(true);
    });

    // Business names
    it('should handle business names and suffixes', () => {
      expect(areNamesSimilar('Acme Corp LLC', 'ACME Corporation')).toBe(true);
      expect(areNamesSimilar('Smith & Sons Ltd', 'Smith and Sons Limited')).toBe(true);
      expect(areNamesSimilar('ABC Inc.', 'ABC Incorporated')).toBe(true);
    });

    // Mixed case and formatting
    it('should handle mixed case and formatting variations', () => {
      expect(areNamesSimilar('JOHN-PAUL SMITH', 'John Paul Smith')).toBe(true);
      expect(areNamesSimilar('von der Leyen', 'VON DER LEYEN')).toBe(true);
    });

    //from real world data
    it('should match real world data', () => {
      expect(areNamesSimilar('JOSAFATH_IVANKOVICH_', ['josafath ivankovich brenes'])).toBe(true);
      expect(areNamesSimilar('ROBERTO_FERNANDEZ_VI', ['ROBERTO_FERNANDEZ_VI'])).toBe(true);
      expect(areNamesSimilar('FRANKLIN_DE_JESUS_AC', ['FRANKLIN DE JESUS ACEVEDO VARGAS'])).toBe(true);
      expect(areNamesSimilar('HENRIETTE__SEIDNER_A', ['HENRIETTE_SEIDNER_AG'])).toBe(true);
    });
  });
}); 