import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import { GetMerge } from "./mergeApi";
import { Getbranch } from "./branchApi";


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

                    </tr>

                </thead>
                <tbody>
                    {merges.map(item => (
                        <tr key={item.id}>
                       
                        <th>{item.title}</th>
                     

                        </tr>
                     

                    ))}
                </tbody>

            </table>

        </div>


    );

}

export default MergeDetails;