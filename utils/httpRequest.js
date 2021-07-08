const request = require('request');
const accessToken = process.env.PAGE_ACCESS_TOKEN;

function postRequest(uri, requestBody) {
    console.log(`post request ${uri}`)
    request({
        'uri': `${uri}?access_token=${accessToken}`,
        'method': 'POST',
        'json': requestBody
    }, (err, _res, _body) => {
        if (!err) {
            console.log('post request: successfully!');
        } else {
            console.error('Unable to post request:' + err);
        }
    });
}


module.exports = {
    postRequest,
}
