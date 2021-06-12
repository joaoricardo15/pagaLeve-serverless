'use strict'

const { ApiCore } = require('../../../utils')

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient()
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE

module.exports.handler = async (event, context, callback) => {

    const apiCore = new ApiCore(event, context)
    let result, status

    try {

        const { customerId } = event.pathParameters

        var params = {
            TableName: CUSTOMERS_TABLE,
            Key: {
                "customerId": customerId
            }
        }

        const response = await ddb.delete(params).promise()

        result = params.Key
        status = 'success'

    } catch (error) {

        result = error
        status = 'fail'

    } finally {
        callback(null, await apiCore.response(status, result))
    }
}
