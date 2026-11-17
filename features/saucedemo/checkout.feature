@saucedemo @epic:E-Commerce @feature:Checkout
Feature: Checkout
  As a shopper
  I want to pay for the items in my cart
  So that my order gets shipped

  Background:
    Given I am logged in to SauceDemo as "standard_user"
    And I add the following products to the cart:
      | Sauce Labs Backpack      |
      | Sauce Labs Fleece Jacket |
    And I open the cart
    And I start the checkout

  @smoke @e2e @severity:blocker
  Scenario: Complete a purchase end to end
    When I submit the checkout form with:
      | first name | last name | postal code |
      | John       | Doe       | 10001       |
    Then the order overview should list:
      | Sauce Labs Backpack      |
      | Sauce Labs Fleece Jacket |
    And the item total should be 79.98
    And the order total should equal item total plus tax
    When I finish the order
    Then I should see the order confirmation "Thank you for your order!"

  @regression @negative @severity:critical
  Scenario Outline: Checkout form validation - missing <missing>
    When I submit the checkout form with:
      | first name   | last name   | postal code   |
      | <first_name> | <last_name> | <postal_code> |
    Then I should see the checkout error "<error>"

    Examples:
      | missing     | first_name | last_name | postal_code | error                          |
      | first name  |            | Doe       | 10001       | Error: First Name is required  |
      | last name   | John       |           | 10001       | Error: Last Name is required   |
      | postal code | John       | Doe       |             | Error: Postal Code is required |

  @regression @severity:minor
  Scenario: Cancelling checkout returns to the cart
    When I cancel the checkout
    Then the cart should contain exactly:
      | Sauce Labs Backpack      |
      | Sauce Labs Fleece Jacket |
