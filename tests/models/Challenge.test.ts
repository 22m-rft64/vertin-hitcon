import { describe, it, expect } from 'vitest';
import { Challenge } from '@core/models/Challenge';

describe('Challenge model', () => {
  describe('platform_id', () => {
    it('should default to null', () => {
      const challenge = new Challenge({ name: 'Test' });
      expect(challenge.platform_id).toBeNull();
    });

    it('should preserve value when explicitly set', () => {
      const challenge = new Challenge({ name: 'Test', platform_id: '42' });
      expect(challenge.platform_id).toBe('42');
    });

    it('should be included in toJSON()', () => {
      const challenge = new Challenge({ name: 'Test', platform_id: '99' });
      const json = challenge.toJSON();
      expect(json).toHaveProperty('platform_id', '99');
    });

    it('should NOT affect _id', () => {
      const challenge = new Challenge({
        _id: 'mongo-oid-123',
        name: 'Test',
        platform_id: '42',
      });
      expect(challenge._id).toBe('mongo-oid-123');
      expect(challenge.platform_id).toBe('42');
      expect(challenge._id).not.toBe(challenge.platform_id);
    });
  });
});
