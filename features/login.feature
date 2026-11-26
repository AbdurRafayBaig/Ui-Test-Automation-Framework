@login
Feature: Login
  As a registered customer
  I want to log in and log out
  So that I can shop with my account

  Background:
    Given I am on the login page

  @smoke
  Scenario: Log in with a registered account
    When I log in with the registered account
    Then I should see "Logged in as Test User" at the top of the page

  @regression
  Scenario Outline: Login is rejected with wrong details
    When I log in with email "<email>" and password "<password>"
    Then I should see the login error "Your email or password is incorrect!"

    Examples:
      | email                               | password   |
      | nobody.unknown.user@example.com     | Test@12345 |
      | uitest.demo.rafay.ammar@example.com | Wrong@999  |

  @regression
  Scenario: Log out
    Given I am logged in with the registered account
    When I log out
    Then I should be on the login page
