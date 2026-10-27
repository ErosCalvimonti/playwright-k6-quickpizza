import { Locator, Page, expect } from '@playwright/test';

export interface AdvancedOptions {
  maxCaloriesPerSlice?: number;
  minToppings?: number;
  maxToppings?: number;
  excludedTools?: string[];
  vegetarian?: boolean;
  customName?: string;
}

export class HomePage {
  readonly pizzaPleaseButton: Locator;
  readonly advancedToggle: Locator;
  readonly recommendation: Locator;
  readonly recommendationName: Locator;
  readonly recommendationTool: Locator;
  readonly recommendationCalories: Locator;
  readonly loveItButton: Locator;
  readonly noThanksButton: Locator;

  constructor(private readonly page: Page) {
    this.pizzaPleaseButton = page.getByRole('button', { name: 'Pizza, Please!' });
    this.advancedToggle = page.getByText('Advanced', { exact: true });
    this.recommendation = page.getByText('Our recommendation:').locator('..');
    this.recommendationName = page.getByText(/^Name: /);
    this.recommendationTool = page.getByText(/^Tool: /);
    this.recommendationCalories = page.getByText(/^Calories per slice: /);
    this.loveItButton = page.getByRole('button', { name: 'Love it!' });
    this.noThanksButton = page.getByRole('button', { name: 'No thanks' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.pizzaPleaseButton).toBeVisible();
  }

  /**
   * The three numeric inputs share id="floating_filled", so their <label for>
   * is ambiguous (see README "Findings"). We locate each input through its label's container instead.
   */
  private numberInput(label: string): Locator {
    return this.page.locator('label', { hasText: label }).locator('xpath=..').locator('input[type="number"]');
  }

  async openAdvanced() {
    await this.advancedToggle.click();
    await expect(this.numberInput('Max Calories per Slice')).toBeVisible();
  }

  async setAdvanced(options: AdvancedOptions) {
    await this.openAdvanced();
    if (options.maxCaloriesPerSlice !== undefined) {
      await this.numberInput('Max Calories per Slice').fill(String(options.maxCaloriesPerSlice));
    }
    if (options.minToppings !== undefined) {
      await this.numberInput('Min Number of Toppings').fill(String(options.minToppings));
    }
    if (options.maxToppings !== undefined) {
      await this.numberInput('Max Number of Toppings').fill(String(options.maxToppings));
    }
    if (options.excludedTools) {
      await this.page.locator('select[multiple]').selectOption(options.excludedTools);
    }
    if (options.vegetarian) {
      await this.page.locator('#default-checkbox').check();
    }
    if (options.customName !== undefined) {
      await this.page.locator('#pizza-name').fill(options.customName);
    }
  }

  /** Clicks "Pizza, Please!" and waits for the API call that backs it. */
  async requestPizza() {
    const response = this.page.waitForResponse((r) => r.url().includes('/api/pizza') && r.request().method() === 'POST');
    await this.pizzaPleaseButton.click();
    return response;
  }

  async ingredientNames(): Promise<string[]> {
    const text = await this.recommendation.innerText();
    const block = text.split('Ingredients:')[1]?.split('Tool:')[0] ?? '';
    return block.split('\n').map((l) => l.trim()).filter(Boolean);
  }
}
