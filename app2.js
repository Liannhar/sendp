const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const {compare, genSalt, hash} = require("bcrypt");

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

const Room = sequelize.define('Rooms',{
    firstNickname:Sequelize.STRING,
    secondNickname:Sequelize.STRING,
})

const Message = sequelize.define('Message',{
    idRoom:Sequelize.INTEGER,
    sander:Sequelize.STRING,
    type:Sequelize.STRING,
    message:Sequelize.JSON,
    length:Sequelize.INTEGER
})

// Sync database
sequelize.sync();

app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
});
app.get('/rooms', async (req, res) => {
    const { myNickname,nickname } = req.query;
    try {
        Room.findOne({
            where: {
                [Op.or]: [
                    { firstNickname: myNickname, secondNickname: nickname },
                    { firstNickname: nickname, secondNickname: myNickname },
                ],
            },
        })
            .then(async room => {
                if (!room) {
                    room = Room.create({
                        firstNickname: myNickname,
                        secondNickname: nickname
                    }).then(res => {
                        console.log(res);
                        console.log("Room create successful")
                    }).catch(err => console.log(err));
                }
                console.log("find Room")
                res.json(await room);
            })
            .catch(err => console.log(err));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении комнат' });
    }
});

app.get('/messages', async (req, res) => {
    const { id } = req.query;
    try {
        const messages = await Message.findAll({
            where: { idRoom: id || '' }
        });
        console.log("find massages")
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении сообщений' });
    }
});


// Configure Passport
passport.use("local",new LocalStrategy( (nickname, password, done) => {
    User.findOne({ where: { nickname: nickname } }).then(async user => {
        if (!user) {
            //const newUser = User.create(nickname,hashedPassword);
            console.log("start user")
            User.beforeCreate(async (user) => {
                const salt = await genSalt(10);
                user.password = await hash(user.password, salt);
                console.log("password salt")
            });
            User.create({
                nickname: nickname,
                password:password
            }).then(res=>{
                console.log("Create successful");
                return done(null, res);
            }).catch(err=>{console.log(err)
                return done(null, false, "Incorrect");});

        }else{
            compare(password,user.password , function(err, result) {
                if (result) {
                    console.log("Correct Password")
                } else {
                    console.log("Incorrect Password")
                    return done(null, false, "Incorrect password");
                }
            });
            console.log(user.nickname+" OK User")
            return done(null, user);
        }

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
    res.send('Hello!');
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

app.get('/logout', (req, res) => {
    console.log("Logout");
    req.logout();
    res.redirect('/');
});


const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server)

io.on('connection', (socket) => {
    let currentRoom;
    socket.on('joinRoom', (data) => {
        Room.findOne({
            where: {
                [Op.or]: [
                    { firstNickname: data.first, secondNickname: data.second },
                    { firstNickname: data.second, secondNickname: data.first },
                ],
            },
        })
            .then(async room => {
                if (!room) {
                    room = Room.create({
                        firstNickname: data.first,
                        secondNickname: data.second
                    }).then(res => {
                        console.log("Room create successful")
                    }).catch(err => console.log(err));
                }
                console.log("join")
                currentRoom =room.id
                socket.join(currentRoom.toString())
            })
            .catch(err => console.log(err));
    });
    socket.on('private_chat', (data) => {
        Message.create({
            idRoom:currentRoom,
            sander:data.first,
            type:data.type,
            message:JSON.stringify({ message:data.message}),
        }).then(res => {
            console.log("Message create successful");
            console.log("Sand message");
            console.log(currentRoom);
            io.to(currentRoom.toString()).emit('private_chat', data.type,res.message, data.first,data.length);
        }).catch(err => console.log(err));

    });

});

// Start server
const port = process.env.PORT || 3000;


server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);

});