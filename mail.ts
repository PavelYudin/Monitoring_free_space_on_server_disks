import { SMTPClient } from "emailjs";
import * as dotenv from "dotenv";
import Log from "./writeLog.js";
import {ErrorSendMail} from "./error.js"
import CryptoJS  from "crypto-js";

dotenv.config();

const from = process.env.FROM_MAIL!;
const to = process.env.TO_MAIL!;
const sekretKey = "ivoin";
const SMTPUser = process.env.SMTP_USER;
const hostMail = process.env.HOST_MAIL;
const password = process.env.ENCRYPTED_PASS!;

export class Mail {
    
    static instance: Mail;

    private client: SMTPClient;

    constructor() {

        const bytes  = CryptoJS.AES.decrypt(password, sekretKey);

        this.client = new SMTPClient({
            user: SMTPUser,
            password: bytes.toString(CryptoJS.enc.Utf8),
            host: hostMail,
            tls: {
                ciphers: "SSLv3",
            }
        });
    }

    static getInstance() {

        if(!Mail.instance) {
            Mail.instance = new Mail();
        }

        return  Mail.instance;
    }

    sendMail(subject: string, text: string) {
        //eslint-disable-next-line
        const regexp = /([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}/;

        if(!regexp.test(from)) {
            const titleErr = "Failed to send message";
            const objErr = new ErrorSendMail(titleErr, "Incorrect sender address");

            Log.getInstance().writeFile(`${objErr.name}: ${objErr.title}`);
        }

        if(!regexp.test(to)) {
            const titleErr = "Failed to send message";
            const objErr = new ErrorSendMail(titleErr, "Incorrect recipient address");

            Log.getInstance().writeFile(`${objErr.name}: ${objErr.title}`);
        }

        this.client.send(
            {
                text,
                from,
                to,
                subject
            },
            err => {

                if(err) {
                    const titleErr = "Failed to send message";
                    const objErr = new ErrorSendMail(titleErr, err.message);
                
                    Log.getInstance().writeFile(`${objErr.name}: ${objErr.title} \n ${objErr.stack}`);
                }
            }
        );
    }
}