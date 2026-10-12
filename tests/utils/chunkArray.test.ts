import { describe, it, expect } from 'vitest';
import { chunkArray } from '@discordutils/array';

describe('chunkArray', () => {
  it('should return empty array for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it('should return single chunk when array < size', () => {
    expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('should return single chunk when array === size', () => {
    expect(chunkArray([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it('should split evenly when array > size', () => {
    expect(chunkArray([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('should handle remainder (7 items, size 3 → [3, 3, 1])', () => {
    expect(chunkArray([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ]);
  });
});
