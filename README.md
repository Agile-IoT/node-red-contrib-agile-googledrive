<!--
# Copyright (C) 2017 Orange.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
# 
# Contributors:
#     Rombit - initial API and implementation
-->

# node-red-contrib-agile-googledrive

<p>A node to upload files to the google drive API. </p>

<b>Important: This the google drive authorization only works on localhost and public domains

<h1>Instructions</h1>
<h2>Configuration</h2>
<ul>
    <li>1. Edit the node and add a Google Id, follow the instructions of the config node.</li>
    <li>2. Add the google ID, click on done for the node config and deploy the flow.</li>
    <li>3. Edit the node again, now you can browse the root folder list of your google Drive.</li>
</ul>
<h2>Upload a file</h2>
<p>Connect a node with the following output</p>
<p>msg.payload: The text content of the file upload</p>
<p>msg.localpath: The local file path of the file to upload</p>
<p>Either the payload or the localpath are required. The payload has a higher priority as the localpath</p>

<h1>Remarks</h1>

<ul>
    <li>If the google callback returns that the profile fetching failed, you need to enable the google+ api in console.developers.google.com</li>
    <li>Check in the console.developers.google.com dashboard that the google+ API and google Drive API are active.</li>
</ul>

changelog:

v1.0.1: Added an output to the node with status messages.

v1.0.0: init