class Communication {
  async sendSMS() {}

  async sendPushNotification() {}

  async sendEmail() {}
}

const CommunicationService = new Communication();

export default CommunicationService;
