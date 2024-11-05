import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Getbranch, CreateBranch } from "./branchApi";

const BranchDetails = () => {
    const { projectId } = useParams();
    const [branch, setBranch] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newBranchName, setNewBranchName] = useState("");
    const [newBranchRef, setNewBranchRef] = useState("");

    useEffect(() => {
        const branchEffect = async () => {
            try {
                const data = await Getbranch(projectId);
                console.log('Alınan veri:', data);
                setBranch(data);
            } catch (err) {
                console.error("Branchler alınırken hata oluştu:", err);
            } finally {
                setLoading(false);
            }
        };
        
        if (projectId) {
            branchEffect();
        }
    }, [projectId]);
    
    const handleCreateBranch = async (e) => {
        e.preventDefault(); // Formun gönderilmesini engeller
        const createdBranch = await CreateBranch(projectId, newBranchName, newBranchRef);
        if (createdBranch) {
            setBranch((prevBranches) => [...prevBranches, createdBranch]); // Yeni branch'i ekle
            setNewBranchName(""); // Giriş alanını sıfırla
            setNewBranchRef(""); // Giriş alanını sıfırla
        }
    };

    if (loading) return <p>Yükleniyor...</p>;

    return (
        <div className="container mt-5">
            <h2>Branchler</h2>
            <form onSubmit={handleCreateBranch} className="mb-3">
                <div className="form-group">
                    <label htmlFor="branchName">Yeni Branch Adı</label>
                    <input
                        type="text"
                        id="branchName"
                        className="form-control"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="branchRef">Ref</label>
                    <input
                        type="text"
                        id="branchRef"
                        className="form-control"
                        value={newBranchRef}
                        onChange={(e) => setNewBranchRef(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Branch Oluştur</button>
            </form>
            <table className="table table-striped table-bordered">
                <thead className="thead-dark">
                    <tr>
                        <th>Branch Name</th>
                        <th>Author</th>
                       
                    </tr>
                </thead>
                <tbody>
                    {branch.map((item) => (
                        <tr key={item.commit.id}>
                            <td>{item.name}</td>
                            <td>{item.commit.message}</td>
                           
                          
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BranchDetails;
