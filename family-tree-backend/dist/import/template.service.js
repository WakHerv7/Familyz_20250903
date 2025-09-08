"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
let TemplateService = class TemplateService {
    async generateExcelTemplate(includeSampleData = true, size = "medium") {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Family Tree Application";
        workbook.lastModifiedBy = "Family Tree Application";
        workbook.created = new Date();
        workbook.modified = new Date();
        const membersSheet = workbook.addWorksheet("Members");
        membersSheet.columns = [
            {
                header: "name",
                key: "name",
                width: 25,
                style: { font: { bold: true, color: { argb: "FFFF0000" } } },
            },
            {
                header: "gender",
                key: "gender",
                width: 15,
                style: { font: { bold: true } },
            },
            {
                header: "status",
                key: "status",
                width: 15,
                style: { font: { bold: true } },
            },
            {
                header: "color",
                key: "color",
                width: 15,
            },
            {
                header: "bio",
                key: "bio",
                width: 40,
            },
            {
                header: "birth_date",
                key: "birth_date",
                width: 15,
            },
            {
                header: "birth_place",
                key: "birth_place",
                width: 25,
            },
            {
                header: "occupation",
                key: "occupation",
                width: 25,
            },
            {
                header: "parent_names",
                key: "parent_names",
                width: 30,
            },
            {
                header: "spouse_names",
                key: "spouse_names",
                width: 30,
            },
            {
                header: "family_name",
                key: "family_name",
                width: 25,
            },
            {
                header: "family_role",
                key: "family_role",
                width: 15,
            },
            {
                header: "facebook",
                key: "facebook",
                width: 30,
            },
            {
                header: "linkedin",
                key: "linkedin",
                width: 30,
            },
            {
                header: "website",
                key: "website",
                width: 30,
            },
        ];
        const genderValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['"MALE,FEMALE,OTHER"'],
        };
        const statusValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['"ACTIVE,INACTIVE,DECEASED,ARCHIVED"'],
        };
        const roleValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['"ADMIN,MEMBER,HEAD,VIEWER"'],
        };
        for (let row = 2; row <= 1000; row++) {
            membersSheet.getCell(`B${row}`).dataValidation = genderValidation;
            membersSheet.getCell(`C${row}`).dataValidation = statusValidation;
            membersSheet.getCell(`L${row}`).dataValidation = roleValidation;
        }
        if (includeSampleData) {
            const sampleData = this.getSampleData(size);
            membersSheet.addRows(sampleData);
        }
        const instructionsSheet = workbook.addWorksheet("Instructions");
        instructionsSheet.columns = [
            { header: "Field", key: "field", width: 20 },
            { header: "Required", key: "required", width: 10 },
            { header: "Description", key: "description", width: 50 },
            { header: "Example", key: "example", width: 30 },
        ];
        const instructions = [
            ["name", "Yes", "Full name of the family member", "John Smith"],
            ["gender", "Yes", "Gender (MALE, FEMALE, OTHER)", "MALE"],
            [
                "status",
                "No",
                "Member status (ACTIVE, INACTIVE, DECEASED, ARCHIVED)",
                "ACTIVE",
            ],
            ["color", "No", "Hex color code for visualization", "#FF5733"],
            [
                "bio",
                "No",
                "Brief biography or description",
                "Software engineer with 10 years experience",
            ],
            ["birth_date", "No", "Birth date in YYYY-MM-DD format", "1990-01-15"],
            ["birth_place", "No", "Place of birth", "New York, USA"],
            ["occupation", "No", "Job title or profession", "Software Engineer"],
            [
                "parent_names",
                "No",
                "Names of parents (comma-separated)",
                "Robert Smith, Mary Smith",
            ],
            [
                "spouse_names",
                "No",
                "Names of spouses (comma-separated)",
                "Jane Smith",
            ],
            ["family_name", "No", "Family name or group", "Smith Family"],
            [
                "family_role",
                "No",
                "Role in family (ADMIN, MEMBER, HEAD, VIEWER)",
                "MEMBER",
            ],
            [
                "facebook",
                "No",
                "Facebook profile URL",
                "https://facebook.com/johnsmith",
            ],
            [
                "linkedin",
                "No",
                "LinkedIn profile URL",
                "https://linkedin.com/in/johnsmith",
            ],
            ["website", "No", "Personal website URL", "https://johnsmith.com"],
        ];
        instructionsSheet.addRows(instructions);
        instructionsSheet.getRow(1).font = { bold: true };
        instructionsSheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6FA" },
        };
        return workbook;
    }
    async generateJsonTemplate(includeSampleData = true, size = "medium") {
        const baseTemplate = {
            families: [
                {
                    name: "Family Name (optional)",
                    description: "Family description (optional)",
                    members: [],
                },
            ],
        };
        if (includeSampleData) {
            const sampleMembers = this.getJsonSampleData(size);
            baseTemplate.families[0].members = sampleMembers;
        }
        return JSON.stringify(baseTemplate, null, 2);
    }
    getSampleData(size) {
        const sampleData = {
            small: [
                [
                    "John Smith",
                    "MALE",
                    "ACTIVE",
                    "#FF5733",
                    "Family patriarch",
                    "1980-01-15",
                    "New York, USA",
                    "Engineer",
                    "",
                    "Jane Smith",
                    "Smith Family",
                    "ADMIN",
                    "https://facebook.com/johnsmith",
                    "",
                    "",
                ],
                [
                    "Jane Smith",
                    "FEMALE",
                    "ACTIVE",
                    "#33FF57",
                    "Family matriarch",
                    "1982-03-20",
                    "Boston, USA",
                    "Teacher",
                    "",
                    "John Smith",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "https://linkedin.com/in/janesmith",
                    "",
                ],
                [
                    "Michael Smith",
                    "MALE",
                    "ACTIVE",
                    "#3357FF",
                    "First child",
                    "2010-05-10",
                    "New York, USA",
                    "Student",
                    "John Smith,Jane Smith",
                    "",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
            ],
            medium: [
                [
                    "John Smith",
                    "MALE",
                    "ACTIVE",
                    "#FF5733",
                    "Family patriarch",
                    "1980-01-15",
                    "New York, USA",
                    "Engineer",
                    "",
                    "Jane Smith",
                    "Smith Family",
                    "ADMIN",
                    "https://facebook.com/johnsmith",
                    "",
                    "",
                ],
                [
                    "Jane Smith",
                    "FEMALE",
                    "ACTIVE",
                    "#33FF57",
                    "Family matriarch",
                    "1982-03-20",
                    "Boston, USA",
                    "Teacher",
                    "",
                    "John Smith",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "https://linkedin.com/in/janesmith",
                    "",
                ],
                [
                    "Michael Smith",
                    "MALE",
                    "ACTIVE",
                    "#3357FF",
                    "First child",
                    "2010-05-10",
                    "New York, USA",
                    "Student",
                    "John Smith,Jane Smith",
                    "",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
                [
                    "Sarah Smith",
                    "FEMALE",
                    "ACTIVE",
                    "#FF33F5",
                    "Second child",
                    "2012-07-22",
                    "New York, USA",
                    "Student",
                    "John Smith,Jane Smith",
                    "",
                    "Smith Family",
                    "MEMBER",
                    "https://facebook.com/sarahsmith",
                    "",
                    "",
                ],
                [
                    "Robert Johnson",
                    "MALE",
                    "ACTIVE",
                    "#F5FF33",
                    "Jane's brother",
                    "1978-11-05",
                    "Boston, USA",
                    "Doctor",
                    "William Johnson,Margaret Johnson",
                    "Lisa Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "",
                    "https://linkedin.com/in/robertjohnson",
                    "",
                ],
                [
                    "Lisa Johnson",
                    "FEMALE",
                    "ACTIVE",
                    "#FF8C33",
                    "Robert's wife",
                    "1980-09-12",
                    "Chicago, USA",
                    "Nurse",
                    "",
                    "Robert Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "https://facebook.com/lisajohnson",
                    "",
                    "",
                ],
            ],
            large: [
                [
                    "John Smith",
                    "MALE",
                    "ACTIVE",
                    "#FF5733",
                    "Family patriarch",
                    "1980-01-15",
                    "New York, USA",
                    "Engineer",
                    "",
                    "Jane Smith",
                    "Smith Family",
                    "ADMIN",
                    "https://facebook.com/johnsmith",
                    "",
                    "",
                ],
                [
                    "Jane Smith",
                    "FEMALE",
                    "ACTIVE",
                    "#33FF57",
                    "Family matriarch",
                    "1982-03-20",
                    "Boston, USA",
                    "Teacher",
                    "",
                    "John Smith",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "https://linkedin.com/in/janesmith",
                    "",
                ],
                [
                    "Michael Smith",
                    "MALE",
                    "ACTIVE",
                    "#3357FF",
                    "First child",
                    "2010-05-10",
                    "New York, USA",
                    "Student",
                    "John Smith,Jane Smith",
                    "",
                    "Smith Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
                [
                    "Sarah Smith",
                    "FEMALE",
                    "ACTIVE",
                    "#FF33F5",
                    "Second child",
                    "2012-07-22",
                    "New York, USA",
                    "Student",
                    "John Smith,Jane Smith",
                    "",
                    "Smith Family",
                    "MEMBER",
                    "https://facebook.com/sarahsmith",
                    "",
                    "",
                ],
                [
                    "Robert Johnson",
                    "MALE",
                    "ACTIVE",
                    "#F5FF33",
                    "Jane's brother",
                    "1978-11-05",
                    "Boston, USA",
                    "Doctor",
                    "William Johnson,Margaret Johnson",
                    "Lisa Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "",
                    "https://linkedin.com/in/robertjohnson",
                    "",
                ],
                [
                    "Lisa Johnson",
                    "FEMALE",
                    "ACTIVE",
                    "#FF8C33",
                    "Robert's wife",
                    "1980-09-12",
                    "Chicago, USA",
                    "Nurse",
                    "",
                    "Robert Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "https://facebook.com/lisajohnson",
                    "",
                    "",
                ],
                [
                    "William Johnson",
                    "MALE",
                    "DECEASED",
                    "#8C33FF",
                    "Robert's father",
                    "1950-02-14",
                    "Boston, USA",
                    "Retired Teacher",
                    "",
                    "Margaret Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
                [
                    "Margaret Johnson",
                    "FEMALE",
                    "DECEASED",
                    "#33FFF5",
                    "Robert's mother",
                    "1952-06-30",
                    "Boston, USA",
                    "Retired Nurse",
                    "",
                    "William Johnson",
                    "Johnson Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
                [
                    "Emma Johnson",
                    "FEMALE",
                    "ACTIVE",
                    "#FF3333",
                    "Robert and Lisa's daughter",
                    "2015-04-18",
                    "Chicago, USA",
                    "Student",
                    "Robert Johnson,Lisa Johnson",
                    "",
                    "Johnson Family",
                    "MEMBER",
                    "",
                    "",
                    "",
                ],
                [
                    "David Smith",
                    "MALE",
                    "ACTIVE",
                    "#33FF33",
                    "John's cousin",
                    "1985-12-03",
                    "Los Angeles, USA",
                    "Architect",
                    "Thomas Smith,Anna Smith",
                    "Maria Smith",
                    "Smith Family",
                    "MEMBER",
                    "https://facebook.com/davidsmith",
                    "https://linkedin.com/in/davidsmith",
                    "https://davidsmith.com",
                ],
            ],
        };
        return sampleData[size] || sampleData.medium;
    }
    getJsonSampleData(size) {
        const sampleData = {
            small: [
                {
                    name: "John Smith",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#FF5733",
                    personalInfo: {
                        bio: "Family patriarch and software engineer",
                        birthDate: "1980-01-15",
                        birthPlace: "New York, USA",
                        occupation: "Software Engineer",
                        socialLinks: {
                            facebook: "https://facebook.com/johnsmith",
                            linkedin: "https://linkedin.com/in/johnsmith",
                        },
                    },
                    spouseNames: ["Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "ADMIN",
                },
                {
                    name: "Jane Smith",
                    gender: "FEMALE",
                    status: "ACTIVE",
                    color: "#33FF57",
                    personalInfo: {
                        bio: "Family matriarch and teacher",
                        birthDate: "1982-03-20",
                        birthPlace: "Boston, USA",
                        occupation: "Teacher",
                    },
                    spouseNames: ["John Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
            ],
            medium: [
                {
                    name: "John Smith",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#FF5733",
                    personalInfo: {
                        bio: "Family patriarch and software engineer",
                        birthDate: "1980-01-15",
                        birthPlace: "New York, USA",
                        occupation: "Software Engineer",
                    },
                    spouseNames: ["Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "ADMIN",
                },
                {
                    name: "Jane Smith",
                    gender: "FEMALE",
                    status: "ACTIVE",
                    color: "#33FF57",
                    personalInfo: {
                        bio: "Family matriarch and teacher",
                        birthDate: "1982-03-20",
                        birthPlace: "Boston, USA",
                        occupation: "Teacher",
                    },
                    spouseNames: ["John Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
                {
                    name: "Michael Smith",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#3357FF",
                    personalInfo: {
                        bio: "First child, currently in school",
                        birthDate: "2010-05-10",
                        birthPlace: "New York, USA",
                        occupation: "Student",
                    },
                    parentNames: ["John Smith", "Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
            ],
            large: [
                {
                    name: "John Smith",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#FF5733",
                    personalInfo: {
                        bio: "Family patriarch and software engineer",
                        birthDate: "1980-01-15",
                        birthPlace: "New York, USA",
                        occupation: "Software Engineer",
                    },
                    spouseNames: ["Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "ADMIN",
                },
                {
                    name: "Jane Smith",
                    gender: "FEMALE",
                    status: "ACTIVE",
                    color: "#33FF57",
                    personalInfo: {
                        bio: "Family matriarch and teacher",
                        birthDate: "1982-03-20",
                        birthPlace: "Boston, USA",
                        occupation: "Teacher",
                    },
                    spouseNames: ["John Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
                {
                    name: "Michael Smith",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#3357FF",
                    personalInfo: {
                        bio: "First child, currently in school",
                        birthDate: "2010-05-10",
                        birthPlace: "New York, USA",
                        occupation: "Student",
                    },
                    parentNames: ["John Smith", "Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
                {
                    name: "Sarah Smith",
                    gender: "FEMALE",
                    status: "ACTIVE",
                    color: "#FF33F5",
                    personalInfo: {
                        bio: "Second child, artistic and creative",
                        birthDate: "2012-07-22",
                        birthPlace: "New York, USA",
                        occupation: "Student",
                    },
                    parentNames: ["John Smith", "Jane Smith"],
                    familyName: "Smith Family",
                    familyRole: "MEMBER",
                },
                {
                    name: "Robert Johnson",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#F5FF33",
                    personalInfo: {
                        bio: "Jane's brother, successful doctor",
                        birthDate: "1978-11-05",
                        birthPlace: "Boston, USA",
                        occupation: "Doctor",
                    },
                    parentNames: ["William Johnson", "Margaret Johnson"],
                    spouseNames: ["Lisa Johnson"],
                    familyName: "Johnson Family",
                    familyRole: "MEMBER",
                },
            ],
        };
        return sampleData[size] || sampleData.medium;
    }
    async sendExcelTemplate(response, includeSampleData = true, size = "medium") {
        const workbook = await this.generateExcelTemplate(includeSampleData, size);
        response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", `attachment; filename=family-import-template-${size}${includeSampleData ? "-with-sample-data" : ""}.xlsx`);
        await workbook.xlsx.write(response);
    }
    async sendJsonTemplate(response, includeSampleData = true, size = "medium") {
        const jsonTemplate = await this.generateJsonTemplate(includeSampleData, size);
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Content-Disposition", `attachment; filename=family-import-template-${size}${includeSampleData ? "-with-sample-data" : ""}.json`);
        response.send(jsonTemplate);
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)()
], TemplateService);
//# sourceMappingURL=template.service.js.map