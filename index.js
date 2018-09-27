const signalR = require('@aspnet/signalr');
const config = require('./app.config');
const mongoose = require('mongoose');
const EntreBotModel = require('./github.schema');
const axios = require('axios');

XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
WebSocket = require('websocket').w3cwebsocket;

mongoose.connect(config.MONGODB_URL);

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://13.233.42.222/connect/chat")
  .configureLogging(signalR.LogLevel.Information)
  .build();

connection.start()
  .then(() => {
    console.log("Connection to hub started");
    connection.invoke("sendToAllconnid", "entre.bot@gmail.com")
      .then(console.log("BOT IS NOW ONLINE!"))
      .catch(err => console.error(err.toString()))
    connection.invoke("sendAllUserChannel", "entre.bot@gmail.com")
      .then(console.log("Requested for the list of channels where bot is installed"))
      .catch(err => console.error(err.toString()));
  })
  .catch(err => console.error(err.toString()));

connection.on("SendToAllconnid", (activeusers) => {
});

connection.on("ReceiveUserChannels", (listofUserChannels, emailId) => {

  if (emailId == "entre.bot@gmail.com") {
    console.log(listofUserChannels);
    listofUserChannels.forEach(channelId => {
      connection.invoke('joinChannel', channelId)
        .catch(err => console.log(err));
    });
  }


});

