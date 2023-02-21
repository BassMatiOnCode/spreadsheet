/*
 *		spreadsheet-interactive-0.js   2023-02-14
 */

export function initPage( ) {
	document.querySelectorAll( "table.spreadsheet" ).forEach( initSpreadsheet );
	} ;
export function initSpreadsheet( sheet ) {
	if ( typeof sheet === "string" ) sheet = document.getElementById( sheet );
	// Add sheet event handlers
	sheet.addEventListener( "click", cellLeftClickHandler.bind( sheet ));
	sheet.addEventListener( "contextmenu", cellRightClickHandler.bind( sheet ));
	sheet.addEventListener( "mousedown", mouseDownHandler.bind( sheet ));
	sheet.addEventListener( "mouseup", mouseUpHandler.bind( sheet ));
	// Add cell context dialog event handlers
	const dialog = document.getElementById("cell-context");
	dialog.addEventListener( "click" , cellContextDialogClickHandler.bind( dialog ));
	dialog.addEventListener( "close", cellContextDialogCloseHandler.bind( dialog ));
	} ;

	// Variables
	
let cellResizing ;  // Reference to a table cell being resized.
export const selectedRanges = { } ;  // Holds the selected ranges of all spreadsheets on the page

	// Selected cell range objects

export function CellRange ( spreadsheet, row1, col1, row2=row1, col2=col1 ) {
	// Constructor function
	// Parameters are label cell index values. These are not affected by cells
	// with rowspan and colspan values greather than 1.
	// TODO: Does it make sense to work with logical row and column numbers instead?
	this.spreadsheet = typeof spreadsheet === "string" ? document.getElementById( spreadsheet ) : spreadsheet;
	this.row1 = row1;
	this.col1 = col1;
	this.row2 = row2;
	this.col2 = col2;
	this.toggleAttribute();
	}
CellRange.prototype.extend = function ( row, col ) {
	// (Re)sets the second point of the range.
	this.toggleAttribute( );
	this.row2 = row;
	this.col2 = col;
	this.toggleAttribute( );
	} ;
CellRange.prototype.toggleAttribute = function ( ) {
	// Toggles the "selected" attribute of cell elements.
	// Note that cell index does not always correlate to the column number.
	// First get the numbers ordered.
	let r1, r2, c1, c2 ;
	if ( this.row1 > this.row2 ) { r1 = this.row2 ; r2 = this.row1 } 
	else { r1 = this.row1 ; r2 = this.row2 } 
	if ( this.col1 > this.col2 ) { c1 = this.col2 ; c2 = this.col1 } 
	else { c1 = this.col1 ; c2 = this.col2 } 
	// Then loop over rows and columns.
	for ( let i = r1 ; i <= r2 ; i ++ ) {
		const row = this.spreadsheet.rows[ i ] ;
		// Loop through the regular spreadsheet cells
		for ( let j = 1 ; j < row.cells.length - 1  ; j ++ ) {
			const cell = row.cells[ j ];
			// Check the logical olumn number against the cell index range. 
			if ( cell.dataset.col < c1 - 1 ) continue;
			if ( cell.dataset.col > c2 - 1 ) break;
			// Cell is within the range, so toggle the attribute.
			cell.toggleAttribute( "selected" );
	}	}	}

	// Spreadsheet table event handlers

export const cellLeftClickHandler = function ( evt ) {
	// Note: "this" references the spreadsheet table
	console.log( "left-click" );
	// A left-click following a resize event must be ignored.
	if ( cellResizing ) { cellResizing = undefined; return; }
	// Make sure that we are working on a cell and not some child element.
	let cell = evt.target;
	while ( cell && cell.tagName !== "TD" && cell.tagName !== "TH" ) cell = cell.parentElement;
	if ( ! cell ) return; // Just in case...
	// Prevent the browser from selecting text across cells.
	evt.preventDefault( );
	evt.stopPropagation( );
	// Call the appropriate selection function.
	selectCells( this, cell, evt.shiftKey );
	return ;
	} ;
