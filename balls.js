/*
 * -- Public classes:
 * Pacman
 *
 *
 * -- Public functions:
 * scene
 * addPacman
 * remPacman
 * pacmanMove
 * pacmanEat
 */

var FieldDrawSettings = {
	columnWidth : 20,
	rowHeight : 20,
}

var PacmanDrawSettings = {
	fillColors : ['red', 'blue', 'white', 'black'], // one color for each player
	strokeColors : ['yellow', 'yellow', 'black', 'yellow'], // one color for each player
	lineWidth : 2,
	R : 15,
}

var PacmanModelSettings = {
	mouthOpenAngle : 1/6,
	moveSpeed : 0.02,
	rotateSpeed : 0.002,
	mouthSpeed : 0.0005,
}

function scene() {
	/*
	 * starts drawing
	 */
	canvas = document.getElementById('myCanvas');
	context = canvas.getContext('2d');
	canvas.width =  window.innerWidth - 10;
	canvas.height = window.innerHeight - 10;
	objects=[];

	addPacman( 0, 3, 3, 1 );

	setInterval( drawFrame, 50 );
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
	var p = new Pacman( player );
	p.column = column;
	p.row = row;
	p.angle = angle;
	p.x = new ConstValue( ( column + 0.5 ) * FieldDrawSettings.columnWidth );
	p.y = new ConstValue( ( row + 0.5 ) * FieldDrawSettings.rowHeight );
	p.ar = new ConstValue( angle/2 );
	p.am = new ConstValue( PacmanModelSettings.mouthOpenAngle );
	objects.push( p );
	return p;
}

function remPacman( pacman ) {
	/*
	 * removes pacman from the field
	 */
	delete objects[ objects.indexOf( pacman ) ];
}

function pacmanMove( pacman, direction, eat ) { 
	/*
	 * orders a pacman to move by one cell
	 *
	 * pacman - Pacman object
	 * direction: 
	 * 	0 - right
	 * 	1 - down
	 * 	2 - left
	 *	3 - up
	 * eat - whether pacman should eat when movement done (optional argument)
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
	if( pacman.ar.get() != direction/2 )
		pacman.ar = new ChangingValue( cur_ar, direction/2, PacmanModelSettings.rotateSpeed*rot_dir );
	if( eat ) pacman.shallEat = true;
}

function pacmanEat( pacman ) {
	/*
	 * orders pacman to eat.
	 * if pacman is moving right at the moment, movement completion will precede eating
	 */
	if( pacman.x.dxdy || pacman.y.dxdy )
		pacman.shallEat = true;
	else
		pacman.am = new ChangingValue( pacman.am.get(), 0, -PacmanModelSettings.mouthSpeed );
}

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

function drawFrame( ) {
	canvas.width = canvas.width; // clear canvas
	for( var i in objects ) {
		var o = objects[i];
		if( o.type == 'Pacman' ) drawPacman( o );
	}
}

function drawPacman( pacman ) {
	try {
		var x = pacman.x.get();
		var y = pacman.y.get();
		var ar = pacman.ar.get();
		var am = pacman.am.get();
		var r = PacmanDrawSettings.R;
		context.fillStyle = PacmanDrawSettings.fillColors[pacman.player];
		context.strokeStyle = PacmanDrawSettings.strokeColors[pacman.player];
		context.lineWidth = PacmanDrawSettings.lineWidth;
	}
	catch(e) {
		console.log('bad pacman: cannot draw. ' + e.name);
		return;
	}
	context.beginPath();
	context.lineCap = 'round';
	context.lineJoin = 'round';
	context.moveTo(x+r*Math.cos((ar-am)*Math.PI),y+r*Math.sin((ar-am)*Math.PI));
	context.lineTo(x,y);
	context.lineTo(x+r*Math.cos((ar+am)*Math.PI),y+r*Math.sin((ar+am)*Math.PI));
	context.arc(x,y,r,(ar+am)*Math.PI,(ar-am)*Math.PI,false);
	context.fill();
	context.stroke();
	context.strokeStyle = 'black';
	context.lineWidth = 1;
	var eyex = x + r * 0.6 * Math.cos( ar*Math.PI - Math.PI/3 );
	var eyey = y + r * 0.6 * Math.sin( ar*Math.PI - Math.PI/3 );
	context.beginPath();
	context.fillStyle = "white";
	context.moveTo(eyex,eyey);
	context.arc(eyex,eyey,r/5,0,Math.PI*2,true);
	context.fill();
	var eyedotx = eyex + r * 0.1 * Math.cos(ar*Math.PI);
	var eyedoty = eyey + r * 0.1 * Math.sin(ar*Math.PI);
	context.beginPath();
	context.fillStyle = 'black';
	context.moveTo(eyedotx,eyedoty);
	context.arc(eyedotx,eyedoty,r/15,0,Math.PI*2,true);
	context.fill();
}

function controller() {
	for( var i in objects ) {
		var o = objects[i];
		if( o.type == 'Pacman' ) {
			// check for end of movement
			var curTime = Date.now();
			if( o.x.dxdt )
				if( o.x.t1 < curTime ) {
					o.x = new ConstValue( o.x.x1 );
					if( o.shallEat ) { 
						pacman.am = new ChangingValue( pacman.am.get(), 0, -PacmanModelSettings.mouthSpeed ); // a planned eating
						pacman.shallEat = false;
					}
				}
			if( o.y.dxdt )
				if( o.y.t1 < curTime ) {
					o.y = new ConstValue( o.y.x1 );
					if( o.shallEat ) { 
						pacman.am = new ChangingValue( pacman.am.get(), 0, -PacmanModelSettings.mouthSpeed ); // a planned eating
						pacman.shallEat = false;
					}
				}
			if( o.ar.dxdt )
				if( o.ar.t1 < curTime )
					o.ar = new ConstValue( o.ar.x1 );
			if( o.am.dxdt )
				if( o.am.t1 < curTime ) {
					// check for mouth actions
					if( o.am.x1 == 0 ) // mouth just has closed, start opening
						o.am = new ChangingValue( 0, PacmanModelSettings.mouthOpenAngle, PacmanModelSettings.mouthSpeed );
					else // mouth just has closed
						o.am = new ConstValue( o.am.x1 );
				}
		}
	}
}

