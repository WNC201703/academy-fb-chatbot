const { postRequest } = require('../utils/httpRequest')
const { payloadType } = require('../utils/constant')
const { messengerUri } = require('../utils/constant')
const { getCoursesByKeyword, getCategories, getCoursesByCategory } = require('../utils/api.helper');

function setupPersistentMenu(senderPsid) {
    const requestBody = {
        'psid': senderPsid,
        "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": false,
                "call_to_actions": [
                    {
                        "type": "postback",
                        "title": "Tìm khoá học theo từ khoá",
                        "payload": payloadType.SEARCH_BY_KEYWORD
                    },
                    {
                        "type": "postback",
                        "title": "Duyệt khoá học theo danh mục",
                        "payload": payloadType.GET_COURSES_BY_CATEGORY
                    },
                    {
                        "type": "web_url",
                        "title": "Đăng ký học ngay",
                        "url": "https://www.google.com/",
                        "webview_height_ratio": "full"
                    }
                ]
            }
        ]
    };
    console.log('setup persistent_menu');
    postRequest(messengerUri.CUSTOM_USER_SETTINGS, requestBody);
}



async function handleMessage(senderPsid, receivedMessage) {
    console.log('handle',receivedMessage.text,receivedMessage.text.toLowerCase().search('#'));
    if (receivedMessage.text && receivedMessage.text.toLowerCase().search('#') === 0) {
        const keyword = receivedMessage.text.substring(7);
        await handleGetCoursesByKeyword(senderPsid, keyword);
        return;
    }
}

async function handleGetCoursesByKeyword(senderPsid, keyword) {
    console.log('handleGetcoursesByKeyword');
    try {
        const _response = await getCoursesByKeyword(keyword);
        let results = _response.data.results;
        sendCourses(senderPsid, results);
    }
    catch (err) {
        console.error(err);
    }
}

function sendCourses(senderPsid, results) {
    const elements = [];
    results.forEach(element => {
        elements.push({
            'title': `${element.name} (${element.numberOfReviews} reviews)`,
            'subtitle': `${element.shortDescription}`,
            'image_url': `${element.imageUrl}`,
            'buttons': [
                {
                    "title": "Join Now",
                    "type": "web_url",
                    "url": `https://www.google.com/search?q=${element.name}`,
                    "messenger_extensions": false,
                    "webview_height_ratio": "tall"
                }
            ]
        });
    });

    const requestBody = {
        "recipient": {
            "id": `${senderPsid}`
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "list",
                    "top_element_style": "compact",
                    "elements": elements
                }
            }
        }
    };
    postRequest(messengerUri.MESSAGES, requestBody);
    return;
}

async function handlePostback(senderPsid, receivedPostback) {
    let payload = receivedPostback.payload;
    console.log('payload', payload);
    switch (payload) {
        case payloadType.SEARCH_BY_KEYWORD:
            const requestBody = {
                "recipient": {
                    "id": senderPsid
                },
                "message": { 'text': 'Để tìm khoá học theo từ khoá, bạn gõ "#<TÊN KHOÁ HỌC>". Ví dụ: #react' }
            }
            postRequest(messengerUri.MESSAGES,requestBody);
            return;
        case payloadType.GET_COURSES_BY_CATEGORY:
            return;

        case payloadType.VIEW_COURSE_DETAILS:
            return;

        case payloadType.GET_STARTED:
            setupPersistentMenu(senderPsid);
            return;
    }

    if (payload.search('category:') === 0) {
        const categoryId = receivedMessage.text.substring(9);
        await sendCoursesByCategory(senderPsid, categoryId);
        return;
    }
}

function getStarted() {
    const requestBody = {
        "get_started": {
            "payload": payloadType.GET_STARTED
        }
    }
    postRequest(messengerUri.MESSENGER_PROFILE, requestBody);
}

function setupWhitelistedDomains() {
    const requestBody = {
        "whitelisted_domains": [
            "https://google.com"
        ]
    };
    postRequest(messengerUri.MESSENGER_PROFILE, requestBody);
}

module.exports = {
    getStarted,
    setupWhitelistedDomains,
    setupPersistentMenu,
    handleMessage,
    sendCourses,
    handlePostback
}