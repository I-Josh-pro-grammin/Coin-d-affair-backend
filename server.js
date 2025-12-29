import app from './app.js'
import path from 'path'
import { runMigrations } from './src/utils/dbMigrate.js';


const PORT = process.env.PORT || 10000;

const startServer = async () => {
    try {
        // Run DB Migrations
        await runMigrations();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
        });
    } catch (error) {
        console.error('Startup error:', error);
    }
};

startServer();