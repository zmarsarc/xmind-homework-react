import request from '../utils/request.js';

const getItemsInMonth = async (month, offset, limit) => {
    return request.get('/api/ledger/item/month/' + month, {offset: offset, limit: limit});
};

const getCategories = async () => {
    return request.get('/api/category');
}

const getOverviewInMonth = async (month) => {
    return request.get('/api/overview/month/' + month);
}

const ledger = { getItemsInMonth, getCategories, getOverviewInMonth };

export default ledger;