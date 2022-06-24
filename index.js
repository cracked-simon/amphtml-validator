const amphtmlValidator = require('amphtml-validator');
const fetch = require('node-fetch');
const fs = require('fs');
const colors = require('colors');
const URLObject = require('url').URL;

function* chunks(arr, n) {
    for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}

let rawUrls = '';
try {
     rawUrls = fs.readFileSync('./urls.txt', {encoding:'utf8', flag:'r'});
} catch (e) {
    console.log('ERROR: Unable to read url.txt'.red);
    process.exit();
}

rawUrls = rawUrls.split("\n");
let urlChunks = [...chunks(rawUrls, 10)];

let passed = [];
let failed = [];

console.log('AMP HTML Batch Validator');
console.log(`- total urls: ${rawUrls.length}`);
console.log('- starting ...');

amphtmlValidator.getInstance().then(async validator => {
    console.log('-- validator loaded');

    for (let i = 0, j = urlChunks.length; i < j; i++) {
        console.log('-- chunking 10 urls');

        let urls = urlChunks[i];

        await Promise.all(urls.map(url => {
            try {
                new URLObject(url);
            } catch (err) {
                console.log(err);
                process.exit();
            }

            return fetch(url)
                .then(res => res.text())
                .then(body => {
                    const result = validator.validateString(body);
        
                    if (result.status === 'PASS') {
                        passed.push({ 'url': url, 'status': 'PASS' });
                    } else {
                        let errors = [];
                        
                        result.errors.forEach(error => {
                            let msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
                            if (error.specUrl !== null) {
                                msg += ' (see ' + error.specUrl + ')';
                            }
        
                            errors.push(msg);
                        });
        
                        failed.push({
                            'url': url,
                            'errors': errors
                        });
                    }            
                })
            }
        ));
    }

    fs.writeFileSync('passed.json', JSON.stringify(passed));
    fs.writeFileSync('failed.json', JSON.stringify(failed));
    
    console.log(`PASSED: ${passed.length} - passed.json`.green);
    console.log(`FAILED: ${failed.length} - failed.json`.brightRed);
});