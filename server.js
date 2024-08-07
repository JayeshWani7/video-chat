// // this code is working fine
// const express = require("express");
// const app = express();
// const server = require("http").Server(app);
// const { v4: uuidv4 } = require("uuid");
// const io = require("socket.io")(server, {
//   cors: {
//     origin: '*'
//   }
// });
// const { ExpressPeerServer } = require("peer");
// const opinions = { debug: true };

// app.set("view engine", "ejs");

// app.use("/peerjs", ExpressPeerServer(server, opinions));
// app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

// io.on("connection", (socket) => {
//   socket.on("join-room", (roomId, userId, userName) => {
//     socket.join(roomId);
//     setTimeout(() => {
//       socket.to(roomId).emit("user-connected", userId);
//     }, 1000);

//     socket.on("message", (message) => {
//       io.to(roomId).emit("createMessage", message, userName);
//     });

//     socket.on("disconnect", () => {
//       socket.to(roomId).emit("user-disconnected", userId);
//     });
//   });
// });

// server.listen(process.env.PORT || 3030);


const express = require("express");
require("dotenv").config();
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const { sendMeetingDetails } = require("./services/emailservice");

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
  debug: true,
});

// Setup database (SQLite)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

const Room = sequelize.define("Room", {
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Sync the database
sequelize
  .sync()
  .then(() => {
    console.log("Connected to SQLite");
  })
  .catch((err) => {
    console.error("Failed to connect to SQLite", err);
  });

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// PeerJS server
const opinions = {
  debug: true,
};
app.use("/peerjs", ExpressPeerServer(server, opinions));

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/create", (req, res) => {
  res.render("createRoom");
});

app.post("/create", async (req, res) => {
  const roomId = uuidv4();
  const password = req.body.password;
  const studentEmails = req.body.studentEmails.split(",");

  try {
    await Room.create({ roomId: roomId, password: password });
    studentEmails.forEach((email) => {
      sendMeetingDetails(email.trim(), roomId, password);
    });
    res.redirect(`/${roomId}`);
  } catch (err) {
    console.log(err);
    res.redirect("/create");
  }
});

app.get("/join", (req, res) => {
  res.render("joinRoom");
});

app.post("/join", async (req, res) => {
  const roomId = req.body.roomId;
  const password = req.body.password;
  try {
    const foundRoom = await Room.findOne({
      where: { roomId: roomId, password: password },
    });
    if (foundRoom) {
      res.redirect(`/${roomId}`);
    } else {
      res.redirect("/join");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/join");
  }
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    socket.to(roomId).emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// Start the server
server.listen(process.env.PORT || 3030, () => {
  console.log(`Server is running on port ${process.env.PORT || 3030}`);
});
