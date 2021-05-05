const koaRouter = require('koa-router');
const ledger = require('./controller/ledger.js');
const sqlite = require('./model/sqlite.js');
const body = require('koa-body');
const resp = require('./controller/response.js');

const backend = new sqlite({database: 'data.db'});

const apiRouter = new koaRouter();

// 全部使用admin身份，暂时不需要登录实际的账号
apiRouter.use(async(ctx, next) => {
    ctx.user = {
        id: 1,
        name: 'admin'
    };
    await next();
})

apiRouter.use(body());

apiRouter.use(async(ctx, next) => {
    try {
        await next();
    }
    catch (err) {
        ctx.logger.error(`${ctx.request.method} ${ctx.request.path} error, ${err.message}`)
        ctx.body = resp.internalError;
    }
})

// api接口默认返回的是json数据
apiRouter.use(async(ctx, next) => {
    ctx.type = 'json';
    await next();
})

apiRouter.prefix('/api');
apiRouter.post('/ledger/item', ledger.addItem((userid, item) => backend.saveItem(userid, item)));
apiRouter.get('/ledger/item/:year/:month', ledger.getItemsInMonth(filter => backend.getItem(filter)))
apiRouter.post('/category', ledger.addCatagory((userid, category) => { return backend.saveCategory(userid, category)}));
apiRouter.get('/category', ledger.getCategory((userid) => { return backend.getCategory({userId: userid})}));
apiRouter.get('/category/type/:typeid', ledger.getCategoryByType((userid, typeid) => { return backend.getCategory({userId: userid, type: typeid})}));
apiRouter.get('/overview', ledger.getOverview(filter => backend.getItem(filter)));
apiRouter.get('/overview/:year/:month', ledger.getOverview(filter => backend.getItem(filter)));
apiRouter.get('/month', ledger.getMonthList(filter => backend.getItem(filter)));

module.exports = apiRouter;