
var socket = io();



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

	var walls = [
	[2,3],[2,4],[2,5],[3,3],[4,3],[5,3],[9,26],[10,26],[11,26],[12,24],[12,25],[12,26]
	
	];
	var wallCoords = [];
	// Tile dimensions are constant across screens
	var windowDimens = [30,14.5];

	var bulletsize, bulletspeed;
	var importSize = 40;

	// Will hold x,y,angle,health,nickname, colors
	var otherTanks = [];
	var otherBullets = [];

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
			console.log("imgsize " + tankImg.width)

			tileWidth = canvas.width/(windowDimens[0]);
			tileHeight = canvas.height/(windowDimens[1]);

			tileWidth = Math.round(tileWidth);
			tileHeight = Math.round(tileHeight);

			// Variables set relative to base unit of the tileWidth
			maxTankSpeed = tileWidth/5;
			bulletspeed = maxTankSpeed * 2;
			bulletsize = tileWidth/10;

			console.log(tileWidth + " " +  tileHeight);

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
			console.log("Someone new joined");
			otherTanks.push(data);
		}

	});

	socket.on("bullet", function(data)
	{
		otherBullets.push(data);
	});

// ************************** HELPER FUNCTIONS **************************************************************************


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

	function wallCollisions(boxx,boxy)
	{
		
		if( (tank.y > boxy - (tileHeight/2) && tank.y < boxy + tileHeight + (tileHeight/2)) &&
			(tank.x + (tileWidth/2) > boxx && tank.x < boxx + tileWidth + (tileWidth/2)))
		{
			if(tank.x + (tileWidth/2) > boxx && tank.x + (tileWidth/2) < boxx + (tileWidth/2))
			{
				tank.x = boxx - tileWidth/2;
			}
			else if(tank.x - (tileWidth/2) > boxx + (tileWidth/2))
			{
				tank.x = boxx + tileWidth + (tileWidth/2);
			}
			else if(tank.y + (tileHeight/2) < boxy + (tileHeight/2))
			{
				tank.y = boxy - tileHeight/2;
			}
			else if(tank.y + (tileHeight/2) > boxy + (tileHeight/2))
			{
				tank.y = boxy + tileHeight + (tileHeight/2);
			}
		}
	}

	function distance(ax,ay,bx,by)
	{
		return Math.sqrt(Math.pow((ax-bx),2) + Math.pow((ay-by),2));
	}

// ************************** END OF HELPER FUNCTIONS ******************************************************* 

