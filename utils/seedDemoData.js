const User = require('../models/User');
const Job = require('../models/Job');

function shouldSeed() {
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  if (!isDev) return false;
  // Default to seeding in dev unless explicitly disabled
  return (process.env.SEED_DEMO_DATA || 'true').toLowerCase() === 'true';
}

async function seedDemoData() {
  if (!shouldSeed()) return;

  const existingDemoJobs = await Job.countDocuments({ isDemo: true });
  if (existingDemoJobs > 0) {
    // Ensure older seeded docs have status synced
    await Job.updateMany(
      { isDemo: true, $or: [{ status: { $exists: false } }, { status: null }] },
      [{ $set: { status: '$approvalStatus' } }]
    ).catch(() => {});
    return;
  }

  // Ensure a demo employer exists
  const demoEmployerEmail = process.env.DEMO_EMPLOYER_EMAIL || 'employer@demo.local';
  let employer = await User.findOne({ email: demoEmployerEmail });
  if (!employer) {
    employer = await User.create({
      name: process.env.DEMO_EMPLOYER_NAME || 'Demo Employer',
      email: demoEmployerEmail,
      password: process.env.DEMO_EMPLOYER_PASSWORD || 'DemoEmployer@123',
      role: 'employer',
      authProvider: 'email',
      accountStatus: 'active',
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded demo employer: ${demoEmployerEmail}`);
  }

  const jobs = [
    {
      employerId: employer._id,
      jobTitle: 'Frontend Developer (React)',
      companyName: 'SmartHire Demo Co.',
      location: 'Remote',
      salaryMin: 60000,
      salaryMax: 90000,
      jobType: 'remote',
      category: 'IT',
      experienceLevel: '1-3 years',
      jobDescription: 'Build and maintain React UI with modern tooling.',
      responsibilities: ['Implement UI features', 'Fix bugs', 'Collaborate with backend'],
      requiredSkills: ['React', 'JavaScript', 'CSS'],
      benefits: ['Remote-friendly', 'Flexible hours'],
      isDemo: true,
      approvalStatus: 'approved',
      status: 'approved',
    },
    {
      employerId: employer._id,
      jobTitle: 'Backend Developer (Node + Express)',
      companyName: 'SmartHire Demo Co.',
      location: 'Mumbai',
      salaryMin: 70000,
      salaryMax: 110000,
      jobType: 'full-time',
      category: 'Engineering',
      experienceLevel: '3-5 years',
      jobDescription: 'Develop REST APIs, integrate MongoDB, and improve performance.',
      responsibilities: ['Build APIs', 'Design schemas', 'Write tests'],
      requiredSkills: ['Node.js', 'Express', 'MongoDB'],
      benefits: ['Health insurance', 'Learning budget'],
      isDemo: true,
      approvalStatus: 'approved',
      status: 'approved',
    },
    {
      employerId: employer._id,
      jobTitle: 'UI/UX Designer',
      companyName: 'SmartHire Demo Co.',
      location: 'Delhi',
      salaryMin: 45000,
      salaryMax: 80000,
      jobType: 'full-time',
      category: 'Design',
      experienceLevel: '1-3 years',
      jobDescription: 'Design clean and accessible interfaces for web products.',
      responsibilities: ['Create wireframes', 'Design components', 'Work with devs'],
      requiredSkills: ['Figma', 'Design systems', 'Accessibility'],
      benefits: ['Hybrid work', 'Paid leaves'],
      isDemo: true,
      approvalStatus: 'approved',
      status: 'approved',
    },
  ];

  await Job.insertMany(jobs);
  // eslint-disable-next-line no-console
  console.log(`Seeded demo jobs: ${jobs.length}`);
}

module.exports = seedDemoData;

