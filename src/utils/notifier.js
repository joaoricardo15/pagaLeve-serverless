'use strict'

const Axios = require('axios')

const SENDGRID_API_URL = process.env.SENDGRID_API_URL
const SENDGRID_API_TOKEN = process.env.SENDGRID_API_TOKEN

module.exports = class Notifier {

    constructor() {
        this.apiRequest = Axios.create({ baseURL: SENDGRID_API_URL, headers: { 'Authorization': `Bearer ${SENDGRID_API_TOKEN}` } })
    }

    async notifyError(fields) {
        const url = '/mail/send'
        const method = 'post'

        try {
            const message = {
                personalizations: [
                  {
                    to: [
                      { 
                        name: 'Sinai Suport Engeneer',
                        email: 'joaoricardocardoso15@gmail.com'
                      }
                    ],
                    dynamic_template_data: fields
                  }
                ],
                from: {
                  name: 'Sinai API Notifier',
                  email: 'joaoricardo15@hotmail.com'
                },
                template_id: 'd-85ff6049c6c6422e9ee6c26366e2b442',
            }

            const response = await this.apiRequest({ url, method, data: message })

            return response.data
        }
        catch (error) {
            throw error.response.data
        }
    }
}

