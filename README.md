# amphtml-validator

## Installation
* clone the repo and run `npm install` or `yarn install`

## Usage
* create urls.txt with one url per line
* run `node index.js`

## Options
* `node index.js --chunk=20` default chunking is set to 10, can be overwritten by `--chunk=20` or `-c 20`
* `node index.js --src=failed-urls.txt` default setting reads urls.txt, but can read other files
* `node index.js --prod-domain=www.cracked.com` optional. used to search production domain and replace with dev domain
* `node index.js --dev-domain=www.crackeddev.com` optional. used to replace production domain with dev domain
* `node index.js --username=abc --password=abc` optiona. attach HTTP Basic auth to requests

## Results
* passed.json contains all urls passed the validator
* failed.json contains all failed urls with error message