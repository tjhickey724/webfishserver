#!/usr/bin/env node --harmony

/***
 dbdemo

Update 8/4/2014
 We have modified the dbdemo so that it uses google oauth authentication
 using the passport-google-oauth module.  This required us to move back to
 an earlier version of express (version 3.0.0) rather than the latest version
 that we had been using (4.4.4) because to google-oauth module was incompatible
 with passport version 4...

 Also, this file contains the clientID and clientSecret for this app which is
 clearly not best practice when writing apps for production, but I'll change them
 fairly soon so these will be out of date!
 


Update 7/24/2014
 This is a simple server illustrating middleware and basic REST functionality
 This demo also adds the mongo database connection, but everything is in one file
 on the server side. We will break this out so that it has model/view/controller on
 the server and client in the next demo...
 
 We have extended the example by using passportjs to get user authentication using google
 and to extend the example to store many people's shopping lists!
 
 The idea is to require authentication to use the app and then to use the authenticated id to
 lookup the user's shopping list ... this requires adding the user's "openID" field to the schema
 for the shopping collection...
 
 This relies on starting a redis-server and a mongod server before staring up the app...
 
 ***/

'use strict';
var express = require('express');
var bodyParser = require('body-parser'); // this allows us to pass JSON values to the server (see app.put below)
var app = express();

var monk = require('monk');
var db = monk('localhost:27017/webfish');
var User = db.get("user");

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');



//**********************************************************
// The following is needed for the passport authentication 
//**********************************************************
var cookieParser = require('cookie-parser');
var session = require('express-session');

var redisClient = require('redis').createClient();
var RedisStore = require('connect-redis')(session);

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var ensureAuthenticated = function(req, res, next) {
    
        if (req.isAuthenticated()) {
            console.log("we are authenticated!!");
            console.log("req.user=" + JSON.stringify(req.user));
            return next();
        } else {
            console.log("you are not authenticated!");
            console.log("req="+req);
            res.redirect('/login.html');
        }
    };

passport.serializeUser(function(user, done) {
    //console.log("serializeUser: "+JSON.stringify(user));
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    //console.log("deserializeUser: "+JSON.stringify(obj));
    done(null, obj);
});


passport.use(new GoogleStrategy({
	    clientID: '327841892394-kg77ug2s36gk4dos0q6c5j8nhafqp9m7.apps.googleusercontent.com',
		clientSecret: '69qGzj4O-iVO41f_RjVbVPKC',
		callbackURL: "http://localhost:4000/oauth2callback"
		},
	function(accessToken, refreshToken, profile, done) {
        console.log("aT = " + JSON.stringify(accessToken) + 
		    "\n  rt=" + JSON.stringify(refreshToken) +
		    "\n  pr=" + JSON.stringify(profile));
    User.find({
        openID: profile.id
    }, function(err, user) {
        console.log("err = " + JSON.stringify(err) + "\n  user=" + JSON.stringify(user));
        if (user.length == 0) {
            // if this is the first visit for the user, then insert him/her into the database
            user = {};
            user.openID = profile.id;
            user.profile = profile;
            //console.log("inserting user:"+ JSON.stringify(user));
            db.get("user").insert(user);
            //console.log("inserted user");
            done(null, user);
        } else {
            // the user has been here before and there should only be one user
            // matching the query (user[0]) so pass user[0] as user ...
            console.log("Google Strategy .. user = " + JSON.stringify(user));
            done(err, user[0]);
        }
	})}));


//**********************************************************


// parse the bodies of all other queries as json
app.use(bodyParser.json());


// log the requests
app.use(function(req, res, next) {
    console.log('%s %s %s', req.method, req.url, JSON.stringify(req.body));
    //console.log("myData = "+JSON.stringify(myData));
    //req.user = {openID:"theUser"};
    next();
});


//**********************************************************
// This is needed for the passport authentication
// start using sessions...
//**********************************************************
//app.use(session({ secret: 'jfjfjfjf89fd89sd90s4j32kl' }));
app.use(cookieParser());
app.use(session({
    secret: 'unguessable',
    store: new RedisStore({
        client: redisClient
    })
}));

app.use(passport.initialize());
app.use(passport.session());

/*
// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return', 
  passport.authenticate('google', { successRedirect: '/',
                                    failureRedirect: '/login' }));
*/

