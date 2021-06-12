'use strict'

const AWS = require('aws-sdk')
const { ApiCore } = require('../../../utils')

const ddb = new AWS.DynamoDB.DocumentClient()
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE

module.exports.handler = async (event, context, callback) => {

    const apiCore = new ApiCore(event, context)
    let result, status

    try {

        const { customerId } = event.pathParameters

        const params = { 
            TableName: CUSTOMERS_TABLE,
            Key: {
                'customerId': customerId,
            }
        }

        const response = await ddb.get(params).promise()

        result = response.Item
        status = 'success'

    } catch (error) {

        result = error
        status = 'fail'

    } finally {
        callback(null, await apiCore.response(status, result))
    }
}
