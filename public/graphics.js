// For some reason this is the problem
var socket = io.connect("http://localhost:3000");

/* 
Extensions:
Make the bullets only have a certain number of bounces
Figure out bullets out of turret
Make tank into an object
Figure out keypress vs keydown, so can turn and shoot and move at the same time
Figure out lerping
Figure out how to make this much less janky, different file with mathy drawing functions
Now have wall coords, need to use the distance equation to see if distance is less than 
Idea for reactangle collision. Have a function that checks if a corner is inside a box. Then run that on all four corners and detirmine chich one is indise.
Then you dont let the corner come less that the x value if inside
*/


/*
ToDo right now:
Do wall collisions
GET RID OF TILE WIDTH AND TANK WIDTH SINCE THEY ARE THE SAME

*/

$(document).ready(function() 
{
	alert("loaded");
	var canvas = document.getElementById("myCanvas")
	var ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	canvas.width = (window.innerWidth*0.99);
	canvas.height = (window.innerHeight*0.97);

	var tankangle = 0;
	var tankspeed = 0;
	var turnspeed = 10;
	var xspeed = 0;
	var yspeed = 0;
	var tankscale = 2;

	var spriteSheet = new Image();
	spriteSheet.src = "level.png";
	//Tank icon loading
	var tank = new Image();
	tank.src = "tank.png";

	// This weird callback inside callback makes sure the images are loaded before the game starts
	spriteSheet.onload = function() {
		tank.onload = function()
		{
		// 	alert("imgs");
		// 	draw();
			// drawTiles();
			setInterval(draw,10); 
		}
	};

	var bulletspeed = 5;
	var bulletsize = 5;
	var bullets = [];

	var walls = [[0,2],[10,20]];
	var wallCoords = [];
	var wallindex = 0;

	var importSize = 40;
	var tileWidth = canvas.width/(canvas.width/(tank.width*tankscale));
	var tileHeight = canvas.height/(canvas.height/(tank.height*tankscale));


// ************************** HELPER FUNCTIONS **************************************************************************
	function keepInsideCanvas()
	{
		if(tankx - (tank.width/2) < 0)
		{
			tankx = tank.width/2;
		}

		if(tankx + (tank.width/2) > canvas.width)
		{
			tankx = canvas.width - (tank.width/2);
		}

		if(tanky - (tank.height/2) < 0)
		{
			tanky = tank.height/2;
		}

		if(tanky + (tank.height/2) > canvas.height)
		{
			tanky = canvas.height - (tank.height/2);
		}
	}


	function drawTiles()
	{
		wallindex = 0;

		for(row = 0; row < canvas.height; row += tileHeight)
		{
			for(col = 0; col < canvas.width; col+= tileWidth)
			{
				if(walls[wallindex][1] == col/tileWidth && walls[wallindex][0] == row/tileHeight)
				{
					// console.log(wallindex
					if(wallCoords.length < walls.length)
					{
						wallCoords.push([col,row]);
					}

					ctx.drawImage(spriteSheet,importSize,0,importSize,importSize,col,row,tileWidth,tileHeight);

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

// ************************** END OF HELPER FUNCTIONS ******************************************************* 

//  ************************** BULLET CLASS ******************************************************* 

	var bullet = function(index)
	{
		this.x = tankx;
		this.y = tanky;
		this.index = index;
		this.angle = tankangle;
		this.xspeed = -bulletspeed*Math.sin((this.angle*Math.PI)/180);
		this.yspeed = -bulletspeed*Math.cos((this.angle*Math.PI)/180);

		this.animate = function()
		{
			//Updates the bullet position
			this.x = this.x + this.xspeed;
			this.y = this.y + this.yspeed;

			if(this.x - (bulletsize/2) < 0)
			{
				delete bullets[this.index];
			}

			if(this.x + (bulletsize/2) > canvas.width)
			{
				delete bullets[this.index];
			}

			if(this.y - (bulletsize/2) < 0)
			{
				delete bullets[this.index];
			}

			if(this.y + (bulletsize/2) > canvas.height)
			{
				delete bullets[this.index];
			}
		}
	}

//  ************************** END OF  BULLET CLASS *******************************************************


	// //Keyboard input
	$(window).keydown(function(event)
	{
		var keyCode = event.keyCode;

  		if(keyCode == 39)
  		{
  			tankangle = tankangle - turnspeed;
  		}

  		//Space Bar
  		if(keyCode == 32)
  		{
  			bullets.push(new bullet(bullets.length));
  		}

  		if(keyCode == 37)
  		{
  			tankangle = tankangle + turnspeed;
  		}

  		

  		if(event.keyCode == 38)
  		{
  			tankspeed = 2;
  		}

	});


	$(window).keyup(function(event)
	{
		if(event.keyCode == 38)
  		{
  			tankspeed = 0;
  		}

	});

	//Initial tanx and tanky
	var tankx = canvas.width/2;
	var tanky = canvas.height/2;


	function pointRect(bx,by,px,py)
	{
		// bx and by are coords of box	


		if((px + tank.width >= bx && px - tank.width/2 <= bx+tileWidth + tank.width) && (py > by && py < by + tileHeight))
		{
			
			// Collision with block
			//Tank is on left half of block
			if(px + tank.width < bx + tileWidth)
			{
				tankx = bx-tileWidth/2;
			}

			// Tank is on right half of block
			if(px - tank.width < bx + tileWidth)
			{
				tankx = bx + tileWidth + tank.width;
			}
		}

	}	

	function distance(ax,ay,bx,by)
	{
		return Math.sqrt(Math.pow((ax-bx),2) + Math.pow((ay-by),2));
	}



	function draw()
	{
		// alert("run");
		//Converts from degrees to radians
		var radians = (tankangle*Math.PI)/180;

		//Gets the slope nessecary for the degrees
		xspeed = -tankspeed*Math.sin(radians);
		yspeed = -tankspeed*Math.cos(radians);

		//Updates the tank position
		tankx = tankx + xspeed;
		tanky = tanky + yspeed;

		// //Resets the background canvas from what was drawn previously
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawTiles();

		// //Bounds of canvas
		keepInsideCanvas();

		ctx.translate(tankx,tanky);
		ctx.rotate(-tankangle*Math.PI/180);
		//Debug rect
		ctx.fillStyle = "grey";
		ctx.fillRect(-((tank.width)*0.5)*tankscale,-((tank.height)*0.5)*tankscale,tank.width * tankscale, tank.height*tankscale);
		// This 0.5 is in here because the middle of the tank is 0,0
		ctx.drawImage(tank,-((tank.width)*0.5)*tankscale,-((tank.height)*0.5)*tankscale,tank.width * tankscale, tank.height*tankscale);

		ctx.rotate(tankangle*Math.PI/180);
		ctx.translate(-tankx,-tanky);
		ctx.fillStyle = "orange";
		ctx.fillRect(tankx,tanky,1,1);

		for(i = 0; i<bullets.length;i++)
		{
			var x = bullets[i];

			if(x != undefined)
			{
				x.animate();

				ctx.beginPath();
				ctx.fillStyle = "black";
				ctx.arc(x.x,x.y,bulletsize,0,2*Math.PI);
				ctx.fillStyle = "black";
      			ctx.fill();
				ctx.stroke();

			}
		}

		pointRect(wallCoords[0][0],wallCoords[0][1],tankx,tanky);

		// socket.emit("box", data);

	}

	// console.log(wallCoords);


});

	