const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();


// show response
const showResponse = (user,repo)=>{
    return `<h3>${user} has ${repo} github repository!</h3>`
}

//make request to github
async function getRepos(req, res) {
    try {
        console.log('fetching data');
        const {
            username
        } = req.params
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json()
        // repositories
        const repositories = data.public_repos
        // set data to redis
        client.setex(username,3600,repositories)


        res.send(showResponse(username,repositories))
    } catch (err) {
        console.error(err);
        res.status(500)
    }
}


// catch middleware
const cache = (req,res,next)=>{
    const {
        username
    } = req.params
    client.get(username, (err , data)=>{
        if(err) throw err;
        if (data !== null) {
            res.send(showResponse(username,data))            
        }else{
            next()
        }
    })
}

app.get('/repos/:username', cache, getRepos)


app.listen(PORT, () => {
    console.log(`app listen on port ${PORT}`);
})