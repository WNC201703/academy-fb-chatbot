const axios = require('axios');

async function getCoursesByKeyword(keyword) {
    const uri = `https://hd-academy-api.herokuapp.com/api/courses?key_word=${keyword}&page_size=5&page_number=1`;
    const response = await axios.get(uri);
    return response;
}

async function getCategories() {
    const uri = `https://hd-academy-api.herokuapp.com/api/categories`;
    const response = await axios.get(uri);
    return response;
}

async function getCoursesByCategory(id) {
    const uri = `https://hd-academy-api.herokuapp.com/api/categories/${id}/courses?page_size=5&page_number=1`;
    const response = await axios.get(uri);
    return response;
}

async function getCourseDetail(courseId){
    const uri = `https://hd-academy-api.herokuapp.com/api/courses/${id}`;
    const response = await axios.get(uri);
    return response;
}

module.exports = { 
    getCoursesByKeyword,
    getCategories,
    getCoursesByCategory,
 }