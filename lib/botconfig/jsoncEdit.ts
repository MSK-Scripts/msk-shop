// ─────────────────────────────────────────────────────────────────────────────
// jsoncEdit — comment-preserving edits on a JSONC document
// ─────────────────────────────────────────────────────────────────────────────
// The form editor never re-serializes the whole config object (that would strip
// every // comment, and those comments are the source of the field help texts).
// Instead each field change is a surgical text patch at a JSONPath, applied via
// jsonc-parser's modify()/applyEdits(). Comments, key order and whitespace of any
// untouched part of the file stay byte-for-byte intact.
//
// The raw `content` string remains the single source of truth: the form reads
// from parse(content) and writes back into content through these helpers.

import {
  modify,
  applyEdits,
  parse,
  type JSONPath,
  type FormattingOptions,
} from 'jsonc-parser';

export type { JSONPath };

// Match the 2-space indentation used throughout the example config files.
const FORMAT: FormattingOptions = {
  tabSize: 2,
  insertSpaces: true,
  eol: '\n',
};

/**
 * Replace the value at `path` with `value`, preserving all surrounding
 * comments/formatting. Use for scalar fields and for setting an entire array
 * at once (e.g. an id-list tag input).
 */
export function editValue(content: string, path: JSONPath, value: unknown): string {
  const edits = modify(content, path, value, { formattingOptions: FORMAT });
  return applyEdits(content, edits);
}

/**
 * Append `item` to the array at `arrayPath`. The new element is inserted at the
 * current array length using isArrayInsertion, so an existing element at that
 * index is never overwritten. New elements carry no comments — that is expected.
 */
export function appendArrayItem(content: string, arrayPath: JSONPath, item: unknown): string {
  const arr = getAtPath(safeParse(content), arrayPath);
  const index = Array.isArray(arr) ? arr.length : 0;
  const edits = modify(content, [...arrayPath, index], item, {
    formattingOptions: FORMAT,
    isArrayInsertion: true,
  });
  return applyEdits(content, edits);
}

/**
 * Remove the element at `arrayPath[index]`. Passing `undefined` as the value
 * makes jsonc-parser delete the element and fix up the surrounding commas.
 */
export function removeArrayItem(content: string, arrayPath: JSONPath, index: number): string {
  const edits = modify(content, [...arrayPath, index], undefined, {
    formattingOptions: FORMAT,
  });
  return applyEdits(content, edits);
}

/**
 * Parse the document tolerantly (comments + trailing commas allowed). Returns
 * `undefined` on hard failure so callers can decide how to degrade.
 */
export function safeParse(content: string): unknown {
  try {
    return parse(content, [], { allowTrailingComma: true });
  } catch {
    return undefined;
  }
}

/** Traverse a plain parsed model along a JSONPath. Returns undefined if any step misses. */
export function getAtPath(model: unknown, path: JSONPath): unknown {
  let current: unknown = model;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string | number, unknown>)[key as string | number];
  }
  return current;
}
