const express = require("express");
const app = express();
const hbs = require("hbs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const alert = require("alert-node");
const sessions = require("express-session");
const { cookie } = require("express/lib/response");
const cookieParser = require("cookie-parser");
const async = require("hbs/lib/async");

app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(
  sessions({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60000,
    },
  })
);

mongoose
  .connect(
    `mongodb+srv://admin:admin@attentaker.n2tew.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error: ", err.message);
  });

var session;

//creating a scheme for registration
const registrationScheme = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  college_id: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

//creating a scheme for classes
const classScheme = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  class_id: {
    type: String,
    required: true,
  },
  class_name: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
});

const RegisterClass = mongoose.model("RegisterClass", classScheme);
const Registration = mongoose.model("Registration", registrationScheme);

app.get("/", (req, res) => {
  res.render("login", {
    title: "Attentaker",
  });
});

app.get("/attendance", (req, res) => {
  if (req.session.user) {
    //getting info from database
    res.render("attendance", {
      title: "Attendance",
      username: req.session.username,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/classes", (req, res) => {
  if (req.session.user) {
    res.render("classes", {
      title: "Classes",
      username: req.session.username,
    });
  } else {
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  //hashing the password
  const passwordhash = bcrypt.hashSync(req.body.password, 10);
  //saving the entries into mongoDB
  const newRegistration = new Registration({
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    college_id: req.body.college_id,
    password: passwordhash,
  });
  newRegistration.save().then((result) => {
    console.log(result);
    alert("Registration Successful");
    res.redirect("/");
  });
});

app.post("/login", (req, res) => {
  //checking if the user exists
  Registration.findOne({ email: req.body.email }).then((result) => {
    var data = result;
    //if the user exists
    if (result) {
      bcrypt.compare(req.body.password, result.password, (err, result) => {
        if (result) {
          session = req.session;
          session.user = result;
          session.email = req.body.email;
          session.username = data.username;
          res.redirect("/attendance");
        } else {
          alert("Wrong Password");
          res.redirect("/");
        }
      });
    } else {
      alert("User does not exist");
      res.redirect("/");
    }
  });
});

app.post("/addClasses", (req, res) => {
  const newClass = new RegisterClass({
    email: session.email,
    class_id: req.body.class_id,
    class_name: req.body.class_name,
    batch: req.body.batch,
    subject: req.body.subject,
    section: req.body.section,
  });
  newClass.save().then((result) => {
    console.log(result);
    alert("Class Added");
    res.redirect("/classes");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
