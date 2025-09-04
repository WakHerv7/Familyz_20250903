import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Family Tree Platform database seeding...");

  // Clear existing data (in development)
  if (process.env.NODE_ENV === "development") {
    console.log("🧹 Cleaning existing data...");
    await prisma.familyMembership.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.family.deleteMany();
    await prisma.user.deleteMany();
    await prisma.member.deleteMany();
  }

  // Create comprehensive family tree members
  console.log("👥 Creating comprehensive family tree members...");

  // Great-Grandparents
  const williamSmith = await prisma.member.create({
    data: {
      name: "William Smith",
      gender: "MALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Great-grandfather, World War II veteran",
        birthDate: "1905-03-15",
        birthPlace: "Boston, MA",
        occupation: "Factory Worker",
        deathDate: "1985-11-20",
      },
    },
  });

  const elizabethSmith = await prisma.member.create({
    data: {
      name: "Elizabeth Smith",
      gender: "FEMALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Great-grandmother, homemaker",
        birthDate: "1908-07-22",
        birthPlace: "Boston, MA",
        occupation: "Homemaker",
        deathDate: "1992-04-10",
      },
    },
  });

  const robertJohnson = await prisma.member.create({
    data: {
      name: "Robert Johnson",
      gender: "MALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Great-grandfather, farmer",
        birthDate: "1902-11-08",
        birthPlace: "Iowa, USA",
        occupation: "Farmer",
        deathDate: "1980-09-15",
      },
    },
  });

  const maryJohnson = await prisma.member.create({
    data: {
      name: "Mary Johnson",
      gender: "FEMALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Great-grandmother, teacher",
        birthDate: "1905-02-14",
        birthPlace: "Iowa, USA",
        occupation: "Teacher",
        deathDate: "1990-12-05",
      },
    },
  });

  // Grandparents
  const jamesSmith = await prisma.member.create({
    data: {
      name: "James Smith",
      gender: "MALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Grandfather, accountant",
        birthDate: "1930-06-12",
        birthPlace: "New York, NY",
        occupation: "Accountant",
        deathDate: "2010-08-25",
      },
    },
  });

  const patriciaSmith = await prisma.member.create({
    data: {
      name: "Patricia Smith",
      gender: "FEMALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Grandmother, nurse",
        birthDate: "1932-09-18",
        birthPlace: "New Jersey, USA",
        occupation: "Nurse",
        deathDate: "2015-03-12",
      },
    },
  });

  const thomasJohnson = await prisma.member.create({
    data: {
      name: "Thomas Johnson",
      gender: "MALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Grandfather, mechanic",
        birthDate: "1935-04-20",
        birthPlace: "Illinois, USA",
        occupation: "Mechanic",
        deathDate: "2008-11-30",
      },
    },
  });

  const catherineJohnson = await prisma.member.create({
    data: {
      name: "Catherine Johnson",
      gender: "FEMALE",
      status: "DECEASED",
      personalInfo: {
        bio: "Grandmother, librarian",
        birthDate: "1937-12-03",
        birthPlace: "Illinois, USA",
        occupation: "Librarian",
        deathDate: "2018-07-08",
      },
    },
  });

  // Parents
  const davidSmith = await prisma.member.create({
    data: {
      name: "David Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Father, software architect",
        birthDate: "1960-01-15",
        birthPlace: "California, USA",
        occupation: "Software Architect",
        email: "david.smith@example.com",
        phone: "+1-555-1001",
      },
    },
  });

  const sarahSmith = await prisma.member.create({
    data: {
      name: "Sarah Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Mother, marketing director",
        birthDate: "1962-05-28",
        birthPlace: "Texas, USA",
        occupation: "Marketing Director",
        email: "sarah.smith@example.com",
        phone: "+1-555-1002",
      },
    },
  });

  // Main User (Alex Smith)
  const alexSmith = await prisma.member.create({
    data: {
      name: "Alex Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Family historian and software developer",
        birthDate: "1985-03-20",
        birthPlace: "Washington, USA",
        occupation: "Software Developer",
        email: "alex.smith@example.com",
        phone: "+1-555-1003",
      },
    },
  });

  // User's Spouse
  const jamieSmith = await prisma.member.create({
    data: {
      name: "Jamie Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Spouse, graphic designer",
        birthDate: "1987-08-12",
        birthPlace: "Oregon, USA",
        occupation: "Graphic Designer",
        email: "jamie.smith@example.com",
        phone: "+1-555-1004",
      },
    },
  });

  // User's Siblings
  const michaelSmith = await prisma.member.create({
    data: {
      name: "Michael Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Brother, lawyer",
        birthDate: "1982-11-05",
        birthPlace: "California, USA",
        occupation: "Lawyer",
        email: "michael.smith@example.com",
        phone: "+1-555-1005",
      },
    },
  });

  const emilySmith = await prisma.member.create({
    data: {
      name: "Emily Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Sister, teacher",
        birthDate: "1988-07-14",
        birthPlace: "California, USA",
        occupation: "Teacher",
        email: "emily.smith@example.com",
        phone: "+1-555-1006",
      },
    },
  });

  // Uncles and Aunts (Father's side)
  const robertSmith = await prisma.member.create({
    data: {
      name: "Robert Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Uncle, dentist",
        birthDate: "1958-09-22",
        birthPlace: "New York, USA",
        occupation: "Dentist",
        email: "robert.smith@example.com",
        phone: "+1-555-1007",
      },
    },
  });

  const lindaSmith = await prisma.member.create({
    data: {
      name: "Linda Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Aunt, pharmacist",
        birthDate: "1960-12-08",
        birthPlace: "New Jersey, USA",
        occupation: "Pharmacist",
        email: "linda.smith@example.com",
        phone: "+1-555-1008",
      },
    },
  });

  const christopherSmith = await prisma.member.create({
    data: {
      name: "Christopher Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Uncle, architect",
        birthDate: "1965-04-17",
        birthPlace: "California, USA",
        occupation: "Architect",
        email: "christopher.smith@example.com",
        phone: "+1-555-1009",
      },
    },
  });

  const jenniferSmith = await prisma.member.create({
    data: {
      name: "Jennifer Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Aunt, interior designer",
        birthDate: "1967-11-30",
        birthPlace: "California, USA",
        occupation: "Interior Designer",
        email: "jennifer.smith@example.com",
        phone: "+1-555-1010",
      },
    },
  });

  // Uncles and Aunts (Mother's side)
  const danielJohnson = await prisma.member.create({
    data: {
      name: "Daniel Johnson",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Uncle, electrician",
        birthDate: "1960-02-14",
        birthPlace: "Illinois, USA",
        occupation: "Electrician",
        email: "daniel.johnson@example.com",
        phone: "+1-555-1011",
      },
    },
  });

  const mariaJohnson = await prisma.member.create({
    data: {
      name: "Maria Johnson",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Aunt, chef",
        birthDate: "1962-08-25",
        birthPlace: "Illinois, USA",
        occupation: "Chef",
        email: "maria.johnson@example.com",
        phone: "+1-555-1012",
      },
    },
  });

  const peterJohnson = await prisma.member.create({
    data: {
      name: "Peter Johnson",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Uncle, firefighter",
        birthDate: "1968-06-09",
        birthPlace: "Texas, USA",
        occupation: "Firefighter",
        email: "peter.johnson@example.com",
        phone: "+1-555-1013",
      },
    },
  });

  const annaJohnson = await prisma.member.create({
    data: {
      name: "Anna Johnson",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Aunt, nurse",
        birthDate: "1970-03-21",
        birthPlace: "Texas, USA",
        occupation: "Nurse",
        email: "anna.johnson@example.com",
        phone: "+1-555-1014",
      },
    },
  });

  // Cousins
  const kevinSmith = await prisma.member.create({
    data: {
      name: "Kevin Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, musician",
        birthDate: "1985-01-10",
        birthPlace: "New York, USA",
        occupation: "Musician",
        email: "kevin.smith@example.com",
        phone: "+1-555-1015",
      },
    },
  });

  const rachelSmith = await prisma.member.create({
    data: {
      name: "Rachel Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, artist",
        birthDate: "1987-05-16",
        birthPlace: "New York, USA",
        occupation: "Artist",
        email: "rachel.smith@example.com",
        phone: "+1-555-1016",
      },
    },
  });

  const brianSmith = await prisma.member.create({
    data: {
      name: "Brian Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, engineer",
        birthDate: "1990-09-03",
        birthPlace: "California, USA",
        occupation: "Engineer",
        email: "brian.smith@example.com",
        phone: "+1-555-1017",
      },
    },
  });

  const lauraSmith = await prisma.member.create({
    data: {
      name: "Laura Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, writer",
        birthDate: "1992-12-11",
        birthPlace: "California, USA",
        occupation: "Writer",
        email: "laura.smith@example.com",
        phone: "+1-555-1018",
      },
    },
  });

  const stevenJohnson = await prisma.member.create({
    data: {
      name: "Steven Johnson",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, photographer",
        birthDate: "1988-04-22",
        birthPlace: "Illinois, USA",
        occupation: "Photographer",
        email: "steven.johnson@example.com",
        phone: "+1-555-1019",
      },
    },
  });

  const lisaJohnson = await prisma.member.create({
    data: {
      name: "Lisa Johnson",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, veterinarian",
        birthDate: "1990-07-08",
        birthPlace: "Illinois, USA",
        occupation: "Veterinarian",
        email: "lisa.johnson@example.com",
        phone: "+1-555-1020",
      },
    },
  });

  const markJohnson = await prisma.member.create({
    data: {
      name: "Mark Johnson",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, pilot",
        birthDate: "1995-11-14",
        birthPlace: "Texas, USA",
        occupation: "Pilot",
        email: "mark.johnson@example.com",
        phone: "+1-555-1021",
      },
    },
  });

  const sophiaJohnson = await prisma.member.create({
    data: {
      name: "Sophia Johnson",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Cousin, researcher",
        birthDate: "1997-02-28",
        birthPlace: "Texas, USA",
        occupation: "Researcher",
        email: "sophia.johnson@example.com",
        phone: "+1-555-1022",
      },
    },
  });

  // User's Children
  const ryanSmith = await prisma.member.create({
    data: {
      name: "Ryan Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Son, college student",
        birthDate: "2010-06-15",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "ryan.smith@example.com",
        phone: "+1-555-1023",
      },
    },
  });

  const taylorSmith = await prisma.member.create({
    data: {
      name: "Taylor Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Daughter, high school student",
        birthDate: "2012-09-20",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "taylor.smith@example.com",
        phone: "+1-555-1024",
      },
    },
  });

  const jordanSmith = await prisma.member.create({
    data: {
      name: "Jordan Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Son, middle school student",
        birthDate: "2015-03-12",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "jordan.smith@example.com",
        phone: "+1-555-1025",
      },
    },
  });

  // Children's Spouses
  const caseySmith = await prisma.member.create({
    data: {
      name: "Casey Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Daughter-in-law, marketing specialist",
        birthDate: "2010-11-08",
        birthPlace: "Oregon, USA",
        occupation: "Marketing Specialist",
        email: "casey.smith@example.com",
        phone: "+1-555-1026",
      },
    },
  });

  const morganSmith = await prisma.member.create({
    data: {
      name: "Morgan Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Son-in-law, data analyst",
        birthDate: "2011-04-25",
        birthPlace: "California, USA",
        occupation: "Data Analyst",
        email: "morgan.smith@example.com",
        phone: "+1-555-1027",
      },
    },
  });

  // Grandchildren
  const ethanSmith = await prisma.member.create({
    data: {
      name: "Ethan Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Grandson, elementary student",
        birthDate: "2030-01-10",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "ethan.smith@example.com",
        phone: "+1-555-1028",
      },
    },
  });

  const oliviaSmith = await prisma.member.create({
    data: {
      name: "Olivia Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Granddaughter, elementary student",
        birthDate: "2032-05-18",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "olivia.smith@example.com",
        phone: "+1-555-1029",
      },
    },
  });

  const noahSmith = await prisma.member.create({
    data: {
      name: "Noah Smith",
      gender: "MALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Grandson, preschooler",
        birthDate: "2035-08-22",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "noah.smith@example.com",
        phone: "+1-555-1030",
      },
    },
  });

  const avaSmith = await prisma.member.create({
    data: {
      name: "Ava Smith",
      gender: "FEMALE",
      status: "ACTIVE",
      personalInfo: {
        bio: "Granddaughter, preschooler",
        birthDate: "2037-12-05",
        birthPlace: "Washington, USA",
        occupation: "Student",
        email: "ava.smith@example.com",
        phone: "+1-555-1031",
      },
    },
  });

  console.log("✅ Created 40 comprehensive family members");

  // Create comprehensive family relationships
  console.log("👨‍👩‍👧‍👦 Creating comprehensive family relationships...");

  // Great-grandparents relationships
  await prisma.member.update({
    where: { id: williamSmith.id },
    data: {
      spouses: {
        connect: { id: elizabethSmith.id },
      },
    },
  });

  await prisma.member.update({
    where: { id: robertJohnson.id },
    data: {
      spouses: {
        connect: { id: maryJohnson.id },
      },
    },
  });

  // Grandparents relationships
  await prisma.member.update({
    where: { id: jamesSmith.id },
    data: {
      spouses: {
        connect: { id: patriciaSmith.id },
      },
      parents: {
        connect: [{ id: williamSmith.id }, { id: elizabethSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: thomasJohnson.id },
    data: {
      spouses: {
        connect: { id: catherineJohnson.id },
      },
      parents: {
        connect: [{ id: robertJohnson.id }, { id: maryJohnson.id }],
      },
    },
  });

  // Parents relationships
  await prisma.member.update({
    where: { id: davidSmith.id },
    data: {
      spouses: {
        connect: { id: sarahSmith.id },
      },
      parents: {
        connect: [{ id: jamesSmith.id }, { id: patriciaSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: sarahSmith.id },
    data: {
      parents: {
        connect: [{ id: thomasJohnson.id }, { id: catherineJohnson.id }],
      },
    },
  });

  // Main user and spouse
  await prisma.member.update({
    where: { id: alexSmith.id },
    data: {
      spouses: {
        connect: { id: jamieSmith.id },
      },
      parents: {
        connect: [{ id: davidSmith.id }, { id: sarahSmith.id }],
      },
    },
  });

  // User's siblings
  await prisma.member.update({
    where: { id: michaelSmith.id },
    data: {
      parents: {
        connect: [{ id: davidSmith.id }, { id: sarahSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: emilySmith.id },
    data: {
      parents: {
        connect: [{ id: davidSmith.id }, { id: sarahSmith.id }],
      },
    },
  });

  // Uncles and aunts (father's side)
  await prisma.member.update({
    where: { id: robertSmith.id },
    data: {
      spouses: {
        connect: { id: lindaSmith.id },
      },
      parents: {
        connect: [{ id: jamesSmith.id }, { id: patriciaSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: christopherSmith.id },
    data: {
      spouses: {
        connect: { id: jenniferSmith.id },
      },
      parents: {
        connect: [{ id: jamesSmith.id }, { id: patriciaSmith.id }],
      },
    },
  });

  // Uncles and aunts (mother's side)
  await prisma.member.update({
    where: { id: danielJohnson.id },
    data: {
      spouses: {
        connect: { id: mariaJohnson.id },
      },
      parents: {
        connect: [{ id: thomasJohnson.id }, { id: catherineJohnson.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: peterJohnson.id },
    data: {
      spouses: {
        connect: { id: annaJohnson.id },
      },
      parents: {
        connect: [{ id: thomasJohnson.id }, { id: catherineJohnson.id }],
      },
    },
  });

  // Cousins
  await prisma.member.update({
    where: { id: kevinSmith.id },
    data: {
      parents: {
        connect: [{ id: robertSmith.id }, { id: lindaSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: rachelSmith.id },
    data: {
      parents: {
        connect: [{ id: robertSmith.id }, { id: lindaSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: brianSmith.id },
    data: {
      parents: {
        connect: [{ id: christopherSmith.id }, { id: jenniferSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: lauraSmith.id },
    data: {
      parents: {
        connect: [{ id: christopherSmith.id }, { id: jenniferSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: stevenJohnson.id },
    data: {
      parents: {
        connect: [{ id: danielJohnson.id }, { id: mariaJohnson.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: lisaJohnson.id },
    data: {
      parents: {
        connect: [{ id: danielJohnson.id }, { id: mariaJohnson.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: markJohnson.id },
    data: {
      parents: {
        connect: [{ id: peterJohnson.id }, { id: annaJohnson.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: sophiaJohnson.id },
    data: {
      parents: {
        connect: [{ id: peterJohnson.id }, { id: annaJohnson.id }],
      },
    },
  });

  // User's children
  await prisma.member.update({
    where: { id: ryanSmith.id },
    data: {
      parents: {
        connect: [{ id: alexSmith.id }, { id: jamieSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: taylorSmith.id },
    data: {
      parents: {
        connect: [{ id: alexSmith.id }, { id: jamieSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: jordanSmith.id },
    data: {
      parents: {
        connect: [{ id: alexSmith.id }, { id: jamieSmith.id }],
      },
    },
  });

  // Children's spouses
  await prisma.member.update({
    where: { id: ryanSmith.id },
    data: {
      spouses: {
        connect: { id: caseySmith.id },
      },
    },
  });

  await prisma.member.update({
    where: { id: taylorSmith.id },
    data: {
      spouses: {
        connect: { id: morganSmith.id },
      },
    },
  });

  // Grandchildren
  await prisma.member.update({
    where: { id: ethanSmith.id },
    data: {
      parents: {
        connect: [{ id: ryanSmith.id }, { id: caseySmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: oliviaSmith.id },
    data: {
      parents: {
        connect: [{ id: ryanSmith.id }, { id: caseySmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: noahSmith.id },
    data: {
      parents: {
        connect: [{ id: taylorSmith.id }, { id: morganSmith.id }],
      },
    },
  });

  await prisma.member.update({
    where: { id: avaSmith.id },
    data: {
      parents: {
        connect: [{ id: taylorSmith.id }, { id: morganSmith.id }],
      },
    },
  });

  console.log("✅ Created comprehensive family relationships");

  // Create main family
  console.log("🏠 Creating main family...");

  const smithFamily = await prisma.family.create({
    data: {
      name: "The Smith-Johnson Family",
      description:
        "Our extensive family spanning four generations with deep roots and many branches",
      isSubFamily: false,
      creatorId: alexSmith.id,
      headOfFamilyId: davidSmith.id,
    },
  });

  // Create family memberships for all members
  const allMembers = [
    williamSmith,
    elizabethSmith,
    robertJohnson,
    maryJohnson,
    jamesSmith,
    patriciaSmith,
    thomasJohnson,
    catherineJohnson,
    davidSmith,
    sarahSmith,
    alexSmith,
    jamieSmith,
    michaelSmith,
    emilySmith,
    robertSmith,
    lindaSmith,
    christopherSmith,
    jenniferSmith,
    danielJohnson,
    mariaJohnson,
    peterJohnson,
    annaJohnson,
    kevinSmith,
    rachelSmith,
    brianSmith,
    lauraSmith,
    stevenJohnson,
    lisaJohnson,
    markJohnson,
    sophiaJohnson,
    ryanSmith,
    taylorSmith,
    jordanSmith,
    caseySmith,
    morganSmith,
    ethanSmith,
    oliviaSmith,
    noahSmith,
    avaSmith,
  ];

  for (const member of allMembers) {
    let role: "MEMBER" | "ADMIN" | "HEAD" | "VIEWER" = "MEMBER";
    if (member.id === alexSmith.id) role = "ADMIN";
    else if (member.id === davidSmith.id) role = "HEAD";

    await prisma.familyMembership.create({
      data: {
        memberId: member.id,
        familyId: smithFamily.id,
        role: role,
        type: "MAIN",
        autoEnrolled: true,
        manuallyEdited: false,
      },
    });
  }

  console.log("✅ Created main family with 40 members");

  // Create sub-family (Alex's immediate family)
  console.log("🌿 Creating sub-family...");

  const alexBranch = await prisma.family.create({
    data: {
      name: "Alex's Branch",
      description: "Alex's immediate family and descendants",
      isSubFamily: true,
      parentFamilyId: smithFamily.id,
      creatorId: alexSmith.id,
      headOfFamilyId: alexSmith.id,
    },
  });

  // Add Alex's immediate family to the sub-family
  const immediateFamilyMembers = [
    alexSmith,
    jamieSmith,
    ryanSmith,
    taylorSmith,
    jordanSmith,
    caseySmith,
    morganSmith,
    ethanSmith,
    oliviaSmith,
    noahSmith,
    avaSmith,
  ];

  for (const member of immediateFamilyMembers) {
    await prisma.familyMembership.create({
      data: {
        memberId: member.id,
        familyId: alexBranch.id,
        role: member.id === alexSmith.id ? "HEAD" : "MEMBER",
        type: "SUB",
        autoEnrolled: true,
        manuallyEdited: false,
      },
    });
  }

  console.log("✅ Created sub-family with 11 members");

  // Create sample users
  console.log("👤 Creating sample users...");

  const hashedPassword = await bcrypt.hash("FamilyTree123!", 12);

  const alexUser = await prisma.user.create({
    data: {
      email: "alex.smith@example.com",
      password: hashedPassword,
      emailVerified: true,
      memberId: alexSmith.id,
    },
  });

  const davidUser = await prisma.user.create({
    data: {
      email: "david.smith@example.com",
      password: hashedPassword,
      emailVerified: true,
      memberId: davidSmith.id,
    },
  });

  console.log("✅ Created 2 sample users");

  // Create sample invitation
  console.log("💌 Creating sample invitation...");

  const invitationCode = "sample_invitation_jwt_token_placeholder";
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await prisma.invitation.create({
    data: {
      code: invitationCode,
      familyId: smithFamily.id,
      inviterUserId: alexUser.id,
      inviterMemberId: alexSmith.id,
      expiresAt,
      status: "VALID",
      memberStub: {
        name: "New Family Member",
        relationship: "cousin",
        note: "Invited to join the Smith-Johnson family",
      },
    },
  });

  console.log("✅ Created sample invitation");

  console.log("🎉 Family Tree Platform database seeding completed!");
  console.log("");
  console.log("📋 Sample Data Created:");
  console.log("  • 40 family members with comprehensive relationships");
  console.log("  • 1 main family (The Smith-Johnson Family)");
  console.log("  • 1 sub-family (Alex's Branch)");
  console.log("  • 2 user accounts for login testing");
  console.log("  • 1 sample invitation");
  console.log("");
  console.log("🔐 Demo Credentials:");
  console.log("  Email: alex.smith@example.com");
  console.log("  Email: david.smith@example.com");
  console.log("  Password: FamilyTree123!");
  console.log("");
  console.log("🌳 Family Structure:");
  console.log("  William Smith (♂) ⚭ Elizabeth Smith (♀) [Great-Grandparents]");
  console.log("  └── James Smith (♂) ⚭ Patricia Smith (♀) [Grandparents]");
  console.log("      └── David Smith (♂) ⚭ Sarah Smith (♀) [Parents]");
  console.log("          ├── Alex Smith (♂) ⚭ Jamie Smith (♀) [Main User]");
  console.log("          │   ├── Ryan Smith (♂) ⚭ Casey Smith (♀)");
  console.log("          │   │   ├── Ethan Smith (♂)");
  console.log("          │   │   └── Olivia Smith (♀)");
  console.log("          │   ├── Taylor Smith (♀) ⚭ Morgan Smith (♂)");
  console.log("          │   │   ├── Noah Smith (♂)");
  console.log("          │   │   └── Ava Smith (♀)");
  console.log("          │   └── Jordan Smith (♂)");
  console.log("          ├── Michael Smith (♂) [Brother]");
  console.log("          └── Emily Smith (♀) [Sister]");
  console.log("      ├── Robert Smith (♂) ⚭ Linda Smith (♀) [Uncle/Aunt]");
  console.log("      │   ├── Kevin Smith (♂) [Cousin]");
  console.log("      │   └── Rachel Smith (♀) [Cousin]");
  console.log(
    "      └── Christopher Smith (♂) ⚭ Jennifer Smith (♀) [Uncle/Aunt]"
  );
  console.log("          ├── Brian Smith (♂) [Cousin]");
  console.log("          └── Laura Smith (♀) [Cousin]");
  console.log("  Robert Johnson (♂) ⚭ Mary Johnson (♀) [Great-Grandparents]");
  console.log(
    "  └── Thomas Johnson (♂) ⚭ Catherine Johnson (♀) [Grandparents]"
  );
  console.log("      └── Sarah Smith (♀) [Mother]");
  console.log(
    "          ├── Daniel Johnson (♂) ⚭ Maria Johnson (♀) [Uncle/Aunt]"
  );
  console.log("          │   ├── Steven Johnson (♂) [Cousin]");
  console.log("          │   └── Lisa Johnson (♀) [Cousin]");
  console.log(
    "          └── Peter Johnson (♂) ⚭ Anna Johnson (♀) [Uncle/Aunt]"
  );
  console.log("              ├── Mark Johnson (♂) [Cousin]");
  console.log("              └── Sophia Johnson (♀) [Cousin]");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
