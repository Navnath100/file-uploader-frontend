import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { saveAs } from "file-saver";
import jwt_decode from "jwt-decode";
import './files.css'

export default function Files() {
    const navigate = useNavigate();
    const [token, setToken] = useState<any>(null)
    const [files, setFiles] = useState<Array<any>>(Array);

    useEffect(() => {
        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) navigate('/')
        else {
            const decoded: any = jwt_decode(jwtToken);
            setToken(jwtToken)
            getFiles(jwtToken)
        }
    }, [])

    function handleLogout() {
        localStorage.removeItem('token')
        navigate('/')
    }

    const credentials: any = {
        accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY
    }
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME
    const s3Client = new S3Client({ region: 'ap-south-1', credentials });

    function handleUpload(selectedFiles: any) {
        const file = selectedFiles.target.files[0];
        try {
            const parallelUploads3 = new Upload({
                client: s3Client,
                params: { Bucket: 'krayo-assignment', Key: file.name, Body: file },
                leavePartsOnError: false, // optional manually handle dropped parts
            });

            parallelUploads3.on("httpUploadProgress", (progress) => {
                console.log(progress);
            });

            parallelUploads3.done().then((res: any) => {
                const body = {
                    key: res.Key,
                    type: file.name.split(".")[1],
                    fileName: file.name
                }
                console.log("body : ", body);

                fetch('http://localhost:4000/file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', authorization: token },
                    body: JSON.stringify(body)
                }).then((response) => response.json())
                    .then((responseJson) => {
                        console.log(responseJson);
                        if (files.length > 0) {
                            setFiles([body, ...files])
                        } else setFiles([body])
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            });

        } catch (e: any) {
            console.log(e);
        }

    }

    async function downloadFile(key = "") {
        try {
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: key
            });
            const response: any = await s3Client.send(command);
            const byteArray = await response.Body.transformToByteArray();
            saveAs(new Blob([byteArray]), key);
        } catch (error) {
            console.log(error);
        }
    }

    async function getFiles(jwtToken = token) {
        fetch('http://localhost:4000/file', {
            method: 'Get',
            headers: { 'Content-Type': 'application/json', authorization: jwtToken },
        }).then(async (response) => {
            const responseJson: any = await response.json();
            if (response.ok) {
                console.log("responseJson : ", responseJson);
                setFiles(responseJson)
            }
            else if (response.status === 403) {
                handleLogout()
            }

        })
            .catch((error) => {
                console.error(error);
            });
    }

    return (
        <div className='files-container'>
            <div className='title'>
                <h2>Files</h2>
                <span style={{ display: 'flex' }}>
                    <input className="upload-btn" type={'file'} onChange={handleUpload} />
                    <a onClick={handleLogout} className="download-link">
                        <span className="download-icon">Logout</span>
                    </a>
                </span>
            </div>
            {
                files.map((file, index) => (
                    <div key={index}>
                        <div className="file-item">
                            <div className="file-name">{file.fileName}</div>
                            <a onClick={() => {
                                downloadFile(file.key)
                            }} className="download-link">
                                <span className="download-icon">Download</span>
                            </a>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}
