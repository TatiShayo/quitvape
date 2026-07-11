import { capCoachResponse, validateCoachInput } from '../coaching';

describe('coaching domain', () => {
  describe('capCoachResponse', () => {
    it('returns short text unchanged', () => {
      const short = 'You can do this.';
      expect(capCoachResponse(short)).toBe(short);
    });

    it('caps text at 120 words and appends ellipsis', () => {
      const words = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ');
      const result = capCoachResponse(words);
      // Result is "word0 word1 ... word119..." — 120 words total (last one is "word119...")
      const resultWords = result.split(/\s+/);
      expect(resultWords.length).toBe(120);
      expect(result.endsWith('...')).toBe(true);
    });

    it('exactly 120 words is not capped', () => {
      const words = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');
      const result = capCoachResponse(words);
      expect(result).toBe(words);
      expect(result.endsWith('...')).toBe(false);
    });

    it('121 words is capped to 120 with ellipsis', () => {
      const words = Array.from({ length: 121 }, (_, i) => `word${i}`).join(' ');
      const result = capCoachResponse(words);
      // Takes first 120 words, joins them, appends '...' to the last word
      expect(result.split(/\s+/).length).toBe(120);
      expect(result.endsWith('...')).toBe(true);
    });

    it('preserves original text if under 120 words (multi-space padding unchanged)', () => {
      const text = 'a  b   c    d'; // extra spaces
      const result = capCoachResponse(text);
      expect(result).toBe(text); // returned as-is if under limit
    });
  });

  describe('validateCoachInput', () => {
    it('returns trimmed input for valid text', () => {
      const input = '  hello world  ';
      expect(validateCoachInput(input)).toBe('hello world');
    });

    it('rejects empty strings', () => {
      expect(validateCoachInput('')).toBeUndefined();
      expect(validateCoachInput('  ')).toBeUndefined();
      expect(validateCoachInput('\t\n')).toBeUndefined();
    });

    it('caps input at 1000 characters', () => {
      const tooLong = 'x'.repeat(1001);
      const result = validateCoachInput(tooLong);
      expect(result?.length).toBe(1000);
    });

    it('preserves text under 1000 chars', () => {
      const input = 'x'.repeat(999);
      expect(validateCoachInput(input)).toBe(input);
    });

    it('exactly 1000 chars is valid', () => {
      const input = 'x'.repeat(1000);
      expect(validateCoachInput(input)).toBe(input);
    });
  });
});
