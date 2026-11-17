@toolshop @epic:Toolshop @feature:Search
Feature: Product search and filtering
  As a DIY customer
  I want to search, sort and filter the tool catalogue
  So that I can find the right tool quickly

  Background:
    Given I am on the Toolshop home page

  @smoke @severity:critical
  Scenario: Search returns only matching products
    When I search the Toolshop for "pliers"
    Then the search caption should mention "pliers"
    And I should see at least 3 search results
    And every search result name should contain "pliers"

  @regression @severity:normal
  Scenario Outline: Search for "<term>"
    When I search the Toolshop for "<term>"
    Then I should see at least <min> search results
    And every search result name should contain "<term>"

    Examples:
      | term   | min |
      | hammer | 2   |
      | saw    | 2   |
      | drill  | 1   |

  @regression @negative @severity:normal
  Scenario: Searching for an unknown product shows no results
    When I search the Toolshop for "unicorn-laser-wrench"
    Then I should see a "no products found" message

  @regression @severity:normal
  Scenario Outline: Sort the catalogue by price <direction>
    When I sort the Toolshop catalogue by "<option>"
    Then the Toolshop prices should be in <direction> order

    Examples:
      | option             | direction  |
      | Price (Low - High) | ascending  |
      | Price (High - Low) | descending |

  @regression @severity:normal
  Scenario: Filter the catalogue by category
    When I filter the Toolshop catalogue by the "Hammer" category
    Then every search result name should contain "hammer"

  @regression @severity:critical
  Scenario: Add an in-stock product found by search to the cart
    Given I search the Toolshop for "pliers"
    When I open the first in-stock Toolshop product
    Then the Toolshop product page should show the chosen product
    When I add the Toolshop product to the cart
    Then I should see the Toolshop notification "Product added to shopping cart."
    And the Toolshop cart should contain 1 item
