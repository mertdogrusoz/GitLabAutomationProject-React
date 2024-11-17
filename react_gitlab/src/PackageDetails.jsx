import React, { act, useEffect, useState } from 'react';
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
    



    useEffect(()=>{
        const fetchProject = async () =>{
            if(!groupId)
            {
                console.error("Geçersiz grupID :" , groupId);
                setLoading(false);
                return;
            }
            setLoading(true);

            try{
                const fetchedProjects = await getProjectsByGroupId(groupId);
                const fetchedPackages = await getNuGetPackagesByGroupId(groupId);
            }
            catch(err)
            {
                console.error("Veriler alınırken hata oluştu: " ,err);
            }
            finally{
                setLoading(false);
            }
        }

    },[groupId]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
      
        
    };

    const handleCheckboxChange = (pkg) => {
        setSelectedPackages((prev) => {
            const updatedSelectedPackages = prev.includes(pkg)
                ? prev.filter((p) => p !== pkg)
                : [...prev, pkg];
   
            // actions'ı sadece update işlemine göre ayarla
            setActions(updatedSelectedPackages.map((pkg) => ({
                pkg,
                action: 'update', // sadece update işlemi
                filePath: `${pkg.projectName}/${pkg.projectName}.csproj`,
                content: '',
                newVersion: pkg.version,
                projectId: pkg.projectId,  // her paketin projectId'sini ekle
            })));
   
            return updatedSelectedPackages;
        });
    };
    
   
    
    
    const handleActionChange = (index, field, value) => {
        const updatedActions = [...actions];
    
        // Action türü otomatik olarak update yapılır
        updatedActions[index].action = 'update';
        updatedActions[index].previous_path = `${updatedActions[index].pkg.projectName}/${updatedActions[index].pkg.projectName}.csproj`;
        updatedActions[index].last_commit_id = "1";
        updatedActions[index].filePath = `${updatedActions[index].pkg.projectName}/${updatedActions[index].pkg.projectName}.csproj`;
    
        setActions(updatedActions);
    };

    
    
    
    const handleUpdateSelected = async () => {
        if (!actions.length) {
            alert("Hiçbir paket seçilmedi.");
            return;
        }

        const branchName = "versionUpdate";
        const commitMessage = "Multiple packages updated";

        const apiActions = await Promise.all(actions.map(async (action) => {
            const xamlContent = await fetchXAMLContent(groupId, action.pkg.projectName);
            if (!xamlContent) {
                console.error(`XAML içeriği alınamadı: ${action.pkg.projectName}`);
                return null;
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

        const validActions = apiActions.filter(action => action !== null);

        const projectId = projects.find(p => p.name === actions[0].pkg.projectName)?.id;
        if (!projectId) return alert("Proje bulunamadı.");

        await createBranch(projectId, branchName);

        const commitResponse = await createCommit(projectId, branchName, commitMessage, validActions);
        if (commitResponse && commitResponse.success) {
            for (const action of actions) {
                await updatePackageVersion(action.pkg.projectName, action.pkg.packageId, action.newVersion);
            }
            alert("Seçilen paketler başarıyla güncellendi.");
        } else {
            alert("Commit creation failed!");
        }
    };
    
    
    
    const UpdateVersion = async () => {
        const newVersion = prompt("Yeni Versiyonu giriniz: ");
        if (!newVersion) return alert("Versiyon bilgisi boş geçilemez.");
        if(selectedPackages == null) return alert("Paket seçilmedi");

        for (const pkg of selectedPackages) {
            const project = projects.find(p => p.name === pkg.projectName);
            if (!project) return alert(`Project not found: ${pkg.projectName}`);

            await updatePackageVersion(pkg.projectName, pkg.packageId, newVersion);
        }
        alert("Seçilen paketler için versiyon başarıyla güncellendi.");
    };
    const UpdateVersionSingle = async () =>{
        for(const pkg of selectedPackages)
        {
            if(selectedPackages == null)
            {
                return alert("Paket seçilmedi");
            }

            const newVersion = prompt("Yeni versiyonu giriniz: ");
            if(!newVersion)
            {
                return alert("Versiyon bilgisi boş geçilemez");
                continue;

            } 
    
            
            const project = projects.find(p => p.name === pkg.projectName);
            if(!project)
            {
                return alert(`Proje bulunamadı:  ${pkg.projectName}`);
                continue;

            }
            
            await updatePackageVersion(pkg.projectName,pkg.packageId,newVersion);
            alert(`Paket ${pkg.packageId} için versiyon başarıyla ${newVersion} olarak güncellendi.`);
    

        }
      
       
    }

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Branch: branchName, Ref: "master" })
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Branch oluşturma hatası: ${response.status}, Detaylar: ${JSON.stringify(errorDetails)}`);
            }
        } catch (error) {
            console.error('Branch oluşturma hatası:', error);
            alert(`Branch oluşturulamadı: ${error.message}`);
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
                const errorText = await response.text();
                throw new Error(`Commit creation error: ${response.status} - ${errorText}`);
            }
    
            return await response.json();
        } catch (error) {
            console.error(`Commit creation error: ${error.message}`);
            alert(`Commit creation failed: ${error.message}`);
            return null;
        }
    };

   const handleBranchCommitForMultipleProjects = async () => {
    if (!actions.length) return alert("Hiçbir paket seçilmedi.");

    const branchName = "versionUpdate";
    const commitMessage = "Multiple packages updated";

    const apiActions = await Promise.all(actions.map(async (action) => {
        const xamlContent = await fetchXAMLContent(groupId, action.pkg.projectName);
        if (!xamlContent) {
            console.error(`XAML içeriği alınamadı: ${action.pkg.projectName}`);
            return null;
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

    const validActions = apiActions.filter(action => action !== null);

    const projectId = projects.find(p => p.name === actions[0].pkg.projectName)?.id;
    if (!projectId) return alert("Proje bulunamadı.");

    await createBranch(projectId, branchName);

    const commitResponse = await createCommit(projectId, branchName, commitMessage, validActions);
    if (commitResponse && commitResponse.success) {
        for (const action of actions) {
            await updatePackageVersion(action.pkg.projectName, action.pkg.packageId, action.newVersion);
        }
        alert("Seçilen paketler başarıyla güncellendi.");
    } else {
        alert("Commit creation failed!");
    }
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
                        <th>Merge Request</th>
                        <th>Seç</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <tr key={project.id}>
                            <td>{project.id}</td>
                            <td>{project.name}</td>
                            <td>{project.description || 'Yok'}</td>
                            <td>
                            <a href={`/project/${project.id || 'defaultProjectId'}/merges`} className="btn btn-danger">Merge Request</a>
                            </td>
                            <td>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                />

                            </td>
                            <td>
                                <button className='btn btn-primary'>Branch oluşturma </button>
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
                        <th>Merge Request</th>
                        
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
                    <p>Eylem: Güncelle (Update)</p>
                    <input
                        type="text"
                        placeholder="Dosya Yolu"
                        value={action.filePath}
                        readOnly               
                        style={{display : 'none'}}   
                    />
                </div>

            ))}
            <button className="btn btn-primary" onClick={handleBranchCommitForMultipleProjects}>
                Branch-commit oluşturma
            </button>
            <button className="btn btn-warning" onClick={UpdateVersion}>
                 Tek Bir Versiyona Güncelle
            </button>
            <button className='btn btn-danger' onClick={UpdateVersionSingle}>
                Seçilen Her Paket için ayrı versiyon Güncellemesi
            </button>

          

          
        
         
        </div>
    );
};

export default PackageDetails;
