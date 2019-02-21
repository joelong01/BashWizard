import { BrowserWindow, dialog } from "electron";
import fs from "fs";
import path from "path";
import { IStorageProvider } from "./storageProviderFactory";

export class LocalFileSystem implements IStorageProvider {
    constructor(private browserWindow: BrowserWindow) {}

    public getFile(dlgTitle: string, extensions: string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const fileNames = dialog.showOpenDialog({
                title: dlgTitle,
                filters: [{ name: "Bash Files", extensions: ["sh"] }]
            });

            if (fileNames === undefined || fileNames.length !== 1) {
                return reject;
            }
            return resolve(fileNames[0]);
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