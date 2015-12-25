/*
 * -- Public classes:
 * Pacman
 * Block
 *
 *
 * -- Public functions:
 * scene()
 * addPacman( player, column, row, angle )
 * remPacman( pacman )
 * pacmanMove( pacman, direction[, eaten ] )
 * showGrid()
 * hideGrid()
 * addBlock( type, column, row )
 * remBlock()
 */

var pacmansArray=[];

function command( json_cmd ) {
	try {
		var cmd = JSON.parse( json_cmd );
		if( ! cmd['code'] == 0 ) 
			return;
		var resp = cmd['response'];
		switch( resp['method'] ) {
			case 'all':
				command_all( resp['pacs'], resp['points'], resp['walls'], resp['bonuses'] );
				break;
			case 'event':
				command_event( resp['user_id'], resp['action'] );
				break;
			default: 
				throw {name: 'invalid method'};
				return;
			}
	} catch(e) {
		console.log('Couldn\'t parse json command "'+json_cmd+'": e.name');
		return;
	}
}

function command_all( pacs, points, walls, bonuses ) {
	try {
		// place pacmans
		pacs.forEach( function( userPacmans ) {
			var userId = userPacmans.user_id;
			PacmanDrawSettings.fillColors[userId] = userPacmans.bg_color;
			PacmanDrawSettings.strokeColors[userId] = userPacmans.line_color;
			pacmansArray[userId] = [];
			userPacmans.units.split(';').forEach( function( unitCoords ) {
				var unitCoords=unitCoords.split(',').map(function(i){return parseInt(i);});
				addPacman( userId, unitCoords[0], unitCoords[1], 0 );
			});
		});
		points.split(';').forEach( function( pointCoords ) {
			var pointCoords = pointCoords.split(',').map(function(i){return parseInt(i);});
			addBlock( 'Coin', pointCoords[0], pointCoords[1] );
		});
		walls.split(';').forEach( function( wallCoords ) {
			var wallCoords = wallCoords.split(',').map(function(i){return parseInt(i);});
			addBlock( 'Wall', wallCoords[0], wallCoords[1] );
		});
	} catch(e) {
		console.log('Couldn\'t parse json "all" command: '+e,name);
	}
}

function command_event( player, actionString ) {
	try{
		actionString.split(';').forEach( function( action, pacId ) {
			if( action.length == 0 )
				return;
			var pacman = pacmansArray[player][pacId];
			var e = action.search('e');
			var moveDir;
			if( e == -1 ) // just moved
			{
				moveDir = parseInt(action);
				pacmanMove( pacman, moveDir );
			}
			else {
				// ate sth
				moveDir = parseInt(action.slice(0,e));
				action = action.slice(e+1);
				var eatColumn = pacman.column;
				var eatRow = pacman.row;
				switch( moveDir ) {
					case 0:
						eatColumn++;
						break;
					case 1:
						eatRow++;
						break;
					case 2:
						eatColumn--;
						break;
					case 3:
						eatRow--;
						break;
				}
				if(action.length == 0) {
					// ate a coin
					blocksArray.forEach( function( block ) {
						if( block.row == eatRow && block.column == eatColumn ) {
							pacmanMove( pacman, moveDir, block );
							return;
						}
					});
				}
				else {
					// ate another pacman
					var pacEaten = action.split(',').map(function(i){return parseInt(i);});
					pacmanMove( pacman, moveDir, pacmansArray[pacEaten[0]][pacEaten[1]] );
					return;
				}
			}
		});
	} catch(e) {
		console.log('Couldn\'t parse json "action" command: '+e,name);
	}
}

var FieldDrawSettings = {
	columnWidth : 30,
	rowHeight : 30,
	columnCount : 25,
	rowCount : 25,
	lineWidth : 1,
	lineColor : 'black',
	showGrid : false,
	canvasHeight: (window.innerHeight - 10),
	canvasWidth: (window.innerHeight - 10),
}

var PacmanDrawSettings = {
	fillColors : ['red', 'blue', 'white', 'black'], // one color for each player
	strokeColors : ['yellow', 'yellow', 'black', 'yellow'], // one color for each player
	lineWidth : 2,
	R : 15,
}

var PacmanModelSettings = {
	mouthOpenAngle : 1/6,
	moveSpeed : 0.03,
	rotateSpeed : 0.002,
	mouthSpeed : 0.0005,
}

