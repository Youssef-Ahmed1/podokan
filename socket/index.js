const express = require("express");
const cors = require("cors");
const app = express();
// const http = require("http");
// const socketIO = require("socket.io");
// const server = http.createServer(app);
// const io = socketIO(server);

app.use(cors());

require("dotenv").config({
  path: "./.env",
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world from server!");
});

// let users = [];

// const addUser = (userId, socketId) => {
//   !users.some((user) => user.userId === userId) &&
//     users.push({ userId, socketId });
// };

// const removeUser = (socketId) => {
//   users = users.filter((user) => user.socketId !== socketId);
// };

// const getUser = (receiverId) => {
//   return users.find((user) => user.userId === receiverId);
// };

// // Define a message object with a seen property
// const createMessage = ({ senderId, receiverId, text, images }) => ({
//   senderId,
//   receiverId,
//   text,
//   images,
//   seen: false,
// });

// io.on("connection", (socket) => {
//   console.log(`a user is connected`);

//   socket.on("addUser", (userId) => {
//     addUser(userId, socket.id);
//     io.emit("getUsers", users);
//   });

//   const messages = {};

//   socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
//     const message = createMessage({ senderId, receiverId, text, images });

//     const user = getUser(receiverId);

//     if (!messages[receiverId]) {
//       messages[receiverId] = [message];
//     } else {
//       messages[receiverId].push(message);
//     }

//     io.to(user?.socketId).emit("getMessage", message);
//   });

//   socket.on("messageSeen", ({ senderId, receiverId, messageId }) => {
//     const user = getUser(senderId);

//     if (messages[senderId]) {
//       const message = messages[senderId].find(
//         (message) =>
//           message.receiverId === receiverId && message.id === messageId
//       );
//       if (message) {
//         message.seen = true;

//         io.to(user?.socketId).emit("messageSeen", {
//           senderId,
//           receiverId,
//           messageId,
//         });
//       }
//     }
//   });

//   socket.on("updateLastMessage", ({ lastMessage, lastMessagesId }) => {
//     io.emit("getLastMessage", {
//       lastMessage,
////       lastMessage,
//       lastMessagesId,
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log(`a user disconnected!`);
//     removeUser(socket.id);
//     io.emit("getUsers", users);
//   });
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});