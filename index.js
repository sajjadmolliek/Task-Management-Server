const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5009;

// middleWare
app.use(
  cors({
    origin: [
      "https://task-management-44525.web.app",
      "https://task-management-44525.firebaseapp.com",
      'http://localhost:5173'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.Token;
    //Token As a middleware;
    if (!token) {
      return res.status(401).send({ massage: "unAuthorize" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        // Token verification failed
        return res.status(401).send({ massage: "unAuthorize" });
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.log("I am Under Verify", err);
  }
};

// MongoDB COde:

const uri = `mongodb+srv://${process.env.DB_U_NAME}:${process.env.DB_PASS}@cluster0.rsgizg7.mongodb.net/?retryWrites=true&w=majority`;

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
    // Database For Add Product in the cart
    const AddTask = client.db("AddTaskDB").collection("TaskData");
   

    // --------------------------------AddProductCollection Data Collection Server--------------------------------------

    // Auth Related Access Token
    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h",
        });
        // const age = 1000;
        res
          .cookie("Token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true: false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ Success: "Cookies Set Successfully" });
      } catch (error) {
        console.log("Error Post Jwt Token :", error);
      }
    });

    // Remove Token
    app.post("/logout-jwt", async (req, res) => {
      try {
        res
          .clearCookie("Token", { 
            maxAge: 0,
            secure: process.env.NODE_ENV === "production" ? true: false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ Success: "Cookies Removed Successfully" });
      } catch (error) {
        console.log("Error Post logOut-Jwt Token:", error);
      }
    });

    // <-------------------------------General Working API----------------------------------->

    // Assignment Posting By AddAssignment Route
    app.post("/AddAssignment", async (req, res) => {
      try {
        const PostedAssignmentData = req.body;
        const result = await AddTask.insertOne(PostedAssignmentData);
        res.send(result);
      } catch (error) {
        console.log("Assignment Posting By AddAssignment Route:", error);
      }
    });

    //  All Posting Assignment Get in AllAssignment Route
    app.get("/AddAssignment", async (req, res) => {
      try {
        const result = await AddTask.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(
          "All Posting Assignment Get By AllAssignment Route:",
          error
        );
      }
    });

    // AddAssignmentCount is for counting product
    app.get("/AddAssignmentCount", async (req, res) => {
      try {
        const count = await AddTask.estimatedDocumentCount();
        res.send({ count });
      } catch (err) {
        console.log("AddAssignmentCount is for counting product API", err);
      }
    });

    //  All Posting Assignment Get By Query AllAssignment Route
    app.get("/AddAssignmentQuery", async (req, res) => {
      try {
        const data = req.query.level;
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        const sizeNeedToSkip = (page - 1) * size;

        if (data === "All") {
          const result = await AddTask.find().skip(sizeNeedToSkip).limit(size).toArray();
          res.send(result);
        } else {
          const query = {
            level: data,
          };
          const result = await AddTask.find(query).skip(sizeNeedToSkip).limit(size).toArray();
          res.send(result);
        }
      } catch (error) {
        console.log(
          "All Posting Assignment Get By AllAssignment Route:",
          error
        );
      }
    });

    //  Find Posting Assignment By id to see Details at Details Route
    app.get("/details/:id",verifyToken, async (req, res) => {
      try {
        const id = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await AddTask.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(
          "Find Posting Assignment By id to see Details at Details Route:",
          error
        );
      }
    });

    // update Assignment By id in Update Route
    app.patch("/details/:id",verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body;
        const query = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            PostedUser: data.PostedUser,
            Tittle: data.Tittle,
            level: data.level,
            Marks: data.Marks,
            Date: data.Date,
            description: data.description,
            photo: data.photo,
            startDate: data.startDate,
          },
        };
        const result = await AddTask.updateOne(query, updateDoc, options);
        res.send(result);
      } catch (error) {
        console.log("update Assignment By id in Update Route Route:", error);
      }
    });

    // Delete Assignment By id which is pass by body in AssignmentCard Route
    app.delete("/delete/:id",verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await AddTask.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(
          "Delete Assignment By id which is pass by body in AssignmentCard Route:",
          error
        );
      }
    });





    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello I am Build as a REST API For Task Management ");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
