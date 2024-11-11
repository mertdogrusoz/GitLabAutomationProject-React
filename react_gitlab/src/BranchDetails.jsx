import { useState,useEffect } from "react";
import { Getbranch } from "./branchApi";
import { useParams } from "react-router-dom";

const BranchDetails = () => {

    const {projectId} = useParams();
    const [branches, setBranches] = useState(null);
    const [loading,setLoading] = useState(true);



useEffect(()=>{
    const fetchProjects = async () =>{
        try{
            const data = await Getbranch(projectId);
            setBranches(data);

        }
        catch(err)
        {
            console.error("Branchler alınırken hata oluştu",err)
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


}


export default BranchDetails;