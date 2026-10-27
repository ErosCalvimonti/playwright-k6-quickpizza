// Shared settings for every k6 scenario.
export const BASE_URL: string = __ENV.BASE_URL || 'https://quickpizza.grafana.com';

// Public token from QuickPizza's own k6 examples (anonymous user).
export const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'token abcdef0123456789',
};

const TOOLS = ['Knife', 'Pizza cutter', 'Scissors'];

/** Random but valid restrictions, so the load looks like real users and not one cached request. */
export function randomRestrictions() {
  const minToppings = 1 + Math.floor(Math.random() * 3);
  return {
    maxCaloriesPerSlice: 500 + Math.floor(Math.random() * 6) * 100,
    mustBeVegetarian: Math.random() < 0.3,
    excludedIngredients: [],
    excludedTools: Math.random() < 0.3 ? [TOOLS[Math.floor(Math.random() * TOOLS.length)]] : [],
    minNumberOfToppings: minToppings,
    maxNumberOfToppings: minToppings + Math.floor(Math.random() * 3),
  };
}

/** The public demo is shared with everyone learning k6: keep load there small. */
export function isPublicDemo(): boolean {
  return BASE_URL.includes('quickpizza.grafana.com');
}
