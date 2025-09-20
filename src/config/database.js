require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.DB_PORT
})

try {
    pool.on('connect',()=>{
    console.log("Database connected successfully")
})
} catch (error) {
    console.log("Database connection failed", error.message);
}

module.exports = pool;