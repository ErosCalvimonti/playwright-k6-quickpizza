import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

/** Prints the usual summary and saves the raw JSON next to it, so CI can archive it. */
export function summary(name: string) {
  return (data: object) => ({
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`k6/results/${name}-summary.json`]: JSON.stringify(data, null, 2),
  });
}
