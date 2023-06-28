/*
 *		spreadsheet-persistence.js   2023-01-31   usp
 */

import { norm, normElements } from "./spreadsheet-utility.js" ;
import { initSpreadsheet } from "./spreadsheet-core.js" ;

export function setupSaveLink( link, spreadsheet, fileName, contentType,  )
	// Provides a download link for a spreadsheet html.
	{
	// Normalize elements.
	[ link, spreadsheet ] = normElements( [ link, spreadsheet ] );
	// Configute the link.
    link.download = fileName;
	link.addEventListener( "click" , ( evt ) => {
		// Retrieve spreadsheet data and create a file.
		link.href = URL.createObjectURL ( new Blob ( [spreadsheet.outerHTML] , { type : contentType } ) );
		// Release file not before download has started.
		globalThis.requestAnimationFrame( ( ) => URL.revokeObjectURL( link.href ));
		} ) ;
	}
export function setupLoadCommand ( button, selector, target, dialog )
	// button : Starts the loading procedure
	// selector : An HTML input element of type "file", used to select a local file.
	// target : This element will be replaced with content loaded.
	{
	// Normalize elements
	[ button, selector, target ] = normElements( [ button, selector, target, dialog ] );
	dialog = norm( dialog );
	// Register click event handler with the button
	button.addEventListener( "click", ( ) => {
			// Create a file reader.
		const reader = new FileReader( );
			// Setup a load event handler.
		reader.addEventListener( "load" , evt => {
				// Create a template element that receives the file contentent.
			const template = document.createElement( "TEMPLATE" );
			template.innerHTML = evt.target.result.trim( );
				// Verify the content.
			checkImportData( template );
				// Initialize all spreadsheet tables
			const spreadsheets = template.content.querySelectorAll( "table.spreadsheet" );
			spreadsheets.forEach( initSpreadsheet );
				// Replace target element with the template content.			
			target.replaceWith( template.content ) ;
			} ) ;
		// Read the file.
		reader.readAsText( selector.files[ 0 ] );
		} ) ;
	}

function checkImportData( template, dialog )
		// Verifies the file is a valid spreadsheet. Expressions in the file are 
		// deleted after confirmation for security reasons, but the user can
		// cancel removal to accept expressions.
		// template : Template element with spreadsheet table loaded.
		// Throws : Error.
	{
		// structural checks
	if ( template.content.firstChild.tagName !== "TABLE" ) throw new Error( "spreadsheet-persistence.js:checkImportData(): This is not a TABLE element." );
	if ( ! template.content.firstChild.classList.contains( "spreadsheet" )) throw new Error( "This is not a spreadsheet table." );
		// Block value expressions
	let elements = template.content.querySelectorAll( "[data-xpr]" );
	if ( elements.length > 0 && confirm( "Block value expressions in spreadsheet?" )) {
		elements.forEach ( element => element.removeAttribute( "data-xpr" )); 
		}
		// Block format expressions
	elements = template.content.querySelectorAll( "[data-format]" );
	if ( elements.length > 0 && confirm( "Block format expressions in spreadsheet?" )) {
		elements.forEach ( element => element.removeAttribute( "data-formatValue" )); 
		}
		// Block parse expressions
	elements = template.content.querySelectorAll( "[data-parse]" );
	if ( elements.length > 0 && confirm( "Block parse expressions in spreadsheet?" )) {
		elements.forEach ( element => element.removeAttribute( "data-parseInput" )); 
		}
		// Remove script elements, they are not allowed in import files
	elements = template.content.querySelectorAll( "script" );
	if ( elements.length > 0 ) {
		alert( "Block script elements in import file will be removed" );
		elements.forEach ( element => element.remove() );
	}	}