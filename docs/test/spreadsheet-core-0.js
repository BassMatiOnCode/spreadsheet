/*
 *		spreadsheet-1.js    2023-01-21   usp
 */

import { findParent, norm } from "./spreadsheet-utility-0.js" ;

// Import static functions and add them to the module global namespace
import * as spreadsheetFunctions from './spreadsheet-functions-0.js';
( function ( ) {
	for ( let o in spreadsheetFunctions ) globalThis[ o ] = spreadsheetFunctions[ o ];
	} ) ( );
export const importModule = moduleName => {
	let p = import( moduleName );
	p.then( m => { for ( let o in m ) globalThis[ o ] = m[ o ]; } );
	return p;
	}

	// Context variables

export let csh, currentSheet, ccell, currentCell, cr, currentRow, cc, currentColumn, evalError;

	// Context setter functions

export const setCurrentSpreadsheet = ( sheet ) => { 
	// TODO : rename to set current sheet
	csh = currentSheet = norm( sheet ); 
	} 
export const setCurrentCell = (cell) => {
	//	Set variables related to the current cell
	currentCell = ccell = cell ;
	setCurrentSpreadsheet( findParent( cell, {tagName : "TABLE"} ));
	currentRow = cr = cell ? +currentCell.parentElement.dataset.row : undefined ;
	currentColumn = cc = cell ? +currentCell.dataset.col : undefined ;
	}

	// Access functions

export const offsetRow = ( rowOffset ) => { 
	return currentRow + rowOffset ; 
	} , or = offsetRow ;  // TODO: Keep?
export const offsetColumn = ( columnOffset ) => { 
	return currentColumn + columnOffset ; 
	} , oc = offsetColumn ;  // TODO: Keep?
export const cellValue = ( row, column, spreadsheet ) => {
	return cellObject( row, column, spreadsheet ).spreadsheetCore.value ;
	} , cv = cellValue, cell = cellValue ;
export const cellObject = ( row, column, spreadsheet = currentSheet ) => {
	/// Returns an HTML table cell element
	/// row : logical row number or cell name
	/// column : logical column number
	/// spreadsheet : reference to a spreadsheet, optional
	/// References: currentSheet
	return spreadsheet.querySelector( `TR[data-row="${row}"]>[data-col="${column}"]` );
	} , co = cellObject ;
export const offsetCellValue = (rows, cols, cell ) => {
	// Offset cell, returns the cell offset by a number of rows and columns
	// from the specified cell.
	return offsetCellObject( rows, cols, cell ).spreadsheetCore.value;
	}, ocv = offsetCellValue ;
export const offsetCellObject = (rows, cols, cell = currentCell) => {
	// Offset cell, returns the cell offset by a number of rows and columns
	// from the specified cell.
	rows += parseInt( cell.parentElement.dataset.row );
	cols += parseInt( cell.dataset.col );
	const spreadsheet = findParent( cell, { tagName : "TABLE" } );
	return spreadsheet.querySelector( `tr[data-row="${rows}"] [data-col="${cols}"]` );
	}, oco = offsetCellObject ;
export const cellRelativeValue = offsetCellValue, crv = offsetCellValue;
export const cellRelativeObject = offsetCellObject, cro = offsetCellObject;
export const namedCellValue = ( name, spreadsheet = currentSheet ) => {
	return spreadsheet.querySelector( `[name="${name}"]` ).spreadsheetCore.value;
	} , ncv = namedCellValue ;
export const invalidReference = ( row, column, spreadsheet=currentSheet ) => {
	// TODO : Add an alert box here.
	console.error( `spreadsheet-core.js:invalidReference(): row=${row} column=${column} sheet=${spreadsheet.id}` );
	}
export const namedCellObject = ( name, spreadsheet = currentSheet ) => {
	return spreadsheet.querySelector( `[name="${name}"]` );
	} , nco = namedCellObject ;
export const sheet = id => {
	return document.getElementById( id );
	}
	
	// Initialization

