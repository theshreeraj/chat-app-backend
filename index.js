const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Match the frontend origin exactly
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies if needed
  },
});

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Chat Schema
const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

// Routes
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Chat.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).send("Error fetching messages");
  }
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", async (data) => {
    const newMessage = new Chat({
      username: data.username,
      message: data.message,
    });
    await newMessage.save();
    io.emit("receive_message", newMessage); // Broadcast to all users
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start Server
const PORT = 8080;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