export const cellRightClickHandler = function ( evt ) {
	// Prevent browser default context menu
	console.log( "right-click" );
	evt.preventDefault( );
	// Find table element
	let cell = evt.target;
	while (cell.tagName !== "TD" && cell.TagName !== "TH" ) cell = cell.parentElement;
	// Prepare and open the context dialog
	const dialog = document.getElementById("cell-context");
	dialog.dataset.result = "" ;
	dialog.dataset.context = `${this.id},${cell.parentElement.rowIndex},${cell.cellIndex}` ;
	dialog.style.marginLeft = `${evt.clientX}px` ;
	dialog.style.marginTop = `${evt.clientY}px` ;
	dialog.showModal( );
	} ;
export const mouseDownHandler = function ( evt ) {
	console.log( `MouseDown` );
	// Exit if the mouse did not go down on the sizer.
	if ( ! /(TD|TH)/.test( evt.target.tagName ) || evt.offsetX < evt.target.scrollWidth - 20 || evt.offsetY < evt.target.scrollHeight - 20 ) return ;
	// Record the cell being resized.
	console.log( "Resizing started" );
	cellResizing = evt.target;
	// Move size constraints from row and column to cell
	if ( evt.target.hasAttribute( "data-col" )) {
		// Regular spreadsheet cell.
		console.log( "regular spreadsheet cell" );
		evt.target.style.height = evt.target.parentElement.style.height;
		evt.target.parentElement.style.height = "" ;
		evt.target.style.width = this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width ;
		this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width = "" ;
		}
	else if ( evt.target.cellIndex === 0  ) {
		// Left row label cell.
		console.log( "left row label cell" );
		evt.target.style.height = evt.target.parentElement.style.height;
		evt.target.parentElement.style.height = "" ;
		evt.target.style.width = this.rows[ 0 ].firstElementChild.style.width ;
		this.rows[ 0 ].firstElementChild.style.width = "" ;
		}
	else if ( evt.target.cellIndex === evt.target.parentElement.cells.length - 1  ) {
		// Right row label cell.
		console.log( "right row label cell" );
		evt.target.style.height = evt.target.parentElement.style.height;
		evt.target.parentElement.style.height = "" ;
		evt.target.style.width = this.rows[ 0 ].lastElementChild.style.width ;
		this.rows[ 0 ].lastElementChild.style.width = "" ;
		}
	else if ( evt.target.parentElement.rowIndex === 0 ) {
		// Top column label cell.
		console.log( "top column label cell" );
		evt.target.style.height = evt.target.parentElement.style.height ;
		evt.target.parentElement.style.height = "" ;
		}
	else if ( evt.target.parentElement.rowIndex === this.rows.length - 1 ) {
		// Bottom column label cell.
		console.log( "bottom column label cell" );
		evt.target.style.height = evt.target.parentElement.style.height ;
		evt.target.parentElement.style.height = "" ;
		evt.target.style.width = this.rows[ 0 ].cells[ evt.target.cellIndex ].style.width ;
		this.rows[ 0 ].cells[ evt.target.cellIndex ].style.width = "" ;
		}
	} ;
export const mouseUpHandler = function ( evt ) {
	console.log( "mouse up" );
	if ( ! cellResizing ) return ;
	// The cell has been resized.
	console.log( "Cell resized" );
	// Copy cell size info to left row and top column label cells.
	if ( evt.target.hasAttribute( "data-col" )) {
		// A regular spreadsheet cell has been resized.
		// We use the logical column number to find the correct column label cell in the first row of the table.
		console.log( "regular spreadsheet cell" );
		this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width = evt.target.scrollWidth - 10  + "px" ;
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		evt.target.style.width = evt.target.style.height = "" ;
		}
	else if ( evt.target.cellIndex === 0 ) {
		// Left row label cell.
		console.log( "left row label cell" );
		this.rows[ 0 ].firstElementChild.style.width = evt.target.scrollWidth - 10  + "px" ;
		evt.target.style.width = "" ;
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		evt.target.style.height = "" ;
		}
	else if ( evt.target.cellIndex === evt.target.parentElement.cells.length - 1 ) {
		// Right row label cell.
		console.log( "right row label cell" );
		this.rows[ 0 ].lastElementChild.style.width = evt.target.scrollWidth - 10  + "px" ;
		evt.target.style.width = "" ;
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		evt.target.style.height = "" ;
		}
	else if ( evt.target.parentElement.rowIndex === 0 ) {
		// Top column label cell.
		console.log( "top column label cell" );
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		evt.target.style.height = "" ;
		}
	else if ( evt.target.parentElement.rowIndex === this.rows.length - 1 ) {
		// Bottom column label cell.
		console.log( "bottom column label cell" );
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		evt.target.style.height = "" ;
		this.rows[ 0 ].cells [ evt.target.cellIndex ].style.width = +evt.target.scrollWidth - 10 + "px" ;
		evt.target.style.width = "" ;
		}
	} ;

	// Cell Selection

