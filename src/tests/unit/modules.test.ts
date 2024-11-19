import { describe, it, expect } from 'vitest';
import { Character } from '@/data/modules';

// Import the functions we want to test
// Since these are private functions, we'll need to make them accessible for testing
// You might want to export them just for testing purposes
import {
  convertCharactersToFields,
  convertFieldsToCharacters,
} from '@/data/modules';

describe.only('Module conversion utilities', () => {
  describe('convertCharactersToFields', () => {
    it('should convert characters array to field object', () => {
      const characters: Character[] = [
        { name: 'Alice', prompt: 'Alice prompt' },
        { name: 'Bob', prompt: 'Bob prompt' },
        { name: 'Charlie', prompt: 'Charlie prompt' },
      ];

      const result = convertCharactersToFields(characters);

      expect(result).toEqual({
        character_name1: 'Alice',
        character_prompt1: 'Alice prompt',
        character_name2: 'Bob',
        character_prompt2: 'Bob prompt',
        character_name3: 'Charlie',
        character_prompt3: 'Charlie prompt',
      });
    });

    it('should handle partial character array', () => {
      const characters: Character[] = [
        { name: 'Alice', prompt: 'Alice prompt' },
        { name: 'Bob', prompt: 'Bob prompt' },
      ];

      const result = convertCharactersToFields(characters);

      expect(result).toEqual({
        character_name1: 'Alice',
        character_prompt1: 'Alice prompt',
        character_name2: 'Bob',
        character_prompt2: 'Bob prompt',
        character_name3: null,
        character_prompt3: null,
      });
    });

    it('should handle empty character array', () => {
      const characters: Character[] = [];

      const result = convertCharactersToFields(characters);

      expect(result).toEqual({
        character_name1: null,
        character_prompt1: null,
        character_name2: null,
        character_prompt2: null,
        character_name3: null,
        character_prompt3: null,
      });
    });
  });

  describe('convertFieldsToCharacters', () => {
    it('should convert fields object to characters array', () => {
      const fields = {
        character_name1: 'Alice',
        character_prompt1: 'Alice prompt',
        character_name2: 'Bob',
        character_prompt2: 'Bob prompt',
        character_name3: 'Charlie',
        character_prompt3: 'Charlie prompt',
      };

      const result = convertFieldsToCharacters(fields);

      expect(result).toEqual([
        { name: 'Alice', prompt: 'Alice prompt' },
        { name: 'Bob', prompt: 'Bob prompt' },
        { name: 'Charlie', prompt: 'Charlie prompt' },
      ]);
    });

    it('should filter out empty characters', () => {
      const fields = {
        character_name1: 'Alice',
        character_prompt1: 'Alice prompt',
        character_name2: null,
        character_prompt2: null,
        character_name3: 'Charlie',
        character_prompt3: 'Charlie prompt',
      };

      const result = convertFieldsToCharacters(fields);

      expect(result).toEqual([
        { name: 'Alice', prompt: 'Alice prompt' },
        { name: 'Charlie', prompt: 'Charlie prompt' },
      ]);
    });

    it('should handle empty fields object', () => {
      const fields = {
        character_name1: null,
        character_prompt1: null,
        character_name2: null,
        character_prompt2: null,
        character_name3: null,
        character_prompt3: null,
      };

      const result = convertFieldsToCharacters(fields);

      expect(result).toEqual([]);
    });
  });
});
