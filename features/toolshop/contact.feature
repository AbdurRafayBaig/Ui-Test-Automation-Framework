@toolshop @epic:Toolshop @feature:Contact-Form
Feature: Contact form validation
  As the shop owner
  I want the contact form to validate its input
  So that I only receive complete and usable messages

  Background:
    Given I am on the Toolshop contact page

  @smoke @negative @severity:critical
  Scenario: Submitting an empty form shows every required-field error
    When I submit the contact form
    Then I should see the following contact form errors:
      | field      | message                  |
      | first name | First name is required   |
      | last name  | Last name is required    |
      | email      | Email is required        |
      | subject    | Subject is required      |
      | message    | Message is required      |

  @regression @negative @severity:normal
  Scenario Outline: Field-level validation - <case>
    When I fill in the contact form with:
      | first name | last name | email   | subject          | message   |
      | Jane       | Doe       | <email> | Customer service | <message> |
    And I submit the contact form
    Then the "<field>" field should show the error "<error>"

    Examples:
      | case              | email            | message                                                              | field   | error                                 |
      | invalid email     | not-an-email     | I would like to know more about the delivery times for power tools. | email   | Email format is invalid               |
      | message too short | jane@example.com | Too short                                                            | message | Message must be minimal 50 characters |
