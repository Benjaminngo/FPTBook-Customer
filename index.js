const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const port = process.env.PORT || 3000;

const dbUrl = "mongodb+srv://owner:tjuZJwlqmYSAzPEI@atn.qyuce32.mongodb.net/?retryWrites=true&w=majority";

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbUrl, connectionParams)
  .then(() => {
    console.info("Connected to DB");
  })
  .catch((e) => {
    console.log("Error:", e);
  });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publicationYear: Number,
  category: String,
  content: String,
});

const Book = mongoose.model("Book", bookSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: "your-secret-key",
  resave: true,
  saveUninitialized: true,
}));

// Middleware để kiểm tra xem người dùng đã đăng nhập chưa
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.redirect("/dashboard");
    } else {
      res.status(401).send("Tên đăng nhập hoặc mật khẩu không đúng");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Lỗi máy chủ");
  }
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(400).send("Tên đăng nhập đã tồn tại");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(200).send("Đăng ký thành công. Đăng nhập để tiếp tục.");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Lỗi máy chủ");
  }
});


app.get("/get-recent-books", async (req, res) => {
  try {
      // Lấy 10 cuốn sách mới cập nhật
      const recentBooks = await Book.find({}).sort({ _id: -1 }).limit(10);
      res.status(200).json(recentBooks);
  } catch (error) {
      res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

app.get("/book/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/detailBook.html", (req, res) => {
  res.sendFile(__dirname + "/detailBook.html");
});

app.listen(port, () => {
  console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
});