app.get('/auth/google',
	passport.authenticate('google', 

			      //{scope: 'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.login https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'}
			      //{scope: 'https://www.googleapis.com/auth/plus.me'}
			      {scope: 'https://www.googleapis.com/auth/plus.me'}
			      ));



app.get('/oauth2callback', 
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
	    // Successful authentication, redirect home.
	    res.redirect('/');
	});


// serve static content from the public folder 
app.use("/index.html",function(req,res){res.render("index",{val:77})})
app.use("/login.html", express.static(__dirname + '/public/login.html'));
app.use("/logout.html", express.static(__dirname + '/public/logout.html'));
app.use("/video/fishpoliceintro480.mov", express.static(__dirname+'/public/video/fishpoliceintro480.mov'));


app.use("/webfishgame",ensureAuthenticated, function(req, res, next) {   next() });

//**********************************************************




// serve static content from the public folder 
app.use("/", express.static(__dirname + '/public'));


//**********************************************************
// this is just to demonstrate how to use the ensureAuthenticated middleware
// to restrict access to a route to authenticated users
//**********************************************************
app.use("/secret", ensureAuthenticated, function(req, res) {
    res.redirect("http://www.brandeis.edu");
})


app.get('/auth/logout', function(req, res) {
    req.logout();
    res.redirect('/logout.html');
});

// this returns the user info
app.get('/api/user', ensureAuthenticated, function(req, res) {
    res.json(req.user);
});

app.get('/api/userState',ensureAuthenticated,function(req,res){
	console.log("\n\n **** user = "+JSON.stringify(req.user));
		console.log("\n\n **** userState = '"+JSON.stringify(req.user.userState)+"'\n\n");
	if (req.user.userState == undefined){
		req.user.userState = {level:0, mode:"visual",consent:"no",age:-1};
		var collection = db.get("user");
		//var u = collection.find({"_id":req.user["_id"]}); console.log("in apu/userState -- "+JSON.stringify(u));
		collection.update({"_id":req.user["_id"]}, req.user);
		req.session.passport.user = req.user;
	}

	res.json(req.user.userState);
	console.log("user = '"+JSON.stringify(req.user)+"'");
})

app.put('/api/userState',ensureAuthenticated, function(req,res){
	console.log("entering /api/userState .. user = "+JSON.stringify(req.user));
	req.user.userState = req.body;
	req.session.passport.user = req.user;
	var collection = db.get("user");
	collection.update({"_id":req.user["_id"]}, req.user);
	console.log("leaving /api/userState user = '"+JSON.stringify(req.user)+"'");
	res.json(JSON.stringify(req.user.userState));
})
//**********************************************************


app.get('/newUserNum',function(req,res){
    var collection = db.get("user");
    collection.find({},{},
      function(err,result){
        res.json(result.length);          
      }    );

})

app.get('/gamelogs', function(req,res){
	var collection = db.get("gamelog");
    collection.find({}, {}, function(e, docs) {
        //console.log(JSON.stringify(docs));
        //res.json(200, docs);
		var mdocs = convertToText(docs);
		res.format({'text/plain': function(){res.send(mdocs)}});
    })

	
})


app.get('/allstats/:mode/:level',function(req,res){
	var mode = req.params.mode;
	var level = parseInt(req.params.level);
	console.log([mode,level]);
    var collection = db.get("gamestats");
    collection.col.aggregate([
		{$match:{mode:mode, level:{$gt:level-1}}},
	  {$group: {_id:"total",
      ff:{$sum: "$stats.fast.fast.tries"},ss:{$sum: "$stats.slow.slow.tries"},
      fs:{$sum: "$stats.fast.slow.tries"},sf:{$sum: "$stats.slow.fast.tries"} ,
      fn:{$sum: "$stats.fast.none.tries"},sn:{$sum: "$stats.slow.none.tries"},
      ns:{$sum: "$stats.none.slow.tries"},nf:{$sum: "$stats.none.fast.tries"} ,
      ffc:{$sum: "$stats.fast.fast.correct"},ssc:{$sum: "$stats.slow.slow.correct"},
      fsc:{$sum: "$stats.fast.slow.correct"},sfc:{$sum: "$stats.slow.fast.correct"},
      fnc:{$sum: "$stats.fast.none.correct"},snc:{$sum: "$stats.slow.none.correct"},
      nsc:{$sum: "$stats.none.slow.correct"},nfc:{$sum: "$stats.none.fast.correct"},
      fft:{$sum: "$stats.fast.fast.time"},sst:{$sum: "$stats.slow.slow.time"},
      fst:{$sum: "$stats.fast.slow.time"},sft:{$sum: "$stats.slow.fast.time"},  
      fnt:{$sum: "$stats.fast.none.time"},snt:{$sum: "$stats.slow.none.time"},
      nst:{$sum: "$stats.none.slow.time"},nft:{$sum: "$stats.none.fast.time"},     
      }}],
      function(err,result){
        res.json(result);          
      }    );

})

