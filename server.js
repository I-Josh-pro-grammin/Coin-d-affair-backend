import dotenv from 'dotenv'
import app from './app.js'
import path from 'path'

dotenv.config()
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});