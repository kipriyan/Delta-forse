import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompaniesPage from './pages/CompaniesPage';
import PublishJobPage from './pages/PublishJobPage';
import MyJobsPage from './pages/MyJobsPage';
import EquipmentPage from './pages/EquipmentPage';

function App() {
  return (
    <AuthProvider>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/publish-job" element={<PublishJobPage />} />
          <Route path="/my-jobs" element={<MyJobsPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
        </Routes>
      </Layout>
    </Router>
    </AuthProvider>
  );
}

export default App;
