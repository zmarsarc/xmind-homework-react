import request from '../utils/request.js';

const getItemsInMonth = async (month) => {
    return request.get('/api/ledger/item/month/' + month);
};

const getCategories = async () => {
    return request.get('/api/category');
}

const getOverviewInMonth = async (month) => {
    return request.get('/api/overview/month/' + month);
}

const ledger = { getItemsInMonth, getCategories, getOverviewInMonth };

export default ledger;