import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GroupList from './GroupList';
import ProjectDetails from './ProjectDetails'; // Örneğin, proje detayları için bir bileşen
import PackageDetails  from './PackageDetails'


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GroupList />} />
                <Route path="/project/:groupId" element={<ProjectDetails />} />
                <Route path='/group/:groupId/packages' element={<PackageDetails />}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
