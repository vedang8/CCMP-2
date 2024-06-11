const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const http = require("http");

require("./db/conn");
const port = 8009;
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow requests from this origin
        methods: ["GET", "POST"]
    }
}); // Initialize Socket.io

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const userRoute = require("./routes/userRoute");
const creditsFormRoute = require("./routes/creditsFormRoute");
const creditsRoute = require("./routes/creditsRoute");
const sellCreditsRoute = require("./routes/sellCreditsRoute");
const bidsRoute = require("./routes/bidsRoute");
const notificationRoute = require("./routes/notificationRoute")(io);

app.use(userRoute);
app.use(creditsFormRoute);
app.use(creditsRoute);
app.use(sellCreditsRoute);
app.use(bidsRoute);
app.use(notificationRoute);

// deployment config
const path = require("path");
__dirname = path.resolve();
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "/client/build")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "client", "build", "index.html"));
    });
}

server.listen(port, ()=>{
    console.log(`server start at port no: ${port}`);
})