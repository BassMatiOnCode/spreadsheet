/*
 *		spreadsheet-structure.js    2023-02-12  usp 
 */

import { currentSheet, countColumns, cellObject, offsetCellObject, oco, offsetCellValue, ocv } from "./spreadsheet-core.js" ;
import { findParent, splice, consolidateTrailingSum } from "./spreadsheet-utility.js" ;

export function insertRange ( row = -1, column = -1, rows = 1, columns = 0, rowDescriptor = "TD", shift = "down" ) 
		// row, column : Upper left logical coordinate of the inserted range.
		// rows, columns : Number of rows and columns to insert
		// rowDescriptor : HTML tag name or an array of cell descriptors, or a row object. 
		// shift = Enum( right, down, overwrite )
	{
		if ( row === -1 ) row = currentSheet.rows.length ;
		if ( column === -1 ) column = countColumns( );
		if ( columns === 0 ) columns = countColumns( );
		if ( rows === 0 ) rows = currentSheet.rows.length ;
		if ( typeof rowDescriptor === "string" ) {
			rowDescriptor = new Array( columns ).fill( { tagName : rowDescriptor, attributes : { contenteditable : "" } } ) ;
			}
	}
export const insertColumns = ( insertColumn, n, table = currentSheet ) => {
		// Get table reference.
	if ( typeof table === "string" ) table = document.getElementById( table );
		// Cache variables.
	const numRows = table.rows.length ;
	const numCols = table.rows[ 0 ] .cells.length - 2;
		// Check insert column.
	if ( insertColumn === -1 ) insertColumn = numCols ;
	else if ( insertColumn > numCols ) throw new Error( "spreadsheet-structure.js:insertColumns(): InsertColumn must be equal to or smaller than number of spreadheet columns." );
		// Update expressions referencing range of cells that will be moved.
	if ( insertColumn < numCols  ) updateExpressions ( {
		firstRow : 0 ,
		lastRow : table.rows.length - 3 ,
		firstCol : insertColumn + n ,
		lastCol : table.rows[ 0 ].cells.length - 3 
		} ) ;
		// Loop through the rows
	for ( let i = 0 ; i < numRows ; i ++ ) {
		const row = table.rows[ i ] ;
		if ( i === 0 || i === numRows - 1 ) {
				// Column label rows.
				// Append n column label cells.
			for ( let j = 0 ; j < n ; j ++ ) {
				const cell = row.insertCell( row.cells.length - 1 );
				cell.innerText = row.cells.length - 3 ;
			}	}
		else {
				// Regular spreadsheet row. Search for the insert position
				// in regular spreadsheet cells.
			let j = 1 ;
			while ( j < row.cells.length - 1 ) {
				if (  row.cells[ j ].dataset.col >= insertColumn ) break;
				j += 1; 
				}
				// Insert spreadsheet cells at index j ++
			let columnNumber = row.cells[ j ].dataset.col ;
			for ( let k = 0 ; k < n ; k ++, j ++ ) {
				const cell = row.insertCell( j );
				cell.spreadsheetCore = { value : "" } ;
				cell.dataset.col = columnNumber ++ ;
				}
				// Rewrite the moved cell column numbers
			while ( j < row.cells.length - 1 ) {
				row.cells[ j ].dataset.col = +row.cells[ j ].dataset.col + n ;
				j += 1;
				}
			}
		}
	} ;
export const insertColumnsOld = ( index, n, table = currentSheet ) => {
		// Prepare.
	if ( typeof table === "string" ) table = document.getElementById( table );
	if ( index === -1 ) index = table.rows[ 0 ].cells.length - 1 ;
		// Check parameters.
	if ( index === 0 ) throw new Error( "spreadsheet-structure.js:insertColumns(): Index must be greater than 0." );
	if ( index > table.rows[ 0 ].cells.length - 1 ) throw new Error( "spreadsheet-structure.js:insertColumns(): Index must be smaller than number of columns." );
	const numRows = table.rows.length ;
		// Update expressions referencing affected columns.
	updateExpressions ( {
		firstRow : 0 ,
		lastRow : table.rows.length - 3 ,
		firstCol : index - 1 ,
		lastCol : table.rows[ 0 ].cells.length - 3 
		} ) ;
		// Insert columns
	for ( let i = 0 ; i < numRows ; i ++ ) {
		const row = table.rows[ i ];
			// Search for the insert position
		for ( var j = 0 ; j < row.cells.length - 1 ; j ++ ) {
			if ( row.cells[ j ].dataset.col == index ) break;
			}
			// Insert cells.
		for (  ; j < row.cells.length - 1 ; j ++ ) {
				// Create a new cell
			const cell = row.insertCell( j );
			if ( i === 0 || i === numRows - 1 ) {
				// Set column label text
				cell.innerText = j - 1 ; 
				}
			else {  
				// Init regular spreadsheet cell
				cell.spreadsheetCore = { value : "" } ;
				cell.dataset.col = j - 1 ;
				}
			}
			// Update cells in moved columns
		for ( let j = index + n ; j < row.cells.length - 1 ; j ++ ) 
				// Overwrite column label text with new value
			if ( i === 0 || i === numRows - 1 ) row.cells[ j ].innerText = j - 1 ;
				// Add n to data-col attribute values
			else row.cells[ j ].dataset.col = + row.cells[ j ].dataset.col + n ;  
		}
	} ;
