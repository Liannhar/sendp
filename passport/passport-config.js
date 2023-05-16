const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('../pg/database');

module.exports = (passport) => {
    passport.use(
        'local-login',
        new LocalStrategy(
            {
                usernameField: 'nickname',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    if (result.rows.length > 0) {
                        const user = result.rows[0];
                        if (await bcrypt.compare(password, user.password)) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Incorrect password.' });
                        }
                    } else {
                        const hashedPassword = await bcrypt.hash(password, 10);
                        const newUser = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', [email, hashedPassword]);
                        return done(null, newUser.rows[0]);
                    }
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            done(null, result.rows[0]);
        } catch (err) {
            done(err);
        }
    });
};