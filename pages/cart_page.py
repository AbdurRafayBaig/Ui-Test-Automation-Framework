import allure
from playwright.sync_api import Page

from pages.base_page import BasePage, log


class CartPage(BasePage):
    """The shopping cart: https://automationexercise.com/view_cart"""

    URL = "/view_cart"

    def __init__(self, page: Page):
        super().__init__(page)
        self.product_names = page.locator(".cart_description h4 a")
        self.empty_cart_message = page.locator("#empty_cart")

    def row(self, product_name: str):
        """The table row of one product in the cart."""
        return self.page.locator("tr", has=self.page.get_by_role("link", name=product_name, exact=True))

    def price_of(self, product_name: str):
        return self.row(product_name).locator(".cart_price p")

    def quantity_of(self, product_name: str):
        return self.row(product_name).locator(".cart_quantity button")

    @allure.step("Remove {product_name} from the cart")
    def remove(self, product_name: str):
        log.info("Remove %s from the cart", product_name)
        self.row(product_name).locator(".cart_quantity_delete").click()
