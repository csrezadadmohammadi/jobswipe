import React, { useState, useEffect } from 'react';
import { Heart, X, Briefcase, MapPin, DollarSign, Clock, Upload, CheckCircle, Loader2, Award, BarChart3, ExternalLink } from 'lucide-react';

const JSEARCH_API_KEY = 'd23684e190msh9643ac69d375bfcp13b8c5jsna2db76bca250';

const fetchRealJobs = async (query, location) => {
  try {
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' in ' + location)}&num_pages=1`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': JSEARCH_API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.data.slice(0, 20).map(job => ({
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: (job.job_city || '') + ', ' + (job.job_state || job.job_country || ''),
        salary: job.job_salary || 'Competitive',
        type: job.job_employment_type || 'Full-time',
        description: job.job_description?.substring(0, 300) + '...' || 'No description',
        requirements: job.job_required_skills || ['See posting'],
        benefits: job.job_highlights?.Benefits || [],
        postedDate: new Date(job.job_posted_at_datetime_utc || Date.now()).toLocaleDateString(),
        experienceLevel: determineLevel(job.job_title || ''),
        applyUrl: job.job_apply_link,
        source: 'JSearch'
      }));
    }
  } catch (error) {
    console.log('API error');
  }
  return getDemoJobs();
};

const determineLevel = (title) => {
  const t = title.toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('junior') || t.includes('entry')) return 'Entry Level';
  if (t.includes('senior') || t.includes('lead')) return 'Senior';
  return 'Mid Level';
};

const getDemoJobs = () => {
  return [{
    id: 'demo_1',
    title: 'Software Engineer',
    company: 'Tech Company',
    location: 'San Francisco, CA',
    salary: '$100,000 - $150,000',
    type: 'Full-time',
    description: 'Build amazing products with cutting-edge technology.',
    requirements: ['Bachelor in CS', '2+ years experience'],
    benefits: ['Health insurance', '401k'],
    postedDate: new Date().toLocaleDateString(),
    experienceLevel: 'Mid Level',
    applyUrl: 'https://www.linkedin.com/jobs',
    source: 'Demo'
  }];
};

const calculateATSScore = (job, userData) => {
  let score = 0;
  const userSkills = userData.skills.toLowerCase().split(',').map(s => s.trim());
  const jobDesc = (job.title + ' ' + job.description).toLowerCase();
  
  const matchedSkills = userSkills.filter(skill => jobDesc.includes(skill));
  score += (matchedSkills.length / Math.max(userSkills.length, 1)) * 40;
  
  const expYears = parseInt(userData.experience.split('-')[0]) || 0;
  if (job.experienceLevel === 'Internship' && expYears === 0) score += 30;
  else if (job.experienceLevel === 'Entry Level' && expYears <= 2) score += 30;
  else if (job.experienceLevel === 'Mid Level' && expYears >= 3) score += 30;
  else if (job.experienceLevel === 'Senior' && expYears >= 5) score += 30;
  else score += 15;
  
  if (job.title.toLowerCase().includes(userData.jobTitle.toLowerCase())) score += 20;
  else score += 10;
  
  if (job.location.toLowerCase().includes(userData.location.toLowerCase()) || userData.location.toLowerCase().includes('remote') || job.location.toLowerCase().includes('remote')) score += 10;
  
  return Math.min(Math.round(score), 100);
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userData, setUserData] = useState({
    email: '', fullName: '', phone: '', location: '', jobTitle: '', experience: '', skills: '', resume: null, privacyConsent: false, autoApply: true
  });
  const [jobs, setJobs] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (currentScreen === 'swipe' && jobs.length === 0) {
      loadRealJobs();
    }
  }, [currentScreen]);

  const loadRealJobs = async () => {
    setLoading(true);
    const realJobs = await fetchRealJobs(userData.jobTitle || 'software engineer', userData.location || 'remote');
    setJobs(realJobs);
    setLoading(false);
  };

  const handleSignup = () => {
    if (!userData.privacyConsent || !userData.fullName || !userData.email || !userData.jobTitle || !userData.skills || !userData.resume) {
      alert('Please fill all required fields');
      return;
    }
    setCurrentScreen('swipe');
  };

  const handleSwipe = async (direction) => {
    const currentJob = jobs[currentJobIndex];
    if (!currentJob) return;

    if (direction === 'right' && userData.autoApply) {
      setApplying(true);
      const score = calculateATSScore(currentJob, userData);
      setAppliedJobs([...appliedJobs, {...currentJob, applicationId: `APP-${Date.now()}`, atsScore: score, appliedDate: new Date().toLocaleDateString()}]);
      if (currentJob.applyUrl) window.open(currentJob.applyUrl, '_blank');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApplying(false);
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 2000);
    }
    
    setCurrentJobIndex(currentJobIndex + 1);
    setDragOffset(0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') setUserData({...userData, resume: file});
    else alert('Please upload PDF');
  };

  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">JobSwipe</h1>
          <p className="text-gray-600 mb-6 text-lg">Swipe right to apply instantly. AI-powered job matching.</p>
          <button onClick={() => setCurrentScreen('signup')} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:shadow-lg transition">Get Started</button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Your Profile</h2>
            <div className="space-y-4">
              <input type="text" value={userData.fullName} onChange={(e) => setUserData({...userData, fullName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Full Name *" />
              <input type="email" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Email *" />
              <input type="text" value={userData.location} onChange={(e) => setUserData({...userData, location: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Location *" />
              <input type="text" value={userData.jobTitle} onChange={(e) => setUserData({...userData, jobTitle: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Job Title *" />
              <select value={userData.experience} onChange={(e) => setUserData({...userData, experience: e.target.value})} className="w-full px-4 py-3 border rounded-xl">
                <option value="">Experience *</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
              </select>
              <textarea value={userData.skills} onChange={(e) => setUserData({...userData, skills: e.target.value})} className="w-full px-4 py-3 border rounded-xl" rows="3" placeholder="Skills *" />
              <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer">
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="resume" />
                <label htmlFor="resume" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  {userData.resume ? <p className="text-sm text-green-600">{userData.resume.name}</p> : <p className="text-sm text-gray-600">Upload Resume (PDF) *</p>}
                </label>
              </div>
              <div className="bg-blue-50 border rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={userData.privacyConsent} onChange={(e) => setUserData({...userData, privacyConsent: e.target.checked})} className="mt-1" />
                  <span className="text-xs">I consent to data collection *</span>
                </label>
              </div>
              <button onClick={handleSignup} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg">Start Finding Jobs</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentJob = jobs[currentJobIndex];
  const hasMoreJobs = currentJobIndex < jobs.length;
  const matchScore = currentJob ? calculateATSScore(currentJob, userData) : 0;

  if (currentScreen === 'swipe') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showConfirm && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">Job Saved!</div>}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hey {userData.fullName.split(' ')[0]}!</h1>
              <p className="text-sm text-gray-600">{appliedJobs.length} applications</p>
            </div>
            <button onClick={() => setCurrentScreen('dashboard')} className="p-3 bg-white rounded-full shadow-lg"><BarChart3 className="w-5 h-5 text-purple-600" /></button>
          </div>
          <div className="relative h-[600px] mb-6">
            {applying && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl z-50 flex items-center justify-center"><Loader2 className="w-12 h-12 text-white animate-spin" /></div>}
            {loading ? <div className="h-full bg-white rounded-3xl shadow-2xl flex items-center justify-center"><Loader2 className="w-16 h-16 text-purple-600 animate-spin" /></div> : hasMoreJobs ? (
              <div className="h-full bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto">
                <div className="mb-4 flex justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{currentJob.title}</h2>
                    <p className="text-lg text-purple-600 font-semibold">{currentJob.company}</p>
                    <p className="text-sm text-gray-500">{currentJob.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{matchScore}%</div>
                    <p className="text-xs text-gray-500">Match</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-700"><DollarSign className="w-5 h-5 text-purple-600" /><span>{currentJob.salary}</span></div>
                  <div className="flex items-center gap-2 text-gray-700"><Clock className="w-5 h-5 text-purple-600" /><span>{currentJob.type}</span></div>
                </div>
                <p className="text-gray-700 text-sm mb-4">{currentJob.description}</p>
                <p className="text-center text-xs text-gray-500">{currentJobIndex + 1} of {jobs.length}</p>
              </div>
            ) : <div className="h-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center"><Award className="w-20 h-20 text-purple-300 mb-4" /><h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2><button onClick={() => setCurrentScreen('dashboard')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full">Dashboard</button></div>}
          </div>
          {hasMoreJobs && !loading && (
            <div className="flex justify-center gap-6">
              <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"><X className="w-8 h-8 text-red-500" /></button>
              <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center"><Heart className="w-8 h-8 text-white" /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={() => setCurrentScreen('swipe')} className="px-4 py-2 bg-purple-600 text-white rounded-xl">Back</button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tracked Applications ({appliedJobs.length})</h2>
          {appliedJobs.length === 0 ? <p className="text-gray-500 text-center py-8">No applications yet</p> : appliedJobs.map(job => (
            <div key={job.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-xl mb-3">
              <div>
                <p className="font-semibold text-gray-800">{job.title}</p>
                <p className="text-sm text-gray-600">{job.company}</p>
                {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 flex items-center gap-1 mt-1">Apply <ExternalLink className="w-3 h-3" /></a>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{job.atsScore}%</p>
                <p className="text-xs text-gray-500">{job.appliedDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
