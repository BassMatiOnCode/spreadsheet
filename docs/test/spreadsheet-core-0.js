/*
 *		spreadsheet-1.js    2023-01-21   usp
 */

"use strict" ;

// Import functions and add them to the module global namespace
import * as spreadsheetFunctions from './spreadsheet-functions-0.js';
( function( ) {
	for ( let o in spreadsheetFunctions ) globalThis[ o ] = spreadsheetFunctions[ o ];
	} ) ( );
export const importModule = moduleName => {
	let p = import( moduleName );
	p.then( m => { for ( let o in m ) globalThis[ o ] = m[ o ]; } );
	return p;
	}

export const spreadsheets = { } ;
	// Provides a map of spreadsheet tables on the page.

export let csh, currentSheet, ccell, currentCell, cr, currentRow, cc, currentColumn, evalError;

	// Support functions

export function findParent ( e, criteria ) {
	////	Searches for an object that matches the required criteria.
	////	Criteria is an associative array with name-value pairs.
	// TODO Move to page.js
	while ( e && ( e = e.parentElement )) {
		let found = true ;
		for ( const name in criteria ) 
			if ( e[ name ] !== criteria[ name ] ) {
				found = false ;
				break ;
				}
		if ( found ) return e ;
	}	}
export const setCurrentSpreadsheet = ( sheet ) => { 
	csh = currentSheet = sheet ; 
	} 
export const setCurrentCell = (cell) => {
	////	Set parameters related to the current cell
	currentCell = ccell = cell ;
	currentSheet = findParent( cell, {tagName : "TABLE"} );
	currentRow = cr = cell ? +currentCell.parentElement.dataset.row : undefined ;
	currentColumn = cc = cell ? +currentCell.dataset.col : undefined ;
	}
export const sheet = id => {
	return document.getElementById( id );
	}
export const offset = (rows, cols, cell = currentCell) => {
	// Offset cell, returns the cell offset by a number of rows and columns
	// from the specified cell.
	const spreadsheet = findParent( cell, { tagName : "TABLE" } );
	rows += cell.parentElement.rowIndex;
	cells += cell.cellIndex ;
	return spreadsheet.querySelector( `tr[row="${rows}"] [col="${cols}"]` );
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
	////	References : currentWorksheet.	
	
	console.info( `spreadsheet-core.js:initSpreadsheet(): ${spreadsheet.id}` );

		// Add spreadsheetCore member
	spreadsheet.spreadsheetCore = { 
			// Helpers for structure changes
		firstColumn : 0, 
		lastColumn : countColumns( spreadsheet.rows ) - 1, 
		firstRow : 0, 
		lastRow : spreadsheet.rows.length - 1
		} ;
	
		// Checks
	if ( ! spreadsheet.id ) console.warn( "initSpreadsheet(): Spreadsheet table has no id, so it cannot be referenced." );
	else if ( document.querySelectorAll( `#spreadsheet.id` ).length > 1 ) console.warn( "initSpreadsheet(): Duplicate spreadsheet id (${spreadsheet.id) cannot be addressed reliably." );
	
		// Initialize 
	initAddresses( spreadsheet );
	initCellValues( spreadsheet );
	createLabels( spreadsheet ) ;

	// Add event listeners
	spreadsheet.addEventListener( "focusin", evt => {
		console.info( "focusin event handler" );
		// Show a prefixed plain text in the cell
		setCurrentCell( evt.target );
		setPrefixedText( );
		// Select the entire text in the cell
		if ( evt.target.innerText.length > 0) window.getSelection().setBaseAndExtent( evt.target, 0, evt.target,1 );
		} ) ;  // FocusIn
	currentSheet.addEventListener( "focusout", evt => {
		console.info( "focusout event handler" );
		setCurrentCell( evt.target );
		parseInput( );
		formatValue( );
		evaluateCellExpressions( evt.currentTarget );
		} ) ;  // FocusOut
	}
