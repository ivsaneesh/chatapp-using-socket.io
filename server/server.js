const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require("cors");
const bodyParser = require('body-parser');


const app = express();
app.use(cors());

// Middleware setup
app.use(bodyParser.json());


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});



const chatRooms = {}; // Store the chat rooms and their members


io.on('connection', (socket) => {
    let currentRoom = null; // Track the current room for each connected socket
    let username = '';

    socket.on('create_user', (userData) => {
        username = userData;
    });

    socket.on('join_room', async (roomData) => {
        if (currentRoom) {
            socket.leave(currentRoom);
        }
        // Join the requested room
        socket.join(roomData.room);
        currentRoom = roomData.room;
        username = roomData.username;
        console.log(`User with ID: ${socket.id} joined room: ${currentRoom}`);

        // Create the room if it doesn't exist
        if (!chatRooms.hasOwnProperty(roomData.room)) {
            let roomName = roomData.room;
            chatRooms[roomData.room] = {
                members: [username],
                unreadCount: { [username]: 0 },
                messages: [],
            };
        } else {
            if (!chatRooms[roomData.room].members.includes(username)) {
                chatRooms[roomData.room].members.push(username);
            }
        }
        io.emit('chat_rooms', chatRooms);

        Object.keys(chatRooms).forEach((r) => {
            if (r !== roomData.room) {
                io.to(socket.id).emit('unread_message_count', {
                    room: r,
                    username: username,
                    count: chatRooms[r].unreadCount[username]
                });
            }
        });
    });

    socket.on('get_chat_rooms', async () => {
        // Broadcast the message to member
        io.emit('receive_chat_rooms', chatRooms);
    });

    // Listen for room switching
    socket.on('switch_room', (roomData) => {
        Object.keys(chatRooms).forEach((r) => {
            if (r != roomData.room) {
                io.to(socket.id).emit('unread_message_count', {
                    room: r,
                    username: username,
                    count: chatRooms[r].unreadCount[username]
                });
            }
            else {
                // update the count and emit
                chatRooms[r].unreadCount[username] = 0;
                io.to(socket.id).emit('clear_message_count', {
                    room: r,
                    username: username,
                    count: 0
                })
            }
        });
        socket.emit('chat_history', chatRooms[roomData.room].messages);
    });

    socket.on('send_message', (messageObj) => {
        // Store the message in the current room
        chatRooms[messageObj.room].messages.push(messageObj);

        // Broadcast the message to all members in the room
        io.to(currentRoom).emit('receive_message', messageObj);

        // Store unread messages for users in different rooms
        chatRooms[messageObj.room].members.forEach((element) => {
            if (element == messageObj.author) {
                let unreadCount = chatRooms[messageObj.room].unreadCount[messageObj.author];
                unreadCount += 1;
                chatRooms[messageObj.room].unreadCount[messageObj.author] = unreadCount;

                io.emit('unread_message_count', {
                    room: messageObj.room,
                    username: messageObj.author,
                    count: chatRooms[messageObj.room].unreadCount[messageObj.author]
                });
            }
        });
    });


    socket.on('disconnect', () => {
        console.log("User Disconnected", socket.id);
        // Remove the socket from the members list of the current room
        Object.keys(chatRooms).forEach((r) => {
            if (r && chatRooms.hasOwnProperty(r)) {
                chatRooms[r].members = chatRooms[r].members.filter((member) => member !== username);
                delete chatRooms[r].unreadCount[username];
            }
        });

    });
});


const port = 3001; // You can change the port number if needed

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});