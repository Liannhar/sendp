const { Client } = require("pg");

const client = new Client({
    host: 'dpg-ch607vu7avj6q56ibo40-a.frankfurt-postgres.render.com',
    port: 5432,
    database: 'crypto_database',
    user: 'crypto_database_user',
    password: 'oDK1n15do9Z2le7lcq00Lp9z707Pl7pA',
    ssl:true
});

client.connect((err) => {
    if (err) {
        console.error('connection error', err.stack)
    } else {
        console.log('connected')
    }
})

let returnAllUsers = function (){
    const query = ` 
 SELECT id,name 
 FROM user_table 
 `;
    return client.query(query, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        return res;
    })
}

exports.users = returnAllUsers();

module.exports = client;