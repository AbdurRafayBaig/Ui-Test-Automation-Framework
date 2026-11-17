@saucedemo @epic:E-Commerce @feature:Product-Catalogue
Feature: Product catalogue
  As a logged-in shopper
  I want to browse and sort the product catalogue
  So that I can quickly find what I want to buy

  Background:
    Given I am logged in to SauceDemo as "standard_user"

  @smoke @severity:critical
  Scenario: The catalogue lists all products with prices
    Then I should see 6 products
    And the catalogue should contain the following products:
      | name                              | price |
      | Sauce Labs Backpack               | 29.99 |
      | Sauce Labs Bike Light             | 9.99  |
      | Sauce Labs Bolt T-Shirt           | 15.99 |
      | Sauce Labs Fleece Jacket          | 49.99 |
      | Sauce Labs Onesie                 | 7.99  |
      | Test.allTheThings() T-Shirt (Red) | 15.99 |

  @regression @severity:normal
  Scenario Outline: Sort products by <sort>
    When I sort the products by "<sort>"
    Then the products should be sorted by <field> in <direction> order

    Examples:
      | sort                | field | direction  |
      | Name (A to Z)       | name  | ascending  |
      | Name (Z to A)       | name  | descending |
      | Price (low to high) | price | ascending  |
      | Price (high to low) | price | descending |

  @regression @severity:normal
  Scenario: Product details match the catalogue entry
    When I open the details of "Sauce Labs Fleece Jacket"
    Then the product details should show "Sauce Labs Fleece Jacket" priced at 49.99
    When I go back to the products list
    Then I should be on the products page
