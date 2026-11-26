@data_driven
Feature: Tests that read their data from Excel, a database, Redis and JSON
  The same test runs once for every row in the Examples table.
  The "source" column says where the test data is read from.

  @regression
  Scenario Outline: Log in as "<user>" with data from <source>
    Given I am on the login page
    When I read the user "<user>" from <source>
    And I log in with that user
    Then the login should end with the user's expected result

    Examples:
      | source | user           |
      | excel  | valid_user     |
      | excel  | wrong_password |
      | sqlite | valid_user     |
      | sqlite | unknown_email  |
      | redis  | valid_user     |
      | redis  | wrong_password |
      | json   | unknown_email  |

  @regression
  Scenario Outline: Search for "<term>" with data from <source>
    Given I am on the products page
    When I read the search term "<term>" from <source>
    And I search for that term
    Then the results should include the expected product of that term

    Examples:
      | source | term  |
      | excel  | dress |
      | sqlite | jeans |
      | redis  | top   |
      | json   | saree |
