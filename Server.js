const express = require('express');
const app = express();
const http = require('http')
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path = require('path')

const server = http.createServer(app);
const io = new Server(server);
const dotenv = require("dotenv");

dotenv.config();




app.use(express.static('build'))

// console.log(path.join(__dirname, 'build', 'index.html'))

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})


function getAllConnectedClients(roomId) {
    if (io.sockets.adapter.rooms.get(roomId) != null) {
        return Array.from(io.sockets.adapter.rooms.get(roomId)).map((socketId) => {
            return {
                socketId,
                user: userSocketMap[socketId],
            }
        })
    }

    return []


}

const userSocketMap = {};



io.on('connection', (socket) => {

    socket.on(ACTIONS.JOIN, ({ roomId, userId, username }) => {
        const rooms = io.sockets.adapter.rooms;
        const room = rooms.get(roomId);

        if (room == undefined) {
            socket.join(roomId)
            userSocketMap[socket.id] = { userId, username }
            const clients = getAllConnectedClients(roomId);
            io.to(socket.id).emit(ACTIONS.CREATED, { clients })
        }
        else if (room.size >= 5) {
            io.to(socket.id).emit('roomFull')
        }
        else {
            socket.join(roomId)
            userSocketMap[socket.id] = { userId, username }
            const clients = getAllConnectedClients(roomId);
            io.to(roomId).emit(ACTIONS.JOINED, { clients, socketId: socket.id })
        }
    })

    socket.on('ready', ({ roomId, userId }) => {
        console.log(socket.id)
        socket.to(roomId).emit('ready', { socketId: socket.id, userId })
    })

    socket.on('condiate', ({ condiate, socketId }) => {
        socket.to(socketId).emit('condiate', { condiate, socketId: socket.id })
    })

    socket.on('offer', ({ offer, socketId, userId }) => {
        socket.to(socketId).emit('offer', { offer, socketId: socket.id, userId })
    })

    socket.on('answer', ({ answer, socketId }) => {
        // console.log('answer')
        socket.to(socketId).emit('answer', { answer, socketId: socket.id })
    })


    // code change
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, {
            code
        })
    })

    // code -sync
    socket.on('code_sync', ({ socketId, code }) => {
        socket.to(socketId).emit(ACTIONS.CODE_CHANGE, {
            code
        })
    })

    const LeaveRoom = () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            if (userSocketMap[socket.id]) {
                socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id].username,
                    userId: userSocketMap[socket.id].userId
                })
            }
        })

        delete userSocketMap[socket.id]
        socket.leave();
        // console.log(rooms, 'leave room')
    }

    socket.on('disconnecting', LeaveRoom)
    socket.on('LeaveRoom', LeaveRoom)

})



const PORT = process.env.PORT || 5000;
// console.log(PORT)
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
