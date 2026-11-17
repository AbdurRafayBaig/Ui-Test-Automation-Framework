@theinternet @epic:UI-Widgets
Feature: Forms and UI widgets
  As a QA engineer
  I want to automate the most common web UI controls
  So that the framework is proven on forms, dialogs, dynamic content and uploads

  @smoke @feature:Form-Authentication @severity:blocker
  Scenario: Log in to the secure area and log out again
    Given I open the secure login form
    When I submit the secure login form with "tomsmith" and "SuperSecretPassword!"
    Then I should see a flash message containing "You logged into a secure area!"
    When I log out of the secure area
    Then I should see a flash message containing "You logged out of the secure area!"

  @regression @negative @feature:Form-Authentication @severity:critical
  Scenario Outline: Secure login rejects <case>
    Given I open the secure login form
    When I submit the secure login form with "<username>" and "<password>"
    Then I should see a flash message containing "<message>"

    Examples:
      | case             | username | password             | message                   |
      | unknown username | admin    | SuperSecretPassword! | Your username is invalid! |
      | wrong password   | tomsmith | wrong                | Your password is invalid! |

  @regression @feature:Checkboxes @severity:minor
  Scenario: Toggle checkboxes
    Given I open the checkboxes page
    When I check checkbox 1
    And I uncheck checkbox 2
    Then checkbox 1 should be checked
    And checkbox 2 should be unchecked

  @regression @feature:Dropdown @severity:minor
  Scenario Outline: Choose "<option>" from a dropdown
    Given I open the dropdown page
    When I select "<option>" from the dropdown
    Then the dropdown should show "<option>" as selected

    Examples:
      | option   |
      | Option 1 |
      | Option 2 |

  @regression @feature:Dynamic-Content @severity:normal
  Scenario: Wait for content that is rendered after a delay
    Given I open the dynamic loading page
    When I start the dynamic loading
    Then the text "Hello World!" should eventually appear

  @regression @feature:JavaScript-Dialogs @severity:normal
  Scenario Outline: Handle a <dialog> dialog by choosing to <action>
    Given I open the JavaScript alerts page
    When I trigger the "<dialog>" dialog and <action> it with text "<text>"
    Then the dialog result should be "<result>"

    Examples:
      | dialog     | action  | text          | result                            |
      | JS Alert   | accept  |               | You successfully clicked an alert |
      | JS Confirm | accept  |               | You clicked: Ok                   |
      | JS Confirm | dismiss |               | You clicked: Cancel               |
      | JS Prompt  | accept  | Playwright    | You entered: Playwright           |

  @regression @feature:File-Upload @severity:normal
  Scenario: Upload a file
    Given I open the file upload page
    When I upload the file "test-data/files/sample-upload.txt"
    Then the upload should succeed for "sample-upload.txt"