function BlockType( imgClass, height, width ) {
	try {
		this.img = document.getElementsByClassName( imgClass )[0];
		if( ! this.img ) throw { name: 'Block type not initialised', message: 'No such class: "'+imgClass+'"' };
	}
	catch(e) {
		console.log('Cannot find image class '+imgClass+': '+e.name+' : '+e.message);
		return;
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

function scene( forecanvas, backcanvas, webSocketAddress ) {
	/*
	 * starts drawing
	 */
	canvasF = forecanvas;
	contextF = canvasF.getContext('2d');
	canvasF.width =  FieldDrawSettings.canvasWidth;
	canvasF.height = FieldDrawSettings.canvasHeight;
	canvasB = backcanvas;
	canvasB.width =  FieldDrawSettings.canvasWidth;
	canvasB.height = FieldDrawSettings.canvasHeight;
	contextB = canvasB.getContext('2d');
	blockTypes = {
		'Coin' : new BlockType('img1',17,17),
		'Wall' : new BlockType('img2'),
		'Banana' : new BlockType('img2', 20 ),
		'Bullshit' : new BlockType('img3', 20, 20 ),
		'Grape' : new BlockType('img4'),
		'Baby' : new BlockType('img5'),
		// ...
	};
	blocksArray=[];

//          ------------------------->8----------------------
//<EXAMPLE comment='these vars are visible from console'>
/*
	p1=addPacman( 0, 3, 3, 1 );
	p2=addPacman( 1, 5, 5, 2 );
	p3=addPacman( 2, 6, 6, 0 );
	b1=addBlock( 'Bullshit',3,4);
	b2=addBlock( 'Wall',2,2);
	b3=addBlock( 'Banana',2,6);
	b4=addBlock( 'Grape',5,2);
	b5=addBlock( 'Baby',6,4);
	pacmanMove(p1,1,b1);
	pacmanMove(p2,2);
	pacmanMove(p3,0);
*/
/* Example all cmd:
'{"code":0, "resp":{"method":"all", "pacs":[
{
"user_id":0
,"bg_color":"blue"
,"line_color":"red"
,"units":"0,0;3,6;2,8"
}
,
{
"user_id":1
,"bg_color":"black"
,"line_color":"yellow"
,"units":"4,1;5,7;8,2"
}
],"points":"9,0;9,1;9,2;9,3;9,4"
}}'

'{"code":0, "response":{"method":"all", "pacs":[{"user_id":0,"bg_color":"blue","line_color":"red","units":"1,0;3,6;2,8"},{"user_id":1,"bg_color":"black","line_color":"yellow","units":"4,1;5,7;8,2"}],"points":"9,0;9,1;9,2;9,3;9,4"}}'

'{"code":0, "response":{"method":"event", "user_id":1,"action":"0;0;0e"}}'
*/

command('{"code":0, "response":{"method":"all", "pacs":[{"user_id":0,"bg_color":"blue","line_color":"red","units":"1,0;3,6;2,8"},{"user_id":1,"bg_color":"black","line_color":"yellow","units":"0,1;5,7;8,2"}],"points":"9,0;9,1;9,2;9,3;9,4","walls":"0,10;1,10;2,10;3,10"}}');
command('{"code":0, "response":{"method":"event", "user_id":0,"action":"1;1;1"}}');
setTimeout( function() {
	command('{"code":0, "response":{"method":"event", "user_id":1,"action":"0e0,0;0;0e"}}');
}, 500 );
//pacmanMove(pacmansArray[1][2], 0, blocksArray[2]);

// </EXAMPLE> ------------------------->8-----------------------

	if( webSocketAddress != undefined ) {
		console.log('Попытка установить соединение с ' + webSocketAddress );
		webSocket = new WebSocket( webSocketAddress );	
		webSocket.onopen = function() {
			console.log("Соединение установлено.");
		};
		webSocket.onclose = function(event) {
		if (event.wasClean) {
			console.log('Соединение закрыто чисто');
		} else {
			console.log('Обрыв соединения'); // например, "убит" процесс сервера
		}
			console.log('Код: ' + event.code + ' причина: ' + event.reason);
		};
		webSocket.onmessage = function(event) {
			console.log("Получены данные " + event.data);
			command( event.data );
		};
		webSocket.onerror = function(error) {
			console.log("Ошибка webSocket: " + error.message);
		};
		// control events
		document.onkeydown = function(event) {
			if (!event)
			event = window.event;
			var code = event.keyCode;
			if (event.charCode && code == 0)
			code = event.charCode;
			switch(code) {
			case 37:
				console.log('Key left.');
				event.preventDefault();
				sendUserMovement( 2 );
				break;
			case 38:
				console.log('Key up.');
				event.preventDefault();
				sendUserMovement( 3 );
				break;
			case 39:
				console.log('Key right.');
				event.preventDefault();
				sendUserMovement( 0 );
				break;
			case 40:
				console.log('Key down.');
				event.preventDefault();
				sendUserMovement( 1 );
				break;
			}
		};
	}

	setInterval( drawForeground, 50 );
	setInterval( controller, 50 );
}

function addPacman( player, column, row, angle ) {
	/*
	 * creates a pacman at given field position
	 *
	 * returns the created Pacman object 
	 *
	 * player - a number [0,1,..)
	 * angle - pacman's orientation
	 * 	0 - right
	 * 	1 - down
	 * 	2 - left
	 *	3 - up
	 */
	if( [ player, column, row, angle ].some( function(i){ return typeof(i) == 'undefined'; } ) ) {
		console.log('Bad addPacman() call!');
		return;
	}
	var p = new Pacman();
	p.column = column;
	p.row = row;
	p.angle = angle;
	p.x = new ConstValue( ( column + 0.5 ) * FieldDrawSettings.columnWidth );
	p.y = new ConstValue( ( row + 0.5 ) * FieldDrawSettings.rowHeight );
	p.ar = new ConstValue( angle/2 );
	p.am = new ConstValue( PacmanModelSettings.mouthOpenAngle );
	if( pacmansArray[player] == undefined )
		pacmansArray[player] = [];
	pacmansArray[player].push( p );
	return p;
}

function remPacman( pacman ) {
	/*
	 * removes pacman from the field
	 */
	for( var i in pacmansArray) {
		delete pacmansArray[i][ pacmansArray[i].indexOf( pacman ) ];
	}
}

function pacmanMove( pacman, direction, eaten ) { 
	/*
	 * orders a pacman to move by one cell
	 *
	 * pacman - Pacman object
	 * direction: 
	 * 	0 - right
	 * 	1 - down
	 * 	2 - left
	 *	3 - up
	 * 'eaten' - pacman or block to be eaten by 'pacman' (optional argument)
	 */
	var rot_dir = 1;
	var cur_ar = pacman.ar.get();
	switch( direction ) {
		case 0:
			pacman.column++;
			pacman.x = new ChangingValue( pacman.x.get(), ( pacman.column + 0.5 ) * FieldDrawSettings.columnWidth, PacmanModelSettings.moveSpeed );
			if( cur_ar < 1 ) rot_dir = -1;
			break;
		case 1:
			pacman.row++;
			pacman.y = new ChangingValue( pacman.y.get(), ( pacman.row + 0.5 ) * FieldDrawSettings.rowHeight, PacmanModelSettings.moveSpeed );
			if( cur_ar < 1.5 && cur_ar > 0.5 ) rot_dir = -1;
			break;
		case 2:
			pacman.column--;
			pacman.x = new ChangingValue( pacman.x.get(), ( pacman.column + 0.5 ) * FieldDrawSettings.columnWidth, -PacmanModelSettings.moveSpeed );
			if( cur_ar < 2 && cur_ar > 1 ) rot_dir = -1;
			break;
		case 3:
			pacman.row--;
			pacman.y = new ChangingValue( pacman.y.get(), ( pacman.row + 0.5 ) * FieldDrawSettings.rowHeight, -PacmanModelSettings.moveSpeed );
			if( cur_ar < 0.5 || cur_ar > 1.5 ) rot_dir = -1;
	}
	if( pacman.ar.get() != direction/2 ) {
		if( cur_ar*rot_dir > direction/2*rot_dir ) cur_ar -= 2*rot_dir;
		pacman.ar = new ChangingValue( cur_ar, direction/2, PacmanModelSettings.rotateSpeed*rot_dir );
	}
	if( eaten ) {
		pacman.target = eaten;
		pacman.shallEat = true;
		if( eaten.type == 'pacman' ) {
			var ip = pacmansArray.indexOf( pacman );
			var it = pacmansArray.indexOf( pacman.target );
			if( ip < it ) {
				var tmp = pacmansArray[ip];
				pacmansArray[ip] = pacmansArray[it];
				pacmansArray[it] = tmp;
			}
		}
	}
}

function showGrid() {
	FieldDrawSettings.showGrid = true;
	drawBackground();
}

function hideGrid() {
	FieldDrawSettings.showGrid = false;
	drawBackground();
}

function addBlock( type, column, row ) {
	/*
	 * adds a block of given 'type' as from blockTypes key
	 */
	if( [ type, column, row ].some( function(i){ return typeof(i) == 'undefined'; } ) ) {
		console.log('Bad addBlock() call!');
		return;
	}
	var b = new Block( type, column, row );
	blocksArray.push(b);
	drawBackground();
	return b;
}

function remBlock( block ) {
	/*
	 * removes block from the field
	 */
	delete blocksArray[ blocksArray.indexOf( block ) ];
	drawBackground();
}


/*
function pacmanEat( eater, eaten ) {
	/*
	 * orders eater pacman to close mouth. when closed, eaten pacman will disappear
	 * if pacman is moving right at the moment, movement completion will precede eating
	 * /
	eater.target = eaten;
	eater.shallEat = true;
	if( ! ( eater.x.dxdy || eater.y.dxdy ) )
		eater.am = new ChangingValue( eater.am.get(), 0, -PacmanModelSettings.mouthSpeed );
}
*/

function ChangingValue( x0, x1, dxdt ) { // from, to, speed
	this.x1 = x1;
	this.t1 = Date.now() + (x1-x0)/dxdt;
	this.dxdt = dxdt;
	this.get = function() {
		return( this.x1 - ( this.t1 - Date.now() ) * this.dxdt );
	}
}

function ConstValue( x0 ) {
	this.x0 = x0;
	this.t0 = 0;
	this.dxdt = 0;
	this.get = function( t ) {
		return( x0 );
	}
}

function Pacman( player ) {
	this.type='Pacman';
	this.player = player;
}

function Block( type, column, row ) {
	this.type = type;
	this.column = column;
	this.row = row;
}

function drawForeground( ) {
	canvasF.width = canvasF.width; // clear canvasF
	pacmansArray.forEach( function( userPacmans, player ) {
		userPacmans.forEach( function( pacman ) {
			drawPacman( pacman, player );
		});
	});
	/*
	for( var i in pacmansArray ) {
		drawPacman( pacmansArray[i] );
	}
	*/
}

function drawBackground() {
	canvasB.width = canvasB.width; // clear canvas
	if( FieldDrawSettings.showGrid ) drawGrid();
	for( var i in blocksArray ) {
		drawBlock( blocksArray[i] );
	}
}

function drawPacman( pacman, player ) {
	try {
		var x = pacman.x.get();
		var y = pacman.y.get();
		var ar = pacman.ar.get();
		var am = pacman.am.get();
		var r = PacmanDrawSettings.R;
		contextF.fillStyle = PacmanDrawSettings.fillColors[player];
		contextF.strokeStyle = PacmanDrawSettings.strokeColors[player];
		contextF.lineWidth = PacmanDrawSettings.lineWidth;
	}
	catch(e) {
		console.log('bad pacman: cannot draw. ' + e.name);
		return;
	}
	contextF.beginPath();
	contextF.lineCap = 'round';
	contextF.lineJoin = 'round';
	contextF.moveTo(x+r*Math.cos((ar-am)*Math.PI),y+r*Math.sin((ar-am)*Math.PI));
	contextF.lineTo(x,y);
	contextF.lineTo(x+r*Math.cos((ar+am)*Math.PI),y+r*Math.sin((ar+am)*Math.PI));
	contextF.arc(x,y,r,(ar+am)*Math.PI,(ar-am)*Math.PI,false);
	contextF.fill();
	contextF.stroke();
	contextF.strokeStyle = 'black';
	contextF.lineWidth = 1;
	var eyex = x + r * 0.6 * Math.cos( ar*Math.PI - Math.PI/3 );
	var eyey = y + r * 0.6 * Math.sin( ar*Math.PI - Math.PI/3 );
	contextF.beginPath();
	contextF.fillStyle = "white";
	contextF.moveTo(eyex,eyey);
	contextF.arc(eyex,eyey,r/5,0,Math.PI*2,true);
	contextF.fill();
	var eyedotx = eyex + r * 0.1 * Math.cos(ar*Math.PI);
	var eyedoty = eyey + r * 0.1 * Math.sin(ar*Math.PI);
	contextF.beginPath();
	contextF.fillStyle = 'black';
	contextF.moveTo(eyedotx,eyedoty);
	contextF.arc(eyedotx,eyedoty,r/15,0,Math.PI*2,true);
	contextF.fill();
}

function drawGrid() {
	contextB.lineWidth = FieldDrawSettings.lineWidth;
	contextB.strokeStyle = FieldDrawSettings.lineColor;
	for( var x = 0; x < FieldDrawSettings.columnCount; x++ ) {
		contextB.beginPath();
		contextB.moveTo( x * FieldDrawSettings.columnWidth, 0 );
		contextB.lineTo( x * FieldDrawSettings.columnWidth, FieldDrawSettings.rowHeight * ( FieldDrawSettings.rowCount + 1 ) - 1 );
		contextB.stroke();
	}
	for( var y = 0; y < FieldDrawSettings.rowCount; y++ ) {
		contextB.beginPath();
		contextB.moveTo( 0, y * FieldDrawSettings.columnWidth );
		contextB.lineTo( FieldDrawSettings.columnWidth * ( FieldDrawSettings.columnCount + 1 ) - 1, y * FieldDrawSettings.columnWidth );
		contextB.stroke();
	}
}

function drawBlock( block ) {
	var type;
	try {
		type = blockTypes[block.type];
	}
	catch(e) {
		console.log('Cannot draw block, bad type: '+type+', . '+e.name);
		return;
	}
	var x = FieldDrawSettings.columnWidth * ( block.column + .5 ) - type.width/2;
	var y = FieldDrawSettings.rowHeight * ( block.row + .5 ) - type.height/2;
	contextB.drawImage( type.img, x, y, type.width, type.height );
}

function controller() {
	pacmansArray.forEach( function( userPacmans, player ) {
		userPacmans.forEach( function( pacman ) {
			// check for end of movement
			var curTime = Date.now();
			if( pacman.x.dxdt )
				if( pacman.x.t1 < curTime ) {
					pacman.x = new ConstValue( pacman.x.x1 );
					if( pacman.shallEat ) { 
						pacman.am = new ChangingValue( pacman.am.get(), 0, -PacmanModelSettings.mouthSpeed ); // a planned eating
						pacman.shallEat = false;
					}
				}
			if( pacman.y.dxdt )
				if( pacman.y.t1 < curTime ) {
					pacman.y = new ConstValue( pacman.y.x1 );
					if( pacman.shallEat ) { 
						pacman.am = new ChangingValue( pacman.am.get(), 0, -PacmanModelSettings.mouthSpeed ); // a planned eating
						pacman.shallEat = false;
					}
				}
			if( pacman.ar.dxdt )
				if( pacman.ar.t1 < curTime )
					pacman.ar = new ConstValue( pacman.ar.x1 );
			if( pacman.am.dxdt )
				if( pacman.am.t1 < curTime ) {
					// check for mouth actions
					if( pacman.am.x1 == 0 ) { // mouth just has closed, start opening & try to remove eaten pacman
						if( pacman.target ) {
							if( pacman.target.type == 'Pacman' ) remPacman( pacman.target );
							else remBlock( pacman.target );
						}
						pacman.am = new ChangingValue( 0, PacmanModelSettings.mouthOpenAngle, PacmanModelSettings.mouthSpeed );
						delete pacman.target;
					}
					else // mouth just has opned, stop it
						pacman.am = new ConstValue( pacman.am.x1 );
				}
		});
	});
}

function sendUserMovement( moveDir ) {
	webSocket.send(
		JSON.stringify(
			{
				"method": "move",
				"params":
					{
						"direction": moveDir,
					}
			}
		)
	);
}

function sendRequestFieldAll() {
	webSocket.send(
		JSON.stringify(
			{
				"method": "getField",
				"params":
					{
						"type": "all",
					}
			}
		)
	);
}
