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
                        "url": "http://hh-academy.herokuapp.com/",
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
    if (receivedMessage.text && receivedMessage.text.toLowerCase().search('#') === 0) {
        const keyword = receivedMessage.text.substring(1);
        await handleGetCoursesByKeyword(senderPsid, keyword);
        return;
    }
    if (receivedMessage.quick_reply) {
        const payload = receivedMessage.quick_reply.payload;
        if (payload.search('category#') === 0) {
            const categoryId = payload.substring(9);
            await sendCoursesByCategory(senderPsid, categoryId);
            return;
        }
    }
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

function sendCourses(senderPsid, results) {
    if (results.length === 0) {
        sendText(senderPsid, 'Không tìm thấy kết quả, vui lòng thử lại!!!')
        return;
    }
    const elements = [];
    results.forEach(element => {
        elements.push({
            "title": `${element.name} (${element.numberOfReviews} reviews)`,
            "subtitle": `${element.shortDescription}`,
            "image_url": `${element.imageUrl}`,
            "buttons": [
                {
                    "title": "Chi tiết khoá học",
                    "type": "web_url",
                    "url": `https://hh-academy.herokuapp.com/courses/${element._id}`,
                    "webview_height_ratio": "full"
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
                    "template_type": "generic",
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
            sendText(senderPsid, 'Để tìm khoá học theo từ khoá, bạn gõ "#<TÊN KHOÁ HỌC>". Ví dụ: #react');
            return;
        case payloadType.GET_COURSES_BY_CATEGORY:
            sendCategories(senderPsid);
            return;
        case payloadType.GET_STARTED:
            setupPersistentMenu(senderPsid);
            return;

        default:
    }


}

async function sendCategories(senderPsid) {
    try {
        const _response = await getCategories();
        let results = _response.data;
        const quickReplies = [];
        results.forEach(category => {
            const subCategories = category.childrens;
            if (subCategories) {
                subCategories.forEach(subCategory => {
                    quickReplies.push(
                        {
                            "content_type": "text",
                            'title': `${subCategory.name}`,
                            'payload': `category#${subCategory._id}`
                        }
                    );
                });
            }
        });
        console.log(quickReplies);
        const requestBody = {
            "recipient": {
                "id": senderPsid
            },
            "messaging_type": "RESPONSE",
            "message": {
                "text": "Chọn một trong các danh mục sau:",
                "quick_replies": quickReplies
            }
        };

        postRequest(messengerUri.MESSAGES, requestBody);
        return;
    } catch (err) {
        console.error(err);
    }
}

async function sendCoursesByCategory(senderPsid, categoryId) {
    try {
        const _response = await getCoursesByCategory(categoryId);
        let results = _response.data.results;
        sendCourses(senderPsid, results)
    } catch (err) {
        console.error(err);
    }
}

function sendText(senderPsid, message) {
    const requestBody = {
        "recipient": {
            "id": senderPsid
        },
        "message": { 'text': message }
    }
    postRequest(messengerUri.MESSAGES, requestBody);
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
            "https://hh-academy.herokuapp.com"
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