import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GetCommit } from './commitApi';

const CommitDetails = () => {
    const { projectId } = useParams(); 
    const [commit, setCommit] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEffect = async () => {
            try {
                const data = await GetCommit(projectId);
                console.log('Alınan veri: ' + data);
                setCommit(data);
            } catch (error) {
                console.error("Commitler alınırken hata oluştu", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchEffect();
        }
    }, [projectId]);

    if (loading) return <p>Yükleniyor....</p>;

    return (
        <div className="container mt-5">
            <h2>Commitler</h2>
            <table className="table table-striped table-bordered">
                <thead className="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Commit Title</th>
                        <th>Commit Message</th>
                    </tr>
                </thead>
                <tbody>
                    {commit.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.title}</td>
                            <td>{item.message || 'Yok'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CommitDetails;
