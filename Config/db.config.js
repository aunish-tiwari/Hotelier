const {Pool} = require('pg');

const pool = new Pool({
    user:'zenocine',
    host:'zeno-cine.postgres.database.azure.com',
    database:'hotelier',
    password:'Abhisah@21',
    port:5432,
    ssl: {
        rejectUnauthorized: false
    }
})

module.exports = pool;