const express = require('express')
const app = express();
const PORT = 8001

const bodyParser = require('body-parser');

const MongoClient = require('mongodb') 
const path = require('path');


app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/build')))

const withDB = async (opearations, res) => {
    try {

        const client = await MongoClient.connect('mongodb://localhost:27017', {useUnifiedTopology: true})
        const db = client.db('myblog')
        await opearations(db)
        client.close()

    } catch(error) {
        res.status(500).json({ message: "Error connecting to the database", error})
    }
}

/*
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/hello.html')
})
*/

app.get('/api/articles/:name', async (req, res) => {
    withDB(async(db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName})
        res.status(200).json(articleInfo)
    }, res)
        
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async(db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {$set: {upvotes: articleInfo.upvotes + 1}})
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName }) //await db.collection('articles').updateOne({ name: articleName }, {$set: {upvotes: articleInfo.upvotes + 1}})
        res.status(200).json(updatedArticleInfo);
    }, res)    
})

app.post('/api/articles/:name/add-comment', async (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async(db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName})
        await db.collection('articles').updateOne({ name: articleName}, {$set: {comments: articleInfo.comments.concat({ username, text})}})
        const updatedArticleinfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(updatedArticleinfo)
    }, res);
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(PORT, () => console.log(`Listening in port ${PORT}`))