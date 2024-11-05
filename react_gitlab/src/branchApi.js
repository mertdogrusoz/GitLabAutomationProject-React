// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7242/api/Branch';
export const Getbranch = async (projectId) => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/branches`);
    return response.data;
};

export const CreateBranch = async (projectId, branchName,ref) => {
    try{
        
        const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/createcommit`,{
            Branch: branchName,
            Ref : ref,
        });
        return response.data;


    }catch(err){
        console.error("Brach oluşturulurken hata oluştu: " , err);
        return null;
    }
   
};

