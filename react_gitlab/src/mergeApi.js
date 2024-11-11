// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7242/api/Merge';

export const GetMerge = async (projectId) => {
    const response = await axios.get(`${API_BASE_URL}/${projectId}/merges`);
    return response.data;
};
export const CreateMerge = async () =>{
    const response = await axios.get(`${API_BASE_URL}/${projectId}/createmerge`);
    return response.data;
};


