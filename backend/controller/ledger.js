const resp = require('./response.js');

module.exports = {
    // 添加账目中间件
    //
    // saveItem是具有async function(userid, item)签名的函数
    // 其中item结构如 {time: [number], input: [number], type: [string], amount: [number]}
    // userid是用户的id
    addItem: (saveItem) => {

        // 添加一条账目
        // 
        // router: [post] /api/ledger/item
        //
        // param: [json] {time: 123123123, input: 0, type: "12348abcd", amount: 100.00}
        //      time [number]: 账目时间，unix时间
        //      input [number]: 入账？0代表出账，1代表入账
        //      type [string]: 类型，用户自定的分类，记录的是分类的uuid
        //      amount [number]: 金额
        //
        // response: [json] {code: 0, msg: "ok"}
        //      code [number]: 错误码，成功为0，否则非0
        //      msg [string]: 错误提示信息
        return async(ctx, next) => {
            ctx.checkBody('time').notEmpty().isInt();
            ctx.checkBody('input').notEmpty().isInt().isIn([0, 1]);
            ctx.checkBody('type').notEmpty();
            ctx.checkBody('amount').notEmpty().isFloat();
            if (ctx.errors) {
                ctx.logger.error(`invalid params when add ledger item to user ${ctx.user.name}`);
                ctx.body = resp.invalidParams;
                return;
            }

            await saveItem(ctx.user.id, ctx.request.body);
            ctx.body = resp.ok;
            return;
        }
    },

    getItemsInMonth: (readItem) => {

        // router: /api/ledger/item/month/:month
        // response: json {"code": 0, "msg": "ok", "data": [{"id": 1, "userId": 1, "eventTime": , "writeTime": , "type": , "category": , "amount": }]}
        return async(ctx, next) => {
            const month = Number(ctx.params.month);
            if (!month) {
                ctx.logger.error('invalid url path, can not get month');
                ctx.body = resp.invalidParams;
                return;
            }

            ctx.logger.debug(`read ledger items of ${ctx.user.name} in month ${month}`);
            const items = await readItem(ctx.user.id, month);
            ctx.body = resp.json(items);
        }
    },

    // 添加账目类目，传入参数saveCategory是一个具有 async function(number, json{"type": , "name":}) 签名的方法
    // saveCategory作为将类目数据写入持久化存储的代理
    //
    // router: POST /api/category
    // body: json {"type": [int], "name": [string]}
    //      type: 类型，出账或是入账，可选值[0,1]
    //      name: 名称，有 unique(userid, type, name) 的限制
    // response: json {"code": 0, "msg": "ok", "data"; {"id": "abcdef1234"}}
    //      返回最新创建的category的id给前端
    addCatagory: (saveCategory) => {
        return async (ctx, next) => {
            ctx.checkBody('type').notEmpty().isInt().isIn([0, 1]);
            ctx.checkBody('name').notEmpty();
            if (ctx.errors) {
                ctx.logger.error(`invalid params when add category to user ${ctx.user.name}`);
                ctx.body = resp.invalidParams;
                return await next();
            }

            const id = await saveCategory(ctx.user.id, ctx.request.body);
            ctx.logger.debug(`user ${ctx.user.name} add new category ${ctx.request.body.name}, id ${id}`);
            ctx.body = resp.json({id: id});
            return await next();
        }
    },

    // 获取账目类目
    //
    // router: GET /api/category
    // response: json {"code": 0, "msg": "ok", "data": []}
    getCategory: (readCategory) => {
        return async(ctx, next) => {
            ctx.logger.debug(`user ${ctx.user.name} get category`);
            ctx.body = resp.json(await readCategory(ctx.user.id));
            return await next();
        }
    },

    // 按类型获取账目类目
    //
    // router: GET /api/cagetory/type/:typeid
    // response: json {"code": 0, "msg": "ok", "data": [object]}
    getCategoryByType: (readCategory) => {
        return async(ctx, next) => {
            ctx.logger.debug(`user ${ctx.user.name} get category with type ${ctx.params.typeid}`);
            ctx.body = resp.json(await readCategory(ctx.user.id, ctx.params.typeid));
            return await next();
        }
    },

    // router: GET /api/overview
    // router: GET /api/overview/month/:month
    getOverview(readLedger) {
        return async(ctx, next) => {
            let items = []
            if (ctx.params) {
                items = await readLedger({userId: ctx.user.id, month: ctx.params.month});
            } else {
                items = await readLedger({userId: ctx.user.id});
            }

            let output = 0;
            let input = 0;
            for (let i of items) {
                // output
                if (i.type === 0) {
                    output += i.amount;
                }

                // input
                if (i.type === 1) {
                    input += i.amount;
                }
            }

            ctx.body = resp.json({output: output, input: input});
        }
    }
}