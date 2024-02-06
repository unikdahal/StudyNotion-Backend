require("dotenv").config();
const connectDB = require("./db/index.js");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB CONNECTED FAILED !!!", err);
  });
