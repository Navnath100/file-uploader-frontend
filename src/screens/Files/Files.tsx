import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { saveAs } from "file-saver";
import jwt_decode from "jwt-decode";
import './files.css'
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { CircularProgress } from '@mui/material';

export default function Files() {
    const navigate = useNavigate();
    const [token, setToken] = useState<any>(null)
    const [files, setFiles] = useState<Array<any>>(Array);
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

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
        try {
            const file = selectedFiles.target.files[0];
            console.log("selected file : ", file);
            setUploadLoading(true)
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
                        setUploadLoading(false);
                        if (files.length > 0) {
                            setFiles([body, ...files])
                        } else setFiles([body])
                    })
                    .catch((error) => {
                        console.error(error);
                        setUploadLoading(false);
                    });
            }).catch((e: any) => {
                console.log("Catch : ", e)
                setUploadLoading(false);
            });

        } catch (e: any) {
            console.log("Catched error : ", e);
            setUploadLoading(false);
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
        setLoading(true);
        fetch('http://localhost:4000/file',
            {
                method: 'Get',
                headers: { 'Content-Type': 'application/json', authorization: jwtToken },
            }).then(async (response) => {
                setLoading(false)
                const responseJson: any = await response.json();
                if (response.ok) setFiles(responseJson)
                else if (response.status === 403) handleLogout()
            }).catch((error) => {
                console.error(error);
                setLoading(false)
            });
    }

    return (
        <div className='files-container'>
            <div className='title'>
                <h2>Files</h2>
                <span style={{ display: 'flex' }}>
                    <Button component="label" className="upload-btn" >
                        {
                            uploadLoading ?
                                <CircularProgress size={14} style={{ color: '#FFF' }} /> :
                                <span>Choose File<input hidden accept="image/*" type="file" onChange={handleUpload} /></span>
                        }
                    </Button>
                    <Button className="upload-btn" onClick={handleLogout}>
                        Logout
                    </Button>
                </span>
            </div>
            {
                !loading && files.length > 0 ?
                    files.map((file, index) => (
                        <div key={index}>
                            <div className="file-item">
                                <div className="file-name">{file.fileName}</div>
                                <Button className="upload-btn" onClick={() => {
                                    downloadFile(file.key)
                                }}>
                                    <span className="download-icon">Download</span>
                                </Button>
                            </div>
                        </div>
                    )) :
                    <div style={{ alignItems: 'center', height: 300, justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                        {
                            !loading ?
                                <><FileCopyOutlinedIcon fontSize='large' style={{ fontSize: 50, color: '#a9a9a9' }} />
                                    <span style={{ fontSize: 14, marginTop: 10 }}>No files found</span></> :
                                <CircularProgress size={16} />
                        }
                    </div>
            }
        </div>
    )
}