export const selectCells = function ( table, cell, extend ) {
	// Select a range of cells.
	console.log( "selectCells()" );
	const row = cell.parentElement ;
	let r1, r2, c1, c2 ;
	const range = selectedRanges[ table.id ] ;
	if ( ! extend ) {
		// Deselect cells of the existing range.
		if ( range ) range.toggleAttribute();
		// Calculate row and column indices.
		if ( row.rowIndex === 0 || row.rowIndex === table.rows.length - 1) { 
			r1 = 1 ; 
			r2 = table.rows.length - 2 ; 
			c1 = c2 = cell.cellIndex;
			}
		else if ( cell.cellIndex === 0 || cell.cellIndex === row.cells.length - 1) { 
			c1 = 1 ; 
			c2 = row.cells.length - 2 
			r1 = r2 = row.rowIndex ;
			}
		else {
			c1 = c2 = +cell.dataset.col + 1 ;
			r1 = r2 = row.rowIndex;
		}
		// Create a new selected range.
		selectedRanges[ table.id ] = new CellRange( table.id, r1, c1, r2, c2 );
		}
	else {
		// Exit if no range.
		if ( ! range ) return ;
		// Calculate indices.
		if ( row.rowIndex === 0 ) { r2 = table.rows.length - 2 ; c2 = cell.cellIndex } 
		else if ( row.rowIndex === table.rows.length - 1 ) { r2 = 1; c2 = cell.cellIndex }
		else if ( cell.cellIndex === 0 ) { r2 = row.rowIndex ; c2 = row.cells.length - 2 }
		else if ( cell.cellIndex === row.cells.length - 1 ) {r2 = row.rowIndex ; c2 = 1 }
		else { r2 = row.rowIndex ; c2 = +cell.dataset.col + 1 } 
		// Extend existing range.
		range.extend( r2, c2 );
		}
	} ;

	// Cell Context Dialog

export const cellContextDialogClickHandler = function ( evt ) {
	// Set result and close dialog
	if ( evt.target.tagName === "TD" ) 
		this.dataset.result = `${evt.target.parentElement.rowIndex},${evt.target.cellIndex}` ;
	this.close();
	} ;
 export const cellContextDialogCloseHandler = function( ) {
	 // Evaluate dialog result and execute desired function
	console.log( "Cell context dialog closed ", this.dataset.result  );
	let table, row, col;
	[table, row, col] = [...this.dataset.context.split(",")];
	table = document.getElementById( table );
	switch ( this.dataset.result ) {
	case "0,0" :
		console.log( `insert row (${this.dataset.context})` );
		break;
	case "1,0" :
		console.log( `delete row (${this.dataset.context})` );
		break;
	case "2,0" :
		console.log( `insert column (${this.dataset.context})` );
		break;
	case "3,0" :
		console.log( `delete column (${this.dataset.context})` );
		break;
	case "4,0" :
		console.log( `resize cell (${this.dataset.context})` );
		const cell = table.rows[row].cells[col];
		if ( ! cell.hasAttribute( "resize" )) startResize( table, cell );
		else endResize( table, cell );
		cell.toggleAttribute( "resize" );
		break;
		}
	} ;
export const startResize = (table, cell) => {
	// Stop other cells from resizing.
	table.querySelectorAll( "[resize]" ).forEach( cell => {
		endResize( table, cell );
		cell.removeAttribute( "resize" );
		} ) ;
	// Prevent cell from collapsing
	cell.style.height = cell.parentElement.style.height;
	cell.style.width = table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width ;
	// Clear the row and column size restrictions
	cell.parentElement.style.height = "" ;
	table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width = "" ;
	} ;
export const endResize = (table, cell) => {
	// Make row height and column width permanent
	cell.parentElement.style.height = cell.scrollHeight + "px" ;
	table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width = cell.scrollWidth + "px";
	// Clear the cell size
	cell.style.height = cell.style.width = "" ;
	} ;