app.get('/allstats2/:mode',function(req,res){
	var mode = req.params.mode;
    var collection = db.get("gamestats");
    collection.col.aggregate([
		{$match: {mode:mode}},
		{$group: {_id:"total",
      	ff:{$sum: "$stats.fast.fast.tries"},ss:{$sum: "$stats.slow.slow.tries"},
      	fs:{$sum: "$stats.fast.slow.tries"},sf:{$sum: "$stats.slow.fast.tries"} ,
      	ffc:{$sum: "$stats.fast.fast.correct"},ssc:{$sum: "$stats.slow.slow.correct"},
      	fsc:{$sum: "$stats.fast.slow.correct"},sfc:{$sum: "$stats.slow.fast.correct"},
      	fft:{$sum: "$stats.fast.fast.time"},sst:{$sum: "$stats.slow.slow.time"},
      	fst:{$sum: "$stats.fast.slow.time"},sft:{$sum: "$stats.slow.fast.time"},      
      	}}],
      function(err,result){
        res.json(result);          
      }    );

})

app.get('/summarystats/:mode/:level',function(req,res){
    var level = parseInt(req.params.level);
    var mode = req.params.mode;
    var collection = db.get("gamesummary");

    collection.col.aggregate([
        {$match: {level: level, mode:mode}},
        {$group: 
        {_id:"total",
         tries:  {$sum: "$summary.tries"},
         correct:{$sum: "$summary.correct"},
         time:{$sum: "$summary.totalTime"},
         count:{$sum: 1}  
        }}],
      function(err,result){
        res.json(result);          
      }    );

})

app.get('/leader/:mode/:level',function(req,res){
    var level = req.params.level;
    var mode = req.params.mode;
    var collection = db.get("gamesummary");

    collection.col.aggregate([
        {$match: {level: level, mode:mode}},
        {$group: 
        {_id:"total",
         tries:  {$sum: "$summary.tries"},
         correct:{$sum: "$summary.correct"},
         time:{$sum: "$summary.totalTime"},
         count:{$sum: 1}  
        }}],
      function(err,result){
        res.json(result);          
      }    );

})
// this shows my stats for level 7
app.get('/mysummarystats/:mode/:level',function(req,res){
    var level = req.params.level;
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {userID:req.user.openID,level: level, mode:mode}},
        {$group: 
        {_id:"total",
         tries:  {$sum: "$summary.tries"},
         correct:{$sum: "$summary.correct"},
         time:{$sum: "$summary.totalTime"},
         count:{$sum: 1}  
        }}],
      function(err,result){
        res.json(result);          
      }    );

})

// this shows my stats for level 7
app.get('/mysummarystats/:mode',function(req,res){
    //var level = req.params.level;
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	//console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {userID:req.user.openID, mode:mode}},
        {$group: 
			{
		 _id:{level:"$level"}, //"total",
         tries:  {$sum: "$summary.tries"},
         correct:{$sum: "$summary.correct"},
         time:{$sum: "$summary.totalTime"},
         count:{$sum: 1}  
        }},
		{$sort: {_id:1}}
    	],
      function(err,result){
		  console.log("Error in mysummarstats"+JSON.stringify(err));
        res.json(result);          
      }    );

})

