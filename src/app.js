import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());

const databaseConfig = {
  user: "postgres",
  password: "123456",
  database: "mywallet_database",
  host: "localhost",
  port: 5432,
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

app.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const result = await connection.query(
      `INSERT INTO users (name, email, password)
          SELECT $1, $2, $3
          WHERE NOT EXISTS(
              SELECT 1 FROM users 
              WHERE users.email = $2
          )`,
      [name, email, hash]
    );
    if (result.rowCount === 0) {
      res.sendStatus(409);
    } else {
      res.sendStatus(201);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await connection.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email]
    );
    const user = result.rows[0]
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = uuid();
        await connection.query(`INSERT INTO sessions ("userId", token)
        VALUES ($1, $2)`, [user.id, token])
        res.send(token);
    } else {
      res.sendStatus(403);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/records", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) return res.sendStatus(401);
    const token = authorization.replace("Bearer ", "");
    const result = await connection.query(
      `
        SELECT 
        jsonb_build_object('userId', records."userId", 'date', records.date, 'description', records."description", 'value', records."value") AS records,
        jsonb_build_object('name', users."name") AS name
        FROM sessions
        LEFT JOIN records
        ON sessions."userId" = records."userId"
        JOIN users
        ON sessions."userId" = users.id
        WHERE sessions.token = $1
        ORDER BY records.date DESC
      `,
      [token]
    );
    const resultReady = {records: result.rows.map((r) => r.records), name: result.rows[0].name.name}
    res.send(resultReady);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/records", async (req, res) => {
    try{
        const authorization = req.headers["authorization"];
        if (!authorization) return res.sendStatus(401);
        const token = authorization.replace("Bearer ", "");
        const { value, description } = req.body;
        const result = await connection.query(
          `
          INSERT INTO records ("userId", date, description, value)
          SELECT (SELECT sessions."userId" from sessions WHERE token = $3),CURRENT_TIMESTAMP,$1,$2
          WHERE EXISTS(
              SELECT 1 FROM sessions
              WHERE token = $3
          )
        `,
          [description, value, token]
        );
        res.send(result.rows);
    } catch(e){
        console.log(e)
        res.sendStatus(500)
    }
});

app.post("/logout", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) return res.sendStatus(401);
    const token = authorization.replace("Bearer ", "");
    await connection.query(
      `
        DELETE FROM sessions 
        WHERE token = $1
        `,
      [token]
    );
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/teste", (req, res) => {
    res.sendStatus(200)
})

export default app;
