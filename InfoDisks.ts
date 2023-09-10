import * as child_process from "child_process";
import { RunShellError, GetInfoError } from "./error.js";
import Log from "./writeLog.js";


export default function getInfoDisk(server: string[], path: string) {

    const command = `
        $cred = Import-CliXML -Path 'mycredentials.xml'
        $date = get-Date -Format 'dd.MM.yyyy'
        $a = Get-WmiObject Win32_LogicalDisk -ComputerName ${server}  -Credential $cred -Filter "DriveType=3" | Select-Object @{Name = "Server"; Expression = {$_.__SERVER}}, @{Name = "IP"; Expression = {[System.Net.Dns]::GetHostAddresses($_.__SERVER).IPAddressToString}}, DeviceID, @{Name = "Size"; Expression = {'{0:N2}'-f ($_.Size / 1GB)}},@{Name = "Free"; Expression = {'{0:N2}'-f ($_.FreeSpace / 1GB)}},@{Name = "PercentFree"; Expression = {'{0:N2}'-f ((($_.FreeSpace)/($_.Size))*100)}}
        $a | Export-Csv "${path}/$date.csv"   
        $date
    `;

    return new Promise( resolve => {

        child_process.exec(command, {"shell":"powershell.exe"}, (err, stdout) => {
            if (err) {
                const titleErr = `An error occurred while checking disks on servers ${server}`;
                const objErr = new RunShellError(titleErr, err.message);
                Log.getInstance().notify(objErr.name, objErr.title, objErr.message, objErr.stack || "");
            }

            if(stdout === "") {
                const titleErr = `Disk info getting error`;
                const objErr = new GetInfoError(titleErr, `Error getting information about disks from servers: ${server}`);
                Log.getInstance().notify(objErr.name, objErr.title, objErr.message, objErr.stack || "");
            }

            resolve(stdout.trim());
        });
    });
}


