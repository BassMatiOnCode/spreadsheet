/*
 *		spreadsheet-utitity.js   2023-02-01   usp
 */

export const norm = element => typeof element === "string" ? document.getElementById( element ) : element ;  // Normalize returns an element reference. Accepts a reference to or the ID of an element.

export const normElements = elements => {
	// Normalizes all element references in the list.
	for ( let i = 0 ; i < elements.length ; i ++ ) elements[ i ] = norm( elements[ i ] );
	return elements ;
	} ;

export const consolidateTrailingSum = ( expression ) => {
		// Replaces addidive expressions of numbers at the end of string with their sum.
		// Eliminates leading monadic plus.
	const match = expression.match( /((^[+-]?|[+-])\d+[+-]\d+)$/ );
		// matches begin of string, optionally followed by plus or minus,
		// or a mandatory plus or minus, 
		// followed by a sequence of digits,
		// followed by plus or minuns,
		// followed by a sequence of digits,
		// followed by the end of the string.
	if ( ! match ) return expression;
	let result = +eval( match[ 0 ] );
	expression = splice( expression, 
		match.index, match.index + match[ 0 ].length - 1, 
		result < 0 ? result : "+" + result 
		) ;
	if ( expression[ 0 ] === "+" ) return expression.substring( 1 );
	else return expression;
	}

export const parseBool = s => {
	// Provides alternatives for true and false booleans
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

export const findParent = ( e, criteria ) => {
	// Searches for a parent object of e object that matches the required 
	// criteria. Criteria is an associative array with name-value pairs.
	while ( e && ( e = e.parentElement )) {
		let found = true ;
		for ( const name in criteria ) 
			if ( e[ name ] !== criteria[ name ] ) {
				found = false ;
				break ;
				}
		if ( found ) return e ;
	}	}

export const splice = ( s, from, to, insert ) => {
	// Cuts the range from...to from s and inserts the replacement string there.
	return s.substring( 0, from ) + insert + s.substring( to+1 );
	}