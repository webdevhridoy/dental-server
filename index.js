const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { ObjectID } = require('bson');
require('dotenv').config();
const jwt = require('jsonwebtoken');

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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Access forbidden' });
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        const serviceCollection = client.db('bandaid-dental').collection('services');
        const reviewsCollection = client.db('bandaid-reviews').collection('reviews');

        // jwt token 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token });
        });


        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({ time: 1, time: -1 });;
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/home-service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({ time: 1, time: -1 });
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const service = await reviewsCollection.findOne(query);
            res.send(service);
        });


        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        app.get('/my-review', async (req, res) => {
            let query = {};
            if (req.query.reviewId) {
                query = {
                    reviewId: req.query.reviewId
                };
                const cursor = reviewsCollection.find(query).sort({ time: -1, time: 1 });
                const result = await cursor.toArray();
                return res.send(result);
            }
            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/my-reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(401).send({ message: 'Unauthorized Access' });
            }
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
run().catch(error => console.error(error));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});