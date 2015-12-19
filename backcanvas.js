/*
 * -- Public classes:
 *
 *
 * -- Public functions:
 * scene()
 * showGrid()
 * hideGrid()
 * addBlock()
 * remBlock()
 *
 */

var Block( imgClass, height, width ) = {
	try {
		this.img = document.getElementByClassName( imgClass )[0];
	}
	catch(e) {
		console.log('Cannot find image class '+imgClass+': '+e.name);
	}
	if( height )
		this.height = height;
	else
		this.height = FieldDrawSettings.rowHeight;
	if( width )
		this.width = width;
	else
		this.width = FieldDrawSettings.columnWidth;
}

var blocks = [
	new Block('img1'),
	new Block('img2', 20 ),
	new Block('img3', 20, 20 ),
	// ...
	];


