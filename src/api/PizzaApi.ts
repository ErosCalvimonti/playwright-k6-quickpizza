import { APIRequestContext, APIResponse } from '@playwright/test';

// Public token documented in QuickPizza's own k6 examples for anonymous use.
export const PUBLIC_TOKEN = 'abcdef0123456789';

export interface Restrictions {
  maxCaloriesPerSlice: number;
  mustBeVegetarian: boolean;
  excludedIngredients: string[];
  excludedTools: string[];
  maxNumberOfToppings: number;
  minNumberOfToppings: number;
  customName?: string;
}

export interface Ingredient {
  ID: number;
  name: string;
  caloriesPerSlice: number;
  vegetarian: boolean;
}

export interface Dough {
  ID: number;
  name: string;
  caloriesPerSlice: number;
}

export interface Recommendation {
  pizza: {
    id: number;
    name: string;
    dough: Dough;
    ingredients: Ingredient[];
    tool: string;
  };
  calories: number;
  vegetarian: boolean;
}

export const DEFAULT_RESTRICTIONS: Restrictions = {
  maxCaloriesPerSlice: 1000,
  mustBeVegetarian: false,
  excludedIngredients: [],
  excludedTools: [],
  maxNumberOfToppings: 5,
  minNumberOfToppings: 2,
};

/** Thin typed client over the QuickPizza HTTP API. Returns raw responses so tests can assert on status codes. */
export class PizzaApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token: string = PUBLIC_TOKEN,
  ) {}

  private get headers() {
    return { Authorization: `token ${this.token}` };
  }

  recommend(overrides: Partial<Restrictions> = {}): Promise<APIResponse> {
    return this.request.post('/api/pizza', {
      headers: this.headers,
      data: { ...DEFAULT_RESTRICTIONS, ...overrides },
    });
  }

  recommendRaw(body: unknown, headers: Record<string, string> = this.headers): Promise<APIResponse> {
    return this.request.post('/api/pizza', { headers, data: body });
  }

  doughs(): Promise<APIResponse> {
    return this.request.get('/api/doughs', { headers: this.headers });
  }

  tools(): Promise<APIResponse> {
    return this.request.get('/api/tools', { headers: this.headers });
  }

  names(): Promise<APIResponse> {
    return this.request.get('/api/names');
  }

  quotes(): Promise<APIResponse> {
    return this.request.get('/api/quotes');
  }
}

/** What the service actually reports: the sum of the ingredients only (see README, F-01). */
export function ingredientCalories(rec: Recommendation): number {
  return rec.pizza.ingredients.reduce((sum, i) => sum + i.caloriesPerSlice, 0);
}

/** What calories per slice should be: dough + every ingredient. */
export function caloriesOf(rec: Recommendation): number {
  return rec.pizza.dough.caloriesPerSlice + rec.pizza.ingredients.reduce((sum, i) => sum + i.caloriesPerSlice, 0);
}
