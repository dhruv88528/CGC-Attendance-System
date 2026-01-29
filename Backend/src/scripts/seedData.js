const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const School = require('../models/School');
const User = require('../models/User');
const Class = require('../models/Class');
const Student = require('../models/Student');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data (optional - comment out in production)
    await School.deleteMany({});
    await User.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // 1. Create a sample school
    const school = await School.create({
      name: 'Government Higher Secondary School',
      code: 'GHSS001',
      address: {
        street: 'Main Road',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '123456',
      },
      contact: {
        phone: '+91-9876543210',
        email: 'ghss001@school.edu',
        principalName: 'Dr. Ramesh Kumar',
      },
      academicYear: '2024-2025',
      totalStudents: 0,
      totalTeachers: 0,
      settings: {
        attendanceStartTime: '09:00',
        attendanceEndTime: '10:00',
        lateThreshold: 15,
        offlineModeEnabled: true,
      },
    });
    console.log(`✅ Created school: ${school.name}`);

    // 2. Create admin user
    const adminPassword = 'admin123';
    const admin = await User.create({
      name: 'School Admin',
      email: 'admin@school.edu',
      password: adminPassword,
      role: 'admin',
      school: school._id,
      phone: '+91-9876543211',
    });
    console.log(`✅ Created admin user: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);

    // 3. Create teacher users
    const teachers = [
      {
        name: 'Mrs. Sunita Sharma',
        email: 'sunita.sharma@school.edu',
        password: 'teacher123',
        role: 'teacher',
        phone: '+91-9876543212',
      },
      {
        name: 'Mr. Rajesh Patel',
        email: 'rajesh.patel@school.edu',
        password: 'teacher123',
        role: 'teacher',
        phone: '+91-9876543213',
      },
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacher = await User.create({
        ...teacherData,
        school: school._id,
      });
      createdTeachers.push(teacher);
      console.log(`✅ Created teacher: ${teacher.name}`);
    }

    // Update school teacher count
    school.totalTeachers = createdTeachers.length + 1; // +1 for admin
    await school.save();

    // 4. Create classes
    const classes = [
      {
        name: 'Class 10-A',
        grade: 10,
        section: 'A',
        teacher: createdTeachers[0]._id,
        academicYear: '2024-2025',
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
        schedule: {
          startTime: '09:00',
          endTime: '15:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
      {
        name: 'Class 10-B',
        grade: 10,
        section: 'B',
        teacher: createdTeachers[1]._id,
        academicYear: '2024-2025',
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
        schedule: {
          startTime: '09:00',
          endTime: '15:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
      {
        name: 'Class 9-A',
        grade: 9,
        section: 'A',
        teacher: createdTeachers[0]._id,
        academicYear: '2024-2025',
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
        schedule: {
          startTime: '09:00',
          endTime: '15:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
    ];

    const createdClasses = [];
    for (const classData of classes) {
      const classObj = await Class.create({
        ...classData,
        school: school._id,
      });
      createdClasses.push(classObj);
      console.log(`✅ Created class: ${classObj.name}`);
    }

    // 5. Create sample students
    const studentNames = [
      { firstName: 'Rahul', lastName: 'Kumar', gender: 'Male' },
      { firstName: 'Priya', lastName: 'Singh', gender: 'Female' },
      { firstName: 'Amit', lastName: 'Sharma', gender: 'Male' },
      { firstName: 'Neha', lastName: 'Verma', gender: 'Female' },
      { firstName: 'Rohit', lastName: 'Gupta', gender: 'Male' },
      { firstName: 'Anjali', lastName: 'Patel', gender: 'Female' },
      { firstName: 'Vikram', lastName: 'Yadav', gender: 'Male' },
      { firstName: 'Sneha', lastName: 'Joshi', gender: 'Female' },
      { firstName: 'Arun', lastName: 'Reddy', gender: 'Male' },
      { firstName: 'Pooja', lastName: 'Nair', gender: 'Female' },
    ];

    const createdStudents = [];
    let rollNumber = 1;

    for (const className of createdClasses) {
      for (let i = 0; i < 5; i++) {
        const studentIndex = (rollNumber - 1) % studentNames.length;
        const name = studentNames[studentIndex];
        
        const student = await Student.create({
          rollNumber: `2024${className.grade}${rollNumber.toString().padStart(3, '0')}`,
          firstName: name.firstName,
          lastName: name.lastName,
          dateOfBirth: new Date(2008 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: name.gender,
          parentName: `${name.firstName}'s Parent`,
          parentPhone: `+91-9${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: {
            street: `${rollNumber} Street`,
            village: 'Sample Village',
            district: 'Sample District',
            state: 'Sample State',
            pincode: '123456',
          },
          aadhaarNumber: Math.random() > 0.5 ? `1234${Math.floor(10000000 + Math.random() * 90000000)}` : null,
          class: className._id,
          school: school._id,
          midDayMealEligible: Math.random() > 0.2, // 80% eligible
          faceRegistered: Math.random() > 0.5, // 50% have face registered
        });

        createdStudents.push(student);
        
        // Update class student count
        className.studentCount += 1;
        await className.save();

        rollNumber++;
      }
    }

    // Update school student count
    school.totalStudents = createdStudents.length;
    await school.save();

    console.log(`✅ Created ${createdStudents.length} students`);

    // 6. Create sample attendance records (last 7 days)
    const Attendance = require('../models/Attendance');
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);

      for (const student of createdStudents) {
        // Random attendance status
        const statuses = ['present', 'absent', 'late', 'leave'];
        const weights = [0.7, 0.15, 0.1, 0.05]; // 70% present, 15% absent, 10% late, 5% leave
        
        let random = Math.random();
        let statusIndex = 0;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < weights.length; i++) {
          cumulativeWeight += weights[i];
          if (random <= cumulativeWeight) {
            statusIndex = i;
            break;
          }
        }
        
        const status = statuses[statusIndex];

        // Random check-in time for present/late students
        let checkInTime = null;
        if (status === 'present' || status === 'late') {
          checkInTime = new Date(date);
          const hour = 8 + Math.floor(Math.random() * 2); // Between 8-10 AM
          const minute = Math.floor(Math.random() * 60);
          checkInTime.setHours(hour, minute, 0, 0);
          
          if (status === 'late' && hour === 9 && minute > 15) {
            // Ensure late students arrive after 9:15
            checkInTime.setMinutes(15 + Math.floor(Math.random() * 45));
          }
        }

        // Random teacher who marked attendance
        const markingTeacher = createdTeachers[Math.floor(Math.random() * createdTeachers.length)];

        await Attendance.create({
          student: student._id,
          class: student.class,
          school: school._id,
          date: date,
          status: status,
          markedBy: markingTeacher._id,
          recognitionMethod: Math.random() > 0.7 ? 'auto' : 'manual',
          confidenceScore: status === 'present' || status === 'late' ? 0.7 + Math.random() * 0.3 : null,
          checkInTime: checkInTime,
          remarks: status === 'leave' ? 'Sick leave' : null,
          midDayMealServed: (status === 'present' || status === 'late') && student.midDayMealEligible && Math.random() > 0.2,
        });
      }
      
      console.log(`✅ Created attendance records for ${date.toDateString()}`);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   School: ${school.name} (${school.code})`);
    console.log(`   Admin: ${admin.email} / ${adminPassword}`);
    console.log(`   Teachers: ${createdTeachers.length}`);
    console.log(`   Classes: ${createdClasses.length}`);
    console.log(`   Students: ${createdStudents.length}`);
    console.log(`   Attendance records: ${7 * createdStudents.length} (7 days)`);
    console.log('\n🔗 Login Credentials:');
    console.log(`   Admin: ${admin.email} / ${adminPassword}`);
    console.log(`   Teacher 1: ${teachers[0].email} / ${teachers[0].password}`);
    console.log(`   Teacher 2: ${teachers[1].email} / ${teachers[1].password}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;