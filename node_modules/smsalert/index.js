const request = require('request-promise')

class SMS {  // Main class
  constructor(username, password) {
    if (!username) {
      throw new TypeError('Username is required')
    }
    if (typeof username !== 'string') {
      throw new TypeError('Username is required to be a string')
    }
    if (!password) {
      throw new TypeError('Password is required')
    }
    if (typeof password !== 'string') {
      throw new TypeError('Password is required to be a string')
    }
    // username and password need for basic authentification
    this.user = username;
    this.pwd = password;
  }

  // send sms message
  async send(phoneNumbers, text, senderid) {
   
    if (!text || typeof text != 'string') {
      throw new TypeError('Second argument text is required, it must be string')
    }
	 
    try {
      const response = await request({
        method: 'GET',
        uri: 'https://www.smsalert.co.in/api/push.json?user='+this.user+'&pwd='+this.pwd+'&sender='+senderid+'&mobileno='+phoneNumbers+'&text='+text,
        json: true
      })
      return response
    } catch (err) {
      throw err
    }
  }

}

module.exports = SMS
