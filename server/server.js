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
        console.log(message);
    });

    socket.on("disconnect", () => {
        console.log("user disconnect");
    });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});