// this shows my stats for level 7
app.get('/myavgstats/:mode',function(req,res){
    //var level = req.params.level;<
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	//console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {userID:req.user.openID, mode:mode}},
        {$group: 
			{
		 _id:{level:"$level"}, //"total",
         tries:  {$sum: "$summary.tries"},
         correct:{$sum: "$summary.correct"},
         time:{$sum: "$summary.totalTime"},
         count:{$sum: 1}  
        }},
		{$project:
			{
				accuracy:{$divide:["$correct","$tries"]},
				reaction:{$divide:["$time","$tries"]}
			}},
		{$sort: {_id:1}}
    	],
      function(err,result){
		  console.log("Error in myavgstats"+JSON.stringify(err));
        res.json(result);          
      }    );

})

// this shows my stats for level 7
app.get('/mybeststats/:mode',function(req,res){
    //var level = req.params.level;
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	//console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {userID:req.user.openID, mode:mode}},

		{$project:
			{
				_id:{level:"$level"},
				//level:"$level",
				accuracy:{$divide:["$summary.correct","$summary.tries"]},
				reaction:{$divide:["$summary.totalTime","$summary.tries"]}
			}},
		{$sort: {_id:1,accuracy:-1, reaction:1}},
		{$group:
			{_id:"$_id",
			accuracy:{$first:"$accuracy"},
			reaction:{$first:"$reaction"}
			 }},
		{$sort: {_id:1,accuracy:-1, reaction:1}},
    	],
      function(err,result){
		  console.log("Error in mybeststats"+JSON.stringify(err));
        res.json(result);          
      }    );

})



// this shows my stats for level 7
app.get('/leaderboard/:mode/:level',function(req,res){
    var level = parseInt(req.params.level);
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	//console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {level:level, mode:mode,"summary.tries":{$gt:0}, "summary.correct":{$gt:0}}}, // watch out for division by zero!!

		{$project:
			{
				_id:{user:"$userID", nickname:"$nickname", level:"$level"},
				//level:"$level",
				accuracy:{$divide:["$summary.correct","$summary.tries"]},
				reaction:{$divide:["$summary.totalTime","$summary.correct"]}
			}},
		{$sort: {accuracy:-1, reaction:1, _id:1}}
    	],
      function(err,result){
		  //console.log("Error in leaderboard"+JSON.stringify(err));
        res.json({level:level, mode:mode, leaders:result});          
      }    );

})


// this shows my stats for level 7
app.get('/myrank/:mode/:level/:accuracy/:reaction',function(req,res){
    var level = req.params.level;
    var mode = req.params.mode;
    var collection = db.get("gamesummary");
	var acc = parseFloat(req.params.accuracy);
	var react = parseFloat(req.params.reaction);
	console.log("Accuracy="+acc);
	var val = 0.5;
	//console.log("the user is "+JSON.stringify(req.user));
	console.log("the userid is "+JSON.stringify(req.user.openID));
    collection.col.aggregate([
        {$match: {userID:req.user.openID,level:level, mode:mode}},

		{$project:
			{
				_id:{user:"$userID", level:"$level"},
				//level:"$level",
				accuracy:{$divide:["$summary.correct","$summary.tries"]},
				reaction:{$divide:["$summary.totalTime","$summary.tries"]}
			}},
		{$sort: {_id:1,accuracy:-1, reaction:1}},
		{$match:{
				accuracy:{$gte: acc}
		        } },
		{$match:{
			     $or:[{accuracy:{$gt: acc}},
					  {reaction:{$lte: react}}]
		}},
		{$group:{_id:"$_id",rank:{$sum:1}}}
				
//		,
//		{$match:{
//			reaction:{$lt:req.params.reaction}
//		}}
//		,
//		{$group: {_id:"$_id",
//		          count:{$sum:1}}}
    	],
      function(err,result){
		  console.log("Error in myrank: "+JSON.stringify(err)+" "+JSON.stringify(result));
        res.json(result);          
      }    );

})


app.post('/resetall', function(req,res){
    var collection = db.get("gamelog");
    console.log("collection = "+collection);
    collection.remove({});
    db.get("gamestats").remove({});
    db.get("gamesummary").remove({});
    db.get("users").remove({});
    res.json({result:'reset'});
});

app.get('/mystats',function(req,res){
    var collection = db.get("gamestats");
    collection.col.aggregate([{$group: {_id:"$user",ff:{$sum: "$stats.fast.fast.tries"},ss:{$sum: "$stats.slow.slow.tries"},fs:{$sum: "$stats.fast.slow.tries"},sf:{$sum: "$stats.slow.fast.tries"} ,ffc:{$sum: "$stats.fast.fast.correct"},ssc:{$sum: "$stats.slow.slow.correct"},fsc:{$sum: "$stats.fast.slow.correct"},sfc:{$sum: "$stats.slow.fast.correct"}}}],
      function(err,result){
        res.json(result);          
      }    );

})

