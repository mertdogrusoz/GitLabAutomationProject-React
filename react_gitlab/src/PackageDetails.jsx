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

    // Combined fetch function
    useEffect(() => {
        const fetchData = async () => {
            if (!groupId) {
                console.error("Geçersiz groupId:", groupId);
                setLoading(false);
                return;
            }
    
            setLoading(true);
            try {
                const [fetchedProjects, fetchedPackages] = await Promise.all([
                    getProjectsByGroupId(groupId),
                    getNuGetPackagesByGroupId(groupId)
                ]);
    
                setProjects(fetchedProjects);
                setPackages(fetchedPackages);
            } catch (error) {
                console.error("Veriler alınırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [groupId]);

    const handleCheckboxChange = (pkg) => {
        setSelectedPackages((prev) => {
            const updatedSelectedPackages = prev.includes(pkg)
                ? prev.filter((p) => p !== pkg)
                : [...prev, pkg];
    
            setActions(updatedSelectedPackages.map((pkg) => ({
                pkg,
                action: 'update',
                filePath: `${pkg.projectName}/${pkg.projectName}.csproj`,
                content: '',
                newVersion: pkg.version,
                projectId: projects.find(p => p.name === pkg.projectName)?.id
            })));
    
            return updatedSelectedPackages;
        });
    };

    const fetchXAMLContent = async (groupId, projectName) => {
        try {
            const response = await axios.get(`https://localhost:7242/api/Group/groups/${groupId}/projects/${projectName}/xaml`);
            return response.data;
        } catch (error) {
            console.error('XAML fetch error:', error);
            return null;
        }
    };

    const createBranch = async (projectId, branchName) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Branch/projects/${projectId}/createbranch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Branch: branchName, Ref: "master" })
            });

            if (!response.ok) {
                throw new Error(`Branch oluşturma hatası: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('Branch oluşturma hatası:', error);
            throw error;
        }
    };

    const createCommit = async (projectId, branchName, commitMessage, actions) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Commit/project/${projectId}/createcommit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch: branchName,
                    CommitMessage: commitMessage,
                    actions
                })
            });

            if (!response.ok) {
                throw new Error(`Commit creation error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Commit creation error:', error);
            throw error;
        }
    };
    const createMergeRequest = async (projectId,branchName) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Merge/${projectId}/merge-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceBranch: branchName, 
                    targetBranch: 'master',       
                    title: 'versiyon güncelleme'  
                })
            });
            console.log("Merge Request oluşturuldu");
            return response.ok;

            
        } catch (err) {
            console.error(`Merge request oluşturulurken hata oluştu: ${err.message}`);
            return false;
        }
    };

    if(loading) return <p>Yükleniyor...</p>


    const handleBranchCommitForMultipleProjects = async () => {
        if (!actions.length) {
            alert("Hiçbir paket seçilmedi.");
            return;
        }
    
        const baseBranchName = "versionUpdate";
        const commitMessage = "Multiple packages updated";
    
        const actionsByProject = actions.reduce((acc, action) => {
            const projectId = action.pkg.projectId || projects.find(p => p.name === action.pkg.projectName)?.id;
            if (!projectId) return acc;
    
            if (!acc[projectId]) {
                acc[projectId] = [];
            }
            acc[projectId].push(action);
            return acc;
        }, {});
    
        try {
            for (const [projectId, projectActions] of Object.entries(actionsByProject)) {
                
                let branchName = baseBranchName;
                let branchSuffix = 1;
    
                while (await branchExists(projectId, branchName)) {
                    branchSuffix++;
                    branchName = `${baseBranchName}_V${branchSuffix}`;
                }
                
    
                const apiActions = await Promise.all(projectActions.map(async (action) => {
                    const xamlContent = await fetchXAMLContent(groupId, action.pkg.projectName);
                    if (!xamlContent) {
                        throw new Error(`XAML içeriği alınamadı: ${action.pkg.projectName}`);
                    }
    
                    return {
                        action: "update",
                        file_path: action.filePath,
                        content: xamlContent,
                        encoding: "text",
                        previous_path: action.filePath,
                        last_commit_id: "1"
                    
                    };
                
                }));
    
                await createBranch(projectId, branchName);
                await createCommit(projectId, branchName, commitMessage, apiActions);
                await createMergeRequest(projectId,branchName);
            }
    
            await Promise.all(actions.map(action => 
                updatePackageVersion(action.pkg.projectName, action.pkg.packageId, action.newVersion)
            ));
    
            alert("Seçilen paketler başarıyla güncellendi.");
        } catch (error) {
            alert(`İşlem sırasında hata oluştu: ${error.message}`);
        }
    };

    

    const updateVersionBulk = async () => {
        const newVersion = prompt("Yeni Versiyonu giriniz: ");
        if (!newVersion || !selectedPackages.length) {
            alert("Versiyon bilgisi boş geçilemez ve en az bir paket seçilmelidir.");
            return;
        }

        try {
            await Promise.all(selectedPackages.map(async pkg => {
                const project = projects.find(p => p.name === pkg.projectName);
                if (!project) throw new Error(`Proje bulunamadı: ${pkg.projectName}`);
                await updatePackageVersion(pkg.projectName, pkg.packageId, newVersion);
            }));
            alert("Seçilen paketler için versiyon başarıyla güncellendi.");
        } catch (error) {
            alert(`Güncelleme sırasında hata oluştu: ${error.message}`);
        }
    };

    const updateVersionIndividual = async () => {
        if (!selectedPackages.length) {
            alert("Paket seçilmedi");
            return;
        }

        try {
            for (const pkg of selectedPackages) {
                const newVersion = prompt(`${pkg.packageId} için yeni versiyonu giriniz:`);
                if (!newVersion) continue;

                const project = projects.find(p => p.name === pkg.projectName);
                if (!project) {
                    alert(`Proje bulunamadı: ${pkg.projectName}`);
                    continue;
                }

                await updatePackageVersion(pkg.projectName, pkg.packageId, newVersion);
                alert(`Paket ${pkg.packageId} için versiyon başarıyla ${newVersion} olarak güncellendi.`);
            }
        } 
        catch (error) {
            alert(`Güncelleme sırasında hata oluştu: ${error.message}`);
        }
    };

      
    const branchExists =  async (projectId, branchName) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Branch/projects/${projectId}/${branchName}`);
           if(response.status === 204)
           {
            return false;
           }

           return response.ok; // Başarılı bir yanıt (ör. 200)
        } catch (error) {
            console.error(`Branch kontrol edilirken hata oluştu: ${error.message}`);
            return false;
        }
    };

   

  
    
        
    if (loading) return <div className="container mt-5">Yükleniyor...</div>;

    return (
        <div className="container mt-5">
            <h2>GitLab Projeleri</h2>
            <table className="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th>Merge Request</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <tr key={project.id}>
                            <td>{project.id}</td>
                            <td>{project.name}</td>
                            <td>{project.description || 'Yok'}</td>
                            <td>
                                <a href={`/project/${project.id}/merges`} className="btn btn-danger">
                                    Merge Request
                                </a>
                            </td>

                           
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                        checked={selectedPackages.includes(pkg)}
                                        onChange={() => handleCheckboxChange(pkg)}
                                    />
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>

            {actions.length > 0 && (
                <>
                    <h2>Seçilen Paketler için Eylem Bilgileri</h2>
                    {actions.map((action, index) => (
                        <div key={index} className="mb-3">
                            <h4>{action.pkg.packageId}</h4>
                            <p>Eylem: Güncelle (Update)</p>
                        </div>
                    ))}
                </>
            )}

            <div className="mt-3 mb-5">
                <button 
                    className="btn btn-primary me-2" 
                    onClick={handleBranchCommitForMultipleProjects}
                    disabled={!actions.length}
                >
                    Branch-commit oluştur
                </button>
                <button 
                    className="btn btn-warning me-2" 
                    onClick={updateVersionBulk}
                    disabled={!selectedPackages.length}
                >
                    Tek Versiyona Güncelle
                </button>
                <button 
                    className="btn btn-danger" 
                    onClick={updateVersionIndividual}
                    disabled={!selectedPackages.length}
                >
                    Her Paket için Ayrı Versiyon
                </button>
            </div>
        </div>
    );
};

export default PackageDetails;