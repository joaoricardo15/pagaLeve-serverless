'use strict'

const { ApiCore } = require('../../../utils')
const { v4: uuidv4 } = require("uuid");

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient()
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE

module.exports.handler = async (event, context, callback) => {

    const apiCore = new ApiCore(event, context)
    let result, status

    try {

        const inputData = JSON.parse(event.body)

        const { email, name } = inputData

        const params = {
            TableName: CUSTOMERS_TABLE,
            Item: {
                customerId: uuidv4(),
                name,
                email
            }
        }

        const response = await ddb.put(params).promise()

        result = params.Item
        status = 'success'

    } catch (error) {

        result = error
        status = 'fail'

    } finally {
        callback(null, await apiCore.response(status, result))
    }
}
