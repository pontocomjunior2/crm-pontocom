const fs = require('fs');
const path = require('path');

function checkFile(file) {
    const code = fs.readFileSync(file, 'utf8');
    try {
        // Use Function constructor to check for syntax errors
        new Function(code);
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log(`\n!!! SYNTAX ERROR in ${file}:`);
            console.log(e.message);
            // Try to find the line
            const lines = code.split('\n');
            // SyntaxError message usually doesn't give line number in Function constructor
            // but we can try to find unmatched braces or similar
        }
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            if (f !== 'node_modules' && f !== '.next' && f !== 'dist') walk(full);
        } else if (f.endsWith('.js')) {
            checkFile(full);
        }
    });
}

const targetDir = 'd:/Projetos/crm-pontocom/backend';
console.log(`Scanning ${targetDir} for syntax errors...`);
walk(targetDir);
console.log('Done scanning.');
