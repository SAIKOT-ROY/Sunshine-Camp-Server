const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
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

// validate jwt token

  //  const verifyJWT = (req, res, next) => {
  //     const authorization = req.headers.authorization
  //     // console.log(authorization);
  //     const token = authorization.split(' ')[1]
  //     // console.log(token);

  //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
  //       if(err){
  //         return res.status(401).send({error: true, message: 'Unauthorized access'})
  //       }
  //       req.decoded = decoded
  //       next()
  //     })
  //  } 

    //  const verifyAdmin = async(req, res, next) => {
    //     const email = req.decoded.email;
    //     const query = {email: email}
    //     const user = await userCollection.findOne(query);
    //     if(user?.role !== 'admin' ){
    //       return res.status(403).send({error: true, message: 'forbidden message'});
    //     }
    //     next();
    //  }



async function run() {
  try {
   // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const classCollection = client.db("courses").collection("classes")
    const userCollection = client.db("courses").collection("users")
    const selectedClassCollection = client.db("courses").collection("selectedClass")
    const enrolledClassCollection = client.db("courses").collection("enrolledClass")

    // jwt verify
    app.post('/jwt', async (req, res) => {
        const email = req.body
        const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '7d'
        })
        // console.log(token);
        // console.log(email);
        res.send({token})
    })


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
        // console.log(result);
        res.send(result)
    })

 // Set role of user
    app.patch("/users/:email", async(req, res) => {
        const email = req.params.email;
        console.log(email)
        const {role} = req.body;
        const query = {email: email}
        const update = {
          $set : {role: role}
        };
        const result = await userCollection.updateOne(query, update)
        console.log(result)
        res.send(result)
    })


  // get class 
    app.get("/classes", async (req, res) => {
        const cursor = classCollection.find().sort({number_of_students: -1});
        const result = await cursor.toArray()
        res.send(result)
    })

    // app.put("/selectedClass", async (req, res) => {
    //     const selectedClasses = req.body;
    //     // console.log(selectedClasses);
    //     const filter = {_id: selectedClasses._id}
    //     const update = {$set: selectedClasses}
    //     const options = {upsert : true}
    //     const result = await selectedClassCollection.updateOne(filter, update, options);
    //     res.send({result});
    // })

    app.put("/selectedClass/:id", async (req, res) => {
      const selectedClass = req.body;
      const id = req.params.id;
    
      const filter = { _id: new ObjectId(id) };
      const existingClass = await selectedClassCollection.findOne(filter);
  
      try{
        if (existingClass) {
          const update = { $set: selectedClass };
          const options = {upsert: true}
          const result = await selectedClassCollection.updateOne(filter, update, options);
          return  res.send({ result });
      
        } else {
          const newClass = { _id: new ObjectId(id), ...selectedClass };
          const result = await selectedClassCollection.insertOne(newClass);
          res.send({ result });
        }
      }
      catch(error){
        if (error.code === 11000) {
          res.status(400).send({ error: "Duplicate key error" });
        } else {
          res.status(500).send({ error: "Internal server error" });
        }
      }
    });
    

    app.get("/selectedClass", async(req, res) => {
        const result = await selectedClassCollection.find().toArray();
        res.send(result);
    })


    app.delete("/selectedClass/:id", async(req, res) => {
        const id = req.params.id;
        // console.log(id)
        const query = {_id: new ObjectId(id)};
        const result = await selectedClassCollection.deleteOne(query);
        res.send(result);
    })


  // for payment history
    app.get('/dashboard/enrolled', async(req, res) => {
        const result = await enrolledClassCollection.find().sort({date: -1}).toArray();
        res.send(result);
    })

  // for delete or insert 
    // app.put('/dashboard/enrolled/:id', async(req, res) => {
    //     const id = req.params.id
    //     const completePayment = req.body;
    //     const result = await enrolledClassCollection.insertOne(completePayment);

        
    //     const query = {_id: new ObjectId(id)};
    //     const deleteResult = await selectedClassCollection.deleteOne(query)

    //     const updateQuery = { _id: id };
    //     const update = {$inc: {available_seats: - 1} };
    //     console.log(update)
    //     const updatedResult = await enrolledClassCollection.updateOne(updateQuery, update);
        
    //     res.send({result, deleteResult, updatedResult})
    //     console.log(updatedResult)
    // })

    app.put('/dashboard/enrolled/:id', async (req, res) => {
      const id = req.params.id;
      const completePayment = req.body;
      const result = await enrolledClassCollection.insertOne(completePayment);
  
      const query = { _id: new ObjectId(id) };
      const deleteResult = await selectedClassCollection.deleteOne(query);
  
      const updateQueryEnrolled = { _id: id };
      const updateEnrolled = { $inc: { available_seats: -1 } };
      const updatedResultEnrolled = await enrolledClassCollection.updateOne(updateQueryEnrolled, updateEnrolled);
  
      const updateQueryClass = { _id: new ObjectId(id) };
      const updateClass = { $inc: { available_seats: 1 } };
      const updatedResultClass = await classCollection.updateOne(updateQueryClass, updateClass);
  
      res.send({ result, deleteResult, updatedResultEnrolled, updatedResultClass });
  });
  


  // instructor add class
    app.post("/dashboard/addClass", async (req, res) => {
        const addNewClass = req.body;
        // console.log(addNewClass);
        const result = await classCollection.insertOne(addNewClass);
        res.send(result);
    });

  // instructor get class
    app.get("/dashboard/addClass", async(req, res) => {
        const filter = { activeRole : 'requested'}
        const result = await classCollection.find(filter).toArray();
        res.send(result)
    })
    
   // for individual payment for
    app.get("/dashboard/payment/:id", async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await selectedClassCollection.findOne(query);
      res.send(result);
  })


  // Admin Approve / Deny A added Class
  
    app.patch("/dashboard/addClass/:id", async (req, res) => {
      const id = req.params.id;
      const {status, feedback} = req.body
      console.log("ID", id)
      console.log(feedback)
      const query = {_id: new ObjectId(id)};
      const update = {
        $set: { status: status, feedback: feedback},
      };

      const result = await classCollection.updateOne(query, update);
      console.log(result);
      res.send(result);
    });

    

   // create payment intent for stripe
    app.post('/create-payment-intent', async(req, res) => {
        const {price} = req.body;
        if(price){
          const amount = parseFloat(price) * 100;
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card']
          })
          res.send({
            clientSecret: paymentIntent.client_secret
          })
        }
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