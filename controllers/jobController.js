const Job = require('../models/Job');
const EmployerProfile = require('../models/EmployerProfile');
const EmployerSubscription = require('../models/EmployerSubscription');
const AdminLog = require('../models/AdminLog');

function parseSalaryRange(salary) {
  if (!salary) return { salaryMin: undefined, salaryMax: undefined };
  const raw = String(salary).trim();
  if (!raw) return { salaryMin: undefined, salaryMax: undefined };

  // Extract numbers (supports "50k-70k", "50000 - 70000", "₹5L - ₹7L" etc.)
  const nums = raw
    .replace(/,/g, '')
    .match(/\d+(\.\d+)?/g)
    ?.map((n) => Number(n))
    .filter((n) => Number.isFinite(n));

  if (!nums || nums.length === 0) return { salaryMin: undefined, salaryMax: undefined };
  if (nums.length === 1) return { salaryMin: nums[0], salaryMax: nums[0] };

  const min = Math.min(nums[0], nums[1]);
  const max = Math.max(nums[0], nums[1]);
  return { salaryMin: min, salaryMax: max };
}

// @desc    Create a job listing
// @route   POST /api/jobs
// @access  Private (Employer)
const createJob = async (req, res, next) => {
  try {
    const employerId = req.user._id;

    // Optional subscription gating (disabled by default for local/dev)
    const requireSubscription = String(process.env.REQUIRE_SUBSCRIPTION || 'false').toLowerCase() === 'true';
    if (requireSubscription) {
      const subscription = await EmployerSubscription.findOne({
        employerId,
        isActive: true,
        endDate: { $gte: new Date() },
      });
      if (!subscription) {
        return res.status(403).json({ success: false, message: 'Active subscription required to post jobs' });
      }

      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      const jobsPostedThisMonth = await Job.countDocuments({
        employerId,
        createdAt: { $gte: currentMonthStart },
      });
      if (jobsPostedThisMonth >= subscription.jobPostLimitPerMonth) {
        return res.status(403).json({ success: false, message: 'Monthly job posting limit reached' });
      }
    }

    // Frontend contract fields
    const { title, company, location, salary, jobType, experience, description } = req.body;
    const { salaryMin, salaryMax } = parseSalaryRange(salary);

    // Prefer EmployerProfile if it exists (logo, canonical name), otherwise accept payload `company`
    const profile = await EmployerProfile.findOne({ userId: employerId }).catch(() => null);

    const newJob = await Job.create({
      employerId,
      jobTitle: title,
      companyName: profile?.companyName || company,
      companyLogo: profile?.companyLogo || '',
      location,
      salaryMin,
      salaryMax,
      jobType,
      experienceLevel: experience || undefined,
      jobDescription: description,
      // Enforce admin approval flow
      status: 'pending',
      approvalStatus: 'pending',
      acceptApplications: true,
    });

    res.status(201).json({ success: true, message: 'Job submitted for admin approval', data: newJob });
  } catch (error) {
    console.error('Core Job Create Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all jobs attached to current employer
// @route   GET /api/employer/jobs
// @access  Private (Employer)
const getEmployerJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public approved jobs
// @route   GET /api/jobs
// @access  Public
const getApprovedJobs = async (req, res, next) => {
  try {
    const { title, location, category, experienceLevel, jobType, page = 1, limit = 20 } = req.query;

    // Clamp regex inputs to prevent ReDoS — a 5000-char title search string could DoS the server
    const sanitizedTitle = title ? String(title).slice(0, 100) : null;
    const sanitizedLocation = location ? String(location).slice(0, 100) : null;

    const query = { approvalStatus: 'approved' };

    // Apply Filters conditionally
    if (sanitizedTitle) {
        query.jobTitle = { $regex: sanitizedTitle, $options: 'i' };
    }
    if (sanitizedLocation) query.location = { $regex: sanitizedLocation, $options: 'i' };
    if (category) query.category = category;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (jobType) query.jobType = jobType;

    // Pagination bounds
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Execute Mongo pipeline
    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.json({
      success: true,
      page: pageNum,
      totalPages: Math.ceil(totalJobs / limitNum),
      totalJobs,
      data: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get specific job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Only allow Employers/Admins to bypass the 'approved' block to see pending versions
    if (job.approvalStatus !== 'approved') {
        if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== job.employerId.toString())) {
             return res.status(403).json({ success: false, message: 'This job is not available to the public yet' });
        }
    }

    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job listing (Employer)
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
const updateJob = async (req, res, next) => {
  try {
    const employerId = req.user._id;
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this job.' });
    }

    const { title, company, location, salary, jobType, experience, description } = req.body;
    const { salaryMin, salaryMax } = parseSalaryRange(salary);

    if (title !== undefined) job.jobTitle = title;
    if (company !== undefined) job.companyName = company;
    if (location !== undefined) job.location = location;
    if (salary !== undefined) {
      job.salaryMin = salaryMin;
      job.salaryMax = salaryMax;
    }
    if (jobType !== undefined) job.jobType = jobType;
    if (experience !== undefined) job.experienceLevel = experience;
    if (description !== undefined) job.jobDescription = description;

    // Any employer edit requires re-approval
    job.status = 'pending';
    job.approvalStatus = 'pending';
    job.approvedBy = undefined;

    await job.save();
    res.json({ success: true, message: 'Job updated and resubmitted for admin approval', data: job });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job listing (Employer)
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
const deleteJob = async (req, res, next) => {
  try {
    const employerId = req.user._id;
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this job.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getEmployerJobs,
  getApprovedJobs,
  getJobById,
  updateJob,
  deleteJob
};
