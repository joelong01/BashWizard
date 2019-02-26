import { BrowserWindow, dialog, FileFilter } from "electron";
import fs from "fs";
import path from "path";
import { IStorageProvider } from "./storageProviderFactory";
import { mainWindow } from "./main"

export class LocalFileSystem implements IStorageProvider {
    constructor(private browserWindow: BrowserWindow) { }
    public setWindowTitle(name: string) {

        mainWindow.setTitle("Bash Wizard: " + name);
    }
    public getOpenFile(dlgTitle: string, exts: FileFilter[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const fileNames = dialog.showOpenDialog({
                title: dlgTitle,
                filters: exts
            });

            if (fileNames === undefined || fileNames.length !== 1) {
                return reject;
            }

            return resolve(fileNames[0]);
        });
    }


    public getSaveFile(dlgTitle: string, exts: FileFilter[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const fileName: string | undefined = dialog.showSaveDialog({
                title: dlgTitle,
                filters: exts
            });

            if (fileName === undefined) {
                return reject;
            }
            console.log(`getSaveFile: ${fileName}`)
            return resolve(fileName);
        });
    }

    public readText(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(
                path.normalize(filePath),
                (err: NodeJS.ErrnoException, data: Buffer) => {
                    if (err) {
                        return reject(err);
                    }
                    this.setWindowTitle(filePath);
                    resolve(data.toString());
                }
            );
        });
    }

    public readBinary(filePath: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(
                path.normalize(filePath),
                (err: NodeJS.ErrnoException, data: Buffer) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(data);
                }
            );
        });
    }

    public writeBinary(filePath: string, contents: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const containerName: fs.PathLike = path.normalize(
                path.dirname(filePath)
            );
            const exists = fs.existsSync(containerName);
            if (!exists) {
                fs.mkdirSync(containerName);
            }

            fs.writeFile(path.normalize(filePath), contents, err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    public writeText(filePath: string, contents: string): Promise<void> {
        this.setWindowTitle(filePath);
        const buffer = Buffer.alloc(contents.length, contents);
        return this.writeBinary(filePath, buffer);
    }

    public deleteFile(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const exists = fs.existsSync(path.normalize(filePath));
            if (exists) {
                fs.unlink(filePath, err => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            }
        });
    }
}

export default LocalFileSystem;