connection.on("SendMessageInChannel", (user, message) => {
  console.log(user);
  if (message.messageBody.startsWith('/connect')) {

    console.log("Connection Attempted")

    EntreBotModel.find({}).then(map => {
      console.log("Finding entry inside DB!");
      console.log(map);
      flag = 0;
      if (map.length != 0) {
        console.log("Found something inside DB")
        map.forEach(obj => {
          if (obj.channelId1 == message.channelId) {
            console.log("Found existing in DB!")
            var message1 = {
              messageBody: "You have already registered for the token!!! Here's the token - " + obj._id,
              timestamp: new Date().toISOString(),
              isStarred: true,
              channelId: message.channelId,
              sender: {
                id: "101010101010101010101111",
                emailId: "entre.bot@gmail.com",
                firstName: "Bot",
                lastName: "User",
                userId: "60681125-e117-4bb2-9287-eb840c4cg672"
              }
            }

            flag = 1;
            var workspacename;
            axios.get('http://13.233.42.222/connect/api/chat/workspaces/workspacename/' + message.channelId)
            //axios.get('http://172.23.238.206:7001/connect/api/chat/workspaces/workspacename/' + message.channelId)
              .then(response => {
                console.log("Getting workspace name");
                workspacename = response.data;
                console.log(workspacename);
                connection.invoke("sendMessageInChannel", "entre.bot@gmail.com", message1, message.channelId, workspacename)
                  .then(console.log("Hub Method Invoked"))
                  .catch(err => console.error(err.toString()));
              })
              .catch(error => {
                console.log(error);
              });


          }
        });
      }

      if (map.length == 0 || flag == 0) {

        console.log("Found nothing inside DB");

        const channelMapping = new EntreBotModel({
          channelId1: message.channelId,
          channelId2: null
        });
        channelMapping.save().then(function (channelMapping) {
          var token = "";

          EntreBotModel.find({ channelId1: message.channelId }).then(map => {
            token = map[0]._id;
            console.log("Generated token");
            console.log(token);

            toSendMessage = {
              messageBody: "Here's your token " + token + " . Please share it with the user you want to talk to :)",
              timestamp: new Date().toISOString(),
              isStarred: true,
              channelId: message.channelId,
              sender: {
                id: "101010101010101010101111",
                emailId: "entre.bot@gmail.com",
                firstName: "Bot",
                lastName: "User",
                userId: "60681125-e117-4bb2-9287-eb840c4cg672"
              }
            }
            var workspacename;
            axios.get('http://172.23.238.206:7001/connect/api/chat/workspaces/workspacename/' + message.channelId)
              .then(response => {
                console.log("Getting workspace name");
                workspacename = response.data;
                console.log(workspacename);
                console.log("Sent Message");
                connection.invoke("sendMessageInChannel", "entre.bot@gmail.com", toSendMessage, message.channelId, workspacename)
                  .then(console.log(toSendMessage.messageBody))
                  .catch(err => console.error(err.toString()));
              })
              .catch(error => {
                console.log(error);
              });

          });
        });
      }
    })
  }

  if (message.messageBody.startsWith('/join')) {
    console.log("Token extracted");
    console.log(message.messageBody.split(" ")[1]);
    EntreBotModel.find({ _id: message.messageBody.split(" ")[1] }).then(map => {
      EntreBotModel.findByIdAndUpdate(map[0]._id, {
        channelId1: map[0].channelId1,
        channelId2: message.channelId
      }, { new: true }).then(response => {
        console.log("DB Updated");
        console.log(response);
        toSendMessage = {
          messageBody: "Interworkspace connection successfull!",
          timestamp: new Date().toISOString(),
          isStarred: true,
          channelId: message.channelId,
          sender: {
            id: "101010101010101010101111",
            emailId: "entre.bot@gmail.com",
            firstName: "Bot",
            lastName: "User",
            userId: "60681125-e117-4bb2-9287-eb840c4cg672"
          }
        }
        var workspacename;
        axios.get('http://172.23.238.206:7001/connect/api/chat/workspaces/workspacename/' + message.channelId)
          .then(response => {
            console.log("Getting workspace name");
            workspacename = response.data;
            console.log(workspacename);
            console.log("Sent Message");
            connection.invoke("sendMessageInChannel", "entre.bot@gmail.com", toSendMessage, message.channelId, workspacename)
              .then(console.log(toSendMessage.messageBody))
              .catch(err => console.error(err.toString()));
          })
          .catch(error => {
            console.log(error);
          });
      })
    });
  }

  if (message.messageBody.startsWith('/send')) {
    console.log(message.channelId);
    EntreBotModel.find({ channelId1: message.channelId }).then(map => {
      console.log("Searching for channelid1");
      console.log(map);
      if (map.length != 0) {
        console.log("Found in channelid1");
        console.log(map);
        var toSendMessage1 = {
          messageBody: message.messageBody.split(" ")[1],
          timestamp: new Date().toISOString(),
          isStarred: true,
          channelId: map[0].channelId2,
          sender: {
            id: "101010101010101010101111",
            emailId: "entre.bot@gmail.com",
            firstName: "Bot",
            lastName: "User",
            userId: "60681125-e117-4bb2-9287-eb840c4cg672"
          }
        }
        axios.get('http://172.23.238.206:7001/connect/api/chat/workspaces/workspacename/' + map[0].channelId2)
          .then(response => {
            console.log("Getting workspace name");
            workspacename = response.data;
            console.log(workspacename);
            console.log("Sent Message");
            connection.invoke("sendMessageInChannel", 'entre.bot@gmail.com', toSendMessage1, map[0].channelId2, workspacename)
              .then(console.log(toSendMessage1.messageBody))
              .catch(err => console.error(err.toString()));
          })
          .catch(error => {
            console.log(error);
          });

      }

    });

    EntreBotModel.find({ channelId2: message.channelId }).then(res => {
      console.log("Searching for channelid2");
      console.log(res);
      if (res.length != 0) {
        console.log("Found in channelid1");
        var toSendMessage2 = {
          messageBody: message.messageBody.slice(6),
          timestamp: new Date().toISOString(),
          isStarred: true,
          channelId: res[0].channelId1,
          sender: {
            id: "101010101010101010101111",
            emailId: "entre.bot@gmail.com",
            firstName: "Bot",
            lastName: "User",
            userId: "60681125-e117-4bb2-9287-eb840c4cg672"
          }
        }
        axios.get('http://172.23.238.206:7001/connect/api/chat/workspaces/workspacename/' + res[0].channelId1)
          .then(response => {
            console.log("Getting workspace name");
            workspacename = response.data;
            console.log(workspacename);
            console.log("Sent Message");
            connection.invoke("sendMessageInChannel", 'entre.bot@gmail.com', toSendMessage2, res[0].channelId1, workspacename)
              .then(console.log(toSendMessage2.messageBody))
              .catch(err => console.error(err.toString()));
          })
          .catch(error => {
            console.log(error);
          });
      }
    });
  }
});