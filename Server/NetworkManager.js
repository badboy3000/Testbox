/**
 * Created by Matt on 12/12/2016.
 */
var Player = require('./Player');
var Utility = require('./Utility/Utility');
var CreateFunction = Utility.CreateFunction;

function NetworkManager(serverLogic) {
    this.serverLogic = serverLogic;
    this.onlinePlayers = [];
    this.currentPlayerID = 0;

    var WebSocketServer = require('ws').Server;
    this.websocketServer = new WebSocketServer({ port: 7777 });

    console.log("Started server on port 7777");

    this.websocketServer.on('connection', CreateFunction(this, function connection(ws) {
        var player = new Player(ws);
        player.id = this.currentPlayerID;
        this.currentPlayerID++;
        this.onlinePlayers.push(player);
        console.log("Player connected "+ this.currentPlayerID);
        console.log("Players online: " + this.onlinePlayers.length);

        ws.on('message', CreateFunction(this, function(messageString) {
            var message = null;
            try {
                message = JSON.parse(messageString);
            } catch (err) {
                console.log("JSON Parsing error: " + messageString);
                return;
            }
            var messageTitle = message['message'];
            switch(messageTitle) {
                case "Chat" : {
                    this.sendToAll({message: 'Chat', text: player.nickname + ": " + message['text']});
                } break;
                case "Nickname" : {
                    player.nickname = message['name'];
                } break;
            }
            //console.log('received: %s', message);
        }));

        ws.on('close', CreateFunction(this, () => {
            this.onlinePlayers.splice(this.onlinePlayers.indexOf(player), 1);
            console.log("Player disconnected "+ this.currentPlayerID);
            console.log("Players online: " + this.onlinePlayers.length);
        }));

        //ws.send('something');
    }));
}

NetworkManager.prototype.sendToAll = function(object) {
    var sendString = JSON.stringify(object);
    for (var i = 0; i < this.onlinePlayers.length; i++) {
        var player = this.onlinePlayers[i];
        player.connection.send(sendString);
    }
};
NetworkManager.prototype.sendToPlayer = function(player, object) {
    player.connection.send(JSON.stringify(object));
};

module.exports = NetworkManager;