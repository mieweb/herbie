
import Link from '@docusaurus/Link';

# Basic Commands

Herbie is a powerful Chrome extension designed to automate and test web interactions seamlessly. It leverages Behavior-Driven Development (BDD) principles, making it accessible for both developers and non-developers to write and understand test scripts.

## Click

The `click` command is used to simulate a mouse click on a specified element. You can use different types of selectors like ID, class, or XPath to identify the element you want to interact with. Here’s how you can use the `click` command:

- **Click by ID:**

  ```herbie
  click on '#submit-button'
  ```

  This will click on the element with the ID `#submit-button`.

- **Click by Class:**

  ```herbie
  click on '.button-class'
  ```

  This will click on the first element with the class `.button-class`.

- **Click by XPath:**

  ```herbie
  click on "//button[text()='Submit']"
  ```

  This will click on the button that contains the text `Submit`.

The `click` command is versatile and can be used in a variety of scenarios where user interaction with elements is required.

[Try it now](pathname:///playgrounds/click.html)

---

## Type

The `type` command is used to simulate typing text into a specified input field. You can use different selectors like ID, class, or XPath to identify the element you want to interact with. Here’s how you can use the `type` command:

- **Type by ID:**

  ```herbie
  type "Hello, World!" in '#text-input'
  ```

  This will type `"Hello, World!"` into the input field with the ID `#text-input`.

- **Type by Class:**

  ```herbie
  type "Hello, World!" in '.input-class'
  ```

  This will type `"Hello, World!"` into the first input field with the class `.input-class`.

- **Type by XPath:**

  ```herbie
  type "Hello, World!" in "//input[@name='username']"
  ```

  This will type `"Hello, World!"` into the input field identified by the XPath.

The `type` command is useful for automating form inputs and other text entry tasks.

[Try it now](pathname:///playgrounds/type.html)

---

## Wait

The `wait` command pauses the execution of the script for a specified amount of time. This is useful for handling asynchronous operations or waiting for elements to load. Here’s how you can use the `wait` command:

- **Wait for 5 seconds:**

  ```herbie
  wait 5000
  ```

  This will pause the script for `5000` milliseconds (5 seconds) before proceeding to the next command.

- **Wait for 2 seconds:**

  ```herbie
  wait 2000
  ```

  This will pause the script for `2000` milliseconds (2 seconds).

The `wait` command is essential when you need to ensure certain conditions are met before continuing the script.

[Try it now](pathname:///playgrounds/wait.html)

---

## Verify

The `verify` command checks if a specific text is present within a specified element on the page. If the text is not found, the script will stop execution. You can use ID, class, or XPath to identify the target element. Here’s how you can use the `verify` command:

- **Verify by ID:**

  ```herbie
  verify "Success" in '#message'
  ```

  This will verify that the text `"Success"` is present in the element with the ID `#message`.

- **Verify by Class:**

  ```herbie
  verify "Success" in '.message-class'
  ```

  This will verify that the text `"Success"` is present in the first element with the class `.message-class`.

- **Verify by XPath:**

  ```herbie
  verify "Success" in "//div[@role='alert']"
  ```

  This will verify that the text `"Success"` is present in the element identified by the XPath.

The `verify` command is crucial for ensuring that specific conditions or messages appear on the page during automated testing.

[Try it now](pathname:///playgrounds/verify.html)