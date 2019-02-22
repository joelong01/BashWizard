import {FileFilter} from "electron";
/*
 *
 * @member readText - Read text from path
 * @member readBinary - Read Buffer from path
 * @member deleteFile - Delete file from path
 * @member writeText - Write text to file at path
 * @member writeBinary - Write buffer to file at path

 */

export interface IStorageProvider  {

    readText(filePath: string): Promise<string>;
    readBinary(filePath: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;

    writeText(filePath: string, contents: string): Promise<void>;
    writeBinary(filePath: string, contents: Buffer): Promise<void>;
    getOpenFile(title:string, extensions:FileFilter[]):Promise<string>;
    getSaveFile(title:string, extensions:FileFilter[]):Promise<string>;
}