//  ************************** BULLET CLASS ******************************************************* 

	var bullet = function()
	{
		this.angle = tank.angle;
		this.xspeed = -bulletspeed*Math.sin((this.angle*Math.PI)/180);
		this.yspeed = -bulletspeed*Math.cos((this.angle*Math.PI)/180);
		// This math puts the bullet in front of the turret
		this.x = tank.x - (Math.sin((this.angle*Math.PI)/180) * tankImg.width) - (this.xspeed*0.65);
		this.y = tank.y - (Math.cos((this.angle*Math.PI)/180) * tankImg.height) - (this.yspeed*0.65);

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
		this.health = 10;

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
			// ctx.drawImage(tankImg,-((tankImg.width)*0.5)*tankscale,-((tankImg.height)*0.5)*tankscale,tankImg.width * tankscale, tankImg.height*tankscale);
			ctx.drawImage(tankImg,-((tileWidth)*0.5),-((tileHeight)*0.5),tileWidth, tileHeight);
			ctx.rotate(this.angle*Math.PI/180);
			ctx.translate(-this.x,-this.y);

			// Drawing nickname
			ctx.fillStyle = "white";
			ctx.font = (tankscale*5) + "px Arial";
			ctx.fillText(nickname,this.x-(tileWidth/2),this.y-((tileHeight*2)/3));

			// Health bar
			ctx.beginPath();
			ctx.rect(this.x-(tileWidth*0.4),this.y-(tileHeight*1.2),tankscale*15,tankscale*2.5);
			ctx.stroke();
			ctx.fillStyle = "green";
			ctx.fillRect(this.x-(tileWidth*0.4),this.y-(tileHeight*1.2),((tankscale*15)/10)*tank.health,tankscale*2.5);


			// x,y,angle,health,nickname
			var data = [this.x,this.y,this.angle,this.health,nickname, socket.io.engine.id];
			socket.emit("tank", data);
			drawBullets();
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
  			bullets.push(new bullet());
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


	function drawBullets()
	{
		var length = bullets.length;
		for(i=0;i<length&&i>=0;i++)
		{
			var bullet = bullets[i];
			bullet.animate();

			if(bullet.x - (bulletsize/2) < 0)
			{
				bullets.splice(i,1);
				i--;
				length--;
			}
			else if(bullet.x + (bulletsize/2) > canvas.width)
			{
				bullets.splice(i,1);
				i--;
				length--;
			}
			else if(bullet.y - (bulletsize/2) < 0)
			{
				bullets.splice(i,1);
				i--;
				length--;
			}
			else if(bullet.y + (bulletsize/2) > canvas.height)
			{
				bullets.splice(i,1);
				i--;
				length--;
			}
			else
			{
				for(x=0;x<wallCoords.length;x++)
				{
					// if(distance(bullet.x,bullet.y,wallCoords[x][0] + tileWidth/2, wallCoords[x][1] + tileHeight/2) < tileWidth/2)
					if((bullet.y + (bulletsize/2) > wallCoords[x][1] && bullet.y - (bulletsize/2) < wallCoords[x][1] + tileHeight &&
						(bullet.x + (bulletsize/2) > wallCoords[x][0] && bullet.x - (bulletsize/2) < wallCoords[x][0] + tileWidth)))
					{
						bullets.splice(i,1);
						i--;
						length--;
						continue;
					}
				}

				for(y=0;y<otherTanks.length;y++)
				{
					if(distance(otherTanks[y][0],otherTanks[y][1],bullet.x,bullet.y) < (tankImg.width*tankscale*0.5))
					{
						bullets.splice(i,1);
						i--;
						length--;
						continue;
					}
				}
			}

			ctx.beginPath();
			ctx.fillStyle = "black";
			ctx.arc(bullet.x,bullet.y,bulletsize,0,2*Math.PI);
  			ctx.fill();
			ctx.stroke();

			socket.emit("bullet", [bullet.x,bullet.y]);
		}
	}


//  ************************** END OF KEYBOARD INPUT ****************************************************

	function draw()
	{
		clearTimeout(drawingTimer);

		//Resets the background canvas from what was drawn previously
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

		// Has a callback to drawBullets in it
		tank.animate();


		for(x=0;x<otherBullets.length;x++)
		{
			if(distance(tank.x,tank.y,otherBullets[x][0],otherBullets[x][1]) < (tankImg.width*tankscale*0.5))
			{
				otherBullets.splice(i,1);
				tank.health--;
			}
			else
			{
				ctx.beginPath();
				ctx.fillStyle = "orange";
				ctx.arc(otherBullets[x][0],otherBullets[x][1],bulletsize,0,2*Math.PI);
  				ctx.fill();
				ctx.stroke();
			}
		}

		otherBullets.splice(0,otherBullets.length);

		for(y=0;y<wallCoords.length;y++)
		{
			wallCollisions(wallCoords[y][0],wallCoords[y][1]);
		}

		// DISPLAYING OTHER TANKS

		for(z=0;z<otherTanks.length;z++)
		{
			// x,y,angle,health,nickname
			var currentTank = otherTanks[z];
			ctx.translate(currentTank[0],currentTank[1]);
			ctx.rotate(-currentTank[2]*Math.PI/180);
			ctx.drawImage(tankImg,-((tileWidth)*0.5),-((tileHeight)*0.5),tileWidth, tileHeight);
			ctx.rotate(currentTank[2]*Math.PI/180);
			ctx.translate(-currentTank[0],-currentTank[1]);

			// ID DRAWING
			ctx.fillStyle = "white";
			ctx.font = (tankscale*5) + "px Arial";
			ctx.fillText(currentTank[4],currentTank[0]-(tankImg.width),currentTank[1]-(tankImg.height*1.4));

			// Health Bar
			ctx.beginPath();
			ctx.rect(currentTank[0]-(tileWidth*0.4),currentTank[1]-(tileHeight*1.2),tankscale*15,tankscale*2.5);
			ctx.stroke();
			ctx.fillStyle = "green";
			ctx.fillRect(currentTank[0]-(tileWidth*0.4),currentTank[1]-(tileHeight*1.2),((tankscale*15)/10)*currentTank[3],tankscale*2.5);
		}

		if(tank.health <= 0)
		{
			socket.disconnect();

			// End Screen
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "black";
			ctx.font = (tankscale*20) + "px Arial";
			ctx.fillText("Thanks for playing! You lost.",tileWidth,tileHeight*2);
		}
		else
		{
			drawingTimer = setTimeout(draw,60);
		}

	}

});