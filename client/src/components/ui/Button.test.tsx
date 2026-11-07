import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });
});
