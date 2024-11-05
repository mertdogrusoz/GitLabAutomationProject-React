import { useState, useEffect } from "react";
import { GetMerge } from "./mergeApi";
import { useParams } from "react-router-dom";

const MargeDetails = () => {
    const [loading, setLoading] = useState(true);
    const [merge, setMerge] = useState(null); // Başlangıç değeri null
    const { id } = useParams();

    useEffect(() => {
        const fetchMarge = async () => {
            try {
                const data = await GetMerge(id);
                console.log("API'den gelen veri:", data); // Veri yapısını görmek için
                setMerge(data); // Gelen veriyi doğrudan set et
            } catch (err) {
                console.error("Merge alınırken hata oluştu: " + err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMarge();
        }
    }, [id]);

    if (loading) return <p>Yükleniyor....</p>;
    if (!merge) return <p>Veri bulunamadı</p>;

    return (
        <div className="Merge Request">
         {merge.map((item)=>(
                <div key={item.id}>
                    <h2>id'si {item.id} olan projenin merge requestleri gözükmektedir.</h2>
                    <p>{item.title}</p>
                    <p>{item.description}</p>
                    



                </div>
         ))}
         
        </div>
    );

    
};

export default MargeDetails;
