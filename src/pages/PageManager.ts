import type { Page } from 'playwright';
import type { Logger } from '../core/Logger';
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

/**
 * Holds one object for every page, so step definitions can simply write
 *   this.pages.login.login('standard_user', 'secret_sauce')
 * without creating page objects themselves.
 *
 * A new one is made for every scenario (in the Before hook). Creating a page
 * object is cheap: it only defines locators and does not open anything.
 * To add a page: create its class, then add one line below.
 */
export class PageManager {
  // ---- SauceDemo (e-commerce) ----
  readonly login: LoginPage;
  readonly inventory: InventoryPage;
  readonly productDetails: ProductDetailsPage;
  readonly cart: CartPage;
  readonly checkoutInformation: CheckoutInformationPage;
  readonly checkoutOverview: CheckoutOverviewPage;
  readonly checkoutComplete: CheckoutCompletePage;

  // ---- Toolshop (search / catalogue / contact form) ----
  readonly toolshopHome: ToolshopHomePage;
  readonly toolshopProduct: ToolshopProductPage;
  readonly contact: ContactPage;

  // ---- The Internet (UI widgets) ----
  readonly secureLogin: SecureLoginPage;
  readonly checkboxes: CheckboxesPage;
  readonly dropdown: DropdownPage;
  readonly dynamicLoading: DynamicLoadingPage;
  readonly jsAlerts: JavaScriptAlertsPage;
  readonly fileUpload: FileUploadPage;

  constructor(page: Page, logger: Logger) {
    this.login = new LoginPage(page, logger);
    this.inventory = new InventoryPage(page, logger);
    this.productDetails = new ProductDetailsPage(page, logger);
    this.cart = new CartPage(page, logger);
    this.checkoutInformation = new CheckoutInformationPage(page, logger);
    this.checkoutOverview = new CheckoutOverviewPage(page, logger);
    this.checkoutComplete = new CheckoutCompletePage(page, logger);

    this.toolshopHome = new ToolshopHomePage(page, logger);
    this.toolshopProduct = new ToolshopProductPage(page, logger);
    this.contact = new ContactPage(page, logger);

    this.secureLogin = new SecureLoginPage(page, logger);
    this.checkboxes = new CheckboxesPage(page, logger);
    this.dropdown = new DropdownPage(page, logger);
    this.dynamicLoading = new DynamicLoadingPage(page, logger);
    this.jsAlerts = new JavaScriptAlertsPage(page, logger);
    this.fileUpload = new FileUploadPage(page, logger);
  }
}
