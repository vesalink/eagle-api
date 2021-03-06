// Retrieve
var MongoClient = require("mongodb").MongoClient;
var fs = require("fs");
var ObjectId = require("mongodb").ObjectID;

/*
HOW TO RUN:
node loadDocumentTags.js <project data>
Ex. If your data is in a file called GaloreCreek.json in the same directory, run:
node loadDocumentTags.js GaloreCreek
*/

// Connect to the db
// Dev
// MongoClient.connect("mongodb://x:x@localhost:5555/epic", async function(err, client) {
// Test
// MongoClient.connect("mongodb://x:x@localhost:5555/epic", async function(err, client) {
// Local
var args = process.argv.slice(2);
MongoClient.connect("mongodb://localhost/epic", async function(err, client) {
    if (!err) {
        console.log("We are connected");
        const db = client.db("epic");

        let documentTagsData = require(process.cwd() + '/' + args[0]);

        console.log("Updating tags on " + documentTagsData.length + " documents.");

        for (let i = 0; i < documentTagsData.length; i++) {
            let object_id = documentTagsData[i]._id.substring(9,33);
            let newDocumentType = (documentTagsData[i].type === "") ? null : documentTagsData[i].type.substring(9,33);
            let newDocumentAuthor = (documentTagsData[i].documentAuthorType === "") ? null : documentTagsData[i].documentAuthorType.substring(9,33);
            let newProjectPhase = (documentTagsData[i].projectPhase === "") ? null : documentTagsData[i].projectPhase.substring(9,33);
            let newMilestone = (documentTagsData[i].milestone === "") ? null : documentTagsData[i].milestone.substring(9,33);
            if(documentTagsData[i].datePosted){
                let documentDate = (documentTagsData[i].milestone === "") ? null : new Date(documentTagsData[i].datePosted);
                await updateTagsDates(db, ObjectId(object_id), ObjectId(newDocumentType), ObjectId(newDocumentAuthor), ObjectId(newProjectPhase), ObjectId(newMilestone), documentDate);
            } else {
                await updateDocumentTags(db, ObjectId(object_id), ObjectId(newDocumentType), ObjectId(newDocumentAuthor), ObjectId(newProjectPhase), ObjectId(newMilestone));
            }
        }
        console.log("ALL DONE");
        client.close();
      } else{
        console.log(err);
      }
});

async function updateTagsDates(db, object_id, newDocumentType, newDocumentAuthor, newProjectPhase, newMilestone, newDocumentDate) {
    return new Promise(function(resolve, reject) {
      db.collection("epic")
        .updateOne({ _id: object_id },
        { $set: { 
            type: newDocumentType, 
            documentAuthorType: newDocumentAuthor, 
            projectPhase: newProjectPhase, 
            milestone: newMilestone, 
            datePosted: newDocumentDate}},
        { upsert : true })
        .then(async function(data) {
          resolve(data);
        });
    });
}

async function updateDocumentTags(db, object_id, newDocumentType, newDocumentAuthor, newProjectPhase, newMilestone) {
    return new Promise(function(resolve, reject) {
      db.collection("epic")
        .updateOne({ _id: object_id },
        { $set: { 
            type: newDocumentType, 
            documentAuthorType: newDocumentAuthor, 
            projectPhase: newProjectPhase, 
            milestone: newMilestone, 
        }},
        { upsert : true })
        .then(async function(data) {
          resolve(data);
        });
    });
}