const uriPrefix='https://graph.facebook.com/v11.0/me';

const payloadType = {
    SEARCH_BY_KEYWORD: 'SEARCH_BY_KEYWORD',
    GET_COURSES_BY_CATEGORY: 'GET_COURSES_BY_CATEGORY',
    VIEW_COURSE_DETAILS: 'VIEW_COURSE_DETAILS',
    GET_STARTED: 'GET_STARTED',
}

const messengerUri = {
    MESSAGES: `${uriPrefix}/messages`,
    MESSENGER_PROFILE: `${uriPrefix}/messenger_profile`,
    CUSTOM_USER_SETTINGS: `${uriPrefix}/custom_user_settings`,
}

module.exports = {
    payloadType,
    messengerUri
}