import express from 'express';
import cors from 'cors';
import { MongoClient} from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient= new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(()=>{
    db= mongoClient.db('projeto12');
});



app.listen(5001, ()=>{
    console.log('listen on port 5001');
});