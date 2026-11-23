import allure
from playwright.sync_api import Page

from pages.base_page import BasePage, log


class LoginPage(BasePage):
    """The 'Signup / Login' page: https://automationexercise.com/login"""

    URL = "/login"

    def __init__(self, page: Page):
        super().__init__(page)
        self.email_input = page.locator("[data-qa='login-email']")
        self.password_input = page.locator("[data-qa='login-password']")
        self.login_button = page.locator("[data-qa='login-button']")
        self.error_message = page.locator("form[action='/login'] p")

    @allure.step("Log in with email {email}")
    def login(self, email: str, password: str):
        log.info("Log in with email %s", email)
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.login_button.click()
