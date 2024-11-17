import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GroupList from './GroupList';
import ProjectDetails from './ProjectDetails'; 
import PackageDetails  from './PackageDetails'

import MergeDetails from './MergeDetails';







function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GroupList />} />
                <Route path="/project/:groupId" element={<ProjectDetails />} />
                <Route path='/group/:groupId/packages' element={<PackageDetails />}/>

                <Route path = '/project/:projectId/merges' element = {<MergeDetails />} />
             
                
              


               
                
      
               
            </Routes>
        </BrowserRouter>
       
    );
}

export default App;
