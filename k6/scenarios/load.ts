import { sleep } from 'k6';
import { Options } from 'k6/options';
import { isPublicDemo } from '../lib/config.ts';
import { userJourney } from '../lib/flows.ts';
import { summary } from '../lib/summary.ts';

// Peak virtual users. Capped on the shared public demo; CI runs against its own container.
const requested = Number(__ENV.VUS || 20);
const PEAK_VUS = isPublicDemo() ? Math.min(requested, 5) : requested;

export const options: Options = {
  scenarios: {
    ramping_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: PEAK_VUS }, // ramp up
        { duration: '40s', target: PEAK_VUS }, // steady state
        { duration: '10s', target: 0 }, // ramp down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    // Per-endpoint SLOs, using the `name` tag set in flows.ts.
    'http_req_duration{name:recommend}': ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{name:tools}': ['p(95)<500'],
    'http_req_duration{name:doughs}': ['p(95)<500'],
    'group_duration{group:::recommendation}': ['avg<1000'],
  },
};

export function setup() {
  console.log(`Load test: peak ${PEAK_VUS} VUs${isPublicDemo() ? ' (capped: public demo)' : ''}`);
}

export default function () {
  userJourney();
  sleep(1 + Math.random() * 2); // think time
}

export const handleSummary = summary('load');