export const insertRows = ( rows, insertIndex = -1, columnInfo = "TD", sheet = currentSheet ) =>
		// Insert a number of rows into the current worksheet.
		// rows : number of rows to insert
		// insertIndex : determines the insert location. 
		//		Physical row index expected. Should not point to a column-labels row. 
		// columnInfo : String or object, describes the structure of a row. 
		//		See comments below.
	{
	if ( insertIndex === -1 ) insertIndex = sheet.rows.length;
	// Create a columns descriptor array.
	if ( typeof columnInfo === "string" ) {
		// Fill the array with column info objects derived from the string input.
		// The string should be either "TD" or "TH".
		columnInfo = new Array(countColumns()).fill( { 
			tagName : columnInfo , 
			attributes : { contenteditable : "" }
			} ); 
		}
	// Use the cells array of a row object as column info array
	else if ( typeof columnInfo === "object" && columnInfo instanceof HTMLTableRowElement ) {
		columnInfo = row.cells;
		}
		// A cells array is also accepted.
	else if ( typeof columnInfo !== "object" || ! (columnInfo instanceof HTMLCollection) ) {
		throw new TypeError( "spreadsheet-structure.js:insertRows(): Illegal columnInfo type." );
		}
		// Compile the affected cell range information
		// Note that the range object contains logical addresses!
	const range = {
		sheet : sheet ,
		firstRow : insertIndex - 1,
		lastRow : sheet.rows.length - 3, // TODO: Check value
		rowOffset : rows,
		firstColumn : 0,
		lastColumn : sheet.rows[0].cells.length - 3,
		columnOffset : 0
		}
	// Create rows
	for ( let i = 0 ; i < rows ; i ++ ) {
		const row = sheet.insertRow( insertIndex + i );
		// Create cells
		for ( let j = 0 ; j < columnInfo.length ; j ++ ) {
			const cell = row.appendChild( document.createElement( columnInfo[ j ].tagName ));
			if ( j > 0 || j < sheet.rows[ 0 ].cells.length - 1 ) {
				// Spreadsheet data cells
				cell.dataset.col = j - 1;
				cell.spreadsheetCore = { value : "" };
				cell.innerText = "" ;
				if ( "contenteditable" in columnInfo[ j ].attributes ) cell.setAttribute( "contenteditable", "" );
				}
		}	}
		// Before address are modified, exisisting expressions must be processed.
	updateExpressions( range );
		// Update logical row addresses of moved rows
	for ( let i = insertIndex ; i <= sheet.rows.length - 2 ; i ++ ) {
		updateRowAddress( i );
		}
	}
const updateRowAddress = ( i, row = currentSheet.rows[ i ] ) => {
	// Set the logical row address in row attribut and inner text of label cells
	row.dataset.row = row.firstElementChild.innerText = row.lastElementChild.innerText = i - 1;
	}
