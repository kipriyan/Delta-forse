import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JobApplyModal from '../components/JobApplyModal';
import axios from 'axios';
import { API_URL } from '../config/config';
import { useAuth } from '../context/AuthContext';

const MyJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState([]);

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        const response = await axios.get(`${API_URL}/profile/jobs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          const formattedJobs = response.data.data.map(job => ({
            id: job._id || job.id,
            position: job.title || 'Няма заглавие',
            company: job.company || 'Частно лице',
            type: job.job_type || 'Пълен работен ден',
            location: job.location || 'Няма локация',
            salary: job.salary || 'По договаряне',
            skills: job.requirements || 'Не са посочени',
            description: job.description || 'Няма описание',
            status: job.application_status || job.status || 'new'
          }));
          setJobs(formattedJobs);
        }
      } catch (err) {
        setError('Грешка при зареждане на обявите');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [token]);

  const applications = [
    {
      id: 1,
      position: "Senior Frontend Developer",
      company: "TechCorp Ltd.",
      status: "Разглежда се",
      appliedDate: "2024-02-15",
      location: "София",
      salary: "4000-6000 лв.",
      applicants: [
        {
          id: 1,
          name: "Иван Иванов",
          email: "ivan@example.com",
          phone: "0888 123 456",
          appliedDate: "2024-02-15",
          status: "pending",
          experience: "5 години",
          coverLetter: "Здравейте, бих искал да кандидатствам за позицията...",
          cv: "ivan-cv.pdf"
        }
      ]
    },
    {
      id: 2,
      position: "UX Designer",
      company: "DesignPro Ltd.",
      status: "Одобрена",
      appliedDate: "2024-02-10",
      location: "Пловдив",
      salary: "3000-4000 лв.",
      applicants: [
        {
          id: 1,
          name: "Мария Петрова",
          email: "maria@example.com",
          phone: "0888 456 789",
          appliedDate: "2024-02-10",
          status: "approved",
          experience: "3 години",
          coverLetter: "Уважаеми господине/госпожо, С настоящото писмо бих искала...",
          cv: "maria-cv.pdf"
        }
      ]
    }
  ];

  const savedJobs = [
    {
      id: 1,
      position: "UX/UI Designer",
      company: "DesignStudio Ltd.",
      savedDate: "2024-02-14",
      location: "Пловдив",
      salary: "3000-4500 лв.",
      applicants: [
        {
          id: 1,
          name: "Иван Иванов",
          email: "ivan@example.com",
          phone: "0888 123 456",
          appliedDate: "2024-02-16",
          status: "pending",
          experience: "5 години",
          coverLetter: "Здравейте, бих искал да кандидатствам за позицията...",
          cv: "ivan-cv.pdf"
        },
        {
          id: 2,
          name: "Мария Петрова",
          email: "maria@example.com",
          phone: "0888 456 789",
          appliedDate: "2024-02-15",
          status: "pending",
          experience: "3 години",
          coverLetter: "Уважаеми господине/госпожо, С настоящото писмо бих искала...",
          cv: "maria-cv.pdf"
        }
      ]
    }
  ];

  const myApplications = [
    {
      id: 1,
      jobTitle: "Строител",
      company: "Строителна Компания ООД",
      appliedDate: "2024-03-15",
      status: "Изпратена",
      location: "София",
      salary: "1500-2000 лв.",
      coverLetter: "Здравейте, бих искал да кандидатствам за позицията...",
      cv: "cv.pdf"
    },
    {
      id: 2,
      jobTitle: "Електротехник",
      company: "Електро Системи АД",
      appliedDate: "2024-03-10",
      status: "Разглежда се",
      location: "Пловдив",
      salary: "2000-2500 лв.",
      coverLetter: "Уважаеми господине/госпожо, С настоящото писмо бих искал...",
      cv: "cv_updated.pdf"
    }
  ];

  const fetchJobApplications = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data.map(app => ({
          id: app._id,
          applicant_name: app.applicant_name,
          email: app.email,
          phone_number: app.phone_number,
          created_at: app.created_at,
          status: app.status,
          cover_letter: app.cover_letter,
          cv: app.cv_url
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  };

  const handleViewApplications = async (job) => {
    const applications = await fetchJobApplications(job.id);
    setSelectedJobApplications(applications);
    setShowApplicationsModal(true);
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(
        `${API_URL}/jobs/applications/${applicationId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Обновяваме локалния списък с кандидатури
        setSelectedJobApplications(prevApps =>
          prevApps.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const ApplicationsModal = ({ applications, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Кандидатури</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {applications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Все още няма кандидатури</p>
          ) : (
            <div className="space-y-8">
              {applications.map((app) => (
                <div key={app.id || app._id} className="bg-gray-700 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">{app.applicant_name}</h3>
                      <div className="space-y-2">
                        <p className="text-gray-300 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {app.email}
                        </p>
                        <p className="text-gray-300 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {app.phone_number || 'Няма посочен телефон'}
                        </p>
                        <p className="text-gray-300 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Кандидатствал на: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium 
                        ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                          app.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                          app.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 
                          'bg-gray-600 text-gray-300'}`}
                      >
                        {app.status === 'pending' ? 'Разглежда се' : 
                         app.status === 'approved' ? 'Одобрена' : 
                         app.status === 'rejected' ? 'Отхвърлена' : 'Нова'}
                      </span>
                      {app.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                            className="px-4 py-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition-colors"
                          >
                            Одобри
                          </button>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/30 transition-colors"
                          >
                            Отхвърли
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <h4 className="text-lg font-medium text-white mb-3">Мотивационно писмо</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{app.cover_letter}</p>
                  </div>

                  {app.cv && (
                    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                      <span className="text-gray-300">CV на кандидата</span>
                      <a 
                        href={app.cv} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-700 text-blue-400 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Изтегли CV
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleEdit = (job) => {
    navigate('/publish-job', { 
      state: { 
        isEditing: true,
        jobData: job
      } 
    });
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете тази обява?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setJobs(jobs.filter(job => job.id !== jobId));
      }
    } catch (error) {
      setError('Грешка при изтриване на обявата');
      console.error('Error deleting job:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow">
        <div className="relative max-w-7xl mx-auto px-4 h-[200px] flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">
              Моите обяви
            </h1>
            <p className="text-xl text-gray-200">
              Управлявайте вашите кандидатури и запазени обяви
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Табове */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('applications')}
            >
              Моите обяви
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'saved' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('saved')}
            >
              Запазени обяви
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-applications' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('my-applications')}
            >
              Моите кандидатури
            </button>
          </div>

          {/* Списък с обяви */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-200">{job.position}</h3>
                      <p className="text-gray-400 mt-1">{job.company}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium 
                        ${job.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                          job.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                          'bg-gray-600 text-gray-300'}`}
                      >
                        {job.status === 'pending' ? 'Разглежда се' : 
                         job.status === 'approved' ? 'Одобрена' : 'Нова'}
                      </span>
                      <button
                        onClick={() => handleEdit(job)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-400 space-x-4">
                    <span>{job.location}</span>
                    <span>{job.type}</span>
                    <span>{job.salary}</span>
                  </div>
                  <p className="mt-4 text-gray-300">{job.description}</p>
                  <div className="mt-4 text-sm text-gray-400">
                    <span>Изисквания: {job.skills}</span>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button 
                      className="text-gray-300 hover:text-gray-100 font-medium transition-colors duration-300"
                      onClick={() => {
                        setSelectedJob(job);
                        handleViewApplications(job);
                      }}
                    >
                      Виж кандидатури →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Списък със запазени обяви */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {savedJobs.map(job => (
                <div key={job.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-200">{job.position}</h3>
                      <p className="text-gray-400 mt-1">{job.company}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-200">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-400 space-x-4">
                    <span>{job.location}</span>
                    <span>{job.salary}</span>
                    <span>Запазено на: {job.savedDate}</span>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button 
                      className="text-green-400 hover:text-green-300 font-medium transition-colors duration-300"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowApplyModal(true);
                      }}
                    >
                      Кандидатствай
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Списък с моите кандидатури */}
          {activeTab === 'my-applications' && (
            <div className="space-y-4">
              {myApplications.map(application => (
                <div key={application.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-200">
                        {application.jobTitle}
                      </h3>
                      <p className="text-gray-400 mt-1">{application.company}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium 
                        ${application.status === 'Разглежда се' ? 'bg-yellow-500/20 text-yellow-300' : 
                          application.status === 'Изпратена' ? 'bg-blue-500/20 text-blue-300' : 
                          'bg-gray-600 text-gray-300'}`}
                      >
                        {application.status}
                      </span>
                      <button
                        onClick={() => handleDelete(application.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Оттегли кандидатурата"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-400 space-x-4">
                    <span>{application.location}</span>
                    <span>{application.salary}</span>
                    <span>Кандидатствано на: {application.appliedDate}</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Мотивационно писмо
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {application.coverLetter}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <a 
                        href={application.cv}
                        className="inline-flex items-center text-gray-300 hover:text-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Изтегли CV
                      </a>
                      <button 
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={() => handleEdit(application)}
                      >
                        Редактирай кандидатурата →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модален прозорец за кандидатурите */}
      {showApplicationsModal && selectedJob && activeTab === 'applications' && (
        <ApplicationsModal
          applications={selectedJobApplications}
          onClose={() => {
            setSelectedJob(null);
            setShowApplicationsModal(false);
          }}
        />
      )}

      {/* Модален прозорец за кандидатстване (за запазените обяви) */}
      {showApplyModal && selectedJob && (
        <JobApplyModal
          job={selectedJob}
          isOpen={showApplyModal}
          initialData={editingApplication}
          isEditing={!!editingApplication}
          onClose={() => {
            setSelectedJob(null);
            setShowApplyModal(false);
            setEditingApplication(null);
          }}
        />
      )}
    </div>
  );
};

export default MyJobsPage; 