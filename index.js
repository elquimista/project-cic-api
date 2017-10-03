'use strict';

const Koa = require('koa');
const parseBody = require('koa-body');
const Router = require('koa-router');
const requestify = require('requestify');
const cors = require('koa2-cors');

const app = new Koa();
const router = new Router();

router
  .post('/gitlab/oauth/token', async (ctx, next) => {
    const { client_id, client_secret, grant_type, redirect_uri, code } = ctx.request.body;
    try {
      const response = await requestify.post('https://gitlab.com/oauth/token', {
        client_id, client_secret, grant_type, redirect_uri, code
      });
      ctx.body = response.getBody();
    } catch (err) {
      ctx.body = err.getBody();
      ctx.status = 401;
    }
    return next();
  });

app.use(cors());
app.use(parseBody());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT || 4000);
