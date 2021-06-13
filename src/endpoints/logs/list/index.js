'use strict'

const { ApiCore, CloudWatch } = require('../../../utils')

const cloudWatch = new CloudWatch()

module.exports.handler = async (event, context, callback) => {

  const apiCore = new ApiCore(event, context)
  let result, status

  try {

    const response = await getLogsOverview()
    
    result = response
    status = 'success'

  } catch (error) {
    
    result = error
    status = 'fail'

  } finally {
    callback(null, await apiCore.response(status, result))
  }
}

async function getLogsOverview() {
  const endpoints = await cloudWatch.getEndpoints()

  const statusPromisses = []
  for (let i = 0; i < endpoints.length; i++)
    statusPromisses.push(cloudWatch.getEndpointStatus(endpoints[i]))
  
  const status = await Promise.all(statusPromisses)

  const completeEndpoints = []
  for (let i = 0; i < status.length; i++)
    completeEndpoints.push({ endpointName: endpoints[i], lastActivity: status[i] })

  return completeEndpoints
}
