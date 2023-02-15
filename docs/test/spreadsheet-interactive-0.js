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
	// Add cell context menu event handlers
	const dialog = document.getElementById("cell-context");
	dialog.addEventListener( "click" , cellContextDialogClickHandler.bind( dialog ));
	dialog.addEventListener( "close", cellContextDialogCloseHandler.bind( dialog ));
	} ;
export const cellLeftClickHandler = function ( evt ) {
	// Prevent browser default context menu
	evt.preventDefault( );
	// Select the current cell
	const activeCell = this.querySelector( "[active]" );
	if ( activeCell ) activeCell.removeAttribute( "active" );
	let cell = evt.target;
	while ( cell.tagName !== "TD" && cell.tagName !== "TH" ) cell = cell.parentElement;
	cell.toggleAttribute( "active" );	
	} ;
export const cellRightClickHandler = function ( evt ) {
	// Prevent browser default context menu
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
		if ( ! cell.hasAttribute( "resize" )) {
			// Start resize
			table.querySelectorAll( "[resize]" ).forEach( cell => cell.removeAttribute( "resize" ));
			// Prevent cell from collapsing
			cell.style.height = cell.parentElement.style.height;
			cell.style.width = table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width ;
			// Clear the row and column size restrictions
			cell.parentElement.style.height = "" ;
			table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width = "" ;
			}
		else {  
			// End resize
			// Make row height and column width permanent
			cell.parentElement.style.height = cell.scrollHeight + "px" ;
			table.rows[ 0 ].cells[ +cell.dataset.col + 1 ].style.width = cell.scrollWidth + "px";
			// Clear the cell size
			cell.style.height = cell.style.width = "" ;
			}
		cell.toggleAttribute( "resize" );
		break;
		}
	} ;
