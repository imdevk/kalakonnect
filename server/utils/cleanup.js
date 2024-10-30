// // utils/cleanup.js
// const fs = require('fs').promises;
// const path = require('path');

// const cleanupTempFiles = async () => {
//     const tempDir = path.join(__dirname, '..', 'public', 'uploads', 'temp');

//     try {
//         const files = await fs.readdir(tempDir);

//         // Get current time
//         const now = Date.now();

//         // Delete files older than 1 hour
//         const deletePromises = files.map(async (file) => {
//             const filePath = path.join(tempDir, file);
//             try {
//                 const stats = await fs.stat(filePath);
//                 if (now - stats.mtimeMs > 60 * 60 * 1000) { // 1 hour
//                     await fs.unlink(filePath);
//                     console.log(`Deleted old temp file: ${file}`);
//                 }
//             } catch (err) {
//                 console.log(`Could not process file ${file}:`, err.message);
//             }
//         });

//         await Promise.all(deletePromises);
//     } catch (err) {
//         console.error('Error cleaning up temp files:', err);
//     }
// };

// // Run cleanup every hour
// setInterval(cleanupTempFiles, 60 * 60 * 1000);

// // Export for manual running
// module.exports = cleanupTempFiles;