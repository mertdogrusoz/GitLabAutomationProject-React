// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7242/api/Commit';
export const GetCommit = async (projectId) => {
    const response = await axios.get(`${API_BASE_URL}/project/${projectId}/commites`);
    return response.data;
};