export function initPage ( ) {
	//// Collect spreadsheet tables on the page.
	console.info( "spreadsheet-core.js:initPage()" );
	const spreadsheets = document.getElementsByClassName( "spreadsheet" );
	for ( let i = 0 ; i < spreadsheets.length ; i ++ ) initSpreadsheet( spreadsheets[ i ] );
	evaluateCellExpressions( );

	} ;
export function initSpreadsheet ( spreadsheet ) {
		// Initializes the spreadsheet.
	console.info( `spreadsheet-core.js:initSpreadsheet(): ${spreadsheet.id}` );
		// Checks
	if ( ! spreadsheet.id ) console.warn( "initSpreadsheet(): Spreadsheet table has no id, so it cannot be referenced." );
	else if ( document.querySelectorAll( `#spreadsheet.id` ).length > 1 ) console.warn( "initSpreadsheet(): Duplicate spreadsheet id (${spreadsheet.id) cannot be addressed reliably." );
		// Initialize
	generateLabels( spreadsheet ) ;
	initAddresses( spreadsheet );
	initCellValues( spreadsheet );
		// Add event listeners
	spreadsheet.addEventListener( "focusin", focusinHandler ) ;
	currentSheet.addEventListener( "focusout", focusoutHandler ) ;
	}
export const focusinHandler = ( evt ) => {
	console.info( "focusin event handler" );
		// Show a prefixed plain text in the cell
	setCurrentCell( evt.target );
	setPrefixedText( );
		// Select the entire text in the cell
	if ( evt.target.innerText.length > 0) window.getSelection().setBaseAndExtent( evt.target, 0, evt.target,1 );
	} ;
export const focusoutHandler = ( evt ) => {
		// Update the cell value
	console.info( "focusout event handler" );
	setCurrentCell( evt.target );
	parseInput( );
	formatValue( );
	evaluateCellExpressions( evt.currentTarget );
	} ;
export function initAddresses( spreadsheet ) {
		/// Decorates row and cell elements with locgical row and column numbers.
	console.info( "spreadsheet-core.js: initAddresses()" );
		// Create logical column number attributes, with colspans taken into account
	for ( let rix = 1 ; rix < spreadsheet.rows.length - 1 ; rix ++ ) {
		const row = spreadsheet.rows[ rix ];
		row.dataset.row = rix - 1 ;
		let spannedCells = 0;
		for ( let cix = 1 ; cix < row.cells.length - 1 ; cix ++ ) {
			// Set the logical column number.
			// TODO : Really set current cell here?
			const cell = ( row.cells[ cix ] );
			cell.dataset.col = cix - 1 + spannedCells ;
			spannedCells += cell.colSpan - 1;
		}	}

	// Addjust logical column numbers according to row-spanning cells above
	let cells = spreadsheet.querySelectorAll("[rowspan]");
	for ( let i = 0 ; i < cells.length ; i ++ ) {
		let cell = cells[ i ];  // row-spanning cell
		let cellColumn = parseInt( cell.dataset.col ); // logical column number
		for ( let rix = cell.parentElement.rowIndex + 1 ; rix < cell.parentElement.rowIndex + cell.rowSpan ; rix ++ ) {
			let row = spreadsheet.rows[ rix ];
			for ( let cix = 1 ; cix < row.cells.length - 1 ; cix ++ ) {
				let targetCell = row.cells[ cix ];
				let targetCellColumn = parseInt( targetCell.dataset.col ); // logical column number
				if ( targetCellColumn >= cellColumn ) {
					targetCell.dataset.col = targetCellColumn + cell.colSpan ;
					}
				}
			}
		}	
	} ;
