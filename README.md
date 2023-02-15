# spreadsheet
A lightweight, fast and modular JavaScript spreadsheet library, based on the HTML Table element

[Github project homepage](https://bassmationcode.github.io/spreadsheet/index.htm)  

[Getting started](https://bassmationcode.github.io/spreadsheet/getting-started.htm)  

## History

2023-02-01  spreadsheet-core.js  Much of the core functionality working. Expressions (formulas) can reference cells in other worksheets on the page now. Absolute and relative cell reference functions. Cell input parsing and output formatting implemented with expressions. Implicit/automatic input data type recognition implemented (number, big int, boolean, string), overridable by type hint prefixes (for number, big int, boolean, string, date). Others may follow.

2023-02-01  spreadsheet-persistence.js  Save to disk is working, load from disk is nearly done.

2023-02-11	spreadsheet-persistence.js working. Security features tested. Label cells around the spreadsheet workarea now mandatory, this simplifies many iteration loop codes. Work on spreadsheet-structure.js: Insert rows successful. Cell references in expressions are updated to reflect the new position of cells. Work on automated test infrastructure.

2023-02-14  Automated test infrastructure improved. Individual test documents are imported in IFRAMES in test-root.htm. Test stati are updated and color coded in an overview table. Test documents can be run and debugged individually to solve problems, if any.

2023-02-15	Spreadsheet cell context menu based on the DIALOG element. Current cell highlighting and cell resizing implemented. 