const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: String,
  msg: String,
  time: String,
  room: String,
});

const Message=mongoose.model("Message",messageSchema);
module.exports=Message;