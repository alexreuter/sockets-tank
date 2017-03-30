
var socket = io();

// Stretch idea: Have agario style and follow tank around,
// Or use maze generation algorithum, and have people spawn at different corners or something like a ctf?

/*
WORKING ON NOW: 

Braindump: 
*/

/*KNOWN BUGS:
 - Text scaling doesnt actually work, x and y are not relative, need to make relative with personalized constant like tile width?
 - Can get rid of bullet ids, no longer needed since parsed in order
 - Bullets don't dissapear immediatly upon block contact, thats an order issue, where checks if in block after draws

 STILL NEED TO IMPLIMENT:
 - Color system?? Might be to complex for now, could just highlight own tank
 - Bullet sharing
 - Health system
 - Death system
 - Clean up a lot of this code / put in seperate files
*/


$(document).ready(function() 
{
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	canvas.width = (window.innerWidth*0.99);
	canvas.height = (window.innerHeight*0.97);

	console.log("height: " + canvas.height);
	console.log("width: " + canvas.width);

	var turnspeed = 15;

	var spriteSheet = new Image();
	spriteSheet.src = "level.png";

	//Tank icon loading
	var tankImg = new Image();
	tankImg.src = "tank.png";

	var bullets = [];

	var walls = [[2,6]];
	var wallCoords = [];
	var windowDimens = [30,30*canvas.height/canvas.width];

	var bulletsize, bulletspeed;
	var importSize = 40;
	var initialHealth = 10;

	// Will hold x,y,angle,health,nickname, color
	var otherTanks = [];

	// This is to prevent weird edge cases in the bullet iding process
	var idCount = 0;

	var tileWidth;
	var tileHeight;
	var tankscale;

	var maxTankSpeed;

	var rightDown = false;
	var leftDown = false;
	var reloaded = true;

	var drawingTimer;

	// This weird callback inside callback makes sure the images are loaded before the game starts
	spriteSheet.onload = function() {
		tankImg.onload = function()
		{
			// canvas.width/windowDimens[0] is gonna be the pixels per tile
			// divding by tank width creates conversion factor, so tank is appropriately scaled to tile size
			tankscale = (canvas.width/windowDimens[0])/tankImg.width;
			console.log("tankscale: " + tankscale);

			tileWidth = canvas.width/(windowDimens[0]);
			tileHeight = canvas.height/(windowDimens[1]);

			tileWidth = Math.round(tileWidth);
			tileHeight = Math.round(tileHeight);

			// Variables set relative to base unit of the tileWidth
			maxTankSpeed = tileWidth/5;
			bulletspeed = maxTankSpeed * 2;
			bulletsize = tileWidth/10;

			// This is basically just the initial load time, because setTimeout gets changed in draw
			drawingTimer = setTimeout(draw,1);
		}
	};
// *************************************** GET NICKNAME ************************************************
var nickname = prompt("What is your nickname?");

// ****** SOCKET DISCONNECT****

window.onbeforeunload = function(){
	socket.close();
}

socket.on("disconnect",function(data)
{
	console.log(data.substring(2));

	// This is to get rid of sockets auto generated /#
	data = data.substring(2);

	for(i = 0;i<otherTanks.length;i++)
	{
		if(otherTanks[i][5] == data)
		{
			otherTanks.splice(i,1);
		}
	}
});

// **************************************** NETWORKING FUNCTIONS **************************************************************************
	socket.on("tank",function(data)
	{
		var id = data[5];
		var found = false;

		for(i=0;i<otherTanks.length;i++)
		{
			if(otherTanks[i][5] == id)
			{
				found = true;
				otherTanks[i] = data;
			}
		}

		if(!found)
		{
			console.log("Someone new has joined");
			otherTanks.push(data);
		}

	});

// ************************** HELPER FUNCTIONS **************************************************************************

	function printBullets()
	{
		for(i = 0; i<bullets.length;i++)
		{
			console.log(bullets[i]);
		}
		console.log("DONE");
	}


	function drawTiles()
	{
		var wallindex = 0;

		for(row = 0; row < canvas.height; row += tileHeight)
		{
			// col is the actual coordinates
			for(col = 0; col < canvas.width; col += tileWidth)
			{

				if(walls[wallindex][1] == col/tileWidth && walls[wallindex][0] == row/tileHeight)
				{
					if(wallCoords.length < walls.length)
					{
						wallCoords.push([col,row]);
					}

					// Draw a wall
					ctx.drawImage(spriteSheet,importSize*1,0,importSize,importSize,col,row,tileWidth,tileHeight);

					if(wallindex + 1 < walls.length)
					{
						wallindex ++;
					}
				}
				else
				{
					// Grass
					ctx.drawImage(spriteSheet,0,0,importSize,importSize,col,row,tileWidth,tileHeight);
				}
			}
		}
	}

	function pointRect(boxx,boxy)
	{
		if(distance(tank.x,tank.y,boxx+tileWidth/2,boxy+tileHeight/2) < tankImg.width + tileWidth/2)
		{

			if(tank.x + tankImg.width <= boxx + tileWidth/2)
			{
				tank.x = boxx - tankImg.width;
			}
			else if(tank.x - tankImg.width > boxx + tileWidth/2)
			{
				tank.x = boxx + tileWidth + tankImg.width;
			}
			// Tank is on top
			else if(tank.y - tankImg.width < boxy + tileWidth/2)
			{
				tank.y = boxy - tankImg.width;
			}
			else if(tank.y + tankImg.width >= boxy + tileWidth/2)
			{
				tank.y = boxy + tileWidth + tankImg.width;
			}
		}
	}

	function distance(ax,ay,bx,by)
	{
		return Math.sqrt(Math.pow((ax-bx),2) + Math.pow((ay-by),2));
	}

// ************************** END OF HELPER FUNCTIONS ******************************************************* 

//  ************************** BULLET CLASS ******************************************************* 

	function findBullet(currentValue)
	{
		// this is inputted in calling findIndex
		if(this == currentValue.id)
		{
			return true;
		}
		else
		{
			return false;
		}
	}


	var bullet = function(id)
	{
		this.id = id;
		this.angle = tank.angle;
		this.xspeed = -bulletspeed*Math.sin((this.angle*Math.PI)/180);
		this.yspeed = -bulletspeed*Math.cos((this.angle*Math.PI)/180);
		this.x = tank.x - (Math.sin((this.angle*Math.PI)/180) * tankImg.width) - (this.xspeed*0.65);
		this.y = tank.y - (Math.cos((this.angle*Math.PI)/180) * tankImg.height) - (this.yspeed*0.65);

		// POTENTIUAL WAY TO MAKE THIS CLEANER IS BY WRITING MORE FUNCTIONS TO BE CALLED BY FIND INDEX THEN DELETING THE INDEX
		// GETS RID OF THE LARGE FUNCTION AND SORTA SPLITS STUFF UP NICLEY
		this.animate = function()
		{
			this.x = this.x + this.xspeed;
			this.y = this.y + this.yspeed;
		}
	}


	// TankClass is just a nice wrapper for the functionality of the local tank
	var tankClass = function(x,y,angle)
	{
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.speed = 0;
		this.xspeed = -this.speed*Math.sin((this.angle*Math.PI)/180);
		this.yspeed = -this.speed*Math.cos((this.angle*Math.PI)/180);
		this.health = initialHealth;

		this.animate = function()
		{
			this.xspeed = -this.speed*Math.sin((this.angle*Math.PI)/180);
			this.yspeed = -this.speed*Math.cos((this.angle*Math.PI)/180);

			//Updates the tank's position
			this.x = this.x + this.xspeed;
			this.y = this.y + this.yspeed;	

			// Wall collisions
			if(this.x - (tankImg.width/2) < 0)
			{
				this.x = tankImg.width/2;
			}

			if(this.x + (tankImg.width/2) > canvas.width)
			{
				this.x = canvas.width - (tankImg.width/2);
			}

			if(this.y - (tankImg.height/2) < 0)
			{
				this.y = tankImg.height/2;
			}

			if(this.y + (tankImg.height/2) > canvas.height)
			{
				this.y = canvas.height - (tankImg.height/2);
			}

			ctx.translate(this.x,this.y);
			ctx.rotate(-this.angle*Math.PI/180);
			// This 0.5 is in here because the middle of the tank is 0,0
			ctx.drawImage(tankImg,-((tankImg.width)*0.5)*tankscale,-((tankImg.height)*0.5)*tankscale,tankImg.width * tankscale, tankImg.height*tankscale);
			ctx.rotate(this.angle*Math.PI/180);
			ctx.translate(-this.x,-this.y);

			// Drawing nickname
			ctx.font = (tankscale*5) + "px Arial";
			ctx.fillText(nickname,this.x-(tankImg.width),this.y-(tankImg.height*1.4));

			// x,y,angle,health,nickname
			var data = [this.x,this.y,this.angle,this.health,nickname, socket.io.engine.id];
			socket.emit("tank", data);
		}
	}


//  ************************** END OF  BULLET CLASS *******************************************************


	var tank = new tankClass(canvas.width/2,canvas.height/10+25,0,0);

//  ************************** START OF KEYBOARD INPUT ****************************************************

	$(window).keydown(function(event)
	{
		var keyCode = event.keyCode;

		//Space Bar
  		if(keyCode == 32 && reloaded)
  		{
  			idCount++;
  			bullets.push(new bullet(idCount));
  			reloaded = false;
  		}

  		if(keyCode == 39)
  		// Right
  		{
  			rightDown = true;
  		}


  		if(keyCode == 37)
  		// Left 
  		{
  			leftDown = true;
  		}

  		

  		if(event.keyCode == 38)
  		// Up Arrow
  		{
  			// This is where tank speed is set relative to base unit
  			tank.speed = maxTankSpeed;
  		}

	});


	$(window).keyup(function(event)
	{
		if(event.keyCode == 38)
		// Up Arrow
  		{
  			tank.speed = 0;
  		}

  		if(event.keyCode == 32)
  		{
  			reloaded = true;
  		}

  		if(event.keyCode == 39)
  		{
  			rightDown = false;
  		}


  		if(event.keyCode == 37)
  		{
  			leftDown = false;
  		}
	});



//  ************************** END OF KEYBOARD INPUT ****************************************************

	function draw()
	{

		clearTimeout(drawingTimer);


		// //Resets the background canvas from what was drawn previously
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		drawTiles();

		// Drawing control
		if(rightDown)
		{
			tank.angle = tank.angle - turnspeed;
		}

		if(leftDown)
		{
			tank.angle = tank.angle + turnspeed;
		}

		tank.animate();

		for(i = 0; i<bullets.length;i++)
		{
			var x = bullets[i];
			x.animate();
			ctx.beginPath();
			ctx.fillStyle = "black";
			ctx.arc(x.x,x.y,bulletsize,0,2*Math.PI);
  			ctx.fill();
			ctx.stroke();
		}

		for(i=0;i<bullets.length;i++)
		{
			var bullet = bullets[i];

			if(bullet.x - (bulletsize/2) < 0)
			{
				bullets.splice(i,1);
				i--;
			}
			if(bullet.x + (bulletsize/2) > canvas.width)
			{
				bullets.splice(i,1);
				i--;
			}
			if(bullet.y - (bulletsize/2) < 0)
			{
				bullets.splice(i,1);
				i--;
			}
			if(bullet.y + (bulletsize/2) > canvas.height)
			{
				bullets.splice(i,1);
				i--;
			}

			for(x=0;x<wallCoords.length;x++)
			{
				if(distance(bullet.x,bullet.y,wallCoords[x][0] + tileWidth/2, wallCoords[x][1] + tileHeight/2) < tileWidth/2)
				{
					bullets.splice(x,1);
				}
			}
		}


		for(i=0;i<wallCoords.length;i++)
		{
			pointRect(wallCoords[i][0],wallCoords[i][1]);
		}

		// DISPLAYING OTHER TANKS

		for(i=0;i<otherTanks.length;i++)
		{
			// x,y,angle,health,nickname
			var currentTank = otherTanks[i];
			ctx.translate(currentTank[0],currentTank[1]);
			ctx.rotate(-currentTank[2]*Math.PI/180);
			ctx.drawImage(tankImg,-((tankImg.width)*0.5)*tankscale,-((tankImg.height)*0.5)*tankscale,tankImg.width * tankscale, tankImg.height*tankscale);
			ctx.rotate(currentTank[2]*Math.PI/180);
			ctx.translate(-currentTank[0],-currentTank[1]);

			// ID DRAWING
			ctx.font = (tankscale*5) + "px Arial";
			ctx.fillText(currentTank[4],currentTank[0]-(tankImg.width),currentTank[1]-(tankImg.height*1.4));
		}

		// console.log(tankImg.width);
		// console.log(tankImg.height);

		drawingTimer = setTimeout(draw,50);

	}

	// drawTiles();


});

	