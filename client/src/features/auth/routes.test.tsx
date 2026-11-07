import { describe, expect, it } from 'vitest';
import { safeRedirect } from './routes';

describe('safeRedirect', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirect('/projects/1/board?x=1')).toBe('/projects/1/board?x=1');
  });
  it('rejects external or protocol-relative targets', () => {
    expect(safeRedirect('https://evil.com')).toBe('/projects');
    expect(safeRedirect('//evil.com')).toBe('/projects');
    expect(safeRedirect(null)).toBe('/projects');
  });
});
