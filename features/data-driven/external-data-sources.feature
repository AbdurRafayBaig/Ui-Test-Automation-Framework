@data-driven @epic:Data-Driven-Testing
Feature: Data-driven tests from external data sources
  The same scenarios run against test data stored in an Excel workbook,
  a SQLite database, Redis and JSON files. The Examples table only holds the
  data source and record key - every other value is fetched at run time
  through the DataManager, so test data can change without touching Gherkin.

  @feature:Login @severity:critical
  Scenario Outline: Login outcome for the "<user>" user read from <source>
    Given I am on the SauceDemo login page
    And I load the "users" record "<user>" from the "<source>" data source
    When I log in with the loaded user
    Then the login result should match the loaded user's expected outcome

    @excel
    Examples: Users from the Excel workbook
      | source | user           |
      | excel  | standard       |
      | excel  | locked_out     |
      | excel  | empty_password |

    @sqlite
    Examples: Users from the SQLite database
      | source | user           |
      | sqlite | problem        |
      | sqlite | wrong_password |
      | sqlite | empty_username |

    @redis
    Examples: Users from Redis
      | source | user         |
      | redis  | visual       |
      | redis  | unknown_user |

    @json
    Examples: Users from JSON
      | source | user     |
      | json   | standard |

  @feature:Checkout @severity:critical
  Scenario Outline: Checkout with the "<customer>" customer read from <source>
    Given I am logged in to SauceDemo with the "standard" user from "<source>"
    And I add the "<product>" product from "<source>" to the cart
    And I open the cart
    And I start the checkout
    When I submit the checkout form with the "<customer>" customer from "<source>"
    Then the checkout should proceed or fail as described by the loaded customer

    @excel
    Examples: Excel
      | source | customer           | product       |
      | excel  | valid_us           | backpack      |
      | excel  | missing_first_name | onesie        |

    @sqlite
    Examples: SQLite
      | source | customer            | product       |
      | sqlite | valid_pk            | fleece_jacket |
      | sqlite | missing_postal_code | bike_light    |

    @redis
    Examples: Redis
      | source | customer          | product     |
      | redis  | missing_last_name | bolt_tshirt |

  @feature:Search @severity:normal @toolshop
  Scenario Outline: Toolshop search driven by the "<term_key>" term from <source>
    Given I am on the Toolshop home page
    And I load the "search_terms" record "<term_key>" from the "<source>" data source
    When I search the Toolshop for the loaded term
    Then the search results should satisfy the loaded expectations

    Examples:
      | source | term_key |
      | excel  | pliers   |
      | sqlite | hammer   |
      | redis  | saw      |

  @feature:Catalogue @severity:normal @sqlite
  Scenario: Every product price stored in the database matches the live catalogue
    Given I am logged in to SauceDemo as "standard_user"
    Then every product in the "products" dataset from "sqlite" should be listed with the stored price
