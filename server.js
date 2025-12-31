import app from './app.js'
import path from 'path'
import { runMigrations } from './src/utils/dbMigrate.js';


const tryListen = (port) => {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            tryListen(port + 1);
        } else {
            console.error('Server failed to start:', err);
        }
    });
};

const startServer = async () => {
    try {
        console.log("Cloudinary Config Check:");
        console.log(`- CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'MISSING'}`);
        console.log(`- CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Present' : 'MISSING'}`);
        console.log(`- CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'Present' : 'MISSING'}`);

        // Run DB Migrations
        await runMigrations();
        const initialPort = parseInt(process.env.PORT || 10000);
        tryListen(initialPort);
    } catch (error) {
        console.error('Startup error:', error);
    }
};

startServer();