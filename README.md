# Customers API

This project is a customers API built on Serverless Framework with NodeJS, and it is part of a technical test proposed by [PagueLeve](https://pagaleve.com.br).

## API documentation

[PagaLeve API for Customers](https://app.swaggerhub.com/apis-docs/paga-leve/PagaLeve-Customers/V1).

## Logs

Logs can be found at [AWS Cloudwatch](https://aws.amazon.com/pt/cloudwatch/)

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
