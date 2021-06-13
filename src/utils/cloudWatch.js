'use strict'

const AWS = require("aws-sdk")
const cloudwatchlogs = new AWS.CloudWatchLogs()

const API_PREFIX = process.env.API_PREFIX

module.exports = class CloudWatch {

    async getEndpoints() {
        const cloudwatchlogs = new AWS.CloudWatchLogs()

        try {
        
            const logGroupNamePrefix = `/aws/lambda/${API_PREFIX}-`

            const params = {
                logGroupNamePrefix
            }

            const response = await cloudwatchlogs.describeLogGroups(params).promise()

            return response.logGroups.map(logGroup => logGroup.logGroupName.split(logGroupNamePrefix)[1])
        }
        catch (error) {
            throw error
        }
    }

    async getEndpointStatus(endpointName) {

        try {

            const logGroupName = `/aws/lambda/${API_PREFIX}-${endpointName}`

            const logStreamsParams = {
                limit: 1,
                logGroupName,
                descending: true,
                orderBy: 'LastEventTime'
            }

            const logStreamsResponse = await cloudwatchlogs.describeLogStreams(logStreamsParams).promise()

            if (logStreamsResponse.logStreams.length === 0) 
                return 

            const logStreamNames = logStreamsResponse.logStreams.map(logStream => logStream.logStreamName)

            const logEventsParams = {
                logGroupName,
                logStreamNames,
                filterPattern: 'INFO'
            }

            const logEvents = await cloudwatchlogs.filterLogEvents(logEventsParams).promise()

            const lastLog = logEvents.events.reverse()[0]

            if (lastLog)
                try {
                    const logPayload = JSON.parse(lastLog.message.split('\tINFO\t')[1])
                    if (logPayload.status)
                        return {
                            status: logPayload.status,
                            timestamp: logPayload.timestamp
                        }
                } catch (error) { return }
        }
        catch (error) {
            throw error
        }
    }
    
    async getLogs(endpointName, searchParams) {
       

        try {
            const logGroupName = `/aws/lambda/${API_PREFIX}-${endpointName}`

            const { endTime, startTime, nextToken } = searchParams ||  {}

            const logStreamsParams = {
                logGroupName,
                descending: true
            }

            const logStreamsResponse = await cloudwatchlogs.describeLogStreams(logStreamsParams).promise()

            if (logStreamsResponse.logStreams.length === 0)
                return { logs: [] }

            const logStreamNames = logStreamsResponse.logStreams.map(logStream => logStream.logStreamName)

            const logEventsParams = {
                logGroupName,
                logStreamNames,
                filterPattern: 'INFO',
                endTime,
                startTime,
                nextToken
            }

            const logEvents = await cloudwatchlogs.filterLogEvents(logEventsParams).promise()

            const formatedLogs = []
            for (let log of logEvents.events.reverse())
                try {
                    const logPayload = JSON.parse(log.message.split('\tINFO\t')[1])
                    if (logPayload.inputData)
                        formatedLogs.push(logPayload)
                } catch (error) { }

            return {
                logs: formatedLogs,
                nextToken: logStreamsResponse.nextToken
            }
        }
        catch (error) {
            throw error
        }
    }
}