/*
 *		spreadsheet-interactive.js    2023-02-01  usp 
 */

import { currentSheet, countColumns, cellObject, offsetCellObject, oco, offsetCellValue, ocv } from "./spreadsheet-core-0.js" ;
import { findParent, splice, consolidateTrailingSum } from "./spreadsheet-utility-0.js" ;

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
export const insertRows = ( rows, insertIndex = -1, columnInfo = "TD", sheet = currentSheet ) =>
		// Insert a number of rows into the current worksheet.
		// rows : number of rows to insert
		// insertIndex : determines the insert location. 
		//		Physical row index expected. Must not point to a column-labels row. 
		// columnInfo : String or object, describes the structure of a row. 
		//		See comments below.
	{
	if ( insertIndex === -1 ) insertIndex = sheet.rows.length;
		// Create a columns descriptor array.
	if ( typeof columnInfo === "string" ) {
			// Fill the array with column info objects.
		columnInfo = new Array(countColumns()).fill( { 
			tagName : columnInfo , 
			attributes : { contenteditable : "" }
			} ); 
			// Make sure that row header cells will be TD elements.
		if ( sheet.spreadsheetCore.firstColumn >  0 ) columnInfo[ 0 ].tagName = "TD" ;
		if ( columnInfo.length - 1 > sheet.spreadsheetCore.lastColumn ) columnInfo[ columnInfo.length - 1 ].tagName = "TD" ;
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
		firstRow : insertIndex - sheet.spreadsheetCore.firstRow,
		lastRow : sheet.spreadsheetCore.lastRow - sheet.spreadsheetCore.firstRow,
		rowOffset : rows,
		firstColumn : 0,
		lastColumn : sheet.spreadsheetCore.lastColumn - sheet.spreadsheetCore.firstColumn,
		columnOffset : 0
		}
		// Update the spreadsheet cell range info
	sheet.spreadsheetCore.lastRow += rows;
		// Create the rows.
	for ( let i = 0 ; i < rows ; i ++ ) {
		const row = sheet.insertRow( insertIndex + i );
		for ( let j = 0 ; j < columnInfo.length ; j ++ ) {
			const cell = row.appendChild( document.createElement( columnInfo[ j ].tagName ));
			if ( j < sheet.spreadsheetCore.firstColumn || j > sheet.spreadsheetCore.lastColumn ) {
					// Row label cells
				cell.innerText = insertIndex + i - sheet.spreadsheetCore.firstRow;  // logical row number 
				cell.classList.add( "row-label" );
				}
			else {  // Spreadsheet workarea cells. 
				cell.dataset.col = j - sheet.spreadsheetCore.firstColumn;
				cell.spreadsheetCore = { value : "" };
				cell.innerText = "" ;
				if ( "contenteditable" in columnInfo[ j ].attributes ) cell.setAttribute( "contenteditable", "" );
				}
		}	}
		// Before address are modified, exisisting expressions must be processed.
	updateExpressions( range );
		// Update logical row addresses
	for ( let i = insertIndex ; i <= sheet.spreadsheetCore.lastRow ; i ++ ) {
		sheet.rows[ i ].dataset.row = i ;
		sheet.rows[ i ].cells[ 0 ].innerText = i ;
		}
	}
const updateExpressions = ( range ) => 
		// Tweak all expressions that are affected by the range
	{
		// Collect and process all cells with expression data attributes
	const cells = document.querySelectorAll( "[data-xpr]" );
	for ( let i = 0 ; i < cells.length ; i ++ ) {
		const currentSheet = findParent( cells[ i ], { tagName : "TABLE" } );
			// Find absolute references in expressions and process them.
		console.info( `  inspecting: ${cells[ i ].dataset.xpr}` );
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
	console.info( `  from ${sourceRow} ${sourceColumn}  to ${targetRow} ${targetColumn}` );
		// Decide
	if ( relative ) return soureInRow ^ targetInRange ;  // Rule 2
	else return targetInRange ;  // Rule 1
	}
