const express = require('express')
const mySecret = process.env["MONGO_URI"]
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const { urlencoded } = require('body-parser')
const { application } = require('express')
const {Schema} = mongoose;



// Schemas
// console.log("it's working..! ");
const userSchema = new Schema({
  "username": String,
})

const exerciseSchema = new Schema({
  username: String,
  date: Date,
  duration: Number,
  description: String,
})

const logSchema = new Schema({
  username: String,
  count: Number,
  log: Array,
})

// models
const UserInfo = mongoose.model("userInfo", userSchema);
const ExerciseInfo = mongoose.model("exerciseInfo",exerciseSchema);
const LogInfo = mongoose.model("logInfo",logSchema);

// Config

mongoose.connect(process.env["MONGO_URI"],{ 
  useNewUrlParser: true, 
  useUnifiedTopology: true },
  () => {console.log("connected to mongo db")}
)

// middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//api endpoints

  // #1

app.post("/api/users",(req,res) => {
  console.log("this is working atleast..!",req.body.username);
  UserInfo.find({"username":req.body.username}, (err, userData) => {
    console.log(userData)
    if (err){
      console.log("Error with server",err);
    }else{
      if (userData.length === 0){
        const test = new UserInfo({
          "_id": req.body.id,
          username: req.body.username,
        })

        test.save((err,data) => {
          if (err){
            console.log("Error saving data =>",err);
          }else{
            res.json({
              "_id": data.id,
              "username":data.username,
            })
          }
        })

      }else{
        res.send("username alareday Exists")
      }
    }
  })
})


  // 2

app.post("/api/users/:_id/exercises", (req,res) => {
  let idJson = {"id": req.params._id};
  let checkedDate = new Date(req.body.date);
  let idToCheck = idJson.id;

  let noDateHandler = () => {
    if (checkedDate instanceof Date && !isNaN(checkedDate)){
      return checkedDate
    }else{
      checkedDate= new Date();
    }
  }
UserInfo.findById(idToCheck, (err,data) => {
  noDateHandler(checkedDate);

  if (err){
    console.log("error with id => ". err);
  }else{
    const test = new ExerciseInfo({
      username: data.username,
      description: req.body.description,
      duration: req.body.duration,
      date: checkedDate.toDateString(),
    })
    test.save((err,data) => {
      if (err){
        console.log("error  saving => ",err);
      }else{
        console.log("saved the exersice successfully");
        res.json({
          "_id": idToCheck,
          "username": data.username,
          "description": data.description,
          "duration": data.duration,
          "date": data.date.toDateString(),
        })
      }

    })
  }
})

})


// 3

app.get("/api/users/:id/logs",(req,res) => {
  const {from ,to , limit} = req.query;
  let idJson = ({"id": req.params.id});
  let idToCheck = idJson.id;
  
  
  // check id
  UserInfo.findById(idToCheck, (err,data) => {
    var query = {
      username: data.username
    }
    if(from !== undefined && to === undefined){
      query.date = {$gte : new Date(from)}
    } else if (to !== undefined && from === undefined){
      query.date = {$lte: new Date(to)}
    }else if (from !== undefined && to !== undefined){
      query.date = {$gte: new Date(from), $lte: new Date(to)}
    }

  let limitChecker = (limit) => {
    let maxLimit = 100;
    if (limit){
      return limit;
    }else{
      return maxLimit;
    }
  }
  if (err){
    console.log("error with id => ",err);
  }else{
    ExerciseInfo.find((query),null, {limit: limitChecker(+limit)},(err,docs) => {
      let loggedArray = [];
      if (err){
        console.log("error with id => ",err);
      }else{
        let document = docs;
        let loggedArray = document.map((item) =>{
          return {
            "description": item.description,
            "duration": item.duration,
            "log": item.date.toDateString(),
          }

        })

        const test = new LogInfo({
          "username":data.username,
          "count": loggedArray.length,
          "log": loggedArray,
        })

        test.save((err,data) => {
          if (err){
            console.log("error save exercise => ",err)
          } else {
            console.log("saved exercise successfully");
            res.json({
              "_id": idToCheck,
              "username": data.username,
              "count": data.count,
              "log": loggedArray,
            })
          }
        })
      }
    })
  }
  })
})


app.get("/api/users", (req,res) => {
  UserInfo.find({}, (err,data) => {
    if (err) {
      res.send("no users");
    }else{
      res.json(data)
    }
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})