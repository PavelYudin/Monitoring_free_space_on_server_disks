import { createWriteStream, WriteStream } from "fs";
import { Mail } from "./mail.js";
import * as dotenv from "dotenv";


dotenv.config();

export default class Log {

    static instance: Log;

    private writeStream: WriteStream;
    
    constructor() {
        const logFile = process.env.LOG_FILE || "Error.log";
        this.writeStream = createWriteStream(logFile, { flags: "a" });

        this.writeStream.on("error", err => {
            console.log(err);
        });
    }

    static getInstance() {
        if(!Log.instance) {
            Log.instance = new Log();
        }

        return  Log.instance;
    }

    writeFile(message: string) {
        const data = `[${new Date().toLocaleString()}] ${message}\n`;

        this.writeStream.write(data);
    }

    notify(name: string, title: string, message: string, stack: string) {
        this.writeFile(`${name}: ${title} \n ${stack}`);
        Mail.getInstance().sendMail(title, `${name}: ${message}`);
    }
}