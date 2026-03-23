const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');

// Load env vars
dotenv.config();

// Connect to DB directly
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthire')
  .then(() => console.log('MongoDB Connected for Seeding'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

const seedJobs = async () => {
  try {
    // 1. Create a dummy employer to own the jobs if one doesn't exist
    let demoEmployer = await User.findOne({ email: 'demo_employer@smarthire.com' });
    
    if (!demoEmployer) {
      demoEmployer = await User.create({
        name: 'Demo Company Admin',
        email: 'demo_employer@smarthire.com',
        role: 'employer',
        password: 'Password123!', // Hashed automatically by pre-save
        accountStatus: 'active'
      });
      console.log('Created Demo Employer Account');
    }

    // 2. Wipe existing jobs to prevent duplicates testing
    await Job.deleteMany({});
    console.log('Cleared existing Jobs');

    // 3. Define the 5 high quality jobs based on the old frontend array
    const demoJobs = [
      {
        employerId: demoEmployer._id,
        jobTitle: "Senior React Developer",
        companyName: "TechFlow Solutions",
        location: "Bangalore",
        salaryMin: 1500000,
        salaryMax: 2500000,
        jobType: "full-time",
        category: "Engineering", // Aligned to Enum
        experienceLevel: "5+ years",
        jobDescription: "We are looking for an experienced React developer to lead our frontend team scaling large Enterprise SaaS architecture.",
        responsibilities: ["Lead frontend architecture", "Mentor junior devs", "Optimize React performance"],
        requiredSkills: ["React", "TypeScript", "Redux", "Tailwind CSS"],
        benefits: ["Remote Work", "Health Insurance", "Stock Options"],
        companyLogo: "https://ui-avatars.com/api/?name=Tech+Flow&background=2563EB&color=fff",
        approvalStatus: 'approved',
        acceptApplications: true
      },
      {
        employerId: demoEmployer._id,
        jobTitle: "Product Designer",
        companyName: "Creative Studio",
        location: "Pune",
        salaryMin: 1200000,
        salaryMax: 1800000,
        jobType: "full-time",
        category: "Design",
        experienceLevel: "3-5 years",
        jobDescription: "Join our core design team to create beautiful, accessible, and intuitive user interfaces for millions of users.",
        responsibilities: ["Figma Prototyping", "User Research", "Design System Management"],
        requiredSkills: ["Figma", "UI/UX", "Adobe Suite"],
        benefits: ["Creative freedom", "Latest MacBook Pro", "Learning Budget"],
        companyLogo: "https://ui-avatars.com/api/?name=Creative+Studio&background=8B5CF6&color=fff",
        approvalStatus: 'approved',
        acceptApplications: true
      },
      {
        employerId: demoEmployer._id,
        jobTitle: "Frontend Engineer",
        companyName: "Global Tech",
        location: "Hyderabad",
        salaryMin: 1000000,
        salaryMax: 1500000,
        jobType: "contract",
        category: "Engineering",
        experienceLevel: "1-3 years",
        jobDescription: "Contract position for a skilled frontend engineer proficient in modern React and deeply customized Tailwind layouts.",
        responsibilities: ["Component Development", "API Integration", "Bug Fixing"],
        requiredSkills: ["Javascript", "React", "Next.JS"],
        benefits: ["Overtime pay", "Flexible Hours"],
        companyLogo: "https://ui-avatars.com/api/?name=Global+Tech&background=10B981&color=fff",
        approvalStatus: 'approved',
        acceptApplications: true
      },
      {
        employerId: demoEmployer._id,
        jobTitle: "Marketing Manager",
        companyName: "Growth Inc",
        location: "Mumbai",
        salaryMin: 800000,
        salaryMax: 1200000,
        jobType: "full-time",
        category: "Marketing",
        experienceLevel: "5+ years",
        jobDescription: "Looking for a seasoned marketing manager to spearhead our outbound growth campaigns and manage our PR relations.",
        responsibilities: ["Campaign Management", "Social Media Strategy", "ROI Analysis"],
        requiredSkills: ["SEO", "Google Analytics", "Content Strategy"],
        benefits: ["Performance Bonuses", "Travel Allowance"],
        companyLogo: "https://ui-avatars.com/api/?name=Growth+Inc&background=F59E0B&color=fff",
        approvalStatus: 'approved',
        acceptApplications: true
      },
      {
        employerId: demoEmployer._id,
        jobTitle: "DevOps Engineer",
        companyName: "Cloud Systems",
        location: "Delhi",
        salaryMin: 1800000,
        salaryMax: 2800000,
        jobType: "full-time",
        category: "IT",
        experienceLevel: "5+ years",
        jobDescription: "Help us maintain and scale our core cloud infrastructure ensuring 99.99% uptime for our global services.",
        responsibilities: ["CI/CD Pipeline design", "Infrastructure as Code", "Incident Response"],
        requiredSkills: ["AWS", "Kubernetes", "Docker", "Terraform"],
        benefits: ["Relocation Assistance", "Premium Healthcare", "Gym Membership"],
        companyLogo: "https://ui-avatars.com/api/?name=Cloud+Sys&background=3B82F6&color=fff",
        approvalStatus: 'approved',
        acceptApplications: true
      }
    ];

    // Seed the Jobs
    await Job.insertMany(demoJobs);
    console.log(`Successfully Seeded ${demoJobs.length} Live MongoDB Jobs`);

    // Disconnect
    process.exit(0);

  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
};

seedJobs();
