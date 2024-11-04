// src/GroupList.jsx
import React, { useEffect, useState } from 'react';
import { getGroups } from './api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const data = await getGroups();
                setGroups(data);
            } catch (error) {
                console.error("Gruplar alınırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) return <p>Yükleniyor...</p>;

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Gruplar</h2>
            <table className="table table-striped table-bordered">
                <thead className="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Group Name</th>
                        <th>Description</th>
                        <th>Durum</th>
                        <th>######</th>
                 
                    </tr>
                </thead>
                <tbody>
                    {groups.map(group => (
                        <tr key={group.id}>
                            <td>{group.id}</td>
                            <td>{group.name}</td>
                            <td>{group.description || 'Yok'}</td>
                            <td>{group.visibility}</td>
                            <td>
                              <Link to= {`project/${group.id}`} className='btn btn-primary'>
                              proje detaylarını gör
                              </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GroupList;
