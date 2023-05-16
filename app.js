"use strict";
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const app = express();
const http = require('https').createServer(app)
const io = require('socket.io')(http)
const PORT = 8080;
const HOST = '0.0.0.0';
const sequelize = require('./pg/database');
const User = require("./models/User");
const bcrypt = require("bcrypt");



http.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});
// Подключение файла конфигурации Passport
require('./passport/passport-config')(passport);

// Настройка сессии и Passport
app.use(session({ secret: 'cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Маршруты для аутентификации
app.post('/login', passport.authenticate('local', {
    successRedirect: '/success',
    failureRedirect: '/failure'
}));

app.get("/" , function(){ console.log("check /") });

app.get('/success', (req, res) => {
    console.log("Login successful")
    res.send('Login successful');
});

app.get('/failure', (req, res) => {
    console.log("Login failed")
    res.send('Login failed');
});

app.post('/register', function(req, res) {
    const {  nickname, password } = req.body;

    // Проверка имени пользователя
    if (!nickname || nickname.length < 3 || nickname.length > 20) {
        return res.status(400).json({ message: 'Имя пользователя должно содержать от 3 до 20 символов' });
    }

    // Проверка пароля
    if (!password || password.length < 6 || password.length > 50) {
        return res.status(400).json({ message: 'Пароль должен содержать от 6 до 50 символов' });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
    User.create({ nickname: req.body.nickname, password: hashedPassword })
        .then(user => res.json(user))
        .catch(err => res.status(500).json(err));
});
sequelize.sync()
    .then(() => console.log('Синхронизация моделей с базой данных успешно выполнена'))
    .catch(err => console.error('Ошибка синхронизации моделей с базой данных:', err));

io.on("connection", (socket) => {
    const usersSocket = [];
    for (let [id,username] of User.getAllUsers()) {
        usersSocket.push({
            id:id,
            username:username,
        });
    }
    socket.emit("users", usersSocket);
    // ...
});

io.on("private message", ({ content, to }) => {
    io.socket.to(to).emit("private message", {
        content,
        from: io.socket.id,
    });
});