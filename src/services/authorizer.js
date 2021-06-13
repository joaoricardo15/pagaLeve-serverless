'use strict'

const { ApiCore } = require('../utils')

module.exports.handler = async (event, context, callback) => {

  const apiCore = new ApiCore(event, context)

  const { authorizationToken } = event

  if (!authorizationToken) {
    return callback('Unauthorized')
  }

  const tokenParts = authorizationToken.split(' ')
  const tokenValue = tokenParts[1]

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue))
    return callback('Unauthorized')

  try {

    await apiCore.response('success')
    callback(null, {
      "principalId": "pagueLeveApi",
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "execute-api:Invoke",
            "Effect": "Allow",
            "Resource": "*"
          }
        ]
      }
    })
  } catch (error) {
    await apiCore.response('fail', error)
    callback('Unauthorized')
  }
}
