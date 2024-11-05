// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7242/api/Merge';

export const GetMerge = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}/merges`);
    return response.data;
};
