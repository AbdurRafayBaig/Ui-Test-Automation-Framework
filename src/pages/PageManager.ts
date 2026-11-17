import type { Page } from 'playwright';
import type { Logger } from '../core/Logger';
import type { BasePage } from './BasePage';
import { CartPage } from './saucedemo/CartPage';
import { CheckoutCompletePage, CheckoutInformationPage, CheckoutOverviewPage } from './saucedemo/CheckoutPages';
import { InventoryPage } from './saucedemo/InventoryPage';
import { LoginPage } from './saucedemo/LoginPage';
import { ProductDetailsPage } from './saucedemo/ProductDetailsPage';
import {
  CheckboxesPage,
  DropdownPage,
  DynamicLoadingPage,
  FileUploadPage,
  JavaScriptAlertsPage,
  SecureLoginPage,
} from './theinternet/TheInternetPages';
import { ContactPage } from './toolshop/ContactPage';
import { ToolshopHomePage } from './toolshop/ToolshopHomePage';
import { ToolshopProductPage } from './toolshop/ToolshopProductPage';

type PageCtor<T extends BasePage> = new (page: Page, logger: Logger) => T;

/**
 * Lazily creates and caches page objects for one scenario (Factory + Flyweight).
 * Step definitions write `this.pages.login.login(...)` and never call `new`.
 * To add a page: create the class, then add one getter here.
 */
export class PageManager {
  private readonly cache = new Map<PageCtor<BasePage>, BasePage>();

  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) {}

  private get<T extends BasePage>(ctor: PageCtor<T>): T {
    let instance = this.cache.get(ctor);
    if (!instance) {
      instance = new ctor(this.page, this.logger);
      this.cache.set(ctor, instance);
    }
    return instance as T;
  }

  // ---- SauceDemo (e-commerce) ----
  get login() { return this.get(LoginPage); }
  get inventory() { return this.get(InventoryPage); }
  get productDetails() { return this.get(ProductDetailsPage); }
  get cart() { return this.get(CartPage); }
  get checkoutInformation() { return this.get(CheckoutInformationPage); }
  get checkoutOverview() { return this.get(CheckoutOverviewPage); }
  get checkoutComplete() { return this.get(CheckoutCompletePage); }

  // ---- Toolshop (search / catalogue / contact form) ----
  get toolshopHome() { return this.get(ToolshopHomePage); }
  get toolshopProduct() { return this.get(ToolshopProductPage); }
  get contact() { return this.get(ContactPage); }

  // ---- The Internet (UI widgets) ----
  get secureLogin() { return this.get(SecureLoginPage); }
  get checkboxes() { return this.get(CheckboxesPage); }
  get dropdown() { return this.get(DropdownPage); }
  get dynamicLoading() { return this.get(DynamicLoadingPage); }
  get jsAlerts() { return this.get(JavaScriptAlertsPage); }
  get fileUpload() { return this.get(FileUploadPage); }
}
