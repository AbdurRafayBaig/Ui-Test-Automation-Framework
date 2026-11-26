@contact
Feature: Contact us form
  As a customer
  I want to send a message to the shop
  So that I can ask a question or report a problem

  Background:
    Given I am on the contact us page

  @smoke
  Scenario: Send a message with a file attached
    When I fill in the contact form with name "Abdur Rafay", email "rafay@example.com", subject "Order question" and message "When will my order arrive?"
    And I attach the file "sample_upload.txt"
    And I submit the contact form
    Then I should see the message "Success! Your details have been submitted successfully."

  @regression
  Scenario Outline: Send different kinds of messages
    When I fill in the contact form with name "<name>", email "<email>", subject "<subject>" and message "<message>"
    And I submit the contact form
    Then I should see the message "Success! Your details have been submitted successfully."

    Examples:
      | name  | email             | subject   | message                     |
      | Ammar | ammar@example.com | Feedback  | Great website, easy to use. |
      | Sara  | sara@example.com  | Complaint | My parcel arrived damaged.  |
