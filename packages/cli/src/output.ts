import ansis from 'ansis';
import stringWidth from 'string-width';
import { stringify as yamlStringify } from 'yaml';

export type OutputFormat = 'table' | 'json' | 'yaml' | 'csv';

export interface OutputOptions {
  format: OutputFormat;
  columns?: string[];
  noHeader?: boolean;
  noTruncate?: boolean;
  quiet?: boolean;
}

/**
 * Format and output data according to the specified format.
 */
export function outputData(
  data: unknown,
  opts: OutputOptions,
): void {
  if (opts.quiet) return;

  const format = opts.format;

  if (format === 'json') {
    outputJson(data);
  } else if (format === 'yaml') {
    outputYaml(data);
  } else if (format === 'csv') {
    outputCsv(data, opts);
  } else {
    outputTable(data, opts);
  }
}

function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function outputYaml(data: unknown): void {
  process.stdout.write(yamlStringify(data));
}

function outputCsv(data: unknown, opts: OutputOptions): void {
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return;

  const columns = opts.columns || Object.keys(items[0] as Record<string, unknown>);

  if (!opts.noHeader) {
    process.stdout.write(columns.join(',') + '\n');
  }

  for (const item of items) {
    const row = columns.map((col) => {
      const val = (item as Record<string, unknown>)[col];
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    process.stdout.write(row.join(',') + '\n');
  }
}

function outputTable(data: unknown, opts: OutputOptions): void {
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) {
    process.stderr.write('No results found.\n');
    return;
  }

  const allKeys = Object.keys(items[0] as Record<string, unknown>);
  const selectedColumns = opts.columns || allKeys;

  // Compute column widths using display width (handles emoji, CJK, etc.)
  const widths: Record<string, number> = {};
  for (const col of selectedColumns) {
    widths[col] = stringWidth(col.toUpperCase());
  }
  for (const item of items) {
    for (const col of selectedColumns) {
      const val = formatValue((item as Record<string, unknown>)[col]);
      const w = stringWidth(val);
      if (w > widths[col]) widths[col] = w;
    }
  }

  // Smart column shrinking: fix narrow columns, shrink only wide ones
  const termWidth = process.stdout.columns || 120;
  if (!opts.noTruncate) {
    const gap = (selectedColumns.length - 1) * 3;
    const available = termWidth - gap - 1; // -1 for leading space
    const totalWidth = selectedColumns.reduce((sum, col) => sum + widths[col], 0);
    if (totalWidth > available) {
      // Columns narrower than threshold keep their width; excess is taken from wide columns
      const threshold = Math.max(12, Math.floor(available / selectedColumns.length));
      let fixed = 0;
      let shrinkable = 0;
      const narrow: Set<string> = new Set();
      for (const col of selectedColumns) {
        if (widths[col] <= threshold) {
          fixed += widths[col];
          narrow.add(col);
        } else {
          shrinkable += widths[col];
        }
      }
      const remaining = available - fixed;
      if (remaining > 0 && shrinkable > 0) {
        const ratio = remaining / shrinkable;
        for (const col of selectedColumns) {
          if (!narrow.has(col)) {
            widths[col] = Math.max(4, Math.floor(widths[col] * ratio));
          }
        }
      }
    }
  }

  // Print header (dim styling)
  if (!opts.noHeader) {
    const header = selectedColumns.map((col) => padEnd(truncate(col.toUpperCase(), widths[col]), widths[col])).join('   ');
    process.stdout.write(' ' + ansis.dim(header) + '\n');
  }

  // Print rows
  for (const item of items) {
    const row = selectedColumns.map((col) => {
      const val = formatValue((item as Record<string, unknown>)[col]);
      const truncated = opts.noTruncate ? val : truncate(val, widths[col]);
      return padEnd(truncated, widths[col]);
    }).join('   ');
    process.stdout.write(' ' + row + '\n');
  }
}

function truncate(str: string, maxLen: number): string {
  if (stringWidth(str) <= maxLen) return str;
  if (maxLen <= 1) return str.slice(0, maxLen);
  // Trim characters until display width fits (handles wide chars correctly)
  let result = str;
  while (stringWidth(result) > maxLen - 1 && result.length > 0) {
    result = result.slice(0, -1);
  }
  return result + '…';
}

function padEnd(str: string, width: number): string {
  const diff = width - stringWidth(str);
  return diff > 0 ? str + ' '.repeat(diff) : str;
}

function formatValue(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val)) return val.length > 0 ? `[${val.length} items]` : '[]';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Output an error in the appropriate format (human-readable or JSON).
 */
export function outputError(
  error: { error: string; code?: number | null; type?: string; [key: string]: unknown },
  format: OutputFormat,
): void {
  if (format === 'json' || !process.stderr.isTTY) {
    process.stderr.write(JSON.stringify(error) + '\n');
  } else {
    const code = error.code ? ` ${error.code}` : '';
    process.stderr.write(`✗ Ошибка${code}: ${error.error}\n`);
    if (error.request_id) {
      process.stderr.write(`  Request ID: ${error.request_id}\n`);
    }
    if (error.hint) {
      process.stderr.write(`  ${error.hint}\n`);
    }
  }
}

/**
 * Output a success message.
 */
export function outputSuccess(message: string, quiet?: boolean): void {
  if (quiet) return;
  if (process.stderr.isTTY) {
    process.stderr.write(`✔ ${message}\n`);
  }
}
