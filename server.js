// var express = require('express');
// var app = express();

// app.use(express.static('public'));

// var server = app.listen(3000);
// console.log("Server is working")

// var socket = require("socket.io");

// var io = socket(server);

var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
app.use(express.static('public'));


var socket = require("socket.io");
var io = socket(server);


io.sockets.on("connection", newConnection);




function newConnection(socket)
{
	console.log("New connection: " + socket.id);

	socket.on("tank", function(data)
	{
		console.log(data);
		socket.broadcast.emit("tank", data);
		// console.log("sent");
	});

	socket.on('disconnect', function () 
	{
		console.log("Someone left " + socket.id);
		io.emit("disconnect",socket.id);
  	});

	socket.on("bullet", function(data)
	{
		console.log(data);
		socket.broadcast.emit("bullet",data);
	});
}






