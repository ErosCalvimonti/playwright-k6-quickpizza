import { test, expect } from '../../src/fixtures';

test.describe('Catalog endpoints', () => {
  test('GET /api/doughs lists doughs with calories', async ({ pizzaApi }) => {
    const res = await pizzaApi.doughs();
    expect(res.status()).toBe(200);
    const { doughs } = await res.json();
    expect(doughs.length).toBeGreaterThan(0);
    for (const dough of doughs) {
      expect(dough.name).not.toHaveLength(0);
      expect(dough.caloriesPerSlice).toBeGreaterThan(0);
    }
  });

  test('GET /api/tools lists the three tools the UI offers', async ({ pizzaApi }) => {
    const res = await pizzaApi.tools();
    expect(res.status()).toBe(200);
    const { tools } = await res.json();
    expect(tools).toEqual(expect.arrayContaining(['Knife', 'Pizza cutter', 'Scissors']));
  });

  test('GET /api/names returns unique pizza names', async ({ pizzaApi }) => {
    const res = await pizzaApi.names();
    expect(res.status()).toBe(200);
    const { names } = await res.json();
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  test('GET /api/quotes returns quotes', async ({ pizzaApi }) => {
    const res = await pizzaApi.quotes();
    expect(res.status()).toBe(200);
    const { quotes } = await res.json();
    expect(quotes.length).toBeGreaterThan(0);
  });

  test('responses are JSON and fast enough for a smoke check', async ({ pizzaApi }) => {
    const started = Date.now();
    const res = await pizzaApi.tools();
    expect(res.headers()['content-type']).toContain('application/json');
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
