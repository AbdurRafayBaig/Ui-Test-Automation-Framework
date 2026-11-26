@cart
Feature: Shopping cart
  As a customer
  I want to put products in my cart
  So that I can buy them together

  Background:
    Given I am on the products page

  @smoke
  Scenario: Add a product to the cart
    When I add "Blue Top" to the cart
    And I open the cart
    Then the cart should contain "Blue Top"
    And the price of "Blue Top" should be "Rs. 500"

  @regression
  Scenario: Add two products to the cart
    When I add "Blue Top" to the cart
    And I add "Men Tshirt" to the cart
    And I open the cart
    Then the cart should contain "Blue Top"
    And the cart should contain "Men Tshirt"

  @regression
  Scenario: Remove the only product from the cart
    When I add "Blue Top" to the cart
    And I open the cart
    And I remove "Blue Top" from the cart
    Then the cart should be empty
