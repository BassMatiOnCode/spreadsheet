/*
 *		spreadsheet-persistence.js   2023-01-31   usp
 */

export function setupSaveLink( link, spreadsheet, fileName, contentType,  )
	// Provides a download link for a spreadsheet html.
	{
	if ( typeof spreadsheet === "string" ) spreadsheet = document.getElementById( spreadsheet );
	if ( typeof link === "string" ) link = document.getElementById( link );
    link.download = fileName;
	link.addEventListener( "click" , ( evt ) => {
		link.href = URL.createObjectURL ( new Blob ( 
			[spreadsheet.outerHTML] , 
			{ type : contentType } 
			) );
		globalThis.requestAnimationFrame( ( ) => URL.revokeObjectURL( link.href ));
		} ) ;
}

//download(jsonData, 'json.txt', 'text/plain' );
//URL.revokeObjectURL(a.href);