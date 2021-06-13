# Customers API

This project is a customers API built on Serverless Framework with NodeJS, and it is part of a technical test proposed by [PagaLeve](https://pagaleve.com.br).

## API documentation

[PagaLeve API for Customers](https://app.swaggerhub.com/apis-docs/paga-leve/PagaLeve-Customers/V1).

## CI/CD

Automated deployment is implemented with [GitHub Actions](https://github.com/features/actions)

## Logs

Logs are saved at [AWS Cloudwatch](https://aws.amazon.com/pt/cloudwatch/), and it's overview can be found on a special area of the [Customers API Front-End](https://pagaleve.click/endpoints)

## Error monitoring

Error monitopring and notification was implemented with [Sendgrid](https://sendgrid.com/)

For any error thats occurs in any endpoint, the responsible Engineer will receive an e-mail with the error overview

## Available Scripts

In the project directory, you can run:

### `yarn test`

Launches the test runner in the interactive watch mode.

### `serverless offline`

Runs the project localy.

### `serverless deploy`

Deploys the project in the cloud provider.
