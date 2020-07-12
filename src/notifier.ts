import * as config from './config';
import twilio from "twilio";

const client = twilio(config.accountSid, config.authToken);

export async function  sendNotification(toPhoneNumber: string, msg: string) {
    await client.messages.create({
        to: toPhoneNumber,
        from: config.phoneNumber,
        body: msg
    });
}