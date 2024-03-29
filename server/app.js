const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");
const morgan = require("morgan");
const fs = require('fs');
const socketIo = require("socket.io");
const http = require("http");

require("./db/conn");
const port = 8009;
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server); // Initialize Socket.io

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// app.use(fileupload({
//     useTempFiles: true,
//     tempFileDir: "D:/Projects/CCMP/server/uploads",
// }));
const userRoute = require("./routes/userRoute");
const creditsFormRoute = require("./routes/creditsFormRoute");
const creditsRoute = require("./routes/creditsRoute");
const sellCreditsRoute = require("./routes/sellCreditsRoute");
const bidsRoute = require("./routes/bidsRoute");
const notificationRoute = require("./routes/notificationRoute");

app.use(userRoute);
app.use(creditsFormRoute);
app.use(creditsRoute);
app.use(sellCreditsRoute);
app.use(bidsRoute);
app.use(notificationRoute);


server.listen(port, ()=>{
    console.log(`server start at port no: ${port}`);
})