export class MainError extends Error {
    title: string;
    
    constructor(title: string, message: string) {
        super(message);

        this.name = this.constructor.name;
        this.title = title;
    }
}

export class RunShellError extends MainError {} 

export class SyntaxErrorInFileENV extends MainError{}

export class ErrorSendMail extends MainError {}

export class GetInfoError extends MainError {}

export class ReadingFileError extends MainError {}

export class ValidationError extends MainError {
    
    constructor(arrMessage: string[]) {
            
        const [property, rc, serverName] = arrMessage;   
        super("Property is missing!", `"${property}" property is missing for server ${rc} ${serverName}!`);
    }
}