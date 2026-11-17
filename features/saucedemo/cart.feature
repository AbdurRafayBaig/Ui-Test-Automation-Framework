@saucedemo @epic:E-Commerce @feature:Shopping-Cart
Feature: Shopping cart
  As a shopper
  I want to manage the items in my cart
  So that I only buy what I need

  Background:
    Given I am logged in to SauceDemo as "standard_user"

  @smoke @severity:critical
  Scenario: Add several products to the cart
    When I add the following products to the cart:
      | Sauce Labs Backpack     |
      | Sauce Labs Bike Light   |
      | Sauce Labs Bolt T-Shirt |
    Then the cart badge should show 3
    When I open the cart
    Then the cart should contain exactly:
      | Sauce Labs Backpack     |
      | Sauce Labs Bike Light   |
      | Sauce Labs Bolt T-Shirt |

  @regression @severity:normal
  Scenario: Remove a product from the cart
    Given I add the following products to the cart:
      | Sauce Labs Backpack   |
      | Sauce Labs Onesie     |
    And I open the cart
    When I remove "Sauce Labs Onesie" from the cart
    Then the cart should contain exactly:
      | Sauce Labs Backpack |
    And the cart badge should show 1

  @regression @severity:normal
  Scenario: Add a product from its details page
    When I open the details of "Sauce Labs Bike Light"
    And I add the product to the cart from the details page
    Then the cart badge should show 1

  @regression @severity:minor
  Scenario: Cart is kept while continuing to shop
    Given I add "Sauce Labs Backpack" to the cart
    And I open the cart
    When I continue shopping
    And I add "Sauce Labs Fleece Jacket" to the cart
    Then the cart badge should show 2

  @regression @severity:minor
  Scenario: Resetting the app state empties the cart
    Given I add "Sauce Labs Backpack" to the cart
    When I reset the app state
    Then the cart badge should show 0
