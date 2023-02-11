# spreadsheet
A lightweight, fast and modular JavaScript spreadsheet library, based on the HTML Table element

[Github project homepage](https://bassmationcode.github.io/spreadsheet/index.htm)  

[Getting started](https://bassmationcode.github.io/spreadsheet/getting-started.htm)  

## History

2023-02-01  spreadsheet-core-0.js  Much of the core functionality working. Expressions (formulas) can reference cells in other worksheets on the page now. Absolute and relative cell reference functions. Cell input parsing and output formatting implemented with expressions. Implicit/automatic input data type recognition implemented (number, big int, boolean, string), overridable by type hint prefixes (for number, big int, boolean, string, date). Others may follow.

2023-02-01  spreadsheet-persistence-0.js  Save to disk is working, load from disk is nearly done.

2023-02-11	spreadsheet-persistence.js working. Security features tested. Label cells around the spreadsheet workarea now mandatory, this simplifies many iteration loop codes. Work on spreadsheet-structure.js: Insert rows successful. Cell references in expressions are updated to reflect the new position of cells. Work on automated test infrastructure.