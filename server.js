/*jshint esversion: 6 */

const express = require('express');
const session = require("express-session");
const ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
const hbs = require('hbs');
const fs = require('fs');

const port = process.env.PORT || 3000;

var app = express();

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `\r\n${now}: [${req.method}] ${req.url}`;
    console.log(log);
    fs.appendFile(`server.log`, log, { encoding: `utf-8` });
    next();
});

// app.use((req, res, next) => {
//     res.render('maintainence.hbs',{});
// });

app.use(express.static(__dirname + '/public'));

app.use(session({
    cookie: { httpOnly: true },
    secret: "long random string",
    resave: false,
    saveUninitialized: true
  }));

  let oidc = new ExpressOIDC({
    issuer: "{org-url}/oauth2/default",
    client_id: "{client-id}",
    client_secret: "{secret}",
    redirect_uri: "http://localhost:3000/authorization-code/callback",
    routes: {
      callback: { defaultRedirect: "/projects" }
    },
    scope: 'openid profile'
  });

hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear().toString();
});

hbs.registerHelper('screamIt', (text) => {
    return text.toUpperCase();
});

app.use(oidc.router);

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        welcomeMessage: 'Welcome in my brand new website',
        isAuthrnticated: req.isAuthenticated(),
    });
});

app.get('/about', oidc.ensureAuthenticated(), (req, res) => {
    res.render('about.hbs', {
        pageTitle: 'About Page',
        isAuthrnticated: req.isAuthenticated(),
    });
});

app.get('/projects', oidc.ensureAuthenticated(), (req, res) => {
    res.render('projects.hbs', {
        pageTitle: 'Projects Page',
        user: req.userinfo,
        isAuthrnticated: req.isAuthenticated(),
    });
});

app.get("/logout", oidc.ensureAuthenticated(), (req, res) => {
    req.logout();
    res.redirect("/");
});

app.get('/bad', (req, res) => {
    res.send({
        errorMessage: "Unable to handle that request"
    });
});

oidc.on("ready", () => {
    app.listen(port, () => {
        console.log(`Server has started at port ${port} !`);
    });
  });

  oidc.on("error", err => {
    console.error(err);
  });

// app.listen(port, () => {
//     console.log(`Server has started at port ${port} !`);
// });