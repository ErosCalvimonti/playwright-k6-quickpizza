import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { BASE_URL, HEADERS, randomRestrictions } from './config.ts';

export const pizzaCalories = new Trend('pizza_calories');
export const vegetarianPizzas = new Counter('vegetarian_pizzas');

/** One user visit: browse the catalog, then ask for a recommendation. */
export function userJourney() {
  group('catalog', () => {
    const tools = http.get(`${BASE_URL}/api/tools`, { headers: HEADERS, tags: { name: 'tools' } });
    check(tools, {
      'tools: status 200': (r) => r.status === 200,
      'tools: has 3 tools': (r) => (r.json('tools') as string[]).length === 3,
    });

    const doughs = http.get(`${BASE_URL}/api/doughs`, { headers: HEADERS, tags: { name: 'doughs' } });
    check(doughs, { 'doughs: status 200': (r) => r.status === 200 });
  });

  group('recommendation', () => {
    const restrictions = randomRestrictions();
    const res = http.post(`${BASE_URL}/api/pizza`, JSON.stringify(restrictions), {
      headers: HEADERS,
      tags: { name: 'recommend' },
    });

    const ok = check(res, {
      'recommend: status 200': (r) => r.status === 200,
      'recommend: has a pizza name': (r) => typeof r.json('pizza.name') === 'string',
      'recommend: vegetarian when asked': (r) => !restrictions.mustBeVegetarian || r.json('vegetarian') === true,
    });

    if (ok) {
      pizzaCalories.add(res.json('calories') as number);
      if (res.json('vegetarian') === true) vegetarianPizzas.add(1);
    }
  });
}
