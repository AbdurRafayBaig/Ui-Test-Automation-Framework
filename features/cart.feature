@cart
Feature: Shopping cart
  As a customer
  I want to put products in my cart
  So that I can buy them together

  @smoke
  Scenario: Add a product to the cart
    Given I am on the products page
    When I add "Blue Top" to the cart
    And I open the cart
    Then the cart should contain "Blue Top"
    And the price of "Blue Top" should be "Rs. 500"

  @regression
  Scenario: Add two products to the cart
    Given I am on the products page
    And I have added "Blue Top" to the cart
    When I add "Men Tshirt" to the cart
    And I open the cart
    Then the cart should contain "Blue Top"
    And the cart should contain "Men Tshirt"

  @regression
  Scenario: Remove the only product from the cart
    Given I am on the products page
    And I have added "Blue Top" to the cart
    And I have opened the cart
    When I remove "Blue Top" from the cart
    Then the cart should be empty
