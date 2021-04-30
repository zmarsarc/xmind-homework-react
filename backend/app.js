const koa = require('koa');
const serve = require('koa-static');
const mount = require('koa-mount');
const fs = require('fs');
const log4js = require('log4js');
const apiRouter = require('./router.js');

module.exports = function() {

    const app = new koa();

    // 输入参数检查
    require('koa-validate')(app);

    // 日志记录器绑定到全局上下文
    app.context.logger = log4js.getLogger();
    app.context.logger.level = 'debug'
    
    // 兜底路由，如果后端没有命中任何路由则返回首页，在浏览器执行前端路由
    // 兜底在最外层中间件
    app.use(async(ctx, next) => {
        await next();
        if (ctx.body === undefined) {
            ctx.type = 'html'
            ctx.body = fs.createReadStream('./build/index.html');
        }
    })
    
    // 挂载静态文件服务，提供js、css等资源
    app.use(mount('/static', serve('./build/static')))
    
    // 安装api路由
    app.use(apiRouter.routes());

    return app;
}
