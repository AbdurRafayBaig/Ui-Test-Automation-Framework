@data_driven
Feature: Tests that read their data from Excel, a database (SQLite) and Redis
  The same scenario runs once for every row of the Examples table.
  The "source" column says where the test data is read from.

  @regression
  Scenario Outline: Log in as "<user>" with data from <source>
    Given the test account exists
    And I am on the login page
    And I have read the user "<user>" from <source>
    When I log in with that user
    Then the login should end with the user's expected result

    Examples:
      | source | user           |
      | excel  | valid_user     |
      | excel  | wrong_password |
      | sqlite | valid_user     |
      | sqlite | unknown_email  |
      | redis  | valid_user     |
      | redis  | wrong_password |

  @regression
  Scenario Outline: Search for "<term>" with data from <source>
    Given I am on the products page
    And I have read the search term "<term>" from <source>
    When I search for that term
    Then the results should include the expected product of that term

    Examples:
      | source | term  |
      | excel  | dress |
      | sqlite | jeans |
      | redis  | top   |
