import Log from "./writeLog.js";
import {existsSync, mkdirSync} from "fs";
import getInfoDisk from "./InfoDisks.js";
import { ValidationError, SyntaxErrorInFileENV } from "./error.js";
import CSV from "./csv.js";
import { Mail } from "./mail.js";
import IServers from "./interface/IServers";


function checkMemeory(isPercent: boolean, percentFreeSpace: number, freeSpace: number, diskLimit: number): boolean {
    
    if(isPercent) {
        if(percentFreeSpace <= diskLimit) {
            return true;
        }
    } else {
        if(freeSpace <= diskLimit) {
            return true;
        }
    }

    return false;
}

export default async function run(servers: IServers, pathFiles: string) {
    
    const arrServersGroupKey = Object.keys(servers);
    
    for(const rc of arrServersGroupKey) {

        console.log(`Servers - ${rc}`);

        if(!existsSync(`${pathFiles}\\${rc}`)) {
            mkdirSync(`${pathFiles}\\${rc}`, { recursive: true });
        }
        
        if(Array.isArray(servers[rc]) && servers[rc].length) {    
            console.table(servers[rc]);
            const arrServersName: string[] = [];
           
            for(let index = 0; index < servers[rc].length; index++) {

                const server = servers[rc][index];
                const serverName = server.name.trim();
                const interestLimit = server.interestLimit;
                const diskLimit = server.diskLimit;

                try {
                    if(!serverName) {
                        throw new ValidationError(["name", rc]);
                    }
                    
                    if(typeof interestLimit !== "boolean") {
                        throw new ValidationError(["interestLimit", rc, serverName]);
                    }
                    
                    if(typeof diskLimit !== "number" || diskLimit === 0) {
                        throw new ValidationError(["diskLimit", rc, serverName]);
                    }
                    
                    arrServersName.push(serverName);
                } catch(err) {
                    if(err instanceof ValidationError) {
                        servers[rc].splice(index, 1);
                        index--;
                        Log.getInstance().notify(err.name, err.title, err.message, err.stack!);
                    }
                }
            }
            
            console.log("Getting disk Information...\n");
            const fileName = await getInfoDisk(arrServersName, `${pathFiles}\\${rc}`);
            
            const arrDataCsv = await CSV.parse(`${pathFiles}\\${rc}\\${fileName}.csv`);
            console.log("-----Server disk information-----");
            console.table(arrDataCsv);

            if(!arrDataCsv.length) {

                const countRepeatServersGroup = arrServersGroupKey.reduce((count, elem) => {
                    if(elem === rc) {
                        count++;
                    }
                    return count;
                }, -1);

                if(!countRepeatServersGroup) {
                    arrServersGroupKey.push(rc);
                }

                const title = `Failed to check disks on servers ${rc}!`;
                const message = `Failed to check disks on servers: ${arrServersName.length? arrServersName : "undefined"}`;
                Mail.getInstance().sendMail(title, message);
                
                continue;
            }
            
            
            const serverVerified = new Set();
            const serversIsNotVerified = new Set();

            servers[rc].forEach( (objServer) => {
                const nameServer = objServer.name;
                
                for(let indexServerCSV = 0; indexServerCSV < arrDataCsv.length; indexServerCSV++) {

                    let isEnoughSpace: boolean;
                    const objServerCsv = arrDataCsv[indexServerCSV];             
                    const ip = objServerCsv.IP;
                     
                    if(ip === nameServer) {
                        
                        arrDataCsv.splice(indexServerCSV, 1);
                        indexServerCSV--;
                        serverVerified.add(nameServer);
                        
                        isEnoughSpace = checkMemeory(objServer.interestLimit, +objServerCsv.PercentFree, +objServerCsv.Free, objServer.diskLimit);
                            
                    } else {
                        const nameServerCsv = objServerCsv.Server.toLowerCase();
                        const index = nameServer.toLowerCase().indexOf(nameServerCsv);
                        
                        if(index !==-1 && (nameServer[index + nameServerCsv.length] === "." || nameServer.length === nameServerCsv.length)) {

                            arrDataCsv.splice(indexServerCSV, 1);
                            indexServerCSV--;
                            serverVerified.add(nameServer);
                        
                            isEnoughSpace = checkMemeory(objServer.interestLimit, +objServerCsv.PercentFree, +objServerCsv.Free, objServer.diskLimit);
                            
                        } else {
                            isEnoughSpace = false;
                        
                            if(!serverVerified.has(nameServer)) {
                                serversIsNotVerified.add(nameServer);
                            }
                        }
                    }
                     
                    if(isEnoughSpace) {
                        const title = "NOT ENOUGH DISK SPACE!";
                        const message = `Not enough space on drive "${objServerCsv.DeviceID}" on ${objServerCsv.Server} server(${objServerCsv.IP})`; 
                        Mail.getInstance().sendMail(title, message)
                    }
                }
            });
            
            if(serversIsNotVerified.size) {
                let servers = "";

                serversIsNotVerified.forEach( serverName => {

                    if(serverVerified.has(serverName)) {
                        serversIsNotVerified.delete(serverName);
                    } else {
                        servers += ` ${serverName},`;
                    }
                });
                
                Mail.getInstance().sendMail("Servers not tested", `Servers that could not be checked:${servers.slice(0, -1)}`);
            }                     
            if(arrDataCsv.length) {
                const unscheduledServersName = arrDataCsv.map( server => server.Server);
                Mail.getInstance().sendMail("Unscheduled servers", `Servers that passed the test but are not in the .env file: ${unscheduledServersName}`)
            }
                                
        } else {
            const titleErr = `Invalid data in .env file`;
            const objErr = new SyntaxErrorInFileENV(titleErr, `Invalid data in .env file: ${rc} is not array or the array is empty!`);
     
            Log.getInstance().notify(objErr.name, objErr.title, objErr.message, objErr.stack!);
        }
        console.log("---------------------------------------------------------------------------------------------")
    }

}