import { test as base } from '@playwright/test';
import { PizzaApi } from '../api/PizzaApi';
import { HomePage } from '../pages/HomePage';

type Fixtures = {
  pizzaApi: PizzaApi;
  homePage: HomePage;
};

export const test = base.extend<Fixtures>({
  pizzaApi: async ({ request }, use) => {
    await use(new PizzaApi(request));
  },
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();
    await use(home);
  },
});

export { expect } from '@playwright/test';
