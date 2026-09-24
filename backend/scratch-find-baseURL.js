const fs = require('fs');
const files = fs.readdirSync('iex_js2');
for (const file of files) {
    if (file.endsWith('.js')) {
        const text = fs.readFileSync('iex_js2/' + file, 'utf8');
        if (text.includes('62829:')) {
            const index = text.indexOf('62829:');
            console.log(text.substring(index, index + 1000));
        }
    }
}
