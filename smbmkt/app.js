/** App Initial Configuration **/

/* Load NodeJS Modules */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require("redis")
const pg = require("pg")

/* Load Local Modules */
const biz = require('./modules/biz');
const sql = require('./modules/sql');
const start = require('./modules/start')

var credentials = null;
var vcap = null;

/* Configure Redis */
console.log("Configuring redis")

//Check where the Redis instance will come from. 
//From CF BackingServiecs, OR a Remote Host OR a local (credentials = null)
if (process.env.VCAP_SERVICES) {
    vcap = JSON.parse(process.env.VCAP_SERVICES);

    if (vcap.hasOwnProperty('redis')) {
        credentials = vcap.redis[0].credentials;
        credentials.host = credentials.hostname
        console.log("Redis credentials found in VCAP")
    } else {
        console.log("No Redis found in VCAP Services")
    }
};

if (!credentials) {
    //Maybe Redis is on a remote enviroment
    console.log("Looking for remote Redis connection details")
    if (process.env.REDIS_HOST) {
        console.log("trying to connect to Redis on " + process.env.REDIS_HOST)
        credentials = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,

        }
    } else {
        console.log("No remote Redis details found, will try to connect locally")
    }
}

var redisClient = redis.createClient(credentials);
redisClient.on('error', function (er) {
    console.trace('Here I am');
    console.error(er.stack);
});

redisClient.on('connect', function () {
    console.log("Connected to Redis")
    biz.setClient(redisClient)
});

/* Configure PostgreSQL */
credentials = null;

//Check where the PostgreSQL instance will come from. 
//From CF Backing Services, OR a Remote Host OR a local PG (credentials = null)
console.log("Connecting to PostgresSQL...")
if (process.env.VCAP_SERVICES) {
    vcap = JSON.parse(process.env.VCAP_SERVICES);

    if (vcap.hasOwnProperty('postgresql')) {
        //Postgresql on CloudFoundry services
        credentials = {
            connectionString: vcap.postgresql[0].credentials.uri
        }
        console.log("PostgresSQL found in VCAP Services")
    } else {
        console.log("No PostgresSQL found in VCAP Services")
    }
}

if (!credentials) {
    //Maybe PostgreSQL on a remote enviroment
    console.log("Looking for remote PostgresSQL connection details")
    if (process.env.PG_HOST) {
        console.log("trying to connect to PostgreSQL on " + process.env.PG_HOST)
        credentials = {
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            ssl: true
        }
    } else {
        console.log("No remote PostreSQL details found, will try to connect locally")
    }
}


var pgClient = new pg.Client(credentials)
pgClient.connect(function (err) {
    if (err) {
        console.error("Error Connecting to PostgreSQL - \n" + err)
    } else {
        console.log('PostegreSQL connected')
        sql.setClient(pgClient);
    }
})

/* Configure Express App */
console.log("Configuring Express App")
const app = express();
app.use(express.static('public'));
console.log("Allowing CORS...")
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//To Support body on post requests
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//Static folder (to css and js front end files)
app.use(express.static('public'));


setInterval(biz.UpdateItemPrices, 1.8e+6)

/* Express API */
// Root path to retrieve Index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/Items', function (req, res) {
    console.log("REQUEST: List Items")
    biz.GetItems(req.query, function (error, response) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.send(response)
    })
});

app.get('/SalesOrders', function (req, res) {
    console.log("REQUEST: List Sales Orders")
    biz.GetSalesOrders(req.query, function (error, response) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.send(response)
    })
});

app.get('/SelectDB', function (req, res) {
    sql.Select(function (error, response) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.send(response)
    })
});

app.delete('/CleanDB', function (req, res) {

    console.log("Clean ALL Items")
    sql.Clean(function (err, resp) {
        res.setHeader('Content-Type', 'application/json')
        if (err) {
            res.status(500).send(resp)
        } else {
            console.dir(resp);
            res.status(200).send(resp)
        }
    });
});

app.post('/Initialize', function (req, res) {
    console.log("POST REQUEST: Initialize System")
    start.Initialize();
    var output = {
        message: "executing"
    };
    res.setHeader('Content-Type', 'application/json')
    res.send(output)

});

app.post('/SimilarItems', function (req, res) {

    console.log("Finding similiar Items for: ")
    console.log(req.body)
    biz.SimilarItems(req.body, function (err, resp) {
        res.setHeader('Content-Type', 'application/json')
        if (err) {
            res.status(500).send(resp)
        } else {
            console.dir(resp);
            res.status(200).send(resp)
        }
    });
    console.log('GetSimilarItems')
});

app.post('/SalesOrders', function (req, res) {
    console.log("REQUEST: Create Sales Order")
    biz.CreateSalesOrder(req.body, function (response) {
        res.setHeader('Content-Type', 'application/json')
        res.status(201)
        res.send(response)
    })
});


var port = process.env.PORT || 30000
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});