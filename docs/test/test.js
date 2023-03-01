//
//	Test support functions
//

let errors = 0;
let tests = 0;

export const report = window.parent.report || function ( testNumber, status, result, errors, comment ) { 
	console.log( testNumber, status, result, errors, comment ) 
	} ;

export const logError = (number, msg) => { 
	document.getElementById( "errors" ).innerText = ++errors;
	console.log( `Test ${number} failed: ${msg}` ) 
	} ;

export const check = function ( number, actual, expected, message ) {
	document.getElementById( "tests" ).innerText = ++tests;
	if ( ! number ) number = `${document.getElementById( "test-number" ).innerText}.${tests}	` ;
	if ( expected !== actual ) logError( number, `${message} expected: ${expected}, actual: ${actual}` );
	} ;

export const publishResults = function ( ) {
	document.getElementById("status").innerText = "finished";
	document.getElementById("result").setAttribute( "value", errors ? "fail" : "pass" );
	document.getElementById( "errors" ).innerText = errors;
	window.requestAnimationFrame( () => report( document.getElementById("test-number").innerText, document.getElementById("status").innerText, errors ? "fail" : "pass", errors + " errors" )); 
	}
