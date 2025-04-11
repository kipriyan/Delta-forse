import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/config';
import { useAuth } from '../context/AuthContext';

const SuccessPopup = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
      <div className="flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white text-center mb-2">
        Успешно изпратена кандидатура!
      </h3>
      <p className="text-gray-300 text-center mb-4">
        Ще бъдете уведомени когато работодателят прегледа кандидатурата ви.
      </p>
      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Разбрах
        </button>
      </div>
    </div>
  </div>
);

const JobApplyModal = ({ job, isOpen, onClose, initialData, isEditing }) => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState(initialData || {
    name: user?.username || '',
    email: user?.email || '',
    phone: '',
    coverLetter: '',
    cv: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ако има CV файл, първо го качваме
      let cvUrl = null;
      if (formData.cv) {
        const fileFormData = new FormData();
        fileFormData.append('file', formData.cv);

        const uploadResponse = await axios.post(
          `${API_URL}/upload`,
          fileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (uploadResponse.data.success) {
          cvUrl = uploadResponse.data.data.fileUrl;
        } else {
          setError('Грешка при качване на CV файла');
          return;
        }
      }

      const applicationData = {
        applicant_name: formData.name,
        email: formData.email,
        phone_number: formData.phone,
        cover_letter: formData.coverLetter,
        cv: cvUrl
      };

      console.log('Sending application for job:', job);
      
      const response = await axios.post(`${API_URL}/jobs/${job.id}/apply`, applicationData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });

      if (response.data.success) {
        setShowSuccess(true);
      } else {
        setError(response.data.error || 'Възникна грешка при изпращане на кандидатурата');
      }
    } catch (error) {
      console.error('Application error details:', {
        response: error.response,
        message: error.message,
        data: error.response?.data
      });

      if (error.response) {
        setError(error.response.data?.error || error.response.data?.message || 'Грешка от сървъра');
      } else if (error.request) {
        setError('Няма отговор от сървъра. Моля, опитайте по-късно.');
      } else {
        setError('Грешка при изпращане на заявката: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      {showSuccess ? (
        <SuccessPopup onClose={handleSuccessClose} />
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{job.position}</h2>
                  <p className="text-gray-400">{job.company}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Име
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Имейл
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Мотивационно писмо
                  </label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Прикачи CV
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-gray-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-400">
                        <label className="relative cursor-pointer rounded-md font-medium text-gray-300 hover:text-white focus-within:outline-none">
                          <span>Качи файл</span>
                          <input 
                            type="file" 
                            className="sr-only" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cv: e.target.files[0]
                            }))}
                          />
                        </label>
                        <p className="pl-1">или провлачете тук</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC до 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Изпращане...' : (isEditing ? 'Запази промените' : 'Изпрати кандидатура')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobApplyModal; 