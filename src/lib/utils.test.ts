import { describe, expect, it } from 'vitest';
import { cn, formatFileSize, getInitials, truncate } from '@/lib/utils';

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', undefined, 'b', null, false, '', 'c')).toBe('a b c');
  });
});

describe('truncate', () => {
  it('keeps strings at or under the limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('cuts longer strings and appends an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('getInitials', () => {
  it('uses the first letter of the first two words, uppercased', () => {
    expect(getInitials('john ronald tolkien')).toBe('JR');
  });
});

describe('formatFileSize', () => {
  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes, KB, and MB', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });
});
