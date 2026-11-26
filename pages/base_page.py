import logging

import allure
from playwright.sync_api import Page

log = logging.getLogger("pages")


class BasePage:
    """Parent class of every page.

    It keeps the Playwright `page` and the parts that are the same on every page
    of the website: the top menu with "Logged in as ..." and "Logout".
    """

    URL = "/"

    def __init__(self, page: Page):
        self.page = page
        self.logged_in_as = page.locator("a:has-text('Logged in as')")
        self.logout_link = page.locator("a[href='/logout']")

    def open(self):
        with allure.step(f"Open {self.URL}"):
            log.info("Open %s", self.URL)
            self.page.goto(self.URL)

    @allure.step("Log out")
    def logout(self):
        log.info("Log out")
        self.logout_link.click()
