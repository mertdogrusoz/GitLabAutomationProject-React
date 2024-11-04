// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7242/api/Group';

export const getGroups = async () => {
    const response = await axios.get(`${API_BASE_URL}/groups`);
    return response.data;
};

export const getProjectsByGroupId = async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/projects`);
    return response.data;
};

export const getNuGetPackagesByGroupId = async (groupId, searchTerm = '') => {
    const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/projects/packages`, {
        params: { searchTerm }
    });
    return response.data;
};

export const updatePackageVersion = async (projectName, packageId, version) => {
    const response = await axios.put(`${API_BASE_URL}/update-package-version`, null, {
        params: { projectName, packageId, version }
    });
    return response.data;
};
