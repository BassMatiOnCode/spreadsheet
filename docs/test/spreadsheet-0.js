/*
 *		spreadsheed-1.js    2023-01-21   usp
 */

export const spreadsheets = { } ;
	// Provides a map of spreadsheet tables on the page.

export const state = {
		// Variables used for communication between evaluation functions.
		// Note: Variables on the root level of a module are read-only!
	currentSpreadsheet : null, 
		// The current spreadsheet the evaluation functions work on.
	currentRow : -1, currentColumn : -1,
		// Logical row and column numbers
	evaluationError : null
		// Indicates that evaluation did not work for some reason.
	} ;

console.log( "spreadsheet-0.js: Initializing..." );
initPage( );

export default function initPage ( ) {
	//// Collect spreadsheet tables on the page.
	const list = document.getElementsByClassName( "spreadsheet" );
	for ( let i = 0 ; i < list.length ; i ++ ) {
		initSpreadsheet( list[ i ] );
		}
	} ;

export function initSpreadsheet ( spreadsheet ) {
	// Checks
	if ( ! spreadsheet.id ) { console.error( "initSpreadsheet(): Spreadsheet table has no id, skipped." ); return; }
	if ( spreadsheets[ spreadsheet.id ] ) { console.error( "initSpreadsheet(): Duplicate spreadsheet id, skipped." ); return; }
	// Add spreadsheet to the list
	console.log( `\tspreadsheet.js:initSpreadsheet(${spreadsheet.id})` );
	spreadsheets[ spreadsheet.id ] = spreadsheet;
	initLogicalCellAddresses( spreadsheet );
	createLabels( spreadsheet ) ;
	// 
	}

