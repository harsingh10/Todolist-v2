require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const loadash = require("loadash");
const app = express();
app.set("view engine", "ejs")
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static('public'));

//connecting to the data
const connString = process.env.DB_URL || 'mongodb://localhost:20717/';
const dbName = process.env.DB_NAME || 'todolistDB';
mongoose.connect(connString + dbName, {useUnifiedTopology: true,useNewUrlParser: true,},(err)=>{
  if(err)
    console.log('Initial connection error: ', err);
    else
      console.log("connected success")
}).catch((err) => {
  console.error('connection error: ',err);
});
//creating schema

const itemSchema = new mongoose.Schema({
  name : String
});
const randomSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
//creating model using that schema
const Todolist = mongoose.model("Todolist", itemSchema);
const Randomlist = mongoose.model("Randomlist", randomSchema);

const item1 = new Todolist({
  name: "Welcome to your to do list"
});
const item2 = new Todolist({
  name: "type anything that you wanted add in the list"
});
const item3 = new Todolist({
  name: "and press add to add the things in your list"
});
const defaultItems = [item1,item2,item3];
//getting the data from
app.get("/", function(req, res){
Todolist.find(function(err,items){
    if(items.length === 0)
    {
      Todolist.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
        console.log("inserted three items");
        }
      });
      res.redirect("/");
    }
    else{res.render("list", {listTitle: "today", addItems: items});}

  });

});
//dyanamic route
app.get("/:name", function(req,res){
   const routeName = _.capitalize(req.params.name);
   Randomlist.findOne({name:routeName},function( err, founditem){
     if(!err){
       if(!founditem){
        const newItem = new Randomlist({
          name:routeName,
          items:defaultItems
        });
        newItem.save();
        res.redirect("/"+routeName);
        }
       else{
        res.render("list",{listTitle: founditem.name, addItems: founditem.items});
       }
     }
     else{
       console.log(err)
     }



});
});
//posting data to home route and random route
app.post("/", function(req,res){
  //getting the item by body-parser
    let hold = req.body.addlist;
    let listName = req.body.list;
    const item4 = new Todolist({
      name: hold
    });
//checking in which list you have to add the item
    if(listName === "today")
    {
      item4.save();
      res.redirect("/");
    }
    else{
      Randomlist.findOne({name:listName}, function(err,founditem){
        founditem.items.push(item4);
        founditem.save();
        res.redirect("/"+ listName);
      });
    }

});
//delete route used delete the item from the list
app.post("/delete", function(req,res){
  //when checkbox is clicked to remove item we apply on change to submit form whenever there is checkbox(on/off) and we want the list name and the item we want to delete(its id)
  const listname = req.body.listName;
  const deletedItemId = req.body.checkbox;
  if(listname === "today" )
  {
    Todolist.deleteOne({_id: deletedItemId}, (err)=>{
    if(err){
      console.log(err);
    }
    else{
      console.log("succesfully deleted 1 item ");
    }
    res.redirect("/");
  });

}
//here we are using the mongoDB ($pull request to  remove the elements of array of documents and using the findOneAndUpdate from mongoose to get list)
else{
  Randomlist.findOneAndUpdate({name:listname},{$pull:{items:{_id: deletedItemId}}}, function(err,founditem){
    if(!err){
      res.redirect("/" + listname );
    }
  });

}
});
//server is running on port number:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});
// app.listen(3000 || process.env.PORT, function(){
//   console.log("server is started successfully");
// });
