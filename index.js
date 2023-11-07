const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(cookieParser());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// token middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Not authorized" });
    }
    // console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjahkzd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const assignmentCollection = client
      .db("online-group-study")
      .collection("assignmentCollection");

    // json web token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
        })
        .send({ success: true });
    });
    // logout api
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    //   get all assignment
    app.get("/all/assignment", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });

    // insert assignment
    app.post("/create/assignment", async (req, res) => {
      const assignments = req.body;
      const result = await assignmentCollection.insertOne(assignments);
      res.send(result);
    });

    // single assignment
    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    // update assignment
    app.put("/update-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      
      const options = { upsert: true };

      const filter = { _id: new ObjectId(id) };

      

      const updatedData = {
        $set: {
          title: data.title,
          marks: data.marks,
          difficultyLevel: data.difficultyLevel,
          description: data.description,
          dueDate: data.dueDate,
          image: data.image,
        },
      };
      
      const result = await assignmentCollection.
      updateOne(filter, updatedData, options);
      res.send(result);
    });

    // delete assignment
    app.delete("/delete/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`App running port ${port}`);
});
