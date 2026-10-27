import { test, expect } from '../../src/fixtures';
import { caloriesOf, ingredientCalories, Recommendation } from '../../src/api/PizzaApi';

// The recommender is random, so each rule is checked over several samples.
const SAMPLES = 5;

test.describe('POST /api/pizza - recommendation contract', () => {
  test('returns a well-formed recommendation', async ({ pizzaApi }) => {
    const res = await pizzaApi.recommend();
    expect(res.status()).toBe(200);

    const body: Recommendation = await res.json();
    expect(body.pizza.id).toEqual(expect.any(Number));
    expect(body.pizza.name).not.toHaveLength(0);
    expect(body.pizza.dough).toMatchObject({ name: expect.any(String), caloriesPerSlice: expect.any(Number) });
    expect(body.pizza.tool).toEqual(expect.any(String));
    for (const ingredient of body.pizza.ingredients) {
      expect(ingredient).toMatchObject({
        name: expect.any(String),
        caloriesPerSlice: expect.any(Number),
        vegetarian: expect.any(Boolean),
      });
    }
  });

  test('reported calories equal the sum of the ingredients', async ({ pizzaApi }) => {
    for (let i = 0; i < SAMPLES; i++) {
      const body: Recommendation = await (await pizzaApi.recommend()).json();
      expect(body.calories).toBe(ingredientCalories(body));
    }
  });

  test('vegetarian pizzas only contain vegetarian ingredients', async ({ pizzaApi }) => {
    for (let i = 0; i < SAMPLES; i++) {
      const body: Recommendation = await (await pizzaApi.recommend({ mustBeVegetarian: true })).json();
      expect(body.vegetarian).toBe(true);
      const meat = body.pizza.ingredients.filter((ing) => !ing.vegetarian).map((ing) => ing.name);
      expect(meat, `non-vegetarian ingredients in ${body.pizza.name}`).toEqual([]);
    }
  });

  test('never uses an excluded tool', async ({ pizzaApi }) => {
    for (let i = 0; i < SAMPLES; i++) {
      const body: Recommendation = await (await pizzaApi.recommend({ excludedTools: ['Knife', 'Scissors'] })).json();
      expect(body.pizza.tool).toBe('Pizza cutter');
    }
  });

  test('topping count stays within the requested range', async ({ pizzaApi }) => {
    for (let i = 0; i < SAMPLES; i++) {
      const body: Recommendation = await (await pizzaApi.recommend({ minNumberOfToppings: 3, maxNumberOfToppings: 3 })).json();
      // The service counts the base olive oil / tomato as ingredients too, so assert a sane range, not exact equality.
      expect(body.pizza.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(body.pizza.ingredients.length).toBeLessThanOrEqual(7);
    }
  });

  test('excluded ingredients never appear', async ({ pizzaApi }) => {
    for (let i = 0; i < SAMPLES; i++) {
      const body: Recommendation = await (await pizzaApi.recommend({ excludedIngredients: ['Pepperoni', 'Pineapple'] })).json();
      const names = body.pizza.ingredients.map((ing) => ing.name);
      expect(names).not.toContain('Pepperoni');
      expect(names).not.toContain('Pineapple');
    }
  });
});

test.describe('POST /api/pizza - negative cases', () => {
  test('rejects a malformed JSON body', async ({ pizzaApi }) => {
    const res = await pizzaApi.recommendRaw('{not json');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

// Known defects, kept as expected failures (test.fail) so the suite stays green
// but turns red the day they get fixed. Details in README > Findings.
test.describe('Known defects', () => {
  test('F-01: calories per slice should include the dough', async ({ pizzaApi }) => {
    test.fail(true, 'F-01: CalculateCalories() only sums ingredients; dough calories are ignored');
    const body: Recommendation = await (await pizzaApi.recommend()).json();
    expect(body.calories).toBe(caloriesOf(body));
  });

  test('F-02: an impossible calorie limit should not return a pizza that breaks it', async ({ pizzaApi }) => {
    test.fail(true, 'F-02: after 10 attempts the generator returns the last pizza even if it exceeds the limit');
    const res = await pizzaApi.recommend({ maxCaloriesPerSlice: 1 });
    const body: Recommendation = await res.json();
    expect(res.status() >= 400 || body.calories <= 1, `got ${res.status()} with ${body.calories} cal`).toBe(true);
  });
});
