@saucedemo @epic:E-Commerce @feature:Authentication
Feature: SauceDemo login
  As a shopper
  I want to sign in to the store
  So that I can browse and buy products

  Background:
    Given I am on the SauceDemo login page

  @smoke @severity:blocker
  Scenario: Successful login with valid credentials
    When I log in with username "standard_user" and password "secret_sauce"
    Then I should be on the products page
    And the page heading should be "Products"

  @regression @negative @severity:critical
  Scenario Outline: Login is rejected - <case>
    When I log in with username "<username>" and password "<password>"
    Then I should see the login error "<error>"
    And I should still be on the login page

    Examples:
      | case            | username        | password     | error                                                                     |
      | locked out user | locked_out_user | secret_sauce | Epic sadface: Sorry, this user has been locked out.                       |
      | wrong password  | standard_user   | bad_password | Epic sadface: Username and password do not match any user in this service |
      | unknown user    | nobody          | secret_sauce | Epic sadface: Username and password do not match any user in this service |
      | empty username  |                 | secret_sauce | Epic sadface: Username is required                                        |
      | empty password  | standard_user   |              | Epic sadface: Password is required                                        |

  @regression @severity:normal
  Scenario: User can log out
    Given I log in with username "standard_user" and password "secret_sauce"
    When I log out
    Then I should still be on the login page

  @regression @negative @severity:critical
  Scenario: Protected pages cannot be opened without logging in
    When I navigate directly to the inventory page
    Then I should see the login error "Epic sadface: You can only access '/inventory.html' when you are logged in."
