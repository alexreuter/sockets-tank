var express = require('express');
var app = express();

app.use(express.static('public'));

var server = app.listen(3000);
console.log("Server is working")

// var socket = require("socket.io");

// var io = socket(server);

// io.sockets.on("connection", newConnection);

// function newConnection(socket)
// {
// 	console.log("New connection: " + socket.id);
// }

// 	socket.on("msg", message);

// 	function message(data)
// 	{
// 		console.log(data);
// 		socket.broadcast.emit("msg", data);
// 		// console.log("sent");
// 	}
// }