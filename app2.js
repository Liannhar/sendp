const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
//const {hash} = require("bcrypt");

const app = express();

// Configure database connection
const sequelize = new Sequelize('crypto_database', 'crypto_database_user', 'oDK1n15do9Z2le7lcq00Lp9z707Pl7pA', {
    host: 'dpg-ch607vu7avj6q56ibo40-a.frankfurt-postgres.render.com',
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
        },
    },
});

// Define User model
const User = sequelize.define('User', {
    nickname: Sequelize.STRING,
    password: Sequelize.STRING,
});

// Sync database
sequelize.sync();

/*try
       const result = await query('SELECT * FROM users WHERE nickname = $1', [nickname]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await query('INSERT INTO users (nickname, password) VALUES ($1, $2) RETURNING *', [nickname, hashedPassword]);
            return done(null, newUser.rows[0]);
        }
    } catch (err) {
        return done(err);
    }*/

// Configure Passport
passport.use("local",new LocalStrategy((nickname, password, done) => {
    User.findOne({ where: { nickname: nickname } }).then(user => {
        if (!user) {
            //const hashedPassword = hash(password, 10).toString();
            //const newUser = User.create(nickname,hashedPassword);
            const newUser = User.create({
                nickname: nickname,
                password:password
            }).then(res=>{
                console.log(res);
                console.log("Create successful")
            }).catch(err=>console.log(err));
            console.log(newUser.nickname+" OK new User")
            return done(null, newUser);
        }
        if (user.password !== password) {
            console.log("Incorrect")
            return done(null, false, "Incorrect password.");
        }
        console.log(user.nickname+" OK User")
        console.log("Where")
        return done(null, user);
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id).then(user => {
        done(null, user);
    });
});

// Configure Express
app.use(session({ secret: 'cat_crypto', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Define routes
app.get('/', (req, res) => {
    res.send('W');
});

app.get('/login', (req, res) => {
    res.send('You are login');
});

class LoginResponse {
    constructor(user) {
        this.nickname = user.nickname;
        this.token = user.token;
    }
}
app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle the case when the user is not found or the password is incorrect
            return res.status(401).json(info);
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            // Create a new LoginResponse object with the user's information.
            const loginResponse = new LoginResponse(req.user);

            // Send the LoginResponse object as the response.
            res.json(loginResponse);
        });
    })(req, res, next);
});
/*
app.post('/login', passport.authenticate('local'), (req, res) => {
    // If this function is called, authentication was successful.
    // `req.user` contains the authenticated user.

    // Create a new LoginResponse object with the user's information.
    const loginResponse = new LoginResponse(req.user);

    // Send the LoginResponse object as the response.
    res.json(loginResponse);
});
*/

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});