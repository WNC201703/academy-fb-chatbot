const express = require('express');
const router = express.Router();
require("dotenv").config();
const request = require('request');
const { getCoursesByKeyword, getCategories, getCoursesByCategory } = require('../utils/api.helper');

const payloadType = {
  SEARCH_BY_KEYWORD: 'SEARCH_BY_KEYWORD',
  GET_COURSES_BY_CATEGORY: 'GET_COURSES_BY_CATEGORY',
  VIEW_COURSE_DETAILS: 'VIEW_COURSE_DETAILS'
}

const responseMenu = {
  'attachment': {
    'type': 'template',
    'payload': {
      'template_type': 'generic',
      'elements': [{
        'title': 'Chọn 1 trong các lựa chọn bên dưới?',
        'subtitle': 'Tap a button to answer.',
        'buttons': [
          {
            'type': 'postback',
            'title': 'Tìm khoá học theo từ khoá',
            'payload': payloadType.SEARCH_BY_KEYWORD,
          },
          {
            'type': 'postback',
            'title': 'Duyệt khoá học theo danh mục',
            'payload': payloadType.GET_COURSES_BY_CATEGORY,
          },
          {
            'type': 'postback',
            'title': 'Xem chi tiết khoá học',
            'payload': payloadType.VIEW_COURSE_DETAILS,
          }
        ],
      }]
    }
  }
}

// Adds support for GET requests to our webhook
router.get('/', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  console.log(VERIFY_TOKEN);
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  console.log(mode, token, challenge);
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for your webhook
router.post('/', (req, res) => {
  let body = req.body;

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      console.log(entry);
      // Gets the body of the webhook event
      let webhookEvent = entry.messaging[0];

      // Get the sender PSID
      let senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {

    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});


// Handles messages events
async function handleMessage(senderPsid, receivedMessage) {
  if (receivedMessage.text && receivedMessage.text.toLowerCase().search('search:') === 0) {
    const keyword = receivedMessage.text.substring(7);
    await handleGetCoursesByKeyword(senderPsid, keyword);
    return;
  }
  callSendAPI(senderPsid, responseMenu);
}

// Handles messaging_postbacks events
async function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  let payload = receivedPostback.payload;

  if (payload.search('category:') === 0) {
    const categoryId = receivedMessage.text.substring(9);
    await sendCoursesByCategory(senderPsid, categoryId);
    return;
  }

  if (payload === payloadType.SEARCH_BY_KEYWORD) {
    response = { 'text': 'Để tìm khoá học theo từ khoá, bạn gõ "search:<TÊN KHOÁ HỌC>". Ví dụ: search:lập trình web' };
  } else if (payload === payloadType.GET_COURSES_BY_CATEGORY) {
    await sendCategories(senderPsid);
    return;
  } if (payload === payloadType.VIEW_COURSE_DETAILS) {
    response = { 'text': 'View course details' };
  }
  // Send the message to acknowledge the postback
  callSendAPI(senderPsid, response);
}

async function handleGetCoursesByKeyword(senderPsid, keyword) {
  try {
    const _response = await getCoursesByKeyword(keyword);
    let results = _response.data.results;
    sendCourses(senderPsid, results);
  }
  catch (err) {
    console.error(err);
  }
}

async function sendCategories(senderPsid) {
  try {
    const _response = await getCategories();
    let results = _response.data;
    const buttons = [];
    results.forEach(element => {
      buttons.push(
        {
          'type': 'postback',
          'title': `${element.name}`,
          'payload': `category:${element._id}`,
        }
      );
    });
    console.log(JSON.stringify(buttons));
    console.log(JSON.parse(JSON.stringify(buttons)));
    const response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': `Tìm kiếm khoá học theo danh mục`,
            'subtitle': `Chọn một trong các lựa chọn bên dưới`,
            'buttons': JSON.parse(JSON.stringify(buttons))
          }]
        }
      }
    };
    callSendAPI(senderPsid, response);
    return;
  } catch (err) {
    console.error(err);
  }
}

async function sendCoursesByCategory(senderPsid,categoryId) {
  try {
    const _response = await getCoursesByCategory(categoryId);
    let results = _response.data.results;
    sendCourses(senderPsid,results)      
  } catch (err) {
    console.error(err);
  }
}

function sendCourses(senderPsid, results) {
  results.forEach(element => {
    const response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': `${element.name}`,
            'subtitle': `${element.shortDescription}`,
            'image_url': `${element.imageUrl}`,
            'buttons': [
              {
                'type': 'postback',
                'title': 'Xem chi tiết!',
                'payload': 'view_detail',
              },
            ]
          }]
        }
      }
    };
    callSendAPI(senderPsid, response);
    return;
  });
}

// Sends response messages via the Send API
function callSendAPI(senderPsid, response) {

  // The page access token we have generated in your app settings
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // Construct the message body
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };

  // Send the HTTP request to the Messenger Platform
  request({
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, _res, _body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}


module.exports = router;