export function initLogicalCellAddresses( spreadsheet ) {
	// Create logical column number attributes, with colspans taken into account
	const startcol = spreadsheet.tBodies[ 0 ].classList.contains( "rowlabels-left" ) ? 1 : 0 ;
	const startrow = spreadsheet.tHead && spreadsheet.tHead.firstChild.classList.contains( "column-labels" ) ? 1 : 0 ;
	for ( let rix = startrow ; rix < spreadsheet.rows.length ; rix ++ ) {
		const row = spreadsheet.rows[ rix ];
		row.dataset.row = rix - startrow ;
		let colspan = 0;
		for ( let cix = startcol ; cix < row.cells.length ; cix ++ ) {
			let cell = row.cells[ cix ];
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

export function createLabels( spreadsheet ) {
	////	Creates the row and column labels	
	const keywords = (spreadsheet.getAttribute( "gen-labels" ) || "").split("," );
	keywords.forEach( (keyword) => {
		switch ( keyword ) {
		case "top" :
		case "colums" :
				insertColumnLabels( spreadsheet );
				break;
		case "left" :
		case "rows" :
				insertRowLabels( spreadsheet );
				break;
		case "bottom" :
				appendColumnLabels( spreadsheet );
				break;
		case "right" :
				appendRowLabels( spreadsheet );
				break;
		case "both" :
				insertColumnLabels( spreadsheet );
				insertRowLabels( spreadsheet );
				break;
		case "all" :
				insertColumnLabels( spreadsheet );
				appendColumnLabels( spreadsheet );
				insertRowLabels( spreadsheet );
				appendRowLabels( spreadsheet );
				break;
		default :
				console.error( "spreadsheet.js:initSpreadsheet(): Illegal value for gen-lables attribute: " + keywords );
			} 
		} ) ; 

	// Processing done, remove control attribute
	spreadsheet.removeAttribute( "gen-labels" )
	}
	
export function insertColumnLabels( spreadsheet ) {
	// Create a table header row at the top.
	const row = spreadsheet.createTHead( ).insertRow( 0 );
	createColumnLabels( spreadsheet, row );
	}

export function appendColumnLabels( spreadsheet ) {
	// Create a table header row at the top.
	const row = spreadsheet.createTFoot( ).insertRow( );
	createColumnLabels( spreadsheet, row );
	}

export function countColumns( rows ) {
	////	Counts the number of logical columns in a HTML Table.
	let count = 0 , cells = rows[ rows[ 0 ].classList.contains( "column-labels" ) ? 1 : 0 ].cells ; 
	for ( let i = 0 ; i < cells.length ; i ++ ) count += cells[ i ].colSpan ;
	return count;
	}

export function createColumnLabels( spreadsheet, row ) {
	// Add class name for CSS
	row.classList.add( "column-labels" );
	// Generate cells
	const numColumns = countColumns( spreadsheet.rows );
	const offset = spreadsheet.hasAttribute( "rowlabels-left" ) ? -1 : 0 ;
	for ( let i = 0 ; i < numColumns ; i ++ ) row.insertCell( ).innerText = i + offset ;
	if ( offset ) row.cells[ 0 ].innerText = "" ;
	if ( spreadsheet.hasAttribute( "rowlabels-right" )) rows.cells[ rows.cells.count - 1 ].innerText = "" ;
	}

export function insertRowLabels ( spreadsheet ) {
	spreadsheet.classList.add( "rowlabels-left" );
	const offset = spreadsheet.rows[ 0 ].classList.contains( "column-labels" ) ? -1 : 0 ;
	for ( let i = 0 ; i < spreadsheet.rows.length ; i ++ )
		spreadsheet.rows[ i ].insertCell( 0 ).innerText = i + offset ;
	if ( offset ) spreadsheet.rows[ 0 ].cells[ 0 ].innerText = "" ;
	const lastRow = spreadsheet.rows[ spreadsheet.rows.length - 1 ] ;
	if ( lastRow.classList.contains( "column-labels" )) lastRow.cells[ 0 ].innerText = "" ; 
	}

export function appendRowLabels ( spreadsheet ) {
	spreadsheet.classList.add( "rowlabels-right" );
	const offset = spreadsheet.rows[ 0 ].classList.contains( "column-labels" ) ? -1 : 0 ;
	for ( let i = 0 ; i < spreadsheet.rows.length ; i ++ )
		spreadsheet.rows[ i ].insertCell( ).innerText = i + offset ;
	if ( offset ) spreadsheet.rows[ 0 ].cells[ spreadsheet.rows[ 0 ].cells.length - 1 ].innerText = "" ;
	const lastRow = spreadsheet.rows[ spreadsheet.rows.length - 1 ] ;
	if ( lastRow.classList.contains( "column-labels" )) lastRow.cells[ lastRow.cells.length - 1 ].innerText = "" ; 
	}

export function findParentElement ( e, criteria ) {
	////	Searches for an object that matches the required criteria.
	////	Criteria is an associative array with name-value pairs.
	// TODO Move to page.js
	while ( ! found && e ) {
		let found = true ;
		for ( const name in criteria ) 
			if ( e[ name ] !== criteria[ name ] ) {
				found = false ;
				break ;
				}
		if ( found ) return e ;
		e = e.parentElement ;
	}
}

	// Cell reference functions, reserved keywords and usable in expressions:

export function rr ( rowOffset ) { return state.currentRow + rowOffset ; }

export function rc ( columnOffset ) { return state.currentColumn + columnOffset ; }

export function cell ( row, column ) {
	////	Finds a cell element with a specific logical row/column value or cell name
	////	References: state.currentSpreadsheet
	if ( ! column && typeof row === "string" ) return state.currentSpreadsheet.querySelector( `[name="${row}"]` );
	return state.currentSpreadsheet.querySelector( `TR[data-row="${row}"]>[data-col="${column}"]` );
	}

export function format ( cell ) {
	// Formats a cell value according to its data type and fomat.
	switch( cell.dataset.type ) {
	case "number" :
			return cell.dataset.value.toFixed( cell.dataset.format || "2" );
	default :
			return cell.dataset.value;
		}
	}

export function evaluateCellExpression( currentCell ) {
	////	Evaluates the expression found in the xpr attribute,
	////	sets the data-value attribute, and the cell content with 
	////	the formatted result value.
	////
	////	Parameters
    ////		cell - reference to the HTML table cell element with
	////			an xpr attribute
	////	Returns 
	////		true = Expression solved
	////		false = not solved
	////	References
	////		state.currentRow, state.currentColumn.
	let expression = currentCell.getAttribute( "xpr" );
	// Determine logical cell coordinates. Required for relative cell addressing.
	state.currentColumn = parseInt( currentCell.dataset.col );
	state.currentRow = parseInt( currentCell.parentElement.dataset.row );
	// Reset evaluation error. Might be set in cell() function.
	state.error = false;
	// Evaluate expression.
	try {
		const result = eval( currentCell.getAttribute( "xpr" ));
		if ( state.error ) {
			currentCell.dataset.value = result ;
			currentCell.dataset.type = typeof result;
			currentCell.innerText = format( currentCell( currentCell ));
		}	}
	catch ( e ) { 
		state.error=true; 
		console.error( e ); 
		}
	return ! state.error ;
	}

export function evaluateCellExpressions( spreadsheet ) {
	////	Loops throught the expressions in a spreadsheet and 
	////	evaluates them. Multiple runs are required if an expression
	////	references another not yet evaluated expression.
	// Retrieve all expression cells and remove their result attribute.
	const cells = Array.from( spreadsheet.querySelectorAll( "[xpr]" ));
	cells.forEach( cell => cell.removeAttribute( "value" ));
	do {
		let equationSolved = false;
		for ( let i = 0 ; i < cells.length ; i ++ ) {
			// Skip processing if already evaluated.
			const cell = cells[ i ];
			if ( cell.hasAttribute( "data-value" )) continue;
			// Evaluate and record successful evaluation.
			equationSolved ||= evaluateCellExpression( cell );	
			}
		} while ( equationSolved ) ;  // 
	}

