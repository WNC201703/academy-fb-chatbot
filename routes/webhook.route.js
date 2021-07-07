const express = require('express');
const router = express.Router();
require("dotenv").config();
const { payloadType } = require('../utils/constant')
const { setupPersistentMenu, handleMessage } = require('../controllers/webhook.controller')

// Adds support for GET requests to our webhook
router.get('/', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
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




// Handles messaging_postbacks events
async function handlePostback(senderPsid, receivedPostback) {
  // Get the payload for the postback
  let payload = receivedPostback.payload;
  switch (payload) {
    case payloadType.SEARCH_BY_KEYWORD:
      response = { 'text': 'Để tìm khoá học theo từ khoá, bạn gõ "search:<TÊN KHOÁ HỌC>". Ví dụ: search:lập trình web' };
      return;

    case payloadType.GET_COURSES_BY_CATEGORY:
      return;

    case payloadType.VIEW_COURSE_DETAILS:
      return;

    case payloadType.GET_STARTED:
      setupPersistentMenu(senderPsid);
      return;
  }


  if (payload === payloadType.SEARCH_BY_KEYWORD) {
   
    return;
  } else if (payload === payloadType.GET_COURSES_BY_CATEGORY) {
    await sendCategories(senderPsid);
    return;
  } if (payload === payloadType.VIEW_COURSE_DETAILS) {
    response = { 'text': 'View course details' };
    return;
  }

  if (payload.search('category:') === 0) {
    const categoryId = receivedMessage.text.substring(9);
    await sendCoursesByCategory(senderPsid, categoryId);
    return;
  }

  // callSendAPI(senderPsid, response);
}


// async function sendCategories(senderPsid) {
//   try {
//     const _response = await getCategories();
//     let results = _response.data;
//     const buttons = [];
//     results.forEach(element => {
//       buttons.push(
//         {
//           'type': 'postback',
//           'title': `${element.name}`,
//           'payload': `category:${element._id}`,
//         }
//       );
//     });
//     console.log(JSON.stringify(buttons));
//     console.log(JSON.parse(JSON.stringify(buttons)));
//     const response = {
//       'attachment': {
//         'type': 'template',
//         'payload': {
//           'template_type': 'generic',
//           'elements': [{
//             'title': `Tìm kiếm khoá học theo danh mục`,
//             'subtitle': `Chọn một trong các lựa chọn bên dưới`,
//             'buttons': [
//               {
//                 'type': 'postback',
//                 'title': 'IT',
//                 'payload': 'category60c31e3a402ea31191ba72a4'
//               },
//               {
//                 'type': 'postback',
//                 'title': 'IT',
//                 'payload': 'category60c31e3a402ea31191ba72a4'
//               },
//               {
//                 'type': 'postback',
//                 'title': 'IT',
//                 'payload': 'category60c31e3a402ea31191ba72a4'
//               },
//               {
//                 'type': 'postback',
//                 'title': 'IT',
//                 'payload': 'category60c31e3a402ea31191ba72a4'
//               },
//               {
//                 'type': 'postback',
//                 'title': 'IT',
//                 'payload': 'category60c31e3a402ea31191ba72a4'
//               }
//             ]
//           }]
//         }
//       }
//     };
//     callSendAPI(senderPsid, response);
//     return;
//   } catch (err) {
//     console.error(err);
//   }
// }

// async function sendCoursesByCategory(senderPsid, categoryId) {
//   try {
//     const _response = await getCoursesByCategory(categoryId);
//     let results = _response.data.results;
//     sendCourses(senderPsid, results)
//   } catch (err) {
//     console.error(err);
//   }
// }

module.exports = router;
