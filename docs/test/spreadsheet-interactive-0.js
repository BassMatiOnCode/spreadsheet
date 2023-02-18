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

	// Selected Ranges

	// Holds the selected ranges of all spreadsheets on the page
export const selectedRanges = [ ] ;

export function CellRange ( spreadsheet, row1, col1, row2=row1, col2=col1 ) {
	// Constructor function
	this.spreadsheet = typeof spreadsheet === "string" ? document.getElementById( spreadsheet ) : spreadsheet;
	this.y1 = row1;
	this.x1 = col1;
	this.y2 = row2;
	this.x2 = col2;
	this.toggleAttribute();
	}

CellRange.prototype.extend = function ( row, col ) {
	// A shift-click extends a selected cell range.
	this.toggleAttribute( );
	if ( row < this.y1 || row === this.y1 && col < this.x1 ) {
		this.y2 = this.y1;
		this.x2 = this.x1;
		this.y1 = row;
		this.x1 = col;
		}
	else {
		this.y2 = row;
		this.x2 = col;
		}
	this.toggleAttribute( );
	} ;

CellRange.prototype.toggleAttribute = function ( ) {
	for ( let i = this.y1 ; i <= this.y2 ; i ++ ) {
		const row = this.spreadsheet.rows[ i ] ;
		for ( let j = this.x1 ; j <= this.x2 ; j ++ ) {
			row.cells[ j ].toggleAttribute( "selected" );
	}	}	}

	// Spreadsheet table event handlers

export const cellLeftClickHandler = function ( evt ) {
	// "this" references the spreadsheet table
	// Make sure that we are working on a cell and not some child element.
	console.log( "left-click" );
	if ( cellSizeInfo.cell ) {
		cellSizeInfo.cell = undefined;
		return;
		}
	let cell = evt.target;
	while ( cell && cell.tagName !== "TD" && cell.tagName !== "TH" ) cell = cell.parentElement;
	if ( ! cell ) return; // Just in case...
	// Prevent browser default context menu.
	evt.preventDefault( );
	evt.stopPropagation( );
	if ( evt.shiftKey ) {
		// Extend selected range.
		const range = selectedRanges[ this.id ] ;
		if ( ! range ) return ; // Nothing to extend
		range.extend( cell.parentElement.rowIndex, cell.cellIndex );
		}
	else {
		// Create a new selected range.
		if ( selectedRanges[ this.id ] ) selectedRanges[ this.id ].toggleAttribute();
		selectedRanges[ this.id ] = new CellRange( this.id, cell.parentElement.rowIndex, cell.cellIndex );
		}
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
const cellSizeInfo = {
	cell : undefined,	// cell at mouse down
	cellW : 0,		// cell width at mouse down
	cellH : 0		// cell height at mouse down
	} ;
export const mouseDownHandler = function ( evt ) {
	console.log( `MouseDown` );
	if ( /(TD|TH)/.test( evt.target.tagName ) && evt.offsetX > evt.target.scrollWidth - 20 && evt.offsetY > evt.target.scrollHeight - 20 ) {
		// A mouse button went down on a table cell.
		console.log( "Resizing started" );
		cellSizeInfo.cell = evt.target;
		cellSizeInfo.cellW = evt.target.scrollWidth ;
		cellSizeInfo.cellH = evt.target.scrollHeight ;
		// Move size constraints from row and column to cell
		evt.target.style.height = evt.target.parentElement.style.height;
		evt.target.style.width = this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width ;
		// Clear the row and column size restrictions
		evt.target.parentElement.style.height = "" ;
		this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width = "" ;
		}
	} ;
export const mouseUpHandler = function ( evt ) {
	console.log( "mouse up" );
	if ( cellSizeInfo.cell ) {
		// The cell has been resized.
		console.log( "Cell resized" );
		// Copy cell size info to row and column elements
		evt.target.parentElement.style.height = evt.target.scrollHeight + "px" ;
		this.rows[ 0 ].cells[ +evt.target.dataset.col + 1 ].style.width = evt.target.scrollWidth - 10  + "px" ;
		// Delete size info in cell
		evt.target.style.width = evt.target.style.height = "" ;
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