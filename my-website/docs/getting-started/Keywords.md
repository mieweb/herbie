

## Keywords without Variable

To add a keyword without a variable in the Herbie extension, follow these steps:

1. Navigate to the **Keywords** tab in the Herbie extension.
2. In the **Enter keyword** field, type your desired keyword, e.g., `SubmitButton`.
3. In the **Enter XPath** field, type the XPath of the element, e.g., `//button[@id='submit']`.
4. Leave the **Has Variable** checkbox unchecked.
5. Click the **Add Keyword** button to save the keyword.
6. The keyword will now appear under the **Global Keywords** section.
7. To use the added keyword in your Herbie script, navigate back to the **Herbie** tab and type the following:
   
   ```herbie
   click on 'SubmitButton'
   ```

This will simulate a click action on the element specified by the XPath in the keyword.

[Try it now](pathname:///playgrounds/keywords.html)

---

## Keywords with Variable

To add a keyword with a variable in the Herbie extension, follow these steps:

1. Navigate to the **Keywords** tab in the Herbie extension.
2. In the **Enter keyword** field, type your desired keyword, e.g., `DynamicLink`.
3. In the **Enter XPath** field, type the XPath of the element with a variable, e.g., `//a[contains(text(),"{$}")]`.
4. Check the **Has Variable** checkbox to indicate that this XPath contains a variable.
5. Click the **Add Keyword** button to save the keyword.
6. The keyword will now appear under the **Global Keywords** section.
7. To use the added keyword in your Herbie script, navigate back to the **Herbie** tab and type the following:

   ```herbie
   click on "Click me" 'DynamicLink'
   ```

This will replace the variable in the XPath with "Click me" and simulate a click action on the matching element.

[Try it now](pathname:///playgrounds/keywords_with_variable.html)
