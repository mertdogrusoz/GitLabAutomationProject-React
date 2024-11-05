import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GroupList from './GroupList';
import ProjectDetails from './ProjectDetails'; // Örneğin, proje detayları için bir bileşen
import PackageDetails  from './PackageDetails'
import MargeDetails from './MargeDetails'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CommitDetails from './CommitDetails';
import BranchDetails from './BranchDetails';



function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GroupList />} />
                <Route path="/project/:groupId" element={<ProjectDetails />} />
                <Route path='/group/:groupId/packages' element={<PackageDetails />}/>
                <Route path='/project/:id/merges' element= {<MargeDetails/>}/>
                <Route path='/project/:projectId/commites' element = {<CommitDetails/>} />
                <Route path='/project/:projectId/branches' element = {<BranchDetails/>}/>
      
               
            </Routes>
        </BrowserRouter>
       
    );
}

export default App;
