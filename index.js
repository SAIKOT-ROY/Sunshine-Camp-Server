const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());

// MONGODB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndhwlcd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classCollection = client.db("courses").collection("classes")
    const userCollection = client.db("courses").collection("users")
    const selectedClassCollection = client.db("courses").collection("selectedClass")

    // saving user
    app.put("/users/:email", async (req, res) => {
        const email = req.params.email
        const user = req.body
        const query = {email: email}
        const options = {upsert: true}
        const updateDoc = {
          $set: user,
        }
        const result = await userCollection.updateOne(query, updateDoc, options)
        // console.log(result);
        res.send(result)
    })
    // get user
    app.get("/users", async (req, res) => {
        const cursor = userCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    // get user by email
    app.get("/users/:email", async (req, res) => {
        const email = req.params.email
        const query = {email: email}
        const result = await userCollection.findOne(query)
        console.log(result);
        res.send(result)
    })

    // Set role of user
    app.patch("/users/:email", async(req, res) => {
        const email = req.params.email;
        const {role} = req.body;
        const query = {email: email}
        const update = {
          $set : {role: role}
        };
        const result = await userCollection.updateOne(query, update)
        res.send(result)
    })


    // get class 
    app.get("/classes", async (req, res) => {
        const cursor = classCollection.find().sort({number_of_students: -1});
        const result = await cursor.toArray()
        res.send(result)
    })

    app.post("/selectedClass", async (req, res) => {
        const selectedClasses = req.body;
        // console.log(selectedClasses);
        const result = await selectedClassCollection.insertOne(selectedClasses);
        res.send({result});
    })

    app.get("/selectedClass", async(req, res) => {
        const result = await selectedClassCollection.find().toArray();
        res.send(result);
    })

    // app.get("/selectedClass/:id", async(req,res) => {
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)};
    //     const result = await selectedClassCollection.findOne(query);
    //     res.send(result);
    // })

    app.delete("/selectedClass/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await selectedClassCollection.deleteOne(query);
        res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('school coltese')
})

app.listen(port, () => {
    console.log(`Summer School colse bacca ra bose poro`);
})