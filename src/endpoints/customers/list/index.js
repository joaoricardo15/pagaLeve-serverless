'use strict'

const { ApiCore } = require('../../../utils')

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient()
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE

module.exports.handler = async (event, context, callback) => {

    const apiCore = new ApiCore(event, context)
    let result, status

    try {

        const params = {
            Limit:20,
            TableName: CUSTOMERS_TABLE
        }

        const response = await ddb.scan(params).promise()

        result = response.Items
        status = 'success'

    } catch (error) {

        result = error
        status = 'fail'

    } finally {
        callback(null, await apiCore.response(status, result))
    }
}
