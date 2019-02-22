import { IpcRendererProxy } from "./ipcRendererProxy";
import { IStorageProvider } from "./electron/storageProviderFactory";
import { FileFilter } from 'electron';

const PROXY_NAME = "LocalFileSystem";


/**
 * Storage Provider for Local File System. Only available in Electron application
 * Leverages the IpcRendererProxy
 */
export class LocalFileSystemProxy implements IStorageProvider {
    public getOpenFile(title: string, extensions: FileFilter[]): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:getOpenFile`, [
            title,
            extensions
        ]);
    }

    public getSaveFile(title: string, extensions: FileFilter[]): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:getSaveFile`, [
            title,
            extensions
        ]);
    }

    /**
     * Read text from file
     * @param fileName - Name of file from which to read text
     */
    public readText(fileName: string): Promise<string> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, [filePath]);
    }

    /**
     * Read buffer from file
     * @param fileName Name of file from which to read buffer
     */
    public readBinary(fileName: string): Promise<Buffer> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, [filePath]);
    }

    /**
     * Delete file
     * @param fileName Name of file to delete
     */
    public deleteFile(fileName: string): Promise<void> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteFile`, [filePath]);
    }

    /**
     * Write text to file
     * @param fileName Name of target file
     * @param contents Contents to be written
     */
    public writeText(fileName: string, contents: string): Promise<void> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, [
            filePath,
            contents
        ]);
    }

    /**
     * Write buffer to file
     * @param fileName Name of target file
     * @param contents Contents to be written
     */
    public writeBinary(fileName: string, contents: Buffer): Promise<void> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeBinary`, [
            filePath,
            contents
        ]);
    }
}
