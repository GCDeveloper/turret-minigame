var App = (function(){
	var width = null;
	var height = null;
	var minWH = null;
	var canvas = null;
	var ctx = null;
	var AppClient = (function(){
		function initializeApp(){

			if(typeof window.console == 'undefined') {
			  window.console = {log: function (msg) {}, warn: function(msg){}};
			}
			window.onerror = function(msg) {
			  console.log("error message:", msg);
			};
			var onWindowResized = function(){
				width = window.innerWidth;
				height = window.innerHeight;
				minWH = Math.min(width, height);
				canvas.width = width;
				canvas.height = height;
				if(bDrawStart){
					drawStart();
				} else if(bDrawGame){
					drawGame();
				} else if(bDrawGameOver){
					drawGameOver();
				}
			};
			var onWindowLoaded = function(){
				console.log("window loaded");
				canvas = document.getElementById('canvas');
				ctx = canvas.getContext('2d');
				AppConnect.connect(function(blnResponse, data){
					AppClient.isConnected = blnResponse;
					AppClient.connectionData = data;
					console.log("connected:", blnResponse, "with data:", data);
				});
				onWindowResized();
				window.addEventListener('click', initGame, false);
			};

			//Initialize program
			//document.addEventListener("deviceready", onDeviceReady, false);
			window.addEventListener('load', onWindowLoaded, false);
			window.addEventListener('resize', onWindowResized, false);
		};
		function drawStart(){
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.fillRect(0,0,width,height);
			ctx.strokeStyle = 'rgb(255,255,255)';
			ctx.lineCap = 'round';
			ctx.lineWidth = 12;
			ctx.beginPath();
			drawArrow(ctx, {x:width/2,y:height/2}, Math.PI/2, minWH*0.2);
			ctx.closePath();
			ctx.stroke();
		}
		var turret = {};//{x:width*0.1+15,y:height/2,radius:15,angle:Math.PI/2};
		function drawTurret(){
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(turret.x+turret.radius, turret.y);
			ctx.arc(turret.x, turret.y, turret.radius, 0, Math.PI*2);
			ctx.moveTo(turret.x,turret.y);
			ctx.lineTo(turret.gunX, turret.gunY);
			ctx.closePath();
			ctx.fill();
		}
		function updateTurret(aim){
			turret.angle = AppCalc.getAngle(turret, aim);
			turret.gunX = turret.x+Math.sin(turret.angle)*turret.gunLength;
			turret.gunY = turret.y+Math.cos(turret.angle)*turret.gunLength;
		}
		function drawGameBG(){
			ctx.fillStyle = 'rgb(255,255,255)';
			ctx.fillRect(0,0,width,height);
			/*ctx.strokeStyle = 'rgb(0,0,0)';
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(width*0.1, 0);
			ctx.lineTo(width*0.1, height);
			ctx.closePath();
			ctx.stroke();*/
		}
		var mouseIsDown = false;
		var mX, mY;
		function mouseMove(e){
			var x,y;
			if(e.touches && e.touches.length >= 1){
				x = e.touches[0].pageX;
				y = e.touches[0].pageY;
			} else {
				x = e.pageX;
				y = e.pageY;
			}
			mX = x;
			mY = y;
		}
		function mouseDown(e){
			var x,y;
			if(e.touches && e.touches.length >= 1){
				x = e.touches[0].pageX;
				y = e.touches[0].pageY;
			} else {
				x = e.pageX;
				y = e.pageY;
			}
			mX = x;
			mY = y;
			mouseIsDown = true;
			if(buttons[0].active){
				if(AppCalc.pointHitsCircle({x:x,y:y}, buttons[0])){
					//hit >> button
					turret.shootSpeed ++;
					buttons[0].active = false;
					setTimeout(function(){
						buttons[0].active = true;
					}, 2000);
				}
			}
			if(buttons[1].active){
				if(AppCalc.pointHitsCircle({x:x,y:y}, buttons[1])){
					//hit >> button
					turret.shootDensity -= 2;
					buttons[1].active = false;
					setTimeout(function(){
						buttons[1].active = true;
					}, 3000);
				}
			}
		}
		function mouseUp(e){
			var x,y;
			if(e.touches && e.touches.length >= 1){
				x = e.changedTouches[0].pageX;
				y = e.changedTouches[0].pageY;
			} else {
				x = e.pageX;
				y = e.pageY;
			}
			mouseIsDown = false;
		}
		function initGame(){
			buttons = [
		{x:width*0.33,y:height*0.1,radius:30,active:false},
		{x:width*0.66,y:height*0.1,radius:30,active:false}];
		setTimeout(function(){
			buttons[0].active = true;
		}, 2000);
		setTimeout(function(){
			buttons[1].active = true;
		}, 3000);
			turret = {x:width*0.1+15,y:height/2,radius:15,angle:Math.PI/2,gunLength:30, shootSpeed:6,shootDensity:20};
			window.removeEventListener('click', initGame, false);
			bDrawGame = true;
			bDrawStart = false;
			drawGame();
			window.addEventListener('mousedown', mouseDown, false);
			window.addEventListener('mouseup', mouseUp, false);
			window.addEventListener('mousemove', mouseMove, false);
			window.addEventListener('touchstart', mouseDown, false);
			window.addEventListener('touchend', mouseUp, false);
			window.addEventListener('touchmove', mouseMove, false);
			beginLoop();
		};
		var allowLoop = true;
		var bullets = [];
		function drawBullet(b){
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.beginPath();
			ctx.arc(b.x, b.y, 2, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		};
		var score = 0;
		function updateBullet(b, i){
			b.x += Math.sin(b.angle)*b.vel;
			b.y += Math.cos(b.angle)*b.vel;
			//hit test zombies
			zombies.forEach(function(z, j){
				if(AppCalc.pointHitsCircle(b, z)){
					bullets.splice(i, 1);
					z.x += 2;
					z.health -= 10;
					if(z.health <= 0){
						zombies.splice(j, 1);
						score ++;
					}
				}
			});
			//hit test canvas bounds, delete if out of visible area.
			if(!AppCalc.pointHitsRect(b, {x:0,y:0,width:width,height:height})){
				bullets.splice(i, 1);
			}

		};
		var bDrawStart = true;
		var bDrawGame = false;
		var bDrawGameOver = false;
		function drawZombie(z){
			ctx.fillStyle = 'rgb(0,255,0)';
			ctx.beginPath();
			ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		};
		function drawGameOver(){
			var strScore = "Score: "+score;
			ctx.font = '30px Arial';
			var nScoreWidth = ctx.measureText(strScore).width;
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.fillRect(0,0,width,height);
			ctx.fillStyle = 'rgb(255,255,255)';
			ctx.fillText(strScore, width/2-nScoreWidth/2, height/2);
		}
		function gameOver(){
			bullets = [];
			zombies = [];
			endLoop();
			bDrawGame = false;
			bDrawGameOver = true;
			setTimeout(drawGameOver, 150);
			setTimeout(function(){
				window.addEventListener('click', function(){
					location.reload();
				});
			}, 600);

		};
		function updateZombie(z, i){
			var angle;
			if(!AppCalc.circleHitsCircle(turret, z)){
				angle = AppCalc.getAngle(z, turret)+Math.sin(frame/z.turnDivisor)*Math.PI/z.turnAmount;
				z.x += Math.sin(angle)*z.speed;
				z.y += Math.cos(angle)*z.speed;
			} else {
				gameOver();
			}
		};
		var frame = 0;
		var zombies = [];
		function updateGame(frame){
			var i = 0;
			aim = {x:mX,y:mY};
			updateTurret(aim);//updates angle and gunX, gunY
			if(mouseIsDown){
				if(turret.shootDensity >= 1){
					if(frame % turret.shootDensity == 0){
						bullets.push({x:turret.gunX,y:turret.gunY,angle:turret.angle, vel: turret.shootSpeed});
					}
				} else {
					for(i=0;i<-turret.shootDensity+2;i++){
						bullets.push({x:turret.gunX+Math.random()*4-2,y:turret.gunY+Math.random()*4-2,angle:turret.angle, vel: turret.shootSpeed});
					}
				}

			}
			//create a zombie every 200 frames
			if(frame % 200 == 0){
				zombies.push({x:800, y:Math.random()*(height-20)+10,radius:Math.random()*8+10,health:Math.random()*50+20,speed:Math.random()*0.5+0.5+frame/1000, turnDivisor:Math.random()*80+10, turnAmount:Math.random()*3+6});
			}
			zombies.forEach(updateZombie);
			bullets.forEach(updateBullet);
		}
		function drawCircle(b){
			ctx.beginPath();
			ctx.moveTo(b.x+b.radius, b.y);
			ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
			ctx.lineWidth = b.lineWidth || 3;
			ctx.stroke();
			ctx.closePath();
		}
		var buttons;
		function drawButtons(){
			var x = buttons[0].x;
			var y = buttons[0].y;
			if(buttons[0].active){
				ctx.strokeStyle = 'rgb(180,180,180)';
			} else {
				ctx.strokeStyle = 'rgb(230,230,230)';
			}

			drawCircle(buttons[0]);
			ctx.beginPath();
			ctx.moveTo(x-10, y-10);
			ctx.lineTo(x, y);
			ctx.lineTo(x-10, y+10);
			ctx.closePath();
			ctx.stroke();
			x+=15;
			ctx.beginPath();
			ctx.moveTo(x-10, y-10);
			ctx.lineTo(x, y);
			ctx.lineTo(x-10, y+10);
			ctx.closePath();
			ctx.stroke();

			if(buttons[1].active){
				ctx.strokeStyle = 'rgb(180,180,180)';
			} else {
				ctx.strokeStyle = 'rgb(230,230,230)';
			}
			drawCircle(buttons[1]);
		}
		function drawGame(){
			drawGameBG();
			drawTurret();
			ctx.lineWidth = 2;
			zombies.forEach(drawZombie);
			ctx.lineWidth = 1;
			bullets.forEach(drawBullet);
			drawButtons();
		}
		function loop(){
			if(allowLoop){
				//start loop code here--
				updateGame(frame);
				drawGame();
				frame ++;
				//--end loop code here
				requestAnimFrame(loop);
			}
		}
		function beginLoop(){
			allowLoop = true;
			loop();
		}
		function endLoop(){
			allowLoop = false;
		}
		function drawRegularShape(ctx, xPos, yPos, numSides, numWidth, numHeight, numRotation){
			var i = 0;
			ctx.moveTo(xPos+Math.sin((i/numSides)*Math.PI*2+numRotation)*numWidth, yPos+Math.cos((i/numSides)*Math.PI*2+numRotation)*numHeight);
			for(i = 0;i<numSides+1;i++){
				ctx.lineTo(xPos+Math.sin((i/numSides)*Math.PI*2+numRotation)*numWidth, yPos+Math.cos((i/numSides)*Math.PI*2+numRotation)*numHeight);
			}
		};
		function drawArrow(ctx, pos, angle, size){
			var posVectorA = AppCalc.getVectorEnd({x:pos.x, y:pos.y, angle:-angle, dist:size*0.5});
			var posVectorB = AppCalc.getVectorEnd({x:pos.x, y:pos.y, angle:-angle, dist:size*2});

			//ctx.save();
			//ctx.translate(pos.x, pos.y);
			//ctx.rotate(angle);
			//draw triangle shape (or, draw image instead)
			ctx.moveTo(posVectorA.x, posVectorA.y);
			drawRegularShape(ctx, pos.x, pos.y, 3, size, size, -angle-Math.PI);
			//ctx.moveTo(posVectorA.x, posVectorA.y);
			//ctx.lineTo(posVectorB.x, posVectorB.y);
			//xPos, yPos, numSides, numSize, numRotation
			//ctx.restore();
		};
		//exports
		var AppClient = {
			isConnected: false,
			connectionData: null
		};
		initializeApp();//Auto initializes self (load) if this module is in the code
		return AppClient;
	}());

	var AppConnect = (function(){
		var socket = null;
		var blnConnected = false;
		var AppConnect = {
			connect: function(callback){
				console.log("begin connecting...");
				if(typeof io != 'undefined'){
					socket  = io.connect();//connect to socket.io
					socket.emit('client_loaded');//tell server that the client has loaded and is trying to connect to the server.
					//fired when the server comes online
					socket.on('server_online', function(message){
						console.log("Server online:", message);
					});
					//fires when the current client connects to the server
					socket.on('server_you_connected', function(user){
						console.log("you connected: ", user);
						blnConnected = true;
						callback(true, user);//do callback with response and user data
					});
					//fires when any user connects to the server
					socket.on('server_user_connected', function(user){
						console.log("a user connected", user);
					});
					//fires when a user disconnects
					socket.on('server_user_disconnected', function(uID){
						console.log("user "+uID+" disconnected");
					});
					//reloads the webpage for a client if server decides
					socket.on('server_refresh_client', function(){
						location.reload();
					});
				} else {
					callback(false, null);//callback with false for not connected, and null data.
					console.log("Cannot connect; socket.io not found.");
				}
			}
		};
		return AppConnect;
	}());
	window.requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       ||
			  window.webkitRequestAnimationFrame ||
			  window.mozRequestAnimationFrame    ||
			  window.oRequestAnimationFrame      ||
			  window.msRequestAnimationFrame     ||
			  function( callback ){
				window.setTimeout(callback, 1000 / 30);//30 times per second
			  };
	})();
}());