//**********************************************************
// the rest of this app implements a REST interface to parts of the database ...
// get a particular item from the model
//**********************************************************
app.get('/model/:collection/:id', function(req, res) {
    var collection = db.get(req.params.collection);
    collection.find({
        _id: req.params.id
    }, {}, function(e, docs) {
        //console.log(JSON.stringify(docs));
        if (docs.length > 0) res.json(200, docs[0]);
        else res.json(404, {});
    })
});


// get all items from the model
app.get('/model/:collection', function(req, res) {
    var collection = db.get(req.params.collection);
    //console.log("app.get -- req.user=" + JSON.stringify(req.user));
    collection.find({
        openID: req.user.openID
    }, {}, function(e, docs) {
        //console.log(JSON.stringify(docs));
        res.json(200, docs);
		//var mdocs = convertToText(docs);
		//res.format({'text/plain': function(){res.send(JSON.stringify(mdocs))}});
    })
});

function convertToText(docs){
	var result=[];
    for(var i=0; i<docs.length; i++){
		var d = docs[i];
    	//result.push({id:d._id, userID:d.userID,level:d.level,age:d.age,mode:d.mode,time:d.time,gameVersion:d.gameVersion});
		var header = {id:d._id, userID:d.userID,level:d.level,age:d.age,mode:d.mode,time:d.time,gameVersion:d.gameVersion};
		var headerString = JSON.stringify(header);
		var j=0;
		while(j<d.log.length){
			var a1=d.log[j];
			
			if (a1.action=="keypress") {  // pressing key when no fish is there!
				var a2=a1;
				a1={time:0, id:0, visual:"nofish", audio:"nofish", side:"nofish"};
				//console.log(JSON.stringify(a1)+" "+JSON.stringify(a2));console.dir(a2);
				var trial =d._id+" "+d.userID+" "+d.level+" "+d.age+" "+d.mode+" "+d.time+" "+
				a1.time+" "+a1.id+" "+" "+a1.visual+" "+a1.audio+" "+a1.side+" "+
				a2.action+" "+a2.time+" "+a2.reaction+" "+a2.key+" "+a2.correct+" "+a2.consistent;
				result.push(trial);
				j += 1;
			}
			else {
				var a2=(j+1<d.log.length)?d.log[j+1]:{};
				var trial =d._id+" "+d.userID+" "+d.level+" "+d.age+" "+d.mode+" "+d.time+" "+
					a1.time+" "+a1.id+" "+" "+a1.visual+" "+a1.audio+" "+a1.side+" "+
					a2.action+" "+a2.time+" "+a2.reaction+" "+a2.key+" "+a2.correct+" "+a2.consistent;
					result.push(trial);
				j+=2;
			}
			
		}	
    }

	return result;
}
// change an item in the model
app.put('/model/:collection/:id', function(req, res) {
    var collection = db.get(req.params.collection);
    collection.update({
        "_id": req.params.id
    }, req.body);
    res.json(200, {});
});

// add new item to the model
// in this example we show how to use javascript promises
// to simply asynchronous calls
app.post('/model/:collection', function(req, res) {
    //console.log("post ... " + JSON.stringify(req.body));
    //console.log("post req.user=" + JSON.stringify(req.user));
    var collection = db.get(req.params.collection);
    var newItem = req.body;
    newItem.openID = req.user.openID;
    //console.log("post2 ... " + JSON.stringify(newItem));
    var promise = collection.insert(newItem);
    promise.success(function(doc) {
        res.json(200, doc)
    });
    promise.error(function(error) {
        res.json(404, error)
    });
});

// delete a particular item from the model
app.delete('/model/:collection/:id', function(req, res) {
    var id = req.params.id;
    //console.log("deleting " + id);
    var collection = db.get(req.params.collection);
    collection.remove({
        _id: id
    });
    res.json(200, {});
});



//**********************************************************
// Finally we assign the server to a port ....
//**********************************************************
var port = 4000;
app.listen(port, function() {
    console.log("server is listening on port " + port);
});
