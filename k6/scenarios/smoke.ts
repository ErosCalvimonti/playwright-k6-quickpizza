import { sleep } from 'k6';
import { Options } from 'k6/options';
import { userJourney } from '../lib/flows.ts';
import { summary } from '../lib/summary.ts';

// Smoke: 1 user for a short time. Proves the system and the script work before any load test.
export const options: Options = {
  vus: 1,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    checks: [{ threshold: 'rate>0.99', abortOnFail: true }],
  },
};

export default function () {
  userJourney();
  sleep(1);
}

export const handleSummary = summary('smoke');
