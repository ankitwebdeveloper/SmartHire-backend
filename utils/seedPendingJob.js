require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const emp = await User.findOne({ role: 'employer' });
  if (!emp) { console.log('No employer found'); process.exit(1); }
  await Job.create({
    employerId: emp._id,
    jobTitle: 'Senior Backend Engineer',
    companyName: 'TechFlow Solutions',
    category: 'Engineering',
    jobType: 'full-time',
    location: 'Bangalore',
    salaryRange: '20-30 LPA',
    experienceLevel: '5+ years',
    jobDescription: 'We need a senior backend engineer to scale our platform to 10M users.',
    requiredSkills: ['Node.js', 'MongoDB', 'Redis', 'Kubernetes'],
    responsibilities: ['Design scalable APIs', 'Mentor juniors', 'Own reliability'],
    benefits: ['Remote Work', 'Stock Options', 'Health Insurance'],
    companyLogo: 'https://ui-avatars.com/api/?name=Tech+Flow&background=2563EB&color=fff',
    approvalStatus: 'pending',
    acceptApplications: true
  });
  console.log('Pending job seeded!');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
