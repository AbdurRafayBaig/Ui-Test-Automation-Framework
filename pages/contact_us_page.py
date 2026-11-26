import allure
from playwright.sync_api import Page

from pages.base_page import BasePage, log


class ContactUsPage(BasePage):
    """The 'Contact Us' form: https://automationexercise.com/contact_us"""

    URL = "/contact_us"

    def __init__(self, page: Page):
        super().__init__(page)
        self.name_input = page.locator("[data-qa='name']")
        self.email_input = page.locator("[data-qa='email']")
        self.subject_input = page.locator("[data-qa='subject']")
        self.message_input = page.locator("[data-qa='message']")
        self.file_input = page.locator("input[name='upload_file']")
        self.submit_button = page.locator("[data-qa='submit-button']")
        self.success_message = page.locator(".status.alert-success")

    @allure.step("Fill in the contact form")
    def fill_form(self, name: str, email: str, subject: str, message: str):
        log.info("Fill in the contact form as %s <%s>", name, email)
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.subject_input.fill(subject)
        self.message_input.fill(message)

    @allure.step("Attach the file {file_path}")
    def attach_file(self, file_path: str):
        self.file_input.set_input_files(file_path)

    @allure.step("Submit the form")
    def submit(self):
        log.info("Submit the contact form")
        # The site asks "Press OK to proceed!" in a browser popup; we press OK.
        self.page.once("dialog", lambda dialog: dialog.accept())
        self.submit_button.click()
