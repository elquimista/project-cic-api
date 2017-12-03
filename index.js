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
  GITHUB_OAUTH_APP_CLIENT_SECRET: client_secret,
  FRONTEND_APP_BASE_URL,
  GITHUB_LOGIN,
  GITHUB_PERSONAL_ACCESS_TOKEN,
  FRONTEND_APP_GITHUB_REPO_OWNER_LOGIN,
  FRONTEND_APP_GITHUB_REPO_NAME
} = process.env;

router
  .get('/', async (ctx, next) => {
    const { code } = ctx.request.query;
    if (code) {
      ctx.redirect(`${FRONTEND_APP_BASE_URL}?code=${code}`);
    }
    return next();
  })
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
  })
  .get('/latest-version', async (ctx, next) => {
    const response = await requestify.post('https://api.github.com/graphql', {
      query: `
        query ($ownerLogin: String!, $repoName: String!) {
          repositoryOwner(login: $ownerLogin) {
            repository(name: $repoName) {
              refs(refPrefix: "refs/tags/", last: 1) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        ownerLogin: FRONTEND_APP_GITHUB_REPO_OWNER_LOGIN,
        repoName: FRONTEND_APP_GITHUB_REPO_NAME
      }
    }, {
      auth: {
        username: GITHUB_LOGIN,
        password: GITHUB_PERSONAL_ACCESS_TOKEN
      }
    });
    ctx.body = response.getBody().data.repositoryOwner.repository.refs.edges[0].node.name;
    ctx.status = 200;
    return next();
  });

app.use(cors());
app.use(parseBody());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT || 4000);
