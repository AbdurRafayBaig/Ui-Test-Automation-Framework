import allure
from playwright.sync_api import Page

from pages.base_page import BasePage, log


class ProductsPage(BasePage):
    """The 'All Products' page with the search box: https://automationexercise.com/products"""

    URL = "/products"

    def __init__(self, page: Page):
        super().__init__(page)
        self.search_input = page.locator("#search_product")
        self.search_button = page.locator("#submit_search")
        self.heading = page.locator("h2.title")
        self.product_cards = page.locator(".productinfo")
        self.product_names = page.locator(".productinfo p")
        self.continue_shopping_button = page.locator("#cartModal button.close-modal")

    @allure.step("Search for {keyword}")
    def search(self, keyword: str):
        log.info("Search for %s", keyword)
        self.search_input.fill(keyword)
        self.search_button.click()

    def result_names(self) -> list[str]:
        return self.product_names.all_inner_texts()

    @allure.step("Add {product_name} to the cart")
    def add_to_cart(self, product_name: str):
        log.info("Add %s to the cart", product_name)
        card = self.product_cards.filter(has=self.page.get_by_text(product_name, exact=True)).first
        card.locator("a.add-to-cart").click()
        # A popup "Added!" opens; close it to keep shopping
        self.continue_shopping_button.click()
