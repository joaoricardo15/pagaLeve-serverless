'use strict'

const Notifier = require('./notifier')

const API_PREFIX = process.env.API_PREFIX

module.exports = class ApiCore {
    
    constructor(inputData, functionContext) {
        this.logObject = { inputData, timestamp: new Date() }
        this.functionName = functionContext.functionName.split(`${API_PREFIX}-`)[1]
        this.headers = {
            'Content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }

    async response(status, content) {
        
        this.logObject['status'] = status
        this.logObject['result'] = typeof(content) === 'string' ? content : (typeof(content) === 'object' ? ((content.message || content.errorMessage) ? (content.message || content.errorMessage) : content) : undefined)
        
        console.log(JSON.stringify(this.logObject))
        
        if (status !== 'success') {
            await this.notificateError()
            return {
                statusCode: 500,
                headers: this.headers,
                body: JSON.stringify({ 
                    success: false,
                    message: this.logObject['result']
                })
            }
        }

        return {
            statusCode: 200,
            headers: this.headers,
            body: JSON.stringify({ 
                success: true,
                data: this.logObject['result'],
            })
        }
    }

    async notificateError() {
        const notifier = new Notifier()
        await notifier.notifyError({ 
            botName: this.functionName,
            timestamp: this.logObject.timestamp,
            input: JSON.stringify(this.logObject.inputData, null, 4),
            error: this.logObject.result
        })
    }
}