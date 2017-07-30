/*******************************************************************************
 *Copyright (C) 2017 Orange Belgium.
 *All rights reserved. This program and the accompanying materials
 *are made available under the terms of the Eclipse Public License v1.0
 *which accompanies this distribution, and is available at
 *http://www.eclipse.org/legal/epl-v10.html
 *
 *Contributors:
 *    Orange Belgium - initial API and implementation
 ******************************************************************************/
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const path = require('path');
var fs = require('fs');
var google = require('googleapis');
var d = require('debug')('GoogleDriveGFileUpload');
var dateFormat = require('dateformat');

// var scopes = [
//     'https://www.googleapis.com/auth/drive',
//     'https://www.googleapis.com/auth/drive.appdata',
//     'https://www.googleapis.com/auth/drive.file',
//     'https://www.googleapis.com/auth/drive.metadata',
//     'https://www.googleapis.com/auth/drive.metadata.readonly',
//     'https://www.googleapis.com/auth/drive.photos.readonly',
//     'https://www.googleapis.com/auth/drive.readonly',
//     'https://www.googleapis.com/auth/drive.scripts'
// ];

module.exports = function (RED) {
    "use strict";
    function googleDriveFileUploadNode(config) {
        var node = this;
        RED.nodes.createNode(this, config);
        node.driveFolder = config.driveFolder;
        node.driveFolderId = config.driveFolderId;
        this.google = RED.nodes.getNode(config.google);
        if (!this.google || !this.google.credentials.accessToken) {
            d(RED._("googleDriveFileUpload.warn.no-credentials"));
            node.status({fill: "red", shape: "dot", text: "googleDriveFileUpload.warn.no-credentials"});
            return;
        } else {
            node.status({fill: "blue", shape: "dot", text: "googleDriveFileUpload.status.waiting-for-file"});
        }
        node.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'starting'
        });

        this.on('input', function (msg) {
            var localpath = msg.localpath;
            var payload = msg.payload;
            if (typeof localpath !== 'undefined' || (typeof payload !== 'undefined' || !payload)) {
                node.status({fill: 'yellow', shape: 'dot', text: 'uploading file'});
                var uploadFileBool = (typeof localpath !== 'undefined' && (typeof payload === 'undefined' || !payload));
                var uploadConfig = {
                    uploadFileBool: uploadFileBool,
                    uploadContent: payload,
                    uploadFileName: dateFormat(new Date(), "yyyy.mm.dd") + "-Agile.txt"
                };
                if (uploadFileBool) {
                    fs.readFile(localpath, 'utf8', function (err, file) {
                        if (err) {
                            d(RED._('googleDriveFileUpload.error.failed-read-file: ') + err.toString());
                            return;
                        }
                        uploadConfig.uploadContent = file.toString();
                        uploadConfig.uploadFileName = path.basename(localpath);
                        uploadToDrive(uploadConfig, node, function (err) {
                            if (err) {
                                node.error(err);
                                node.status({
                                    fill: "red",
                                    shape: "ring",
                                    text: "googleDriveFileUpload.status.error-uploading"
                                });
                                return;
                            }
                            node.status({
                                fill: "blue",
                                shape: "dot",
                                text: "googleDriveFileUpload.status.waiting-for-file"
                            });
                        });
                    });
                } else {
                    uploadToDrive(uploadConfig, node, function (err) {
                        if (err) {
                            node.error(err);
                            node.status({
                                fill: "red",
                                shape: "ring",
                                text: "googleDriveFileUpload.status.error-uploading"
                            });
                            return;
                        }
                        node.status({
                            fill: "blue",
                            shape: "dot",
                            text: "googleDriveFileUpload.status.waiting-for-file"
                        });
                    });
                }
            } else {
                d(RED._('googleDriveFileUpload.warn.no-file-content-long'));
                node.status({fill: "red", shape: "ring", text: "googleDriveFileUpload.warn.no-file-content"});
            }
        });
        node.status({fill: "blue", shape: "dot", text: "googleDriveFileUpload.status.waiting-for-file"});

        function folderList(node, cb) {
            var req = {
                method: 'GET',
                url: 'https://www.googleapis.com/drive/v3/files',
                qs: {corpora: 'user', q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents"}

            };
            node.google.request(req, function (err, data) {
                if (err) {
                    d(RED._('googleDriveFileUpload.status.google-drive-error') + ': ' + err.toString());
                    cb(RED._("googleDriveFileUpload.error.fetch-failed", {message: err.toString()}));
                    return;
                }
                if (data.error) {
                    d(RED._('googleDriveFileUpload.status.google-drive-error'));
                    cb(RED._("googleDriveFileUpload.error.fetch-failed", {message: data.error.message}));
                }
                cb(data);
            });
        }

        function uploadToDrive(uploadConfig, node, cb) {

            const boundary = '--------54064848621236985632';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "\r\n";

            var tmpFolderId = (node.driveFolderId && node.driveFolderId !== '0') ? [node.driveFolderId] : [];
            var contentType = "text/plain";
            var metadata = {name: uploadConfig.uploadFileName, parents: tmpFolderId};
            var multipartRequestBody =
                delimiter + 'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter + 'Content-Type: ' + contentType + '\r\n' + '\r\n' +
                uploadConfig.uploadContent +
                close_delim;

            var req = {
                method: 'POST',
                url: 'https://www.googleapis.com/upload/drive/v3/files',
                qs: {uploadType: 'multipart'},
                headers: {'Content-Type': 'multipart/related; boundary=--------54064848621236985632'},
                body: multipartRequestBody
            };
            node.google.request(req, function (err, data) {
                if (err) {
                    d(RED._('googleDriveFileUpload.status.google-drive-error') + ': ' + err.toString());
                    cb(RED._("googleDriveFileUpload.error.fetch-failed", {message: err.toString()}));
                    return;
                }
                if (data.error) {
                    d(RED._('googleDriveFileUpload.status.google-drive-error'));
                    cb(RED._("googleDriveFileUpload.error.fetch-failed", {message: data.error.message}));
                    return;
                }
                cb(null);
            });
        }

        RED.httpAdmin.get("/folders", function (req, res) {
            var folders = [];

            if (req.query.googleNodeId === node.google.id) {
                folders.push({name: 'root', id: 0});
                folderList(node, function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    data["files"].forEach(function (data) {
                        folders.push({name: data.name, id: data.id});
                    });
                    node.status({fill: "blue", shape: "dot", text: "googleDriveFileUpload.status.waiting-for-file"});
                    res.json(folders);
                });
            } else {
                res.json(404, {
                    msg: RED._("googleDriveFileUpload.error.fetch-unauthorized")
                });
            }
        });
    }
    RED.nodes.registerType("agile-GDrive-upload", googleDriveFileUploadNode);
};