export function initAddresses( spreadsheet ) {
	/// Decorates row and cell elements with locgical row and column numbers.
	console.info( "spreadsheet-core.js: initAddresses()" );
	// Create logical column number attributes, with colspans taken into account
	const startcol = spreadsheet.tBodies[ 0 ].classList.contains( "rowlabels-left" ) ? 1 : 0 ;
	const startrow = spreadsheet.tHead && spreadsheet.tHead.firstChild.classList.contains( "column-labels" ) ? 1 : 0 ;
	for ( let rix = startrow ; rix < spreadsheet.rows.length ; rix ++ ) {
		const row = spreadsheet.rows[ rix ];
		row.dataset.row = rix - startrow ;
		let colspan = 0;
		for ( let cix = startcol ; cix < row.cells.length ; cix ++ ) {
			// Set the logical column number.
			// TODO : Really set current cell here?
			const cell = ( row.cells[ cix ] );
			cell.dataset.col = cix - startcol + colspan ;
			colspan += cell.colSpan - 1;
		}	}

	// Addjust logical column numbers according to row-spanning cells above
	let cells = spreadsheet.querySelectorAll("[rowspan]");
	for ( let i = 0 ; i < cells.length ; i ++ ) {
		let cell = cells[ i ];  // row-spanning cell
		let cellColumn = parseInt( cell.dataset.col ); // logical column number
		for ( let rix = cell.parentElement.rowIndex + 1 ; rix < cell.parentElement.rowIndex + cell.rowSpan ; rix ++ ) {
			let row = spreadsheet.rows[ rix ];
			for ( let cix = startcol ; cix < row.cells.length ; cix ++ ) {
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
	// Initialize internal value and display of cells.
	console.info( `spreadsheet-core.js:initCellValues(): ${spreadsheet.id || ""}`);
	for ( let i = 0 ; i < spreadsheet.rows.length ; i ++ ) {
		for ( let j = 0 ; j < spreadsheet.rows[ i ].cells.length ; j ++ ) {
			const cell = spreadsheet.rows[ i ].cells[ j ];
			setCurrentCell( cell );
			// parse, store and format the cell text
			cell.spreadsheetCore = { } ;
			// Skip expression cells. They cannot be parsed, they must be evaluated first.
			if (cell.hasAttribute( "data-xpr" )) continue;
			parseInput ( );
			formatValue( );
			console.info( `spreadsheet-core.js:initCellValues():  ${cell.spreadsheetCore.value}` );
	}	}	}

	// Row and Column Labels

export function createLabels( ) {
	////	Creates the row and column labels	
	const keywords = (currentSheet.getAttribute( "gen-labels" ) || "").split("," );
	keywords.forEach( (keyword) => {
		switch ( keyword ) {
		case "top" :
		case "colums" :
			insertColumnLabels( );
			break;
		case "left" :
		case "rows" :
			insertRowLabels( );
			break;
		case "bottom" :
			appendColumnLabels( );
			break;
		case "right" :
			appendRowLabels( );
			break;
		case "both" :
			insertColumnLabels( );
			insertRowLabels( );
			break;
		case "all" :
			insertColumnLabels( );
			appendColumnLabels(  );
			insertRowLabels( );
			appendRowLabels( );
			break;
		case "" :
		case "none" :
			break;
		default :
			console.error( "spreadsheet.js:initSpreadsheet(): Illegal value for gen-lables attribute: " + keywords );
			} 
		} ) ; 

	// Processing done, remove control attribute
	currentSheet.removeAttribute( "gen-labels" )
	}
export function insertColumnLabels( ) {
	// Create a table header row at the top.
	const row = currentSheet.createTHead( ).insertRow( 0 );
	currentSheet.spreadsheetCore.firstRow += 1;
	currentSheet.spreadsheetCore.lastRow += 1;
	createColumnLabels( row );
	}
export function appendColumnLabels( ) {
	// Create a table header row at the top.
	const row = currentSheet.createTHead( ).insertRow( );
	createColumnLabels( row );
	}
export function countColumns( rows = currentSheet.rows ) {
	////	Counts the number of logical columns in a HTML Table.
	let count = 0 , cells = rows[ rows[ 0 ].classList.contains( "column-labels" ) ? 1 : 0 ].cells ; 
	for ( let i = 0 ; i < cells.length ; i ++ ) count += cells[ i ].colSpan ;
	return count;
	}
export function createColumnLabels( row ) {
	// Add class name for CSS
	row.classList.add( "column-labels" );
	// Generate cells
	const numColumns = countColumns( );
	const offset = currentSheet.hasAttribute( "rowlabels-left" ) ? -1 : 0 ;
	for ( let i = 0 ; i < numColumns ; i ++ ) row.insertCell( ).innerText = i + offset ;
	if ( offset ) row.cells[ 0 ].innerText = "" ;
	if ( currentSheet.hasAttribute( "rowlabels-right" )) rows.cells[ rows.cells.count - 1 ].innerText = "" ;
	}
export function insertRowLabels ( where ) {
		// where : left | right
	currentSheet.classList.add( `rowlabels-${where}` );
		// Adjust data cell range
	if ( where === "left" ) {
		currentSheet.spreadsheetCore.firstColumn += 1;
		currentSheet.spreadsheetCore.laststColumn += 1;
		}
		// covert to insert index
	where = where === "left" ? 0 : null ;
	const offset = -currentSheet.spreadsheetCore.firstColumn ;
	const rows = currentSheet.rows;
	for ( let i = 0 ; i < rows.length ; i ++ {
		const cell = currentSheet.rows[ i ].insertCell( where );
		cell.innerText = i + offset ;
		if ( i >= currentSheet.spreadsheetCore.firstColumn && i <= currentSheet.spreadsheetCore.lastColumn )cell.classList.add( "row-label" );
		}
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
	if ( currentCell.dataset.format ) currentCell.innerHTML = eval( currentCell.dataset.format );
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
export function parseBool( s ) {
	// TODO : currently not used
	switch ( s.trim()) {
	case "yes" :
	case "1" :
	case "true" : 
		return true;
	case "no" :
	case "0" :
	case "false" :
		return false;
	}	}
export function rr ( rowOffset ) { 
	return currentRow + rowOffset ; 
	}
export function rc ( columnOffset ) { 
	return currentColumn + columnOffset ; 
	}
export function cell( row, column, spreadsheet ) {
	return cellObject( row, column, spreadsheet ).spreadsheetCore.value ;
	}
export function ncell( name, spreadsheet = currentSheet ) {
	return spreadsheet.querySelector( `[name="${name}"]` ).spreadsheetCore.value;
	}
export const ncellObject = ( name, spreadsheet = currentSheet ) => {
	return spreadsheet.querySelector( `[name="${name}"]` );
	}
export const nco = ncellObject;

export function cellObject ( row, column, spreadsheet = currentSheet ) {
	// TODO : Rename to cellObject
	/// Returns an HTML table cell element
	/// row : logical row number or cell name
	/// column : logical column number
	/// spreadsheet : reference to a spreadsheet, optional
	/// References: currentSheet
	return spreadsheet.querySelector( `TR[data-row="${row}"]>[data-col="${column}"]` );
	}
export function evaluateCellExpression( ) {
	////	Evaluates the expression found in the data-xpr attribute,
	////	sets the data-value attribute, and the cell content with 
	////	the formatted result value.
	////
	////	Parameters
    ////		cell - reference to the HTML table cell element with
	////			an data-xpr attribute
	////	Returns 
	////		true = Expression solved
	////		false = not solved
	////	References
	////		currentCell.
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

