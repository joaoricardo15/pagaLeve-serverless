'use strict'

const { ApiCore, CloudWatch } = require('../../../utils')

const cloudWatch = new CloudWatch()

module.exports.handler = async (event, context, callback) => {

  const apiCore = new ApiCore(event, context)
  let result, status

  try {

    const { queryStringParameters: params, pathParameters: { endpointName } } = event

    const response = await cloudWatch.getLogs(endpointName, params)
    
    result = response
    status = 'success'

  } catch (error) {
    
    result = error
    status = 'fail'

  } finally {
    callback(null, await apiCore.response(status, result))
  }
}
