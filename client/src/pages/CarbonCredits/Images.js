import React, { useState } from 'react'
import { Button, Upload, message } from 'antd';
import { useDispatch } from "react-redux";
import { SetLoader } from '../../redux/loadersSlice';

function Images({
    selectedCredit,
    setShowCreditsForm,
    getData,
}) {
  const [file=null, setFile] = useState(null);
  const dispatch = useDispatch();
  const upload = async () => {
    try{
      console.log('File:', file);
        
      if(!file){
        message.error('Please select an image to upload.');
        return;
      }
      dispatch(SetLoader(true)); 
      
      // Upload Image to cloudinary 
      const formData = new FormData();
      formData.append("file", file);
      formData.append("creditId", selectedCredit._id);
      
      const token = localStorage.getItem("usersdatatoken");
      const res = await fetch("/upload-image-to-form", {
        method: "POST",
        headers: {
          "Authorization": token,
        },
        body: formData,
      });
      const data = await res.json();
      if(data.success){
        message.success(data.message);
        getData();
        setShowCreditsForm(false);
      }else{
        message.error(data.message);
      }
    }catch(error){
      dispatch(SetLoader(false)); 
      message.error(error.message);
    }
  }
  return (
    <div>
        <Upload listType="picture" beforeUpload={() => false} onChange={(info) => {setFile(info.file);}}>
            <Button type="dashed">Upload Image</Button>
        </Upload>
        <div className='flex justify-end gap-5 md-5'>
            <Button type="default" onClick={()=>{setShowCreditsForm(false);}}>
             Cancel
            </Button>
            <Button type="primary" disabled={!file} onClick={upload}>
              Upload
            </Button>
        </div>
    </div>
  )
}

export default Images;