const updateExpressions = ( range ) => 
		// Tweak all expressions that are affected by the range
		// range.firstRow.lastRow.firstCol .lastCol : outdated logical addresses of the moved cells 
	{
		// Collect and process all cells with expression data attributes
	const cells = document.querySelectorAll( "[data-xpr]" );
	for ( let i = 0 ; i < cells.length ; i ++ ) {
		const currentSheet = findParent( cells[ i ], { tagName : "TABLE" } );
			// Find absolute references in expressions and process them.
		console.info( `  inspecting expression: ${cells[ i ].dataset.xpr}` );
			// TODO : Insert all reference functions that might be affected
		const re = new RegExp( "(cell|cv)\\s*\\(", "g" );
		const matches = [...cells[ i ].dataset.xpr.matchAll( re )];
		for ( let j = 0 ; j < matches.length ; j ++ ) {
				// Pass the expression string and the index of the left parenthesis of the match
				// to the extractor function
			const extracted = extractFunctionsArgs( cells[ i ].dataset.xpr, matches[ j ].index + matches[ j ][ 0 ].length - 1 );
				// Obtain the arguments and pass them to the cellObject() function.
				// TODO : According to the mached function name, 
				// choose a suitable counterpart. 
			let command = `cellObject( ${extracted.args[0]}, ${extracted.args[1]}, ${extracted.args[2] || "currentSheet" } )` ;
			const targetCell = eval( command );
			const relativeAddressing = matches[ j ][ 1 ] in { offsetCellObject, oco, offsetCellValue, ocv };
				// Check if the reference is affected
			if ( isAffected( cells[ i ], targetCell, relativeAddressing, range )) {
					// Add row offset
				if ( range.rowOffset < 0 ) extracted.args[ 0 ] += range.RowOffset ;
				else if ( range.rowOffset > 0 ) extracted.args[ 0 ] += `+${range.rowOffset}` ;
				extracted.args[0] = consolidateTrailingSum( extracted.args[0] );
					// Add column offset
				if ( range.columnOffset < 0 ) extracted.args[ 1 ] += range.ColumnOffset ;
				else if ( range.columnOffset > 0 ) extracted.args[ 1 ] += `+${range.columnOffset}` ;
				extracted.args[1] = consolidateTrailingSum( extracted.args[1] );
					// Recompile the expression
				cells[ i ].dataset.xpr  = splice( cells[ i ].dataset.xpr, matches[ j ].index + matches[ j ][ 0 ].length, extracted.lastIndex-1,
					`${extracted.args[ 0 ]},${extracted.args[ 1 ]}${extracted.args[2] ? `,$extracted.args[ 2 ]` : "" }` ) ;
				}
			}
		}
	}
const extractFunctionsArgs = ( s, index ) => {
		// Index points to the left parenthesis of the function call 
		// operator in the string s.
		// Searches for commas (= split points) and the matching 
		// right parenthesis (end of argument list).
		// Returns the function call arguments in an array of strings,
		// and the index of the right matching bracket.
	let level = 0, done = false;
	const commas = [ ];  // Positions of commas
		// Search for commas up to the closing parenthesis
	for ( let i = index ; i < s.length && ! done ; i ++ ) {
		switch ( s[ i ] ) {
		case "(" : 
			if ( level++ === 0 ) commas.push( i ) ; // outer left bracket
			break;
		case ")" :
			if ( --level === 0 ) { done = true; commas.push( i ); } // outer right bracket
			break;
		case "," :
			if ( level === 1 ) commas.push( i );
			break;
			}
		}
		// Check for error
	if ( ! done ) throw new Error( `spreadsheet-structure.js:splitFunctionArgs(): Unbalanced argument list: ${s}` );
		// Slice the string between comma positions
		// into the args array, one at a time.
	const args = [ ];
	while ( commas.length > 1 ) {
		args.push( s.substring( commas[ 0 ] + 1, commas[ 1 ] ));
		commas.shift( );
		}
	return { args : args , lastIndex: commas[ 0 ] };
	}
const isAffected = ( source, target, relative, range ) => {
		// Returns true if the source coordinates have to be modified.
		// source : reference to the expression source cell
		// target : reference to the referenced cell
		// relative : boolean, indicates relative addressing mode
		// range : the range of cells that were moved
	const sourceRow = source.parentElement.dataset.row;
	const sourceColumn = source.dataset.col;
	const sourceInRange = sourceRow >= range.firstRow && sourceRow <= range.lastRow && sourceColumn >= range.firstColumn && sourceColumn <= range.lastColumn ;
	const targetRow = target.parentElement.dataset.row;
	const targetColumn = target.dataset.col;
	const targetInRange = targetRow >= range.firstRow && targetRow <= range.lastRow && targetColumn >= range.firstColumn && targetColumn <= range.lastColumn ;
//	console.info( `  from ${sourceRow} ${sourceColumn}  to ${targetRow} ${targetColumn}` );
		// Decide
	if ( relative ) return soureInRow ^ targetInRange ;  // Rule 2
	else return targetInRange ;  // Rule 1
	}
