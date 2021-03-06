// app/routes.js
var ImageModel = require('./models/images.js')
var User = require('./models/user.js');

module.exports = function(app, passport) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/', function(req, res) {
    res.render('index.ejs', {
      user : req.user, // get the user out of session and pass to template
      failureFlash : true, // allow flash messages
      message: req.flash('signupMessage')
    }); // load the index.ejs file
  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get('/login', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));
  // =====================================
  // PROFILE SECTION =====================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user : req.user // get the user out of session and pass to template
    });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/userCheck', isLoggedIn, function(req, res) {
    res.render('index.ejs', {
      user : req.user,
      message: " " // get the user out of session and pass to template
    }); // load the index.ejs file
  });



  app.get('/images', function(req, res, next) {

    ImageModel.find({}).limit(20).exec(
      function (err, data) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.json(data);
    }
    )
  });

  app.post('/file-upload', function(req, res, next) {
    console.log(req.body)
    var userIdentification = req.user._id
    var image = req.body.pics
    var questionF = req.body.questions
    var newDocument = new ImageModel( { outfit: image, question: questionF, likes: 0, dislikes: 0 } );
    newDocument.save(function(err) { if( err ) throw new Error( 'There was an error while saving to the database.' ) })
    console.log("--------------")
    console.log(newDocument._id)
    console.log("userid")
    console.log(userIdentification)
    var newPictureId = {
      pictureID: newDocument._id
    };
    User.update({ _id: userIdentification}, {$push: { pictures : newPictureId }}, function(err, data) {
          if (err) { console.log(err) }
      });

    });


    app.post('/comments', function(req, res, next) {
      console.log("testing to see if I can get user")
      console.log(req.user._id)
      var textServer = req.body.text
      console.log(textServer)
      var newComment = {
      note: textServer.note,
      date: textServer.date
    };
    console.log(req.body.picID)
    console.log(newComment)
      ImageModel.update({ _id: req.body.picID}, {$push: { comments : newComment }}, {upsert:true}, function(err, data) {
          if (err) { console.log(err) }
      });
    });

    app.post('/like', function(req, res, next) {
      console.log(req.body)
      ImageModel.update({ _id: req.body.picID }, { $inc: { likes: 1 }}, { upsert: true }, function(err) {
      if (err) { console.log(err) }
      })
    });


    app.post('/dislike', function(req, res, next) {
      console.log(req.body)
      ImageModel.update({ _id: req.body.picID }, { $inc: { dislikes: 1 }}, { upsert: true }, function(err) {
      if (err) { console.log(err) }
      })
    });

    app.get('/findMyPics', function(req, res, next) {
      User.find({_id: req.user._id}).exec(
      function (err, data) {
        if (err) {
            console.log(err);
            return next(err);
        }
        var idArray = [];
        var pictureData = data[0].pictures
        for (var i = 0; i<pictureData.length; i++) {
          idArray.push(pictureData[i].pictureID)
        }

        ImageModel.find({
          _id: { $in: idArray}
          }, function(err, docs){
           console.log(docs);
           res.json(docs)
         });
      }
      )
    });

    app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });






};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.json({check: "nope"})
  }

  // if they aren't redirect them to the home page

}




