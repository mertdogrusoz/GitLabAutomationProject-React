import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import { GetMerge } from "./mergeApi";



const MergeDetails = () =>{
    const {projectId} = useParams();
    const [merges,setMerges] = useState(null);
    const [loading,setLoading] = useState(true);


    useEffect(()=>{
        const fetchProjects = async () =>{
            try{
                const data = await GetMerge(projectId)
                setMerges(data)
            }
            catch(err)
            {
                console.error("Merge requestler alınırken hata oluştu",err);
            }

            finally{
                setLoading(false);
            }
        };

        if(projectId)
        {
            fetchProjects();

        }

    },[projectId])
    const createMergeRequest = async (projectId) => {
        try {
            const response = await fetch(`https://localhost:7242/api/Merge/${projectId}/merge-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceBranch: "versionUpdate", 
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


    return(
        <div className="container mt-5">
            <h2>Project Request</h2>
            <table className="table table-striped table-bordered">
                <thead className="thead-dark">
                    <tr>
                    <th>ID</th>
                        <th>Project Title</th>
                        <th>Description</th>
                        <th>Web URL</th>
                        <th>Merge Request oluştur</th>

                    </tr>

                </thead>
                <tbody>
                    {merges.map(item => (
                        <tr key={item.id}>
                       
                        <th>{item.title}</th>
                        <th><a href="" className="btn btn-primary" onClick={()=> createMergeRequest(projectId)}>Merge Request oluştur</a></th>
                     

                        </tr>
                     

                    ))}
                </tbody>

            </table>

        </div>
    );

}

export default MergeDetails;