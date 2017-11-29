'use strict';

require('dotenv').config({ path: '.env.local' });

const Koa = require('koa');
const parseBody = require('koa-body');
const Router = require('koa-router');
const requestify = require('requestify');
const cors = require('koa2-cors');

const app = new Koa();
const router = new Router();
const {
  GITHUB_OAUTH_APP_CLIENT_ID: client_id,
  GITHUB_OAUTH_APP_CLIENT_SECRET: client_secret
} = process.env;

router
  .post('/github/oauth', async (ctx, next) => {
    const { code } = ctx.request.body;
    try {
      const response = await requestify.post('https://github.com/login/oauth/access_token', {
        client_id, client_secret, code
      });
      ctx.body = response.getBody();
      ctx.status = 200;
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
