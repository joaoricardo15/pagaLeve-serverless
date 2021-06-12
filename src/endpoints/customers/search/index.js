'use strict'

const { ApiCore } = require('../../../utils')

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient()
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE

module.exports.handler = async (event, context, callback) => {

    const apiCore = new ApiCore(event, context)
    let result, status

    try {

        const { queryTerm } = event.pathParameters

        const params = {
            Limit:20,
            TableName: CUSTOMERS_TABLE
        }
        
        const response = await ddb.scan(params).promise()
        
        result = findMatchingCustomers(response.Items, queryTerm)
        status = 'success'

    } catch (error) {

        result = error
        status = 'fail'

    } finally {
        callback(null, await apiCore.response(status, result))
    }
}

function findMatchingCustomers(customers, queryTerm) {
    const matchingCustomers = []
    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        const customerKeys = Object.keys(customer)
        for (let j = 0; j < customerKeys.length; j++) {
            
            const attributeKey = customerKeys[j]
            const attributeValue = customer[attributeKey]

            if (typeof attributeValue === 'string') {
                const formatedAttributeValue = attributeValue.toLowerCase()
                const formatedQueryTerm = queryTerm.toLowerCase()

                if (formatedAttributeValue.includes(formatedQueryTerm)) {
                    matchingCustomers.push(customer)
                    break
                }
            }
        }
    }

    return matchingCustomers
}