import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { saveAs } from "file-saver";
import jwt_decode from "jwt-decode";
import './files.css'

export default function Files() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [files, setFiles] = useState<Array<any>>(Array);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/')
        else {
            const decoded: any = jwt_decode(token);
            setUser(decoded)
            getFiles(decoded.email)
        }
    }, [])

    function handleLogout() {
        localStorage.removeItem('token')
        navigate('/')
    }
    function handleUpload(selectedFiles: any) {
        const file = selectedFiles.target.files[0];
        console.log("selected file", file);

        try {
            const parallelUploads3 = new Upload({
                client: new S3Client({ region: 'ap-south-1', credentials: { accessKeyId: 'AKIAYXWB4ZWHO5GYBZE5', secretAccessKey: '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' } }),
                params: { Bucket: 'krayo-assignment', Key: file.name, Body: file },
                leavePartsOnError: false, // optional manually handle dropped parts
            });

            parallelUploads3.on("httpUploadProgress", (progress) => {
                console.log(progress);
            });

            parallelUploads3.done().then((res: any) => {
                const body = {
                    email: user.email,
                    key: res.Key,
                    type: file.name.split(".")[1],
                    fileName: file.name
                }
                console.log("body : ", body);

                fetch('http://localhost:4000/file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
    const credentials: any = {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
    const s3Client = new S3Client({ region: 'ap-south-1', credentials });

    async function downloadFile(key = "") {
        try {
            const command = new GetObjectCommand({
                Bucket: "krayo-assignment",
                Key: key,
            });
            const response: any = await s3Client.send(command);
            const file = new Blob([response.Body]);
            saveAs(file, key);
        } catch (error) {
            console.log(error);
        }
    }

    async function getFiles(email = user?.email) {
        fetch('http://localhost:4000/file?email=' + email, {
            method: 'Get',
            headers: { 'Content-Type': 'application/json' },
        }).then((response) => response.json())
            .then((responseJson) => {
                console.log("responseJson : ", responseJson);

                setFiles(responseJson)
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
            {files.map((file, index) => (
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
            ))}
        </div>
    )
}
