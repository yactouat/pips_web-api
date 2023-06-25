# pips_channel_personal-website_api

- [pips\_channel\_personal-website\_api](#pips_channel_personal-website_api)
  - [what is this ?](#what-is-this-)
  - [stack](#stack)
  - [GCP service accounts and roles/permissions](#gcp-service-accounts-and-rolespermissions)
    - [Cloud Run Deployer](#cloud-run-deployer)
  - [how to run and setup locally](#how-to-run-and-setup-locally)
    - [dev services](#dev-services)
  - [CI/CD](#cicd)
    - [secrets and env vars](#secrets-and-env-vars)
    - [deploying to the GCP manually](#deploying-to-the-gcp-manually)
  - [connecting to the Supabase Postgres instance](#connecting-to-the-supabase-postgres-instance)
  - [Google Cloud PubSub](#google-cloud-pubsub)
  - [API](#api)
    - [API resources](#api-resources)
        - [GET `/users/:id/permissions`](#get-usersidpermissions)
        - [POST `/users`](#post-users)
        - [POST `/users/reset-password`](#post-usersreset-password)
        - [PUT `/users/:id`](#put-usersid)
        - [PUT `/users/:id/permissions`](#put-usersidpermissions)
        - [PUT `/users/:id/process-token`](#put-usersidprocess-token)
  - [Contribution guidelines](#contribution-guidelines)
  - [Code Viz](#code-viz)
  - [Contributors](#contributors)


## what is this ?

the server-side code that powers my PIPS (Portable Integrated Personal System) JSON API, this API is available @ <https://api.yactouat.com>

## stack

- Docker
- GitHub repo + GitHub Actions
- Google Cloud Platform (GCP) project with billing enabled
- `gcloud` CLI installed and configured to the PIPS GCP project (`gcloud auth application-default login` and `gcloud init` if it's not the case)
- [Node.js](https://nodejs.org/en/)
- PostgreSQL Supabase database
- [Typescript](https://www.typescriptlang.org/)
- uses this npm **business** package: <https://github.com/yactouat/pips_shared>

## GCP service accounts and roles/permissions

Instead of using whatever default service account is affected automatically during the CI/CD process to build and deploy to Google Cloud Run and while interacting with GCP APIs, I like to create dedicated service accounts:

### Cloud Run Deployer

It has roles:

- `Artifact Registry Writer`
- `Cloud Build Editor`
- `Cloud Build Service Account`
- `Cloud Run Developer`
- `Service Account User`

Also, during the build step, a default service account for Cloud Build in the GCP project (`**@cloudbuild.gserviceaccount.com`) is triggered in the pipeline, and it needs to have the:

- `Artifact Registry Administrator` role
- `Storage Admin` role

Finally, the compute service account that is used (`**--compute@developer.gserviceaccount.com`) in the GCP project needs to have the:

- `Secret Manager Secret Accessor` role

This is the result of a trial and error process, trying to set a service account from scratch to figure this out. Please don't hesitate to open an issue if you find a better way to do this.

## how to run and setup locally

- clone the repo
- run `npm install` to install the dependencies
- run `npm run build` to build the project
- run `npm run dev` to start the server on port 8080
- `docker compose up -d` will start a local postgres instance and a `pgAdmin` instance
- migrations are run by default with `npm run dev` (and also `start`)
- to be enable to run the migrations, you need to create a `.env` file at the root of the project, and add the following env vars:

  ```bash
  # .env
  PGDATABASE=api
  PGPASSWORD=pwd
  PGUSER=usr
  ```
- to run the migrations afterwards, run `npm run migrate-db-dev`
- this project is meant to have <https://github.com/yactouat/pips_blog.yactouat.com> as a front-end application

### dev services

- with docker stack up, you have access to a `pgAdmin` instance @ <http://localhost:8081>
- with docker stack up, you have access to a `swagger` instance @ <http://localhost:8082>, all you will need to do is to import the `api_docs.yaml` file within the UI

## CI/CD

testing with jest, building with tsc, and deploying to the GCP, are all automated using Github Actions under the `.github/workflows` folder; this happens whenever a push is made to the main branch

### secrets and env vars

- all the needed secrets and env vars are listed in the GitHub workflows
- a secret ending with `FILE_NAME` is a path to a file that contains the actual secret
- a secret ending with `_KEY` is a JSON key (such as service acounts keys in the GCP) and its contents
- I use the `dotenv` package only on dev as I use GitHub repo secrets and the GCP Secret Manager to store/access the sensitive env vars on prod; you can
  - use the `.env.example` file as a template for your own `.env` file
  - checkout out the GitHub workflows to see how the secrets and env vars are used
- I need several service accounts key JSON files, I created them in the GCP IAM and Admin section of the console

### deploying to the GCP manually

- running `gcloud run deploy`, one may be prompted several times to confirm stuff, and you can also specify a few options:
  - the `--port=PORT` option is used to specify the port on which the server will listen (for instance `8080`)
  - the `--region=REGION` option is used to specify the region in which the service will be deployed (for instance, `europe-west1`)
    - if you plan to point a domain name to your service, check out [domain mapping availability for Cloud Run](https://cloud.google.com/run/docs/mapping-custom-domains#run) to pick [the right region](https://cloud.google.com/compute/docs/regions-zones)
  - `gcloud run deploy --help` tells you more about the options when deploying a service to Cloud Run

## connecting to the Supabase Postgres instance

- I downloaded a root SSL certificate from the Supabase dashboard to enable TLS connections to the database
- also, a few env vars need to be set, both locally and on the deployed service (check out <https://www.postgresql.org/docs/9.1/libpq-envars.html>)
- a `pgAdmin` client is provided via the `docker-compose.yml` file, you can use it to connect to the database; it is available on port 8081 after a `docker-compose up` command
- if you're having troubles to connect to the database, check out [the Supabase documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)
- I set a few repository secrets with relevant values based on what you see in the `./env.example` file and the workflos files
- ! the path of a secret, under the `SUPABASE_POSTGRES_ROOT_CERT` env var, should not be in the same directory than the blog posts bucket credentials secret
- on each new release, migrations are run on the live database before the server starts

## Google Cloud PubSub

I'm using PubSub to broadcast events across the PIPS system.

I created a topic to send a notification to when a new user is created. The topic fully qualified name is set in the `PUBSUB_USERS_TOPIC` env var.

## API

### API resources

##### GET `/users/:id/permissions`

- requires a valid JWT token in the `Authorization` header of type `Bearer`
- returns a user's permissions
- user who makes the request must have the `Read:Users_Permissions` permission otherwise will 403
- successful 200 response looks like so =>

  ```json
  {
    "msg": "user permissions fetched",
    "data": [
      "read:blog_posts_drafts",
      "create:images",
      "create:blog_posts",
      "delete:blog_posts",
      "read:users_permissions"
    ]
  }
  ```

##### POST `/users`

- creates a new user in the database, e.g. sign up
- input payload must look like =>

  ```json
  {
    "email": "myemail@domain.com",
    "password": "my-password",
    "socialhandle": "my-social-handle",
    "socialhandletype": "GitHub" // or "LinkedIn"
  }
  ```

- these are the password strength requirements =>

  ```js
  /**
   *    minLength: 8,
   *    minLowercase: 1,
   *    minUppercase: 1,
   *    minNumbers: 1,
   *    minSymbols: 1,
   *    returnScore: false,
   *    pointsPerUnique: 1,
   *    pointsPerRepeat: 0.5,
   *    pointsForContainingLower: 10,
   *    pointsForContainingUpper: 10,
   *    pointsForContainingNumber: 10,
   *    pointsForContainingSymbol: 10
   * */
  ```

- success response should look like =>

  ```json
  {
    "msg": "user created",
    "data": {
      "token": "some.jwt.token",
      "user": {
        "id": "some-id",
        "email": "myemail@domain.com",
        "password": null,
        "socialHandle": "my-social-handle",
        "socialHandleType": "GitHub",
        "verified": false
      }
    }
  }
  ```

- after the response has been issued to the client, the API sends a Pub/Sub message to a users resource topic to be listened to by other components of the PIPS system

##### POST `/users/reset-password`

- saves an auth token for the given user in the database, and forwards it to the PIPS system
- input payload must look like =>

  ```json
  {
    "email": "myemail@domain.com"
  }
  ```

- success response should look like, status code would be 201 =>

  ```json
  {
    "msg": "password reset request sent",
    "data": null
  }
  ```

##### PUT `/users/:id`

- updates an existing user
- requires a valid JWT token in the `Authorization` header of type `Bearer`
- input payload must look like =>

  ```json
  {
    "email": "myemail@domain.com",
    "password": "some-password", // optional
    "socialhandle": "my-social-handle",
    "socialhandletype": "GitHub" // or "LinkedIn"
  }
  ```

- success response should look like =>

  ```json
  {
    "msg": "user updated, some profile data modifications may require an additional confirmation", // "user fetched" if no fields require confirmation (such as socialhandle or socialhandletype)
    "data": {
      "token": "some.jwt.token",
      "user": {
        "id": "some-id",
        "email": "myemail@domain.com",
        "password": null,
        "socialHandle": "my-social-handle",
        "socialHandleType": "GitHub",
        "verified": true,
        "hasPendingModifications": true // optional
      }
    }
  }
  ```

##### PUT `/users/:id/permissions`

- requires a valid JWT token in the `Authorization` header of type `Bearer`
- updates a user's permissions with valid actions and resources in the payload
- user who makes the request must have the `Update:Users_Permissions` permission otherwise will 403
- input payload must look like =>

  ```json
  {
    "permissions": ["Update:Blog_Posts_Drafts"]
  }
  ```

- successful 200 response looks like so =>

  ```json
  {
    "msg": "user permissions updated",
    "data": null
  }
  ```

##### PUT `/users/:id/process-token`

- validates a user token; user tokens are always sent to the user via a private channel (such as an email), they are used for several purposes:
  - to authenticate, for instance when a user forgot their password and wants to reset it
  - to confirm sensitive profile data changes
  - to delete the user account
  - to verify the user's email address
- requires a valid JWT token in the `Authorization` header of type `Bearer`
- input payload must look like =>

  ```json
  {
    "email": "myemail@domain.com",
    "authtoken": "some-token" // field can also be `deletetoken` | `modifytoken` | `veriftoken`
  }
  ```

- response may differ based on the token type =>

  - auth, modify, and verify tokens:

    ```json
    {
      "msg": "user fetched", // or "user updated, some profile data modifications may require an additional confirmation"
      "data": {
        "token": "some.jwt.token",
        "user": {
          "id": "some-id",
          "email": "myemail@domain.com",
          "password": null,
          "socialHandle": "my-social-handle",
          "socialHandleType": "GitHub",
          "verified": true,
          "hasPendingModifications": true // optional
        }
      }
    }
    ```

  - delete token sends back a 204 response with no body if the token is valid

## Contribution guidelines

dear past, present, and future contributors, you have my many thanks, but please follow these guidelines:

- please use comments to explain your code, even if it's obvious to you, it might not be to someone else
- you are free to arrange the code, the folder structure, the file names, etc. as you see fit if you're able to provide a good reason for it

that's all, thank you for your time !

## Code Viz

<https://mango-dune-07a8b7110.1.azurestaticapps.net/?repo=yactouat%2Fpips_channel_personal-website_api>

## Contributors

a big thanks goes to the contributors of this project:

<table>
<tbody>
    <tr>
        <td align="center"><a href="https://github.com/yactouat"><img src="https://avatars.githubusercontent.com/u/37403808?v=4" width="100px;" alt="yactouat"/><br /><sub><b>Yactouat</b></sub></a><br /><a href="https://github.com/yactouat"></td>
    </tr>
</tbody>
</table>
