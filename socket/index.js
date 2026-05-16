const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

require("dotenv").config({
  path: "./.env",
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world from server!");
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
