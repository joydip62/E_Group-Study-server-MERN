const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(cookieParser());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
// app.use(cors());

app.use(
  cors({
    origin: [
      "https://online-group-study-react.surge.sh"
    ],
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: [
//       "https://online-group-study-react.surge.sh/",
//       "http://localhost:5173",
//     ],
//     credentials: true,
//   })
// );

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

    const assignmentSubmittedCollection = client
      .db("online-group-study")
      .collection("assignmentSubmittedCollection");

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
      // filtering
      // let queryObj = {};
      // const difficultyLevel = req.query.difficultyLevel;
      // if (difficultyLevel) {
      //   queryObj.difficultyLevel = difficultyLevel;
      // }

      // pagination
      // const page = Number(req.query.page);
      // const limit = Number(req.query.limit);

      // const skip = (page - 1) * limit;

      // const result = await assignmentCollection.find(queryObj).skip(skip).limit(limit).toArray();

      
      const result = await assignmentCollection.find().toArray();

      // count data
      // const total = await assignmentCollection.countDocuments();

      res.send(result);
      
      // const check = res.send({
      //   total,
      //   result
      // });

      // console.log(check);
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

      const result = await assignmentCollection.updateOne(
        filter,
        updatedData,
        options
      );
      res.send(result);
    });

    // delete assignment
    app.delete("/delete/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // =====================

    //  all assignment
    app.get("/all-submitted-assignment", async (req, res) => {
      const result = await assignmentSubmittedCollection.find().toArray();
      res.send(result);
    });

    // single submitted assignment
    app.get("/all-submitted-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentSubmittedCollection.findOne(query);
      res.send(result);
    });

    // giving assignment mark
    app.put("/update-assignment-mark/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const options = { upsert: true };

      const filter = { _id: new ObjectId(id) };

      const updatedData = {
        $set: {
          obtainMarks: data.obtainMarks,
          feedback: data.feedback,
          status: data.status,
        },
      };

      const result = await assignmentSubmittedCollection.updateOne(
        filter,
        updatedData,
        options
      );
      res.send(result);
    });


    //  my assignment
    app.get("/my-assignment", async (req, res) => {
      const result = await assignmentSubmittedCollection.find().toArray();
      res.send(result);
    });

    // submitted assignment
    app.post("/submit/assignment", async (req, res) => {
      const assignments = req.body;
      const result = await assignmentSubmittedCollection.insertOne(assignments);
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
