// src/ProjectDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectsByGroupId } from './api';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProjectDetails = () => {
    const { groupId } = useParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await getProjectsByGroupId(groupId); 
                setProjects(data);
            } catch (error) {
                console.error("Projeler alınırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        if (groupId) {
            fetchProjects();
        }
    }, [groupId]);

    if (loading) return <p>Yükleniyor...</p>;

    return (
        <div className="container mt-5">
            <h2>GitLab Projeleri</h2>
            <table className="table table-striped table-bordered">
                <thead className="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th>Web URL</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <tr key={project.id}>
                            <td>{project.id}</td>
                            <td>{project.name}</td>
                            <td>{project.description || 'Yok'}</td>
                            <td><a href={project.webUrl} target="_blank" rel="noopener noreferrer">{project.webUrl}</a></td>
                        </tr>
                        
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProjectDetails;
