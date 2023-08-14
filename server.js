/*********************************************************************************
* WEB322 – Assignment 06

* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part

* of this assignment has been copied manually or electronically from any other source

* (including 3rd party web sites) or distributed to other students.

*

* Name: _____Simran Saini_________________ Student ID: __167685213____________ Date: ________08/13/2023________

*

* Cyclic Web App URL: https://nice-puce-fox-boot.cyclic.app/blog

*

* GitHub Repository URL: https://github.com/Saini-Simran/web322-app
*
 *
 ********************************************************************************/

var express = require("express");
var path = require("path");
var blog = require("./blog-service");
var app = express();
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
//const { title } = require("process");
var HTTP_PORT = process.env.PORT || 8080;

//setting the cloudinary config to my name
cloudinary.config({
  cloud_name:'dnw6wnzfv',
  api_key:'426271796116721',
  api_secret:'JogClj0ja6WEp9HcDZSlNLV3wgQ',
  secure: true
})

//upload variable without disk storge
const upload = multer({
  storage: multer.memoryStorage()
});


app.engine(".hbs",exphbs.engine({
                                  extname: '.hbs',
                                  helpers: {
                                    navLink: function(url, options){
                                              return '<li' + 
                                              ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                                              '><a href="' + url + '">' + options.fn(this) + '</a></li>';
                                              },

                                              //custom helper
                                              equal: function (lvalue, rvalue, options) {
                                                if (arguments.length < 3)
                                                throw new Error("Handlebars Helper equal needs 2 parameters");
                                                if (lvalue != rvalue) {
                                                  return options.inverse(this);
                                                } else {
                                                  return options.fn(this);
                                                }
                                              },
                                              safeHTML: function(context){
                                                return stripJs(context);
                                              },
                                              formatDate: function(dateObj){
                                                let year = dateObj.getFullYear();
                                                let month = (dateObj.getMonth() + 1).toString();
                                                let day = dateObj.getDate().toString();
                                                return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
                                              }                                                                                        
                                            }
                                          }));
                                          
app.set('view engine','.hbs');

//using a static file
app.use(express.static('public'));

//will add active route to app.local
app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: "session",
    secret: "blargadeeblargblarg",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
  })
);

const ensureLogin = (req, res, next) => {
  if (res.locals.session.user) {
    return next();
  }
  res.redirect("/login");
};

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});



app.post("/Posts/add",ensureLogin,upload.single("featureImage"), (req,res) =>{
  if(req.file){
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
                  } else {
                    reject(error);
                    }
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }

    upload(req).then((uploaded)=>{
      processPost(uploaded.url);
    });
  }else{
    processPost("");
}
 
function processPost(imageUrl){
    req.body.featureImage = imageUrl;

    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
    blog.addPost(req.body).then(()=>{
      res.redirect('/')
    }).catch((err)=>{
      res.redirect('/Posts');
    })
} 

})


// call this function after the http server starts listening for requests
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
  }
   
  
  // setup a 'route' to redirect to other URL
  app.get("/", function(_req,res){
      res.redirect('/blog');
  });
  
  // setup another route to listen on /about
  app.get("/about", function(_req,res){
      // res.sendFile(path.join(__dirname,"/views/about.html"));
      res.render("about");
  });

  // setup another route to listen on /blog
  app.get("/Blog", async(req,res)=>{
    let viewData = {};
    try {
      let posts = [];
  
      if (req.query.category) {
        posts = await blog.getPublishedPostsByCategory(req.query.category);
      } else {
        posts = await blog.getPublishedPosts();
      }
  
      posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
  
      let post = posts[0];
  
      viewData.posts = posts;
      viewData.post = post;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      let categories = await blog.getCategories();
  
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    res.render("blog", { data: viewData });

  });

  app.get('/blog/:id', async (req, res) => {

    let viewData = {};

  try {
    let posts = [];

    if (req.query.category) {
      posts = await blog.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog.getPublishedPosts();
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.post = await blog.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await blog.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("blog", { data: viewData });
});
  
  //route to send file addPost.html
  app.get("/posts/add",ensureLogin,function(req,res){
    // res.sendFile(path.join(__dirname,"/views/addPost.html"))
    blog
    .getCategories()
    .then((data) => res.render("addPost", { categories: data }))
    .catch(() => res.render("addPost", { categories: [] }));
  })

  app.get("/posts/delete/:id", ensureLogin,(req, res) => {
    blog
      .deletePostById(req.params.id)
      .then(() => res.redirect("/posts"))
      .catch(() =>
        res.status(500).send("Unable to Remove Category / Category not found)")
      );
  });

  
  // setup another route to listen on /posts
  app.get("/posts", ensureLogin,function(req,res){
    const category = req.query.category;
    const minDate = req.query.minDate;
 
    if(category){
      blog.getPostByCategory(category)
      .then((post) =>{
      post.length > 0?
       res.render("posts",{posts: post}):res.render("posts",{message: "No Results"});
      }).catch((err)=>{
        res.render("posts",{message: "No Results"});
      })
    }
    else if(minDate){
      blog.getPostsByMinDate(minDate).then((post)=>{
        post.length > 0?
        res.render("posts",{posts: post}):res.render("posts",{message: "No Results"});
        }).catch((err)=>{
          res.render("posts",{message: "No Results"});
        })
    }
    else{
      blog.getAllPosts() .then((data) => {
        data.length > 0
          ? res.render("posts", { posts: data })
          : res.render("posts", { message: "No Results" });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
    }
  });


  app.get("/categories/add", ensureLogin,(_req, res) => {
    res.render("addCategories");
  });

  app.post("/categories/add", ensureLogin,(req, res) => {
    blog.addCategory(req.body).then(() => res.redirect("/categories"));
  });
  
  app.get("/categories/delete/:id", ensureLogin,(req, res) => {
    blog.deleteCategoryById(req.params.id)
      .then(() => res.redirect("/categories"))
      .catch(() =>
        res.status(500).send("Category not found/Category not removed")
      );
  });
  
  // setup another route to listen on /Categories
  app.get("/Categories", ensureLogin,function(req,res){
    blog.getCategories().then(data =>{
        data.length > 0?
        res.render("categories",{categories: data}):res.render("categories",{message: "No Results"})
    }).catch(()=>{
        res.render("categories",{message: "no result"})
    })
  });



  app.get("/login", (req, res) => {
    res.render("login");
  });
  
  app.get("/register", (req, res) => {
    res.render("register");
  });
  
  app.post("/register", (req, res) => {
    authData
      .registerUser(req.body)
      .then(() => res.render("register", { successMessage: "User created" }))
      .catch((err) =>
        res.render("register", { errorMessage: err, userName: req.body.userName })
      );
  });
  
  app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData
      .checkUser(req.body)
      .then((user) => {
        req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory,
        };
        res.redirect("/posts");
      })
      .catch((err) =>
        res.render("login", {
          errorMessage: err,
          userName: req.body.userName,
        })
      );
  });
  
  app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
  });
  
  app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
  });
  
  // setup error page
  app.use((req, res) => {
    res.status(404).send("Page Not Found") 
  })
  
  // setup http server to listen on HTTP_PORT
  blog.initialize()
  .then(authData.initialize)
  .then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Express http server listening on ${PORT}`);
    });
  })
  .catch((e) => {
    console.error("An error occurred while initializing the server", e);
  });
