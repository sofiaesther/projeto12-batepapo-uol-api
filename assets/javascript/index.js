import express, { response } from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

const mongoClient= new MongoClient(process.env.MONGO_URI);


let db;
mongoClient.connect().then(()=>{
    db = mongoClient.db('projeto12');
});

/*
VERIFICATION MODELS
*/

const participantsSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message').valid('private_message')
});


/*
GET AND POST
*/

/*
PARTICIPANTS
*/

app.post('/participants', async (req,res)=>{
    const userdata = req.body;
    const validation = participantsSchema.validate(userdata, {abortEarly: true});
    if(validation.error) {
        res.sendStatus(422);
        return;
    };
    const time = Date.now();
    const participantpost = {
        name: userdata.name,
        lastStatus: time
    };


try{
    const onlyuser = await db.collection('participants').findOne(userdata);
    if (!onlyuser){
        await db.collection('participants').insertOne(participantpost);
        const confirm = {   from: userdata.name, 
                            to: 'Todos', 
                            text: 'entra na sala...', 
                            type: 'status', 
                            time: dayjs().format('HH:mm:ss')
                        };
        await db.collection('messages').insertOne(confirm);
        res.sendStatus(201);

    } else {
        res.sendStatus(409);
        return;
    };

} catch(error){
    res.send(error);
};
});

app.get('/participants', async (req,res)=>{
    const participantsCollection = db.collection("participants");
    try{
        const allparticipants = await participantsCollection.find().toArray();
        const participants = [];
        allparticipants.map((p)=>participants.push({User:p.name}));
        
        res.send(participants);
    }
    catch(err){
        res.send(err);
    }

});

/*
MESSAGES
*/

app.post('/messages', async (req,res) =>{
    const { to, text, type } = req.body;
    const validation = messageSchema.validate(req.body, {abortEarly:true});
    if (validation.error){
        res.sendStatus(422);
        return;
    };

    const { user } = req.headers;

    try{
        const validuser = await db.collection('participants').findOne({name:user});
        if(!validuser){
            res.sendStatus(422);
            return;
        };
        const msg = {
            from: user,
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        };
        await db.collection('messages').insertOne(msg);
        res.sendStatus(201);

    }
    catch(err){
        res.send(err);
    }

});

app.get('/messages', async (req,res)=>{
    const { limit } = req.query;
    const { user } = req.headers;
    try{
        const allmsgs = await db.collection('messages').find({$or:[{type:"status"},{type:'message'},{to:user},{from:user}]}).toArray();
        if (!limit){
            res.send(allmsgs);
        } else{
            const msg = allmsgs.slice(-limit);
            res.send(msg);
        }
    }
    catch(err){
        res.send(err);
    }

});

app.listen(5001, ()=>{
    console.log('listen on port 5001');
});