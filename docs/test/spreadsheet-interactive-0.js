/*
 *		spreadsheet-interactive.js    2023-02-01  usp 
 */

import { currentSheet, countColumns } from "./spreadsheet-core-0.js" ;

export const insertRows = ( rows, at = -1, celltypeInfo = "TD", sheet = currentSheet ) =>
	// Insert a number of rows into the current worksheet.
	// at : The index, id or TR element reference of the 
	// insert position.
	{
		// Normalize insert position.
	switch ( typeof at ) {
	case "object" :
		at = at.rowIndex ;
		break;
	case "string" :
		at = document.getElementById( at.rowIndex );
		// intended fall through
	case "number" :
		break;
	default :
		throw new Error( "spreadsheet-interactive.js:insertRows(): Unsupported type." );
		}
		// Make sure that insert position is above the bottom label row
	if ( sheet.rows[ at ].
		// Create the cell type info
	if ( ! Array.isArray( celltypeInfo )) celltypeInfo = new Array(countColumns()).fill( celltypeInfo, 0 );
		// Create the rows.
	for ( let i = 0 ; i < rows ; i ++ ) {
		const row = sheet.insertRow( at );
		for ( let j = 0 ; j < celltypeInfo.length ; j ++ ) {
			const cell = row.appendChild( document.createElement( celltypeInfo[ j ] ));
			cell.setAttribute( "contenteditable", "" );
		}	}
		// Update logical addresses
	for ( let i = 0 ; i < rows ; i ++ ) {

		}
	}