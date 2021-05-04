import request from '../utils/request.js';

const getItemsInMonth = async (year, month, offset, limit) => {
    return request.get(`/api/ledger/item/${year}/${month}`, {offset: offset, limit: limit});
};

const getCategories = async () => {
    return request.get('/api/category');
}

const getOverviewInMonth = async (year, month) => {
    return request.get(`/api/overview/${year}/${month}`);
}

const ledger = { getItemsInMonth, getCategories, getOverviewInMonth };

export default ledger;