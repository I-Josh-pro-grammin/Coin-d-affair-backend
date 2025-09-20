
import dotenv from 'dotenv'
import app from './app.js'
import loop from './src/config/database.js'
dotenv.config()
const PORT = process.env.PORT || '5000'

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) });