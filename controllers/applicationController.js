const Application = require('../models/Application');
const Job = require('../models/Job');
const UserProfile = require('../models/UserProfile');
const { createNotification } = require('./notificationController');

// @desc    Get all applications for employer's jobs
// @route   GET /api/applications/employer
// @access  Private (Employer)
const getEmployerApplications = async (req, res, next) => {
  try {
    const employerId = req.user._id;

    const jobs = await Job.find({ employerId }).select('_id jobTitle location companyName');
    const jobIds = jobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate({ path: 'candidateId', select: 'name email avatar' })
      .populate({ path: 'jobId', select: 'jobTitle companyName location' })
      .sort({ appliedDate: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply to a specific job
// @route   POST /api/applications/:jobId
// @access  Private (JobSeeker)
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user._id;

    // 1. Verify Job validity
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Core constraints
    if (job.approvalStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Job is not available for applications' });
    }
    if (!job.acceptApplications) {
      return res.status(403).json({ success: false, message: 'Applications are currently disabled for this job' });
    }
    if (job.isDemo) {
      return res.status(403).json({ success: false, message: 'This is a demo job listing. Applications are disabled.' });
    }

    // 2. Duplicate Application Protection
    const duplicateApp = await Application.findOne({ jobId, candidateId });
    if (duplicateApp) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job.' });
    }

    // 3. Extract Resume
    const profile = await UserProfile.findOne({ userId: candidateId });
    const resumeUrl = profile && profile.resume ? profile.resume : ''; // Default blank if missing, scaling dynamically

    // 4. Fire Application
    const newApplication = await Application.create({
      jobId,
      candidateId,
      employerId: job.employerId,
      resumeUrl,
      status: 'applied' // Handled by schema default naturally, but explicitly setting is clean
    });

    // 5. Notify Employer
    await createNotification(
      job.employerId,
      'application',
      'New Application Received',
      `A new candidate has applied for your job: ${job.jobTitle}`,
      job._id
    );

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: newApplication });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications made by the current jobseeker
// @route   GET /api/applications/me
// @access  Private (JobSeeker)
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ candidateId: req.user._id })
      .populate({
        path: 'jobId',
        select: 'jobTitle companyName companyLogo location' // Only pull what's needed for the UI table
      })
      .sort({ appliedDate: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all candidates/applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer)
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user._id;

    // 1. Verify ownership
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    if (job.employerId.toString() !== employerId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this job listing.' });
    }

    // 2. Fetch applications and populate Candidate data deeply
    const applications = await Application.find({ jobId })
      .populate({
        path: 'candidateId',
        select: 'name email avatar' 
      })
      .populate({
        path: 'jobId',
        select: 'jobTitle'
      })
      .sort({ appliedDate: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Employer updates specific candidate pipeline status
// @route   PATCH /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employerId = req.user._id;

    // Validate enum payload
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify ownership
    if (application.employerId.toString() !== employerId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this application funnel.' });
    }

    application.status = status;
    await application.save();

    // Notify Jobseeker
    await createNotification(
      application.candidateId,
      'status_update',
      'Application Status Updated',
      `Your application status has been changed to: ${status}`,
      application.jobId
    );

    res.json({ success: true, message: `Candidate status updated to ${status}`, data: application });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployerApplications,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus
};
