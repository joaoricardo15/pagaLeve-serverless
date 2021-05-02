'use strict'

const { Calculator, Sendgrid } = require('../utils')

const calculator = new Calculator()
const sendgrid = new Sendgrid()

const headers = {
    'Content-type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}

module.exports.handler = async (event, context, callback) => {
    try {

        // parse input
        // const input = JSON.parse(event.body)
        const input = { electricity: 10, waste: 10, water: 10 }

        // calculalte emission
        const emission = calculator.simulateFootprint(input)

        // parse response
        const result = { emission }

        // return result
        callback(null, {
            headers,
            statusCode: 200,
            body: JSON.stringify(result, null, 2)
        })

        // log result
        console.log('success: ', result)
    } catch (error) {
        // parse error
        const errorMessage = error.message ? error.message : typeof error === 'string' ? error : 'unkown error' 

        // return error
        callback(null, {
            headers,
            statusCode: 500,
            body: JSON.stringify({ message: errorMessage }, null, 2)
        })

        // log error
        console.log('fail: ', errorMessage)
        
        // notify error
        await sendgrid.sendEmail({
            resource: 'simulateFootprint',
            timestamp: new Date().toISOString(),
            input: event.body,
            error: errorMessage
        })
    }
}