import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JobApplyModal from '../components/JobApplyModal';
import axios from 'axios';
import { API_URL } from '../config/config';
import { useAuth } from '../context/AuthContext';

const MyJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApplications, setLoadingMyApplications] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  useEffect(() => {
    if (activeTab === 'my-applications' && token) {
      fetchMyApplications();
    }
  }, [activeTab, token]);

  const fetchMyApplications = async () => {
    setLoadingMyApplications(true);
    try {
      const response = await axios.get(`${API_URL}/profile/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('Кандидатури от API:', response.data);
        
        const formattedApplications = response.data.data.map(app => ({
          id: app._id || app.id,
          jobTitle: app.job_title || 'Няма заглавие',
          company: app.employer_name || app.company_name || 'Частно лице',
          appliedDate: new Date(app.created_at).toLocaleDateString(),
          status: app.status === 'pending' ? 'Разглежда се' : 
                 app.status === 'approved' ? 'Одобрена' : 
                 app.status === 'rejected' ? 'Отхвърлена' : 'Изпратена',
          location: app.location || 'Няма локация',
          salary: app.salary || 'По договаряне',
          coverLetter: app.cover_letter || '',
          phone_number: app.phone_number,
          cv: app.resume_url
        }));
        
        setMyApplications(formattedApplications);
      }
    } catch (err) {
      console.error('Грешка при зареждане на кандидатурите:', err);
    } finally {
      setLoadingMyApplications(false);
    }
  };

  const applications = [

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
          id: app._id || app.id,
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
    if (!applicationId) {
      console.error('Error: Application ID is undefined');
      return;
    }
    
    try {
      console.log(`Updating application ${applicationId} status to ${newStatus}`);
      
      const response = await axios.put(
        `${API_URL}/applications/${applicationId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
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
                            onClick={() => {
                              console.log('Approving application with ID:', app.id);
                              handleUpdateApplicationStatus(app.id, 'approved');
                            }}
                            className="px-4 py-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition-colors"
                          >
                            Одобри
                          </button>
                          <button
                            onClick={() => {
                              console.log('Rejecting application with ID:', app.id);
                              handleUpdateApplicationStatus(app.id, 'rejected');
                            }}
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

  // Функция за отваряне на модалния прозорец за изтриване
  const openDeleteModal = (application) => {
    setApplicationToDelete(application);
    setShowDeleteModal(true);
  };

  // Функция за изтриване на кандидатура
  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;
    
    try {
      const response = await axios.delete(`${API_URL}/profile/applications/${applicationToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Премахваме кандидатурата от списъка
        setMyApplications(myApplications.filter(app => app.id !== applicationToDelete.id));
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  // Функция за редактиране на кандидатура
  const handleEditApplication = (application) => {
    console.log("Редактиране на кандидатура, пълни данни:", application);
    setSelectedJob({
      id: application.job_id,
      position: application.jobTitle
    });
    
    // Важно: използваме точните имена на полетата от данните
    setEditingApplication({
      id: application.id,
      cover_letter: application.coverLetter || '',
      resume_url: application.cv || '',
      phone_number: application.phone_number || '', // Използваме phone_number консистентно
    });
    
    setShowApplyModal(true);
  };

  // Компонент за модален прозорец за изтриване
  const DeleteApplicationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="bg-red-500/20 p-3 rounded-full inline-flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Оттегляне на кандидатура</h3>
          <p className="text-gray-300">
            Сигурни ли сте, че искате да оттеглите кандидатурата си за{' '}
            <span className="font-semibold">{applicationToDelete?.jobTitle}</span> в{' '}
            <span className="font-semibold">{applicationToDelete?.company}</span>?
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={handleDeleteApplication}
            className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 transition-colors"
          >
            Оттегли
          </button>
        </div>
      </div>
    </div>
  );

  // Коригиран компонент JobApplyModal, за да работи с данните от запазените обяви
  const JobApplyModal = ({ job, onClose, editMode, applicationData, onSubmitSuccess }) => {
    // Добавена проверка и правилно извличане на ID на обявата
    const jobId = job.job_id || job.id;
    
    // Използваме само необходимите състояния
    const [coverLetter, setCoverLetter] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [cvUrl, setCvUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [applicationId, setApplicationId] = useState(null);
    const [email, setEmail] = useState('');

    // Зареждаме данните първоначално
    useEffect(() => {
      if (editMode && applicationData) {
        setCoverLetter(applicationData.cover_letter || '');
        setCvUrl(applicationData.resume_url || '');
        setPhone(applicationData.phone_number || '');
        setApplicationId(applicationData.id);
        setEmail(applicationData.email || '');
      }
    }, [editMode, applicationData]);

    // Функция за обновяване на телефонния номер
    const handlePhoneNumberChange = (e) => {
      const newValue = e.target.value;
      console.log("Нов телефонен номер:", newValue);
      setPhone(newValue);
    };

    // Форматиране на данните от формата
    const formData = {
      job_id: jobId,
      name: name,
      email: email,
      phone: phone,
      cover_letter: coverLetter,
      // ... existing code ...
    };

    // Опростена функция за отпращане на формата
    const submitForm = async () => {
      // Вземаме текущата стойност от input полето директно
      const currentPhoneNumber = document.querySelector('input[type="tel"]').value;
      console.log("При изпращане - телефонен номер:", currentPhoneNumber);
      
      setIsSubmitting(true);
      
      try {
        // Само за редактиране
        if (editMode && applicationId) {
          // Създаваме изцяло нов обект за данните
          const requestPayload = {
            cover_letter: coverLetter,
            phone_number: currentPhoneNumber
          };
          
          // Проверяваме точно какво изпращаме
          console.log("ТОЧНО ТОВА ИЗПРАЩАМЕ:", JSON.stringify(requestPayload));
          
          // Директно изпращане с ясното заявка
          const response = await axios({
            method: 'put',
            url: `${API_URL}/profile/applications/${applicationId}`,
            data: requestPayload,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("ОТГОВОР ОТ СЪРВЪРА:", response.data);
          
          if (response.data && response.data.success) {
            // ВАЖНО: Изчакваме fetchMyApplications да завърши
            await fetchMyApplications();
            onClose();
          } else {
            setError('Грешка при обновяване на данните');
          }
        } else {
          // ... existing code for new application ...
        }
      } catch (err) {
        console.error("ГРЕШКА ПРИ ИЗПРАЩАНЕ:", err);
        setError('Възникна грешка');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editMode ? 'Редактиране на кандидатура' : `Кандидатстване за ${job.position}`}
            </h2>
            
            <form>
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-25 border border-red-500 rounded-md text-red-500">
                  {error}
                </div>
              )}
              
              {/* Поле за телефонен номер с явен onChange handler */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 font-medium">
                  Телефонен номер
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneNumberChange}
                  className="w-full bg-gray-700 text-gray-200 rounded-md p-3"
                  placeholder="Въведете телефонен номер за контакт"
                />
              </div>

              {/* Поле за мотивационно писмо */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 font-medium">
                  Мотивационно писмо
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 rounded-md p-3 min-h-[150px]"
                  placeholder="Добавете вашето мотивационно писмо"
                ></textarea>
              </div>
              
              {/* CV / Резюме */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 font-medium">
                  CV / Резюме
                </label>
                
                {/* Показване на текущото CV с опция за изтегляне */}
                {cvUrl && (
                  <div className="flex items-center justify-between bg-gray-700 p-3 rounded-md mb-2">
                    <span className="text-gray-300 truncate max-w-[70%]">
                      {cvUrl.split('/').pop() || 'Текущо CV'}
                    </span>
                    <div className="flex space-x-2">
                      <a 
                        href={cvUrl}
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Изтегли
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Качване на ново CV */}
                <div className="bg-gray-700 border border-dashed border-gray-500 rounded-md p-4 text-center">
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setCvFile(e.target.files[0])}
                  />
                  <label
                    htmlFor="cv-upload"
                    className="cursor-pointer flex flex-col items-center text-gray-300 hover:text-gray-100"
                  >
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>
                      {cvFile ? cvFile.name : editMode ? 'Сменете CV файла' : 'Качете своето CV (PDF, DOC, DOCX)'}
                    </span>
                  </label>
                  {cvFile && (
                    <div className="mt-2 text-sm text-gray-400">
                      Избран файл: {cvFile.name}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                >
                  Отказ
                </button>
                <button
                  type="button"
                  onClick={submitForm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Изпращане...
                    </div>
                  ) : (
                    editMode ? 'Запази промените' : 'Кандидатствай'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Обновена функция за извличане на запазените обяви
  const fetchSavedJobs = async () => {
    setIsLoading(true);
    try {
      // Коригиран URL според истинския endpoint в бекенда
      const response = await axios.get(`${API_URL}/saved-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Получени запазени обяви:', response.data);
      
      // Обработка на отговора според формата от savedJobsController
      if (response.data.success) {
        // Форматиране на данните според отговора
        const formattedSavedJobs = response.data.data.map(job => ({
          id: job.id || job._id,
          job_id: job.job_id,
          position: job.title || 'Няма заглавие',
          company: job.company_name || 'Частно лице',
          type: job.job_type || 'Пълен работен ден',
          location: job.location || 'Няма локация',
          salary: job.salary || 'По договаряне',
          saved_at: new Date(job.saved_at || job.created_at).toLocaleDateString(),
          skills: job.skills || []
        }));
        setSavedJobs(formattedSavedJobs);
      } else {
        setSavedJobs([]);
      }
      setError(null);
    } catch (err) {
      console.error('Грешка при зареждане на запазени обяви:', err);
      setError('Не успяхме да заредим запазените обяви. Моля, опитайте отново.');
      setSavedJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновена функция за премахване на обява от запазени
  const handleRemoveFromSaved = async (jobId) => {
    try {
      // Коригиран URL според истинския endpoint в бекенда
      await axios.delete(`${API_URL}/saved-jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Успешно премахване - обновяваме списъка локално
      setSavedJobs(prevSavedJobs => prevSavedJobs.filter(job => job.job_id !== jobId));
      
      // Показваме съобщение за успех
      setSuccessMessage('Обявата е премахната от запазени успешно');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Грешка при премахване от запазени:', err);
      setError('Не успяхме да премахнем обявата от запазени. Моля, опитайте отново.');
    }
  };

  // Добавяне на функция за запазване на обява
  const handleSaveJob = async (jobId) => {
    try {
      await axios.post(`${API_URL}/saved-jobs`, 
        { job_id: jobId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Обновяваме списъка със запазени обяви
      if (activeTab === 'saved') {
        fetchSavedJobs();
      }
      
      // Показваме съобщение за успех
      setSuccessMessage('Обявата е запазена успешно');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Грешка при запазване на обява:', err);
      setError('Не успяхме да запазим обявата. Моля, опитайте отново.');
    }
  };

  // Допълваме съществуващия useEffect, за да зарежда запазените обяви при смяна на таба
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (activeTab === 'applications') {
      // Директно код за зареждане на обявите
      const getMyJobs = async () => {
        setIsLoading(true);
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
          setIsLoading(false);
        }
      };
      
      getMyJobs();
    } else if (activeTab === 'saved') {
      fetchSavedJobs();
    } else if (activeTab === 'my-applications') {
      fetchMyApplications();
    }
  }, [activeTab, token, navigate]);

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
              {savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Нямате запазени обяви</p>
                </div>
              ) : (
                savedJobs.map(job => (
                  <div key={job.id || job.job_id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-200">{job.position}</h3>
                        <p className="text-gray-400 mt-1">{job.company}</p>
                      </div>
                      <button 
                        className="text-yellow-400 hover:text-yellow-300"
                        onClick={() => handleRemoveFromSaved(job.job_id)}
                        title="Премахни от запазени"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-400 space-x-4">
                      <span>{job.location}</span>
                      <span>{job.salary}</span>
                      <span>Запазено на: {job.saved_at}</span>
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
                ))
              )}
            </div>
          )}

          {/* Списък с моите кандидатури */}
          {activeTab === 'my-applications' && (
            <div className="space-y-6">
              {loadingMyApplications ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : myApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Нямате подадени кандидатури</p>
                </div>
              ) : (
                myApplications.map(application => (
                  <div key={application.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-200">
                          {application.jobTitle}
                        </h3>
                        <p className="text-gray-400 mt-1">{application.company}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium 
                          ${application.status === 'Разглежда се' ? 'bg-yellow-500/20 text-yellow-300' : 
                            application.status === 'Одобрена' ? 'bg-green-500/20 text-green-300' : 
                            application.status === 'Отхвърлена' ? 'bg-red-500/20 text-red-300' : 
                            'bg-blue-500/20 text-blue-300'}`}
                        >
                          {application.status}
                        </span>
                        <button
                          onClick={() => openDeleteModal(application)}
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
                        <p className="text-gray-400 text-sm">{application.coverLetter}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        {application.cv && (
                          <a 
                            href={application.cv}
                            className="inline-flex items-center text-gray-300 hover:text-gray-100 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Изтегли CV
                          </a>
                        )}
                        
                        {/* Показвай бутона за редактиране само за кандидатури със статус "Разглежда се" */}
                        {application.status === 'Разглежда се' && (
                          <button 
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            onClick={() => handleEditApplication(application)}
                          >
                            Редактирай кандидатурата →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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

      {/* Модален прозорец за изтриване */}
      {showDeleteModal && <DeleteApplicationModal />}
      
      {/* Модален прозорец за кандидатстване/редактиране */}
      {showApplyModal && (
        <JobApplyModal
          job={selectedJob}
          onClose={() => {
            setShowApplyModal(false);
            setEditingApplication(null);
          }}
          editMode={!!editingApplication}
          applicationData={editingApplication}
          onSubmitSuccess={(updatedApplication) => {
            if (editingApplication) {
              // Актуализираме списъка с кандидатури след редактиране
              fetchMyApplications();
            }
            setShowApplyModal(false);
            setEditingApplication(null);
          }}
        />
      )}
    </div>
  );
};

export default MyJobsPage; 