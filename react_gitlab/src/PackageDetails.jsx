import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectsByGroupId, getNuGetPackagesByGroupId, updatePackageVersion } from './api';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const PackageDetails = () => {
    const { groupId } = useParams();
    const [projects, setProjects] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [actions, setActions] = useState([]);
    const [newVersion, setNewVersion] = useState("");

    useEffect(() => {
        const fetchProjectsAndPackages = async () => {
            if (!groupId) {
                console.error("Geçersiz groupId:", groupId);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const fetchedProjects = await getProjectsByGroupId(groupId);
                const fetchedPackages = await getNuGetPackagesByGroupId(groupId);

                setProjects(fetchedProjects);
                setPackages(fetchedPackages);
            } catch (error) {
                console.error("Veriler alınırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectsAndPackages();
    }, [groupId]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCheckboxChange = (pkg) => {
        setSelectedPackages((prev) =>
            prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
        );

        if (!selectedPackages.includes(pkg)) {
            setActions([...actions, { pkg, action: 'create', filePath: '', content: '' }]);
        } else {
            setActions(actions.filter(action => action.pkg !== pkg));
        }
    };

    const handleActionChange = (index, field, value) => {
        const updatedActions = [...actions];
        updatedActions[index][field] = value;

        if (field === 'action') {
            if (value === 'create') {
                updatedActions[index].previous_path = '';
                updatedActions[index].last_commit_id = '';
            } else if (value === 'update') {
                const previousPath = prompt("Lütfen previous_path değerini girin:");
                const lastCommitId = prompt("Lütfen last_commit_id değerini girin:");
                updatedActions[index].previous_path = previousPath;
                updatedActions[index].last_commit_id = lastCommitId;
            }
        }

        setActions(updatedActions);
    };

    const handleUpdateSelected = async () => {
        const branchName = prompt("Branch ismi girin:");
        if (!branchName) return alert("Branch name cannot be empty!");

        const commitMessage = prompt("Commit mesajinizi girin:");
        if (!commitMessage) return alert("Commit message cannot be empty!");

        for (const action of actions) {
            const project = projects.find(p => p.name === action.pkg.projectName);
            if (!project) return alert(`Project not found: ${action.pkg.projectName}`);

            const projectId = project.id;

            const xamlContent = await fetchXAMLContent(groupId, action.pkg.projectName);
            if (!xamlContent) return; // XAML içeriği boşsa dur

            const apiActions = [{
                action: "update",
                file_path: action.filePath,
                content: xamlContent,
                encoding: "text",
                ...(action.action === 'update' && {
                    previous_path: action.previous_path,
                    last_commit_id: action.last_commit_id,
                })
            }];

            await createBranch(projectId, branchName);
            await createCommit(projectId, branchName, commitMessage, apiActions);
            await updatePackageVersion(action.pkg.projectName, action.pkg.packageId, newVersion);
        }
        alert("Selected packages have been successfully updated.");
    };

    const UpdateVersion = async () => {
        const newVersion = prompt("Yeni Versiyonu giriniz: ");
        if (!newVersion) return alert("Versiyon bilgisi boş geçilemez.");

        for (const pkg of selectedPackages) {
            const project = projects.find(p => p.name === pkg.projectName);
            if (!project) return alert(`Project not found: ${pkg.projectName}`);

            await updatePackageVersion(pkg.projectName, pkg.packageId, newVersion);
        }
        alert("Seçilen paketler için versiyon başarıyla güncellendi.");
    };

    const fetchXAMLContent = async (groupId, projectName) => {
        try {
            const response = await axios.get(`https://localhost:7242/api/Group/groups/${groupId}/projects/${projectName}/xaml`);
            return response.data;
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    };

    const createBranch = async (projectId, branchName) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Branch/projects/${projectId}/createbranch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Branch: branchName, Ref: "master" })
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Branch oluşturma hatası: ${response.status}, Detaylar: ${JSON.stringify(errorDetails)}`);
            }
        } catch (error) {
            console.error('Branch oluşturma hatası:', error);
        }
    };

    const createCommit = async (projectId, branchName, commitMessage, actions) => {
        const response = await fetch(`https://localhost:7242/api/Commit/project/${projectId}/createcommit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                branch: branchName,
                CommitMessage: commitMessage,
                actions
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Commit creation error: ${response.status} - ${errorText}`);
            throw new Error(`Commit creation error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    };

    if (loading) return <p>Yükleniyor...</p>;

    return (
        <div className="container mt-5">
            <h2>GitLab Projeleri</h2>
            <table className="table table-striped table-bordered">
                <thead>
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

            <h2>Tüm Proje Paketleri</h2>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Paketleri Arayın"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <table className="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Package Name</th>
                        <th>Package Version</th>
                        <th>Seç</th>
                    </tr>
                </thead>
                <tbody>
                    {packages
                        .filter(pkg => pkg.packageId.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(pkg => (
                            <tr key={`${pkg.projectName}-${pkg.packageId}`}>
                                <td>{pkg.projectName}</td>
                                <td>{pkg.packageId}</td>
                                <td>{pkg.version}</td>
                                <td>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        onChange={() => handleCheckboxChange(pkg)}
                                    />
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>

            <h2>Seçilen Paketler için Eylem Bilgileri</h2>
            {actions.map((action, index) => (
                <div key={index} className="mb-3">
                    <h4>{action.pkg.packageId}</h4>
                    <select value={action.action} onChange={(e) => handleActionChange(index, 'action', e.target.value)}>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Dosya Yolu"
                        value={action.filePath}
                        onChange={(e) => handleActionChange(index, 'filePath', e.target.value)}
                    />
                </div>
            ))}

            <button className="btn btn-primary" onClick={handleUpdateSelected}>
                Branch-commit oluşturma
            </button>
            <button className="btn btn-warning" onClick={UpdateVersion}>
                Versiyonu Güncelle
            </button>
        </div>
    );
};

export default PackageDetails;
