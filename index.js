const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { ObjectID } = require('bson');
require('dotenv').config();

//middleware
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xetzjun.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('bandaid-dental').collection('services');
        const reviewsCollection = client.db('bandaid-reviews').collection('reviews');

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/home-service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        app.get('/my-reviews', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                };
            }
            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/my-reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await reviewsCollection.findOne(query);
            res.send(result);
        });

        app.put('/my-reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectID(id) };
            const review = req.body;
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    rewiewDetails: review.rewiewDetails,
                    rating: review.rating
                }
            };
            const result = await reviewsCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        });

        app.post('/my-reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });

        app.delete('/my-reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {

    }

}
run().catch(error => console.error(erro));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});