import request from '../utils/request.js';

const getItemsInMonth = async (year, month, filter) => {
    return request.get(`/api/ledger/item/${year}/${month}`, filter);
};

const getCategories = async () => {
    return request.get('/api/category');
}

const getOverviewInMonth = async (year, month) => {
    return request.get(`/api/overview/${year}/${month}`);
}

const getMonthList = async () => {
    return request.get('/api/month');
}

const uploadLedgerFile = async file => {
    return request.postForm('/api/ledger/file', file);
}

const ledger = { getItemsInMonth, getCategories, getOverviewInMonth, getMonthList, uploadLedgerFile };

export default ledger;