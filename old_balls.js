var objectBeingSpawned = undefined;
var mouseDrag = undefined;
var lastSpawned = Object;
lastSpawned['color']=0;
lastSpawned['r']=50;
var bump_factor = 0.98;
var stuck_cnt = 0;
var ballColors = ['red', 'blue'];
var whatToSpawn = undefined;
var theme = 'start';

function randomOf( min, max ) {
	return Math.random() * ( max - min ) + min;
}

function ChangingValue( x0, t0, dxdt ) {
	this.x0 = x0;
	this.t0 = t0;
	this.dxdt = dxdt;
	this.get = function( t ) {
		if( typeof this.t == 'undefined' ) 
			return( x0 + ( Date.now() - t0 ) * dxdt );
		else
			return( x0 + ( t - t0 ) * dxdt );
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

function Ball( r, color, t0, x0, dxdt, y0, dydt ) {
	this.type='Ball';
	this.bump=true;
	this.r = r;
	this.color = color;
	this.x = new ChangingValue( x0, t0, dxdt );
	this.y = new ChangingValue( y0, t0, dydt );
	this.draw = function() {
		context.beginPath();
		context.arc( this.x.get(), this.y.get(), this.r, 0, 2*Math.PI, true);
		context.fillStyle = ballColors[this.color];
		context.fill();
		context.stroke();
	}
}

function Pacman( r, color, t0, x0, dxdt, y0, dydt, ar0, dardt, am0, damdt ) {
	this.type='Pacman';
	this.state='hungry';
	this.r = r;
	this.color = color;
	this.x = new ChangingValue( x0, t0, dxdt );
	this.y = new ChangingValue( y0, t0, dydt );
	this.ar = new ChangingValue( ar0, t0, dardt );
	this.am = new ChangingValue( am0, t0, damdt );
	this.eyedota = 0;
	this.target = 0;
	this.draw = function() {
		var x = this.x.get();
		var y = this.y.get();
		var ar = this.ar.get();
		var am = this.am.get();
		context.beginPath();
		context.fillStyle = this.color;
		context.strokeStyle = 'yellow';
		context.lineWidth = 2+this.r/10;
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.moveTo(x+this.r*Math.cos((ar-am)*Math.PI),y+this.r*Math.sin((ar-am)*Math.PI));
		context.lineTo(x,y);
		context.lineTo(x+this.r*Math.cos((ar+am)*Math.PI),y+this.r*Math.sin((ar+am)*Math.PI));
		context.arc(x,y,this.r,(ar+am)*Math.PI,(ar-am)*Math.PI,false);
		context.fill();
		context.stroke();
		context.strokeStyle = 'black';
		context.lineWidth = 1;
		/*
		context.moveTo(x,y);
		context.lineTo(x+300*Math.cos((ar)*Math.PI),y+300*Math.sin((ar)*Math.PI));
		context.stroke();
		context.moveTo(x,y);
		*/
		var eyex = x + this.r * 0.6 * Math.cos( ar*Math.PI - Math.PI/3 );
		var eyey = y + this.r * 0.6 * Math.sin( ar*Math.PI - Math.PI/3 );
		if( this.target.type )
			if( this.target.type == 'Ball' || this.target.type == 'Pacman' )
				this.eyedota = angle( this.target.x.get() - eyex, this.target.y.get() - eyey );
		context.beginPath();
		context.fillStyle = "white";
		context.moveTo(eyex,eyey);
		context.arc(eyex,eyey,this.r/5,0,Math.PI*2,true);
		context.fill();
		var eyedotx = eyex + this.r * 0.1 * Math.cos(this.eyedota);
		var eyedoty = eyey + this.r * 0.1 * Math.sin(this.eyedota);
		context.beginPath();
		context.fillStyle = this.color;
		context.moveTo(eyedotx,eyedoty);
		context.arc(eyedotx,eyedoty,this.r/15,0,Math.PI*2,true);
		context.fill();
	}
}

function Wall( n ) {
	this.x0 = ( n < 3 ) ? 0 : canvas.width - 20;
	this.y0 = canvas.height * n / 4;
	this.x1 = ( n < 3 ) ? 20 : canvas.width;
	this.y1 = y0 + canvas.height / 4;
	this.draw = function() {
		context.beginPath();
		context.rect(x0,y0,x1,y1);
		context.stroke();
	}
}

function Border( ) {
	this.draw = function() {
		context.beginPath();
		context.rect(0,0,canvas.width,canvas.height);
		context.stroke();
	}
}

function distance( obj1, obj2 ) {
	if( ( typeof obj1 ) != 'number' ) { 
		var dx = ( obj2.x.get() - obj1.x.get() );
		var dy = ( obj2.y.get() - obj1.y.get() );
	}
	else {
		var dx = obj1;
		var dy = obj2;
	}
	return ( Math.sqrt( dx * dx + dy * dy ) );
}

function angle( obj1, obj2 ) {
	var dx, dy;
	if( ( typeof obj1 ) != 'number' )
		dx = ( obj2.x.get() - obj1.x.get() );
	else 
		dx = obj1;
	if( ( typeof obj1 ) != 'number' )
		dy = ( obj2.y.get() - obj1.y.get() );
	else 
		dy = obj2;
	if( dx == 0 ) return ( (dy >=0) ? ( Math.PI / 2 ) : -( Math.PI / 2 ) );
	var a = Math.atan( dy / dx );
	if( dx < 0 ) a += Math.PI;
	else
		if( dy < 0 ) a += 2*Math.PI;
	return ( a );
}
	
function stuck_restart( nballs, npacmans, ibp, itp ) {
	if ( ! ibp ) { // first time called
		// select biggest pacman
		var bgstPcmn = undefined;
		for( var obj in objects ) {
			if( objects[obj].type && objects[obj].type == 'Pacman' ) 
				if ( ( ! bgstPcmn ) || bgstPcmn.r < objects[obj].r )
					bgstPcmn = objects[obj];
		}
		if ( ! bgstPcmn ) {
			console.log('stuck, but no pacmans found');
			return 0;  
		}
		var ibp = objects.indexOf( bgstPcmn );
		var itp = 0; // index to place new obj at
		bgstPcmn.ar = new ChangingValue( bgstPcmn.ar.get(), Date.now(), 0.0002 );
		bgstPcmn.type = 'ball_spawning_pacman';
	}
	else {
		var bgstPcmn = objects[ibp];
	}
	while( objects[itp] ) itp ++; // where to place new balls
	if( ibp <= itp ) {
		// ball is above bgstPcmn, move bgstPcmn
		itp = ibp + 50;
		while( objects[itp] ) itp ++;
		objects[itp] = bgstPcmn;
		delete objects[ibp];
		// swap
		ibp += itp; 
		itp = ibp - itp;
		ibp -= itp;
		// itp now points to previous ibp, and it's free
	}

	var x = bgstPcmn.x.get();
	var y = bgstPcmn.y.get();
	var xv = -bgstPcmn.ar.get()*Math.PI;
	var yv = -0.3 * Math.sin( xv );
	xv = 0.3 * Math.cos( xv );
	console.log('itp: '+itp+', ibp: '+ibp);
	objects[itp] = new Ball( randomOf(5,60), nballs % 2, Date.now(), x, randomOf(0,xv), y, randomOf(0,yv) );

	if ( nballs != 0 ) { 
		console.log(1);
		console.log('recursive stuck_restart at ' + Date.now() ); 
		setTimeout('stuck_restart(' + (nballs - 1) + ', ' + npacmans + ', ' + ibp + ', ' + itp + ');', 500 );
	}
	else {
		// last iteration
		delete objects[ibp];
		for( var i = 0; i < npacmans; i++ ) {
			objects.push( new Pacman( randomOf(20,50), 'black', Date.now(), randomOf(0,canvas.width), 0, 10, 0, randomOf(0,2), 0, 1/6, 0) );
		}
	bgstPcmn.type = 'Pacman';
	}
}

function check_stuck() {
	for( var obj in objects ) {
		if( objects[obj].type && objects[obj].type == 'Pacman' )
			if( objects[obj].state != 'hungry' ||  objects[obj].target ) {
				stuck_cnt = 0;
				return 0;
			}
	}
	console.log('stuck at ' + Date.now() ); 
	if( stuck_cnt < 5 )
		stuck_cnt ++;
	else {
		stuck_cnt = 0;
		stuck_restart( 20, 6 );
		console.log('call stuck_restart at ' + Date.now() ); 
		//setTimeout( "stuck_restart( 20, 6 )", 5000 );
	}
}	

function physics() {
	// pacman
	var pacman_xy_speed = 0.05;
	var pacman_ar_speed = 0.0002;
	var pacman_am_speed = 0.0005;
	for(var nump in objects) {
		obj = objects[nump];
		if( obj.type == 'Pacman' ) {
			var pacman = obj;
			if( pacman.state == 'eating' && ( ! pacman.target.type || objects.indexOf(pacman.target) == -1 ) ) { 
				// someone other ate my ball
				console.log('someone other ate my ball');
				pacman.target = 0;
				pacman.am = new ChangingValue( pacman.am.get(), Date.now(), pacman_am_speed );
				pacman.state = 'eaten';
			}
			if( pacman.state == 'eating' && pacman.am.get() <= 0 ) {
				pacman.state = 'eaten';
				pacman.r += pacman.target.r / 5;
				delete objects[ objects.indexOf( pacman.target ) ];
				pacman.target = 0;
				pacman.am = new ChangingValue( 0, Date.now(), pacman_am_speed );
			}
			if( pacman.state == 'eaten' && pacman.am.get() >= 1/6 ) {
				pacman.am = new ConstValue( 1/6 );
				pacman.x = new ConstValue( pacman.x.get() );
				pacman.y = new ConstValue( pacman.y.get() );
				pacman.ar = new ConstValue( pacman.ar.get() );
				pacman.state = 'hungry';
			}
			if( ! pacman.target.type || ! pacman.target.type == 'Ball' || objects.indexOf(pacman.target) == -1 ) {
				pacman.target = 0;
				if( pacman.state != 'eating' ) {	
					if( pacman.x.dxdt != 0 ) 
						pacman.x = new ConstValue( pacman.x.get() );
					if( pacman.y.dxdt != 0 ) 
						pacman.y = new ConstValue( pacman.y.get() );
					if( pacman.ar.dxdt != 0 ) 
						pacman.ar = new ConstValue( pacman.ar.get() );
				}
				for(var num1 in objects) 
					if( Math.random() > 0.9 && ( objects[num1].type == 'Ball' || objects[num1].type == 'Pacman' ) )
						if( objects[num1].r < pacman.r * 3 / 5 ) 
							pacman.target = objects[num1];
							if( pacman.target.type ) {
								var ip = objects.indexOf( pacman );
								var it = objects.indexOf( pacman.target );
								if( ip < it ) {
									var tmp = objects[ip];
									objects[ip] = objects[it];
									objects[it] = tmp;
								}
							}
				continue;
			}
			if( pacman.state == 'hungry' && pacman.target.type )
				if( pacman.target.type == 'Ball' || pacman.target.type == 'Pacman' ) {
					var da = angle( pacman.target, pacman ) - pacman.ar.get()*Math.PI - Math.PI;
					var dx = pacman.target.x.get() - pacman.x.get();
					var dy = pacman.target.y.get() - pacman.y.get();

					if( da > Math.PI ) da = -2*Math.PI + da;
					if( da < -Math.PI ) da = 2*Math.PI + da;
					
					if( Math.abs(da) < 0.5 && distance(pacman,pacman.target) < ( pacman.r - pacman.target.r ) * 2 / 3 ) {
						// begin eating
						pacman.x = new ChangingValue( pacman.x.get(), Date.now(), pacman.x.dxdt/2 );
						pacman.y = new ChangingValue( pacman.y.get(), Date.now(), pacman.y.dxdt/2 );
						pacman.target.x = new ChangingValue( pacman.target.x.get(), Date.now(), pacman.target.x.dxdt/5 );
						pacman.target.y = new ChangingValue( pacman.target.y.get(), Date.now(), pacman.target.y.dxdt/5 );
						pacman.ar = new ConstValue( pacman.ar.get() );
						pacman.target.bump = false;
						pacman.am = new ChangingValue( 1/6, Date.now(), -pacman_am_speed );
						pacman.state = 'eating';
					} else {

						var dist = distance(dx,dy);
						var overhead = dist * pacman_xy_speed*10; 
						dx += pacman.target.x.dxdt * overhead;
						dy += pacman.target.y.dxdt * overhead;
						da = angle( -dx, -dy ) - pacman.ar.get()*Math.PI - Math.PI;
						//console.log('X: dx = '+dx+' + '+-pacman.r*Math.cos(pacman.ar.get()*Math.PI)/5);
						//console.log('Y: dy = '+dy+' + '+-pacman.r*Math.sin(pacman.ar.get()*Math.PI)/5);
						dx -= pacman.r*Math.cos(pacman.ar.get()*Math.PI)/5;
						dy -= pacman.r*Math.sin(pacman.ar.get()*Math.PI)/5;
						var pacman_xy_speed_cur = pacman_xy_speed * (1+1/(0.008*pacman.r+0.015)) * ( 1 - 1 / ( 0.8 * dist + 1 ) );
						
						/*
						context.beginPath();
						context.moveTo(pacman.x.get(),pacman.y.get());
						context.lineTo(pacman.x.get()+pacman.r*Math.cos(pacman.ar.get()*Math.PI)/5,pacman.y.get()+pacman.r*Math.sin(pacman.ar.get()*Math.PI)/5);
						context.stroke();
						*/
						if( da > Math.PI ) da = -2*Math.PI + da;
						if( da < -Math.PI ) da = 2*Math.PI + da;
						if( da < 0.03 && da > -0.03 )	
							pacman.ar = new ConstValue( pacman.ar.get() ); 
						if( da < -0.06 && pacman.ar.dxdt != -pacman_ar_speed )
							pacman.ar = new ChangingValue( pacman.ar.get(), Date.now(),-pacman_ar_speed*(1+100/pacman.r)*Math.abs(da+.2) ); 
						if( da > 0.06 && pacman.ar.dxdt != pacman_ar_speed )
							pacman.ar = new ChangingValue( pacman.ar.get(), Date.now(),pacman_ar_speed*(1+100/pacman.r)*Math.abs(da+.2) ); 
						if( dx < 3 && dx > -3 && pacman.x.dxdy != pacman_xy_speed_cur )
							pacman.x = new ConstValue( pacman.x.get() );
						if( dx < -6 || dx > 6 ) 
							pacman.x = new ChangingValue( pacman.x.get(), Date.now(), 
								pacman_xy_speed_cur * Math.cos( angle( dx, dy ) ) );
						if( dy < -6 || dy > 6 ) 
							pacman.y = new ChangingValue( pacman.y.get(), Date.now(), 
								pacman_xy_speed_cur * Math.sin( angle( dx, dy ) ) );
						if( dy < 3 && dy > -3 )
							pacman.y = new ConstValue( pacman.y.get() );
						/*
						if( dx < -6 && pacman.x.dxdy != pacman_xy_speed )
							pacman.x = new ChangingValue( pacman.x.get(), Date.now(), -pacman_xy_speed );
						if( dy < 3 && dy > -3 && pacman.y.dxdy != pacman_xy_speed )
							pacman.y = new ConstValue( pacman.y.get() );
						if( dy > 6 && pacman.y.dxdy != pacman_xy_speed )
							pacman.y = new ChangingValue( pacman.y.get(), Date.now(), pacman_xy_speed );
						if( dy < -6 && pacman.y.dxdy != pacman_xy_speed )
							pacman.y = new ChangingValue( pacman.y.get(), Date.now(), -pacman_xy_speed );
						*/
					}
				}
		}
	}
	

	// balls vzaimnoe bumping
	for(var num1 in objects) {
		obj1 = objects[num1];
		if( ! obj1.bump ) continue;
		for(var num2 in objects) {
			obj2 = objects[num2];
			if( ! obj2.bump ) continue;
			if( num2 <= num1 ) continue;
			//console.log(num1+':'+num2);
			var d = distance( obj1, obj2 );
			if( obj1.bump && obj2.bump ) {
				if( obj1.type == 'Ball' && obj2.type == 'Ball' ) {
					if( d <= obj1.r + obj2.r && obj1.color == obj2.color ) { // balls bump между собой
						//console.log(dbg1+':'+dbg2+"+");
						var oa = angle( obj1, obj2 ); // angle (o1,o2),(oX)
						// speed: [{r,t}]v{1,2}[{1,2}]
						//          (1)    (2)   (3)
						// 1) radial/tangent
						// 2) object numper
						// 3) 1 - before, 2 - after
						var rv11 = distance( obj1.x.dxdt, obj1.y.dxdt ) * Math.cos( oa - angle( obj1.x.dxdt, obj1.y.dxdt ) );
						var rv21 = distance( obj2.x.dxdt, obj2.y.dxdt ) * Math.cos( oa - angle( obj2.x.dxdt, obj2.y.dxdt ) );
						if( rv21 > rv11 ) continue; // balls cannot push each other
						var rv12 = 2*(obj1.r*obj1.r*rv11+obj2.r*obj2.r*rv21)/((obj1.r*obj1.r+obj2.r*obj2.r)); 
						//var rv12 = 2*(rv11+rv21)/(2);
						var rv22 = rv12-rv21;
						rv12 -= rv11;
						var tv1 = distance( obj1.x.dxdt, obj1.y.dxdt ) * Math.sin( oa - angle( obj1.x.dxdt, obj1.y.dxdt ) );
						var tv2 = distance( obj2.x.dxdt, obj2.y.dxdt ) * Math.sin( oa - angle( obj2.x.dxdt, obj2.y.dxdt ) );
						var v12x = rv12*Math.cos(oa)+tv1*Math.sin(oa);
						var v12y = rv12*Math.sin(oa)-tv1*Math.cos(oa);
						var v22x = rv22*Math.cos(oa)+tv2*Math.sin(oa);
						var v22y = rv22*Math.sin(oa)-tv2*Math.cos(oa);
						obj1.x = new ChangingValue( obj1.x.get(), Date.now(), v12x*bump_factor );
						obj1.y = new ChangingValue( obj1.y.get(), Date.now(), v12y*bump_factor );
						obj2.x = new ChangingValue( obj2.x.get(), Date.now(), v22x*bump_factor );
						obj2.y = new ChangingValue( obj2.y.get(), Date.now(), v22y*bump_factor );
					}
				}
			}
		}
	}
	for(var obj in objects) { // bump walls
		obj = objects[obj];
		if( obj.bump ) {
			if( obj.type == 'Ball' ) {
				if( obj.x.get() <= obj.r + 2 ) { //console.log('bump1');
					obj.x = new ChangingValue( obj.x.get(), Date.now(), Math.abs(obj.x.dxdt)*bump_factor ); }
				if( obj.x.get() >= canvas.width - obj.r - 2 ) 
					obj.x = new ChangingValue( obj.x.get(), Date.now(), -Math.abs(obj.x.dxdt)*bump_factor );
				if( obj.y.get() <= obj.r + 2 )
					obj.y = new ChangingValue( obj.y.get(), Date.now(), Math.abs(obj.y.dxdt)*bump_factor );
				if( obj.y.get() >= canvas.height - obj.r - 2 )
					obj.y = new ChangingValue( obj.y.get(), Date.now(), -Math.abs(obj.y.dxdt)*bump_factor );
			}
		}
	}
}

function moonTheme (a) {
	if( theme != 'moon' ) {
		document.getElementsByClassName('balls__moon_img')[0].style['visibility'] = 'visible';
		document.getElementsByClassName('balls-control')[0].classList.add('balls-control-moon');
		document.body.classList.add('body-moon');
		theme = 'moon';
	}
	else { 
		document.getElementsByClassName('balls__moon_img')[0].style['visibility'] = 'hidden';
		document.getElementsByClassName('balls-control')[0].classList.remove('balls-control-moon');
		document.body.classList.remove('body-moon');
		theme = 'normal';
	}
}

function drawFrame( ) {
	physics();
	canvas.width = canvas.width; // clear canvas
	for( var obj in objects ) {
		objects[obj].draw();
	}
}

function canvasMouseDown(e) {
	if( e.button == 0 )
		mouseDrag = [ e.offsetX, e.offsetY, Date.now() ];
}

function canvasMouseClickInit(e) {
	console.log('switch  to normal mode');
	document.getElementById('balls-control-div').style['visibility']='visible';
	canvas.removeEventListener('click', canvasMouseClickInit);
	for( var i = 0; i < 6; i++ ) {
		objects.push( new Pacman( randomOf(20,50), 'black', Date.now(), randomOf(-800,800), 0, randomOf(-800,-200), 0, randomOf(0,2), 0, 1/6, 0) );
	}
}
	
function canvasMouseUp(e) {
	if( e.button != 0 )
		return;
	if( ! objectBeingSpawned )
		return;
	if( objectBeingSpawned.type == 'notYetABall' ) {
		objectBeingSpawned.type='Ball';
		objectBeingSpawned.x = new ChangingValue( e.offsetX, Date.now(), ( e.offsetX - mouseDrag[0] ) / (Date.now() - mouseDrag[2] ) );
		objectBeingSpawned.y = new ChangingValue( e.offsetY, Date.now(), ( e.offsetY - mouseDrag[1] ) / (Date.now() - mouseDrag[2] ) );
		lastSpawned['color'] = objectBeingSpawned.color;
		lastSpawned['r'] = objectBeingSpawned.r;
		objectBeingSpawned = undefined;
	}
	else if( objectBeingSpawned.type == 'notYetAPacman' ) {
		objectBeingSpawned.type='Pacman';
		objectBeingSpawned.x = new ChangingValue( e.offsetX, Date.now(), ( e.offsetX - mouseDrag[0] ) / (Date.now() - mouseDrag[2] ) );
		objectBeingSpawned.y = new ChangingValue( e.offsetY, Date.now(), ( e.offsetY - mouseDrag[1] ) / (Date.now() - mouseDrag[2] ) );
		lastSpawned['r'] = objectBeingSpawned.r;
		console.log("spawned "+objects.indexOf(objectBeingSpawned));
		objectBeingSpawned = undefined;
	}
	canvasMouseEnter(e);
}
function canvasMouseOut(e) {
	delete objects[ objects.indexOf( objectBeingSpawned ) ];
	objectBeingSpawned = undefined;
}
function canvasMouseEnter(e) {
	if( whatToSpawn == 'Ball' ) { // ball
		objectBeingSpawned = new Ball( lastSpawned['r'], lastSpawned['color'], Date.now(), e.offsetX, 0.0, e.offsetY, 0.0 );
		objectBeingSpawned.type = "notYetABall";
		objects.push(objectBeingSpawned);
	}
	if( whatToSpawn == 'Pacman' ) { // pacman
		objectBeingSpawned = new Pacman( lastSpawned['r'], 'black', Date.now(), e.offsetX, 0, e.offsetY, 0, 0, 0, 1/6, 0 );
		objectBeingSpawned.type = "notYetAPacman";
		objects.push(objectBeingSpawned);
	}
}
function canvasMouseWheel(e) {
	if( objectBeingSpawned ) {
		var delta = e.deltaY || e.detail || e.wheelDelta;		
		if( objectBeingSpawned.type == 'notYetABall' || objectBeingSpawned.type == 'notYetAPacman' ) {
			if(delta > 0 )
				objectBeingSpawned.r *= 1.1;
			if(delta < 0 )
				objectBeingSpawned.r /= 1.1;
		}
		e.preventDefault ? e.preventDefault() : (e.returnValue = false);
	}
}
function canvasMouseMove(e) {
	if( objectBeingSpawned ) {
		objectBeingSpawned.x = new ConstValue(e.offsetX);
		objectBeingSpawned.y = new ConstValue(e.offsetY);
	}
}
function canvasMouseRightClick(e) {
	if( e.offsetX < 5 && e.offsetY < 5 ) {
		moonTheme();
	} else 
		if ( whatToSpawn != 'Ball' )
			return 0;
	if( objectBeingSpawned && objectBeingSpawned.type == 'notYetABall' ) {
		objectBeingSpawned.color = ( objectBeingSpawned.color + 1 ) % ballColors.length;
	}
	if (e.preventDefault) 
		e.preventDefault(); 
	else e.returnValue=false;
	if (e.stopPropagation)
		e.stopPropagation();
	else e.cancelBubble=true;
	
}

function resizeCanvas() {
	canvas.width=window.innerWidth;
	canvas.height=window.innerHeight;
}

function changeSpawnedObjectBall(e) {
	document.getElementsByClassName('balls-control__ball-spawn')[0].classList.add('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__pacman-spawn')[0].classList.remove('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__mouse')[0].classList.remove('balls-control__button-pressed');
	whatToSpawn = 'Ball';
}
function changeSpawnedObjectPacman(e) {
	document.getElementsByClassName('balls-control__ball-spawn')[0].classList.remove('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__pacman-spawn')[0].classList.add('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__mouse')[0].classList.remove('balls-control__button-pressed');
	whatToSpawn = 'Pacman';
}
function changeSpawnedObjectNothing(e) {
	document.getElementsByClassName('balls-control__ball-spawn')[0].classList.remove('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__pacman-spawn')[0].classList.remove('balls-control__button-pressed');
	document.getElementsByClassName('balls-control__mouse')[0].classList.add('balls-control__button-pressed');
	whatToSpawn = undefined;
}

function changeElasticity(e) {
	bump_factor = Math.log(e.target.value * 220.25465794806706 + 1)/10;
	console.log(bump_factor);
}

function objClear() {
	for( var obj in objects ) {
		delete objects[obj];
	}
	objects.push( new Border() );
}

function addBalls(e) {
	var size_r = document.getElementsByClassName('balls-control__ball-size')[0].value; //relative to canvas
	var size_a_min = Math.sqrt(canvas.height * canvas.width) * size_r * size_r / 10000; //absolute
	var size_a_max = size_a_min * 1.3;
	var speed_max = (100-size_r)*(100-size_r)*0.00008;
	size_a_min *= 0.7;
	for( var i = 0; i < (100-size_r)*(100-size_r)*(100-size_r)*0.00004; i++ ) {
		objects.push( new Ball( randomOf(size_a_min, size_a_max), i % ballColors.length, Date.now(), randomOf(size_a_max, canvas.width-size_a_max), randomOf(-speed_max,speed_max), randomOf(size_a_max, canvas.height-size_a_max), randomOf(-speed_max,speed_max) ) );
	}
}


function addPacmans(e) {
	var size_r = document.getElementsByClassName('balls-control__pacman-size')[0].value; //relative to canvas
	var size_a_min = Math.sqrt(canvas.height * canvas.width) * size_r * size_r / 10000; //absolute
	var size_a_max = size_a_min * 1.3;
	size_a_min *= 0.7;
	for( var i = 0; i < (100-size_r)*(100-size_r)*(100-size_r)*0.00001; i++ ) {
		objects.push( new Pacman( randomOf(size_a_min, size_a_max), 'black', Date.now(), randomOf(size_a_max, canvas.width-size_a_max), 0, randomOf(size_a_max, canvas.height-size_a_max), 0, randomOf(0,2), 0, 1/6, 0) );
	}
}
	

function scene() { // <<<---------------------------MAIN----FUNC-----------------
	canvas = document.getElementById('myCanvas');
	context = canvas.getContext('2d');
	canvas.width =  window.innerWidth - 10;
	canvas.height = window.innerHeight - 10;



//	------------------object creation syntax:--------------------------
//
//	Ball( r, color, t0, x0, dxdt, y0, dydt ) 
//		r - radius
//		color
//		t0 - start time, at which it was in x0,y0
//		x0 - start x coordinate
//		dxdt - ball's speed projection on x axis
//		y0 - start y coord
//		dydt - ball's speed projection on y axis
//	
//	Border() - draws canvas border
//
//	Pacman( r, color, t0, x0, dxdt, y0, dydt, ar0, dardt, am0, damdt )
//		r ... dydt - see Ball
//		ar0 - initial rotation angle
//		dardt - rotation speed
//		am0 - initial mouth opening angle, and
//		damdt - it's changing speed
//
//	Wall( n ) - draws one of the border walls for interactive playing
//		the number n chooses the wall from these:
//		[0]      [4]
//		[1]      [5]
//		[2]      [6]
//		[3]      [7]
//		walls are thought to be used by players to defend their side 
//		from incoming balls
//
//	--------------------------------------------------------------------



	objects = [ // << ------array--of--objects--to--be--drawn--on--canvas----
	            // ----- the only object requirement is to have draw() func
		    // -- the set can be modified any time, changes apply
		    // -- immediately

		//new Ball( 50, 0, Date.now(), 400, 0.0, 180, -0.1 ),
		//new Ball( 50, 0, Date.now(), 120, -0.5, 120, -0.6 ),
		//new Pacman( 200, 'black', Date.now(), 200, 0, 200, 0, 0, 0, 1/6, 0 ),
		new Border(),
		
	]

	// populate objects[] with for loops
	
	for( var i = 0; i < 20; i++ ) {
		objects.push( new Ball( randomOf(5,60), i % ballColors.length, Date.now(), randomOf(51,canvas.width-51), randomOf(-0.2,0.2), randomOf(51,canvas.height-51), randomOf(-0.2,0.2) ) );
	}
	/* this is done on click
	for( var i = 0; i < 6; i++ ) {
		objects.push( new Pacman( randomOf(20,50), 'black', Date.now(), randomOf(-800,800), 0, randomOf(-800,-200), 0, randomOf(0,2), 0, 1/6, 0) );
	}
	*/

	setInterval( drawFrame, 50 );
	setInterval( check_stuck, 1000 );

	if ('onwheel' in document) 
		canvas.addEventListener('wheel', canvasMouseWheel );
	else if ('onmousewheel' in document)
		canvas.addEventListener('mousewheel', canvasMouseWheel );
	canvas.addEventListener('mousemove', canvasMouseMove );
	canvas.addEventListener('mouseout', canvasMouseOut );
	canvas.addEventListener('mouseenter', canvasMouseEnter );
	canvas.addEventListener('contextmenu', canvasMouseRightClick );
	canvas.addEventListener('mousedown', canvasMouseDown );
	canvas.addEventListener('mouseup', canvasMouseUp );
	canvas.addEventListener('click', canvasMouseClickInit );
	window.addEventListener('resize', resizeCanvas );
//	document.getElementById('balls-control__ball-spawn').addEventListener('click', changeSpawnedObjectBall );
//	document.getElementById('balls-control__pacman-spawn').addEventListener('click', changeSpawnedObjectPacman );
//	document.getElementById('balls-control__mouse').addEventListener('click', changeSpawnedObjectNothing );
	document.getElementsByClassName('balls-control__ball-spawn')[0].addEventListener('click', changeSpawnedObjectBall );
	document.getElementsByClassName('balls-control__pacman-spawn')[0].addEventListener('click', changeSpawnedObjectPacman );
	document.getElementsByClassName('balls-control__mouse')[0].addEventListener('click', changeSpawnedObjectNothing );
	document.getElementsByClassName('balls-control__elasticity')[0].addEventListener('change', changeElasticity );
	document.getElementsByClassName('balls-control__elasticity')[0].addEventListener('change', changeElasticity );
	document.getElementsByClassName('balls-control__balls-spawn')[0].addEventListener('click', addBalls );
	document.getElementsByClassName('balls-control__pacmans-spawn')[0].addEventListener('click', addPacmans );
	document.getElementsByClassName('balls-control__clear')[0].addEventListener('click', objClear );
}
