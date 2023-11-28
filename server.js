const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();
dotenv.config(); //this will make env file reachable

const port = process.env.PORT || 3000;
const pg = new Pool({
  connectionString: process.env.DB_STRING,
  ssl: {
    rejectUnauthorized: false, // Ignore SSL certificate validation (for testing only)
  },
});
// const pool = new Pool({
//     user: 'postgres',
//     host: 'postgres://localhost/pg',
//     database: 'Industry',
//     password: 'example',
//     port: 5432,
//     });
pg.connect();

app.use(express.json());
app.use(cors());
app.use(require("body-parser").urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("hello world");
});
app.post("/createTicket", (req, res) => {
  let data = req.body;
  console.log(data);
  let userFound = false;
  const query = `SELECT username,password,isadmin FROM users`;
  pg.query(query).then((result) => {
    for (let obj of result.rows) {
      if (obj.username == data.username) {
        console.log(obj);
        bcrypt.compare(data.password, obj.password).then(function (result) {
          if (result) {
            pg.query(`INSERT INTO ticket (price,datereceived,name,phonenum,type,dateextimated,status,username) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [
                data.price,
                data.datereceived,
                data.name,
                data.phonenum,
                data.type,
                data.dateextimated,
                data.status,
                data.username
            ]).then((ticketResult) => {
              res.send("good");
            });
          } else res.status(400).send("Username or password not valid");
        });
        userFound = true;
        break;
      }
    }
    if (!userFound) res.status(400).send("Username or password not valid");
  });
});
app.post("/ticket", (req, res) => {
  let userFound = false;
  let data = req.body;
  const query = `SELECT username,password,isadmin FROM users`;
  pg.query(query).then((result) => {
    for (let obj of result.rows) {
      if (obj.username == data.username) {
        bcrypt.compare(data.password, obj.password).then(function (result) {
          if (result) {
            if (obj.isadmin) {
              pg.query(`SELECT * FROM ticket`).then((ticketResult) => {
                console.log(ticketResult);
                res.send(ticketResult.rows);
              });
            } else {
              pg.query(`Select * FROM ticket WHERE username = $1`, [
                data.username,
              ]).then((ticketResult) => {
                console.log("ggg");
                res.send(ticketResult.rows);
              });
            }
          } else res.status(400).send("Username or password not valid");
        });
        userFound = true;
        break;
      }
    }
    if (!userFound) res.status(400).send("Username or password not valid");
  });
});
app.post("/register", (req, res) => {
  let data = req.body;
  console.log(data);
  const query = `SELECT username FROM users`;
  pg.query(query).then((result) => {
    for (let obj of result.rows) {
      if (obj.username == data.username) {
        res.status(400).send("Username already exists");
        return;
      }
    }
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(data.password, process.env.SALT, function (err, hash) {
        const insertQuery = `INSERT INTO users (username,password,isadmin,firstname,lastname,email,dob,gender,phonenum,address,securityquestion,securityanswer,cvv,bankcard) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
        pg.query(insertQuery, [
          data.username,
          hash,
          data.isAdmin,
          data.firstName,
          data.lastName,
          data.email,
          data.dOB,
          data.gender,
          data.phoneNum,
          data.address,
          data.securityQuestion,
          data.securityAnswer,
          data.cvv,
          data.bankCard,
        ]).then((result) => {
          res.send("Success");
        });
      });
    });
  });
});

app.get("/login", (req, res) => {
  let data = req.query;
  let userFound = false;
  const query = `SELECT username,password,isadmin FROM users`;
  pg.query(query).then((result) => {
    for (let obj of result.rows) {
      if (obj.username == data.username) {
        bcrypt.compare(data.password, obj.password).then(function (result) {
          if (result) {
            if (obj.isadmin) res.send("admin");
            else res.send("client");
          } else res.status(401).send("Username or password is incorrect");
        });
        userFound = true;
        break;
      }
    }
    if (!userFound) res.status(401).send("Username or password is incorrect");
  });
});

app.listen(port, () => {
  console.log("Listening to the port " + port);
});
