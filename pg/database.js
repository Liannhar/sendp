/*"use strict";
let {Sequelize} = require('sequelize');

let sequelize = new Sequelize('crypto_database', 'crypto_database_user', 'oDK1n15do9Z2le7lcq00Lp9z707Pl7pA', {
    host: 'dpg-ch607vu7avj6q56ibo40-a.frankfurt-postgres.render.com',
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
        },
    },
});


module.exports = sequelize;*/

const { Pool } = require('pg');

const pool = new Pool({
    user: 'crypto_database_user',
    host: 'dpg-ch607vu7avj6q56ibo40-a.frankfurt-postgres.render.com',
    database: 'crypto_database',
    password: 'oDK1n15do9Z2le7lcq00Lp9z707Pl7pA',
    port: 5432,
    ssl: {
        require: true,
    },
});

module.exports = pool;