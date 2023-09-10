interface IServer {
    [x: string]: any;
    name: string;
    interestLimit: boolean;
    diskLimit: number;
}

export default interface IServers {
    [key: string]: IServer[];
}





