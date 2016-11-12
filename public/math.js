$(document).ready(function() 
{
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

		for(row = 0; row < canvas.height; row += spriteHeight)
		{
			for(col = 0; col < canvas.width; col+= spriteWidth)
			{
				if(walls[wallindex][1] == col/spriteWidth && walls[wallindex][0] == row/spriteHeight)
				{
					// console.log(wallindex
					if(wallCoords.length < walls.length)
					{
						wallCoords.push([col,row]);
						console.log(wallCoords);
					}

					ctx.drawImage(spriteSheet,importSize,0,importSize,importSize,col,row,spriteWidth,spriteHeight);

					if(wallindex + 1 < walls.length)
					{
						wallindex ++;
					}
					
				}
				else
				{
					// Grass
					ctx.drawImage(spriteSheet,0,0,importSize,importSize,col,row,spriteWidth,spriteHeight);
				}
			}
		}
	}

});