export function initCellValues( spreadsheet ) {
	// Initialize internal value from innerHTML and display of cells.
	console.info( `spreadsheet-core.js:initCellValues(): ${spreadsheet.id || ""}`);
	for ( let i = 1 ; i < spreadsheet.rows.length - 1 ; i ++ ) {
		for ( let j = 1 ; j < spreadsheet.rows[ i ].cells.length - 1 ; j ++ ) {
			const cell = spreadsheet.rows[ i ].cells[ j ];
			setCurrentCell( cell );
				// parse, store and format the cell text
			cell.spreadsheetCore = { } ;
				// Skip expression cells. They cannot be parsed, they must be evaluated first.
			if (cell.hasAttribute( "data-xpr" )) continue;
				// Using innerHTML gives strings the opportunity to include HTML in the cell value 
			parseInput ( cell.innerHTML );
			formatValue( );
			console.info( `spreadsheet-core.js:initCellValues():  ${cell.spreadsheetCore.value}` );
	}	}	}
export const generateLabels = ( sheet = currentSheet ) => {
		// Generates the row and column labels around an existing spreadsheet table.
		// Visibility is controlled by the "labels" attribute on the spreadsheet table. 
		// See CSS for details.
	const attribute = sheet.getAttribute( "labels" ) || "" ;
	if ( attribute.startsWith( "generate" )) {
			// Add row labels
		for ( let i = 0 ; i < sheet.rows.length ; i ++ ) {
			sheet.rows[ i ].insertCell( 0 ).innerText = i ;
			sheet.rows[ i ].insertCell( -1 ).innerText = i ;
			}
			// Add column labels
		const columns = countColumns( sheet.rows );
		insertLabelRow( columns, 0, sheet );
		insertLabelRow( columns, -1, sheet );
			// Remove "generate" prefix from attribute
		sheet.setAttribute( "labels", attribute.substring( attribute.indexOf( "," ) + 1 ));
		}
	}
export const insertLabelRow = ( columns, index = 0, sheet = currentSheet ) => {
		const row = sheet.insertRow( index );
		for ( let i = 0 ; i < columns ; i ++ ) row.insertCell( ).innerText = i > 0 && i < columns - 1 ? i - 1 : "" ;
	}
export function countColumns( rows = currentSheet.rows ) {
		// TODO : Change parameter to sheet, make more sense.
		// Counts the number of columns in a HTML Table.
		// Takes colspan of cells into account.
	let count = 0 , cells = rows[ 0 ].cells ; 
	for ( let i = 0 ; i < cells.length ; i ++ ) count += cells[ i ].colSpan ;
	return count;
	}

	//	Cell Value Handling 

export function parseInput( value=currentCell.innerText ) {
	/// Parse the plain text representation of the current cell
	/// and store a typed cell value.
	/// References: currentCell.
	
	// If present, use the data-parse attribute.
	if ( currentCell.dataset.parse ) currentCell.spreadsheetCore.value = eval( currentCell.dataset.parse ); 

	// Otherwise use the type prefix to parse and convert the cell text
	else switch ( value.substr( 0, 2 )) {
	case "n$" : 
		currentCell.spreadsheetCore.value = +(value.substr( 2 ));
		return;
	case "i$" :
		currentCell.spreadsheetCore.value = new BigInt( value.substr( 2 ) );
		return;
	case "s$" :
		currentCell.spreadsheetCore.value = value.substr( 2 ) ;
		return;
	case "b$" :
		switch ( value.substr( 2 )) {
		case "true" : 
			currentCell.spreadsheetCore.value = true;
			return;
		case "false" :
			currentCell.spreadsheetCore.value = false;
			return;
		default : 
			console.error( `spreadsheet-core.js:parseInput(): Cannot recognize boolean value (${value})` );
			currentCell.spreadsheetCore.value = value;
			return;
			}
	case "d$" :
		currentCell.spreadsheetCore.value = new Date( value.substr( 2 ) );
		return;
	case "=$" :
		currentCell.dataset.xpr = value.substr( 2 );
		return;
	default :
		if ( value.substr( 1,1 ) === "$" ) {
			console.error( `spreadsheetCore.js:parseInput(): Illegal type prefix (${value.substr(0,2)})` );
			return;
		}	}
	
	// Finally, guess from input text
	if ( value === "" )currentCell.spreadsheetCore.value = "";
	else if ( ! Number.isNaN( +value )) currentCell.spreadsheetCore.value = +value ;
	else if ( value.toLowerCase() === "true" ) currentCell.spreadsheetCore.value = true;
	else if ( value.toLowerCase() === "false" ) currentCell.spreadsheetCore.value = false;
	else currentCell.spreadsheetCore.value = currentCell.innerText;
	}
