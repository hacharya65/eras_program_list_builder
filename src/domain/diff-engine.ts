export interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

/**
 * Computes word-level diff between two text strings using standard LCS algorithm.
 */
export function computeTextDiff(oldStr: string, newStr: string): DiffChunk[] {
  if (!oldStr && !newStr) return [];
  if (!oldStr) return [{ type: 'added', text: newStr }];
  if (!newStr) return [{ type: 'removed', text: oldStr }];

  const tokenize = (s: string) => s.split(/(\s+)/);
  const words1 = tokenize(oldStr);
  const words2 = tokenize(newStr);

  const n = words1.length;
  const m = words2.length;

  // LCS Matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (words1[i] === words2[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to extract diff chunks
  const rawChunks: DiffChunk[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      rawChunks.unshift({ type: 'unchanged', text: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChunks.unshift({ type: 'added', text: words2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawChunks.unshift({ type: 'removed', text: words1[i - 1] });
      i--;
    }
  }

  // Collapse consecutive chunks of the same type for cleaner rendering
  const collapsed: DiffChunk[] = [];
  for (const chunk of rawChunks) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === chunk.type) {
      last.text += chunk.text;
    } else {
      collapsed.push({ ...chunk });
    }
  }

  return collapsed;
}
