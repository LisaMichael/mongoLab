var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//Require models

var db = require("./models");

var PORT = process.env.PORT || 3000;

//Initialize Express
var app = express();

//Configure middleware

//Morgan logger for logging requests
app.use(logger("dev"));
//Parse request body as JSON
app.use(express.urlencoded({extended: true}));
app.use(express.json());
//Make public a static folder
app.use(express.static("public"));

//Connect to the Mongo DB
mongoose.connect(process.env.MONGODB_URI ||"mongodb://localhost/tricksScraper", {useNewUrlParser: true });



//Routes
//This can go in routes
app.get("/scrape", function(req, res) {
    axios.get("http://www.css-tricks.com/archives/").then(function(response) {
        //Then load response data into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        //Now grab every h2 within an article tag, and do the following:
        $("article h2").each(function(i, element) {
            //Save an empty result object
            var result = {};

            //Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            //Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function(dbArticle) {
                    //View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    //If an error occurred, log it
                    console.log(err);
                });
        });

        //Send a message to the client
        res.send("Scrape Complete");
    });
});

//This can go to controllers
//Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    db.Article.find({})
        .then(function(data) {
            res.json(data);
        })
        .catch(function(err) {
            res.json(data);
        })
});

//This can go to controllers
//Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    //Find one article using req.params.id, and run the populate method with "note", then respond with the article the note included
    db.Article.findOne({_id:req.params.id})
        .populate("note")
        .then(function(dbArticle){
            res.json(dbArticle);
        })
});

//Route for saving/updating an Articles's associated Note
//This can go to controllers
app.post("/articles/:id", function(req, res) {
    //Save the new note that gets posted to the Notes collection then find an article from the req.params.id and update it's "note" property with the _id of the new note
    db.Note.create(req.body)
        .then(function(dbNote) {
            console.log(dbNote);
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id}, {new: true});
        })
        .then(function(dbArticle) {
            console.log(dbArticle);
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        })
});

//Additional routes to be written:

//Route for deleting an article
//This would be controller
app.delete("/articles/:id", function(req, res) {
    db.Article.deleteOne({_id: req.params.id})
        .then(function(dbArticle) {
            console.log("Article deleted.");
            res.json("deleted");
            // return db.Article.deleteOne({_id: req.params.id});
        })
        .catch(function(err) {
            res.json(err);
        })
});

//Route for deleting all articles
//This would be a controller
app.delete("/clear", function(req, res) {
    db.Article.deleteMany({})
        .then(function(dbArticle) {
            console.log("Articles deleted.");
            res.json("deleted");
        })
        .catch(function(err) {
            res.json(err);
        })
})

//Route for saving an article by creating a new collection with saved articles and their associated notes. This would probably be best in order to maintain data persistence.
//This would be a controller

//Start the server
app.listen(PORT, function(){
    console.log("App running on port " + PORT + "!");
});