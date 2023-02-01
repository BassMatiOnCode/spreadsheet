# spreadsheet
A lightweight JavaScript spreadsheet library, based on the HTML Table element

2023-02-01  spreadsheet-core-0.js  Much of the core functionality working. Expressions (formulas) can reference cells in other worksheets on the page now. Absolute and relative cell reference functions. Cell input parsing and output formatting implemented with expressions. Implicit/automatic input data type recognition implemented (number, big int, boolean, string), overridable by type hint prefixes (for number, big int, boolean, string, date). Others may follow.

2023-02-01  spreadsheet-persistence-0.js  Save to disk is working, load from disk is nearly done.
