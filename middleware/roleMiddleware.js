const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

const requireEmployer = (req, res, next) => {
  if (req.user && (req.user.role === 'employer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Employer access required' });
  }
};

const requireJobSeeker = (req, res, next) => {
  if (req.user && (req.user.role === 'jobseeker' || req.user.role === 'user' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Jobseeker access required' });
  }
};

const checkBlockedStatus = (req, res, next) => {
  if (req.user && req.user.accountStatus === 'blocked') {
    // Check if block duration is indefinite or currently active
    if (!req.user.blockUntil || new Date(req.user.blockUntil) > new Date()) {
      return res.status(403).json({ message: 'Account temporarily blocked' });
    }
  }
  next();
};

module.exports = {
  requireAdmin,
  requireEmployer,
  requireJobSeeker,
  checkBlockedStatus
};
