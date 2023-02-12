//
//	Test support functions
//

let errors = 0;

export const report = window.parent.report || function ( path, status, result, comment ) { 
	console.log( path, status, result, comment ) 
	} ;

export const logError = (number, msg) => { 
	errors += 1 ; 
	console.log( `Test ${number} failed: ${msg}` ) 
	} ;

export const check = function ( number, expected, actual, message ) {
	if ( expected !== actual ) logError( number, `${message} expected: ${expected}, actual: ${actual}` );
	} ;

export const publishResults = function ( ) {
	document.getElementById("status").innerText = "finished";
	document.getElementById("result").setAttribute( "value", errors ? "fail" : "pass" );
	window.requestAnimationFrame( () => report( document.location.pathname, document.getElementById("status").innerText, errors ? "fail" : "pass", errors + " errors" )); 
	}
