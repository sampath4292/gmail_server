const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://sampath4292:test123@cluster0.1xkqqoj.mongodb.net/emailServer?retryWrites=true&w=majority",
  )
  .then(() => {
    console.log("MongoDB Atlas connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
