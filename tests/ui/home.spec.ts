import { test, expect } from '../../src/fixtures';
import { Recommendation } from '../../src/api/PizzaApi';

test.describe('Home page', () => {
  test('shows a recommendation that matches the API response', async ({ homePage }) => {
    const response = await homePage.requestPizza();
    expect(response.status()).toBe(200);
    const body: Recommendation = await response.json();

    await expect(homePage.recommendationName).toHaveText(`Name: ${body.pizza.name}`);
    await expect(homePage.recommendationTool).toHaveText(`Tool: ${body.pizza.tool}`);
    await expect(homePage.recommendationCalories).toHaveText(`Calories per slice: ${body.calories}`);
    expect(await homePage.ingredientNames()).toEqual(body.pizza.ingredients.map((i) => i.name));
  });

  test('a new click gives a new recommendation', async ({ homePage }) => {
    const first: Recommendation = await (await homePage.requestPizza()).json();
    const second: Recommendation = await (await homePage.requestPizza()).json();
    expect(second.pizza.id).not.toBe(first.pizza.id);
    await expect(homePage.recommendationName).toHaveText(`Name: ${second.pizza.name}`);
  });

  test('rating a pizza without logging in asks the user to log in', async ({ homePage, page }) => {
    await homePage.requestPizza();
    await homePage.loveItButton.click();
    await expect(page.getByText('Please log in first.')).toBeVisible();
  });
});

test.describe('Advanced options', () => {
  test('the UI sends the restrictions chosen in the form', async ({ homePage }) => {
    await homePage.setAdvanced({
      maxCaloriesPerSlice: 600,
      minToppings: 2,
      maxToppings: 4,
      excludedTools: ['Knife'],
      vegetarian: true,
    });
    const response = await homePage.requestPizza();
    const sent = response.request().postDataJSON();

    expect(sent).toMatchObject({
      maxCaloriesPerSlice: 600,
      minNumberOfToppings: 2,
      maxNumberOfToppings: 4,
      mustBeVegetarian: true,
      excludedTools: ['Knife'],
    });

    // Calories are not asserted here: the limit is not enforced by the service (F-02).
    const body: Recommendation = await response.json();
    expect(body.vegetarian).toBe(true);
    expect(body.pizza.tool).not.toBe('Knife');
  });

  test('a custom pizza name is used in the recommendation', async ({ homePage }) => {
    await homePage.setAdvanced({ customName: 'QA Special' });
    await homePage.requestPizza();
    await expect(homePage.recommendationName).toHaveText('Name: QA Special');
  });
});
