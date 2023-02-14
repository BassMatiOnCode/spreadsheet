//
//	Test support functions
//

let errors = 0;

export const report = window.parent.report || function ( testNumber, status, result, errors, comment ) { 
	console.log( testNumber, status, result, errors, comment ) 
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
	document.getElementById( "errors" ).innerText = errors;
	window.requestAnimationFrame( () => report( document.getElementById("test-number").innerText, document.getElementById("status").innerText, errors ? "fail" : "pass", errors + " errors" )); 
	}
