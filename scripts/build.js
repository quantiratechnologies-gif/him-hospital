const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/index.html');
const destPath = path.join(__dirname, '../index.html');
const rootDir = path.join(__dirname, '..');

let html = fs.readFileSync(srcPath, 'utf8');

// Regex to find <!-- INCLUDE path/to/file.html -->
const includeRegex = /<!-- INCLUDE\s+(.+?)\s+-->/g;

html = html.replace(includeRegex, (match, filePath) => {
    const fullPath = path.join(rootDir, filePath.trim());
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        return content;
    } catch (err) {
        console.error(`Error reading included file: ${fullPath}`);
        return match;
    }
});

fs.writeFileSync(destPath, html);
console.log('Build completed! Wrote to index.html');
