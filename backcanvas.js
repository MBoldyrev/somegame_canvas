/*
 * -- Public classes:
 * Block
 *
 * -- Public functions:
 * scene()
 * showGrid()
 * hideGrid()
 * addBlock( type, column, row )
 * remBlock()
 *
 */

function BlockType( imgClass, height, width ) = {
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

var blockTypes = {
	'Wall' : new Block('img1'),
	'Banana' : new Block('img2', 20 ),
	'Bullshit' : new Block('img3', 20, 20 ),
	// ...
};

function showGrid() {
	FieldDrawSettings.showGrid = true;
}

function hideGrid() {
	FieldDrawSettings.showGrid = false;
}

function addBlock( type, column, row ) {
	/*
	 * adds a block of given 'type' as from blockTypes key
	 */
	var b = new Block( type, column, row );
	blocksArray.push(b);
	return b;
}

function remBlock( block ) {
	/*
	 * removes block from the field
	 */
	delete blocksArray[ blocksArray.indexOf( block ) ];
}

function Block( type, column, row ) {
	this.type = type;
	this.column = column;
	this.row = row;
}

function drawGrid() {
	context.lineWidth = FieldDrawSettings.lineWidth;
	context.strokeStyle = FieldDrawSettings.lineColor;
	for( var x = 0; x < columnCount; x++ ) {
		context.beginPath();
		context.moveTo( x * FieldDrawSettings.columnWidth, 0 );
		context.lineTo( x * FieldDrawSettings.columnWidth, FieldDrawSettings.rowHeight * ( FieldDrawSettings.rowCount + 1 ) - 1 );
		context.stroke();
	}
	for( var y = 0; y < columnCount; y++ ) {
		context.beginPath();
		context.moveTo( 0, y * FieldDrawSettings.columnWidth );
		context.lineTo( FieldDrawSettings.columnWidth * ( FieldDrawSettings.columnCount + 1 ) - 1, y * FieldDrawSettings.columnWidth );
		context.stroke();
	}
}
