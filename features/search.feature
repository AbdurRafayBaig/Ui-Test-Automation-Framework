@search
Feature: Product search
  As a customer
  I want to search the catalogue
  So that I can quickly find what I want to buy

  Background:
    Given I am on the products page

  @smoke
  Scenario: Search for one product by its name
    When I search for "Blue Top"
    Then I should see the heading "Searched Products"
    And the results should include "Blue Top"

  @regression
  Scenario Outline: Search by keyword
    When I search for "<keyword>"
    Then I should see at least <minimum> results
    And the results should include "<product>"

    Examples:
      | keyword | minimum | product            |
      | dress   | 5       | Stylish Dress      |
      | jeans   | 3       | Soft Stretch Jeans |
      | tshirt  | 3       | Men Tshirt         |

  @regression
  Scenario: Search with no matching product
    When I search for "no-such-product-xyz"
    Then I should see 0 results
