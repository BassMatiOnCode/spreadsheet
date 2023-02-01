/*
 *		spreadsheet-utitity.js   2023-02-01   usp
 */

export const norm = element => typeof element === "string" ? document.getElementById( element ) : element ;  // Normalize returns an element reference. Accepts a reference to or the ID of an element.

export const normElements = elements => {
	// Normalizes all element references in the list.
	for ( let i = 0 ; i < elements.length ; i ++ ) elements[ i ] = norm( elements[ i ] );
	return elements ;
	} ;