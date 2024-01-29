const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const cors = require("cors");

const app = express();
app.use(cors({origin: "*"}));

const server = createServer(app);

const port = 3001;

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
});

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.emit(`your room id: ${crypto.randomUUID()}`);

    socket.on("message", (message) => {
        if (typeof message === 'object') {
            if (message.hasOwnProperty("op")) {
                if (message["op"] === 2) {
                    socket.to(message["rid"]).emit(message["proof"]);
                }
                else if (message["op" === 3]) {
                    socket.to(message["rid"]).emit(message["content"]);
                }
            }
        }
    });

    socket.on("create room", () => {
        const rid = crypto.randomUUID();

        socket.rooms.add(rid);
        return rid;
    });

    socket.on("join room", (rid) => {
        socket.rooms.add(rid);

        socket.to(rid).emit("message", {
            op: 3,
            content: `${socket.id} joined to room!`
        });
    });

    socket.on("disconnect", () => {
        console.log("user disconnect");
    });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});