export function formatValue( value = currentCell.spreadsheetCore.value ) {
	/// Formats the internal cell value into HTML
	if ( currentCell.dataset.format ) {
		try { currentCell.innerHTML = eval( currentCell.dataset.format ); }
		catch (e){ currentCell.innerText = e.message; }
		}
	else 	switch ( typeof value ) {
	case "object" :
		if ( value instanceof Date ) 	currentCell.innerHTML = value.toISOString( );
		else currentCell.innerHTML = value.toString();
		break;
	default : 
		currentCell.innerHTML = value.toString();
		break;
	}	}
export function setPrefixedText( value=currentCell.spreadsheetCore.value ) {
	// Used to prepare cell.innerText for data input by the user.
	// TODO : Decide whether to test for hasAttribute("data-xpr");
	if ( currentCell.dataset.xpr ) currentCell.innerText = "=$" + currentCell.dataset.xpr ;
	else switch ( typeof value ) {
	case "bigint" :
		currentCell.innerText = "i$" + value.toString();
		break;
	case "boolean" :
		currentCell.innerText = "b$" + value.toString();
		break;
	case "number" :
		currentCell.innerText = "n$" + value.toString();
		break;
	case "string" :
		currentCell.innerText = "s$" + value.toString();
		break;
	case "object" :
		if ( value instanceof Date ) 	currentCell.innerText = "d$" + value.toISOString( );
		else currentCell.innerText = value.toString();
		break;
	default : 
		currentCell.innerText = value.toString();
		break;
	}	}
export function evaluateCellExpressions( ) {
	////	Loops throught the expressions in a spreadsheet and 
	////	evaluates them one by one. Multiple runs are required 
	////	if an expression references another not yet evaluated 
	////	expression.

	// Retrieve all expression cells and remove their result attribute.
	const cells = Array.from( document.querySelectorAll( "table.spreadsheet [data-xpr]" ));
	cells.forEach( c => c.spreadsheetCore.value = undefined);

	// Evaluation loop
	let equationSolved;
	do {
		// Init exit condition
		equationSolved = false;
		for ( let i = 0 ; i < cells.length ; i ++ ) {
			setCurrentCell( cells[ i ] );
			// Skip processing if thecell was already evaluated.
			if ( typeof currentCell.spreadsheetCore.value != "undefined") continue;
			// Evaluate and record successful evaluation.
			evaluateCellExpression( );
			equationSolved ||= ! evalError;	
			}
		} while ( equationSolved ) ;  // 
	}

export function evaluateCellExpression( ) {
	////	Evaluates the expression found in the data-xpr attribute,
	////	sets the data-value attribute, and the cell content with 
	////	the formatted result value.
	////
	////	References
    ////		currentCell - reference to the HTML table cell element with
	////			an data-xpr attribute
	let expression = currentCell.dataset.xpr;
	console.log( `spreadsheet.js:evaluateCellExpression(): ${currentRow} ${currentColumn} ${expression}` );
	// Evaluate expression.
	evalError = false;
	try {
		const result = eval( expression );
		console.log( `spreadsheet.js:evaluateCellExpression(): ${result} ${typeof result}` );
		if ( ! evalError ) {
			currentCell.spreadsheetCore.value = result;
			formatValue( );
		}	}
	catch ( e ) { 
		evalError=true; 
		currentCell.innerText = e.toString();
		console.error( e ); 
		}
	}
