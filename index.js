const amphtmlValidator = require('amphtml-validator');
const fetch = require('node-fetch');
const fs = require('fs');
const colors = require('colors');
const URLObject = require('url').URL;
const commandLineArgs = require('command-line-args');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const options = commandLineArgs([
    {
        name: 'chunk',
        alias: 'c',
        type: Number
    },
    {
        name: 'src',
        type: String,
        defaultOption: 'urls.txt'
    },
    {
        name: 'prod-domain',
        type: String
    },
    {
        name: 'dev-domain',
        type: String
    },
    {
        name: 'username',
        type: String
    }, 
    {
        name: 'password',
        type: String
    }
]);

let chunk = options['chunk'] || 10;
let src = options['src'] || 'urls.txt';
let prodDomain = options['prod-domain'] || 'www.cracked.com';
let devDomain = options['dev-domain'] || 'www.crackeddev.com';
let username = options['username'] || null;
let password = options['password'] || null;

function* chunks(arr, n) {
    for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}

let rawUrls = '';
try {
     rawUrls = fs.readFileSync(`./${src}`, {encoding:'utf8', flag:'r'});
} catch (e) {
    console.log('ERROR: Unable to read url.txt'.red);
    process.exit();
}

rawUrls = rawUrls.trim().split("\n");
let urlChunks = [...chunks(rawUrls, chunk)];

let passed = [];
let failed = [];
let failedCSV = [];

console.log('AMP HTML Batch Validator');
console.log(`- total urls: ${rawUrls.length}`);
console.log('- starting ...');

let fetchOptions = {};
if (username != null) {
    fetchOptions = {
        headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
    };
}

amphtmlValidator.getInstance().then(async validator => {
    console.log('-- validator loaded');

    for (let i = 0, j = urlChunks.length; i < j; i++) {
        console.log('-- chunking ' + chunk + ' urls');

        let urls = urlChunks[i];

        await Promise.all(urls.map(url => {
            url = url.trim();
            try {
                new URLObject(url);
            } catch (err) {
                console.log(err);
                process.exit();
            }

            return fetch(url, fetchOptions)
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
                            'url': url.replace(prodDomain, devDomain),
                            'errors': errors
                        });

                        failedCSV.push(url.replace(prodDomain, devDomain));
                    }            
                })
                .catch(err => {
                    console.log(err);
                    process.exit();
                })
            }
        ));
    }

    fs.writeFileSync('passed.json', JSON.stringify(passed));
    fs.writeFileSync('failed.json', JSON.stringify(failed));
    fs.writeFileSync('failed-urls.txt', failedCSV.join("\n"));
    
    console.log(`PASSED: ${passed.length} - passed.json`.green);
    console.log(`FAILED: ${failed.length} - failed.json`.brightRed);
});