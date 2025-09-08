import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FamilyRole } from "@prisma/client";
import puppeteer from "puppeteer";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

interface ExportConfig {
  formats: ("pdf" | "excel")[];
  familyTree: {
    structure: "folderTree" | "traditional" | "interactive" | "textTree";
    includeMembersList: boolean;
    memberDetails: (
      | "parent"
      | "children"
      | "spouses"
      | "personalInfo"
      | "contact"
    )[];
  };
}

interface ExportRequest {
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

interface FolderTreeExportData {
  families: {
    id: string;
    name: string;
    members: {
      id: string;
      name: string;
      role: FamilyRole;
      generation: number;
      parents: any[];
      children: any[];
      spouses: any[];
      personalInfo?: any;
    }[];
  }[];
  membersList: any[];
  generatedAt: Date;
  exportConfig: ExportConfig;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async getExplorerTreeData(
    memberId: string
  ): Promise<{ column: number; value: string }[]> {
    const folderTreeData = await this.getFolderTreeData(memberId);

    // Use the same logic as generateExcelTreeFormat but for all families
    const allMembers = folderTreeData.families.flatMap((f) => f.members);
    const treeData = this.generateExcelTreeFormat(allMembers, {
      format: "excel",
      scope: "all-families",
      config: {
        formats: ["excel"],
        familyTree: {
          structure: "textTree",
          includeMembersList: false,
          memberDetails: ["parent", "children", "spouses", "personalInfo"],
        },
      },
      includeData: {
        personalInfo: false,
        relationships: true,
        contactInfo: false,
        profileImages: false,
      },
    });

    return treeData;
  }

  async getFolderTreeDataWithIds(
    memberId: string,
    familyId?: string
  ): Promise<
    {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[]
  > {
    const folderTreeData = await this.getFolderTreeData(memberId, familyId);

    // Use the same logic as generateExcelTreeFormat but for all families
    const allMembers = folderTreeData.families.flatMap((f) => f.members);
    const treeData = this.generateExcelTreeFormatWithIds(allMembers, {
      format: "excel",
      scope: "all-families",
      config: {
        formats: ["excel"],
        familyTree: {
          structure: "textTree",
          includeMembersList: false,
          memberDetails: ["parent", "children", "spouses", "personalInfo"],
        },
      },
      includeData: {
        personalInfo: false,
        relationships: true,
        contactInfo: false,
        profileImages: false,
      },
    });

    return treeData;
  }

  async getFamilyFolderTreeData(
    memberId: string,
    familyId: string
  ): Promise<
    {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[]
  > {
    // Get folder tree data for all accessible families
    const folderTreeData = await this.getFolderTreeData(memberId);

    // Find the target family to ensure user has access
    const targetFamily = folderTreeData.families.find((f) => f.id === familyId);
    if (!targetFamily) {
      throw new BadRequestException("Family not found or access denied");
    }

    // Get all members from all families for relationship context
    const allMembers = folderTreeData.families.flatMap((f) => f.members);

    // Use family-specific tree generation
    const treeData = this.generateFamilyExcelTreeFormatWithIds(
      allMembers,
      targetFamily.members,
      {
        format: "excel",
        scope: "current-family",
        config: {
          formats: ["excel"],
          familyTree: {
            structure: "folderTree",
            includeMembersList: false,
            memberDetails: ["parent", "children", "spouses", "personalInfo"],
          },
        },
        includeData: {
          personalInfo: false,
          relationships: true,
          contactInfo: false,
          profileImages: false,
        },
      }
    );

    return treeData;
  }

  async getFolderTreeData(
    memberId: string,
    familyId?: string
  ): Promise<FolderTreeExportData> {
    // Get the member and their family memberships
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        familyMemberships: {
          include: {
            family: true,
          },
        },
      },
    });

    if (!member) {
      throw new BadRequestException("Member not found");
    }

    // Check if user is admin (can access all families)
    const isAdmin = member.familyMemberships.some(
      (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
    );

    let families;
    if (isAdmin) {
      // Admin can see all families
      families = await this.prisma.family.findMany({
        include: {
          memberships: {
            include: {
              member: {
                include: {
                  parents: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                  children: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                  spouses: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      // Regular member can only see their families
      const familyIds = member.familyMemberships.map((m) => m.familyId);
      families = await this.prisma.family.findMany({
        where: { id: { in: familyIds } },
        include: {
          memberships: {
            include: {
              member: {
                include: {
                  parents: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                  children: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                  spouses: {
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    // Calculate generations for each member
    const calculateGeneration = (
      memberId: string,
      familyMembers: any[],
      visited = new Set()
    ): number => {
      if (visited.has(memberId)) return 0;
      visited.add(memberId);

      const member = familyMembers.find((m) => m.member.id === memberId);
      if (!member) return 0;

      const parents = member.member.parents;
      if (parents.length === 0) return 0;

      const parentGenerations = parents.map((parent: any) =>
        calculateGeneration(parent.id, familyMembers, new Set(visited))
      );

      return Math.max(...parentGenerations, 0) + 1;
    };

    // Transform families data - each family gets its own complete member list
    const transformedFamilies = families.map((family) => {
      // Start with direct family members
      const familyMembers = new Map();

      // Add all direct family members
      family.memberships.forEach((membership) => {
        const generation = calculateGeneration(
          membership.member.id,
          family.memberships
        );

        familyMembers.set(membership.member.id, {
          id: membership.member.id,
          name: membership.member.name,
          gender: membership.member.gender,
          role: membership.role,
          generation,
          parents: membership.member.parents,
          children: membership.member.children,
          spouses: membership.member.spouses,
          personalInfo: membership.member.personalInfo,
          isDirectMember: true,
        });
      });

      // For each family, we want to include ALL members who have relationships with this family
      // This means spouses of family members AND their children
      for (const fam of families) {
        if (fam.id === family.id) continue; // Skip current family

        fam.memberships.forEach((membership) => {
          const member = membership.member;

          // Check if this member has spouses in our current family
          if (member.spouses && member.spouses.length > 0) {
            member.spouses.forEach((spouse: any) => {
              if (familyMembers.has(spouse.id)) {
                // This member has a spouse in our family, so include them
                if (!familyMembers.has(member.id)) {
                  const generation = calculateGeneration(
                    member.id,
                    family.memberships
                  );

                  familyMembers.set(member.id, {
                    id: member.id,
                    name: member.name,
                    gender: member.gender,
                    role: membership.role,
                    generation,
                    parents: member.parents,
                    children: member.children,
                    spouses: member.spouses,
                    personalInfo: member.personalInfo,
                    isDirectMember: false,
                  });

                  // Also include their children
                  if (member.children && member.children.length > 0) {
                    member.children.forEach((child: any) => {
                      if (!familyMembers.has(child.id)) {
                        // Find child's data
                        let childData = null;
                        for (const f of families) {
                          const childMembership = f.memberships.find(
                            (m) => m.member.id === child.id
                          );
                          if (childMembership) {
                            childData = childMembership;
                            break;
                          }
                        }

                        if (childData) {
                          const childGeneration = calculateGeneration(
                            child.id,
                            family.memberships
                          );

                          familyMembers.set(child.id, {
                            id: child.id,
                            name: childData.member.name,
                            gender: childData.member.gender,
                            role: childData.role,
                            generation: childGeneration,
                            parents: childData.member.parents,
                            children: childData.member.children,
                            spouses: childData.member.spouses,
                            personalInfo: childData.member.personalInfo,
                            isDirectMember: false,
                          });
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        });
      }

      return {
        id: family.id,
        name: family.name,
        members: Array.from(familyMembers.values()).sort(
          (a, b) => a.generation - b.generation || a.name.localeCompare(b.name)
        ),
      };
    });

    // Filter families if familyId is provided
    let filteredFamilies = transformedFamilies;
    if (familyId) {
      // Find the target family
      const targetFamily = transformedFamilies.find(
        (family) => family.id === familyId
      );

      if (targetFamily) {
        // Create a new family object that includes related members from other families
        const enhancedTargetFamily = {
          id: targetFamily.id,
          name: targetFamily.name,
          members: [...targetFamily.members], // Start with direct members
        };

        // Add related members from other families
        for (const otherFamily of transformedFamilies) {
          if (otherFamily.id === familyId) continue; // Skip the target family itself

          for (const member of otherFamily.members) {
            // Check if this member has relationships with the target family
            const hasSpouseInTargetFamily = member.spouses?.some(
              (spouse: any) =>
                targetFamily.members.some(
                  (targetMember) => targetMember.id === spouse.id
                )
            );

            const hasChildInTargetFamily = member.children?.some((child: any) =>
              targetFamily.members.some(
                (targetMember) => targetMember.id === child.id
              )
            );

            const hasParentInTargetFamily = member.parents?.some(
              (parent: any) =>
                targetFamily.members.some(
                  (targetMember) => targetMember.id === parent.id
                )
            );

            // If this member has any relationship with the target family, include them
            if (
              hasSpouseInTargetFamily ||
              hasChildInTargetFamily ||
              hasParentInTargetFamily
            ) {
              // Check if this member is already in the target family
              const alreadyExists = enhancedTargetFamily.members.some(
                (m) => m.id === member.id
              );
              if (!alreadyExists) {
                enhancedTargetFamily.members.push({
                  ...member,
                  isDirectMember: false, // Mark as indirect member
                });
              }
            }
          }
        }

        filteredFamilies = [enhancedTargetFamily];
      } else {
        // If target family not found, return empty
        filteredFamilies = [];
      }
    }

    // Get all unique members for members list
    const allMembers = filteredFamilies.flatMap((family) => family.members);
    const uniqueMembers = allMembers.filter(
      (member, index, array) =>
        array.findIndex((m) => m.id === member.id) === index
    );

    return {
      families: filteredFamilies,
      membersList: uniqueMembers,
      generatedAt: new Date(),
      exportConfig: {
        formats: ["pdf", "excel"],
        familyTree: {
          structure: "folderTree",
          includeMembersList: true,
          memberDetails: ["parent", "children", "spouses", "personalInfo"],
        },
      },
    };
  }

  async exportFamilyData(
    memberId: string,
    exportRequest: ExportRequest
  ): Promise<{
    downloadUrl: string;
    filename: string;
    htmlUrl?: string;
    htmlFilename?: string;
  }> {
    // Get folder tree data
    const folderTreeData = await this.getFolderTreeData(memberId);

    // Filter families based on scope
    let familiesToExport = folderTreeData.families;

    if (exportRequest.scope === "current-family") {
      // Get user's first family (their main family)
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        include: { familyMemberships: true },
      });

      if (member && member.familyMemberships.length > 0) {
        const primaryFamilyId = member.familyMemberships[0].familyId;
        familiesToExport = folderTreeData.families.filter(
          (f) => f.id === primaryFamilyId
        );
      }
    } else if (
      exportRequest.scope === "selected-families" &&
      exportRequest.familyIds
    ) {
      familiesToExport = folderTreeData.families.filter((f) =>
        exportRequest.familyIds!.includes(f.id)
      );
    }

    // Generate export based on format
    if (exportRequest.format === "pdf") {
      const result = await this.generatePDF(familiesToExport, exportRequest);
      console.log("📄 PDF Export Result:", result);
      return result;
    } else if (exportRequest.format === "excel") {
      return this.generateExcel(familiesToExport, exportRequest);
    }

    throw new BadRequestException("Unsupported export format");
  }

  private async generatePDF(
    families: any[],
    exportRequest: ExportRequest
  ): Promise<{ downloadUrl: string; filename: string }> {
    console.log("🚀 Starting PDF generation with Puppeteer");
    console.log("📊 Families to export:", families.length);
    console.log(
      "⚙️ Export structure:",
      exportRequest.config.familyTree.structure
    );

    let browser;
    try {
      console.log("🌐 Launching Puppeteer browser...");
      browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-web-security"],
      });
      console.log("✅ Browser launched successfully");

      const page = await browser.newPage();
      console.log("📄 New page created");

      // Generate HTML content
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Family Tree Export</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 40px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
            }
            .family-section {
              margin-bottom: 40px;
            }
            .family-name {
              font-size: 18px;
              font-weight: bold;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
              margin-bottom: 20px;
            }
            .tree-content {
              font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
              font-size: 12px;
              white-space: pre;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
              line-height: 1.3;
              border: 1px solid #ddd;
            }
            .generation-group {
              margin-bottom: 20px;
            }
            .generation-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .member-item {
              margin-bottom: 8px;
            }
            .relationship-info {
              margin-left: 20px;
              font-size: 11px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Family Tree Export</div>
            <div class="subtitle">Generated on: ${new Date().toLocaleString()}</div>
            <div class="subtitle">Structure: ${
              exportRequest.config.familyTree.structure
            }</div>
          </div>
      `;

      console.log("📝 Generating HTML content...");
      families.forEach((family, familyIndex) => {
        console.log(`👨‍👩‍👧‍👦 Processing family ${familyIndex + 1}: ${family.name}`);
        htmlContent += `<div class="family-section">`;
        htmlContent += `<div class="family-name">Family: ${family.name}</div>`;

        if (exportRequest.config.familyTree.structure === "folderTree") {
          // Group by generations
          const generations: { [key: number]: any[] } = {};
          family.members.forEach((member: any) => {
            if (!generations[member.generation]) {
              generations[member.generation] = [];
            }
            generations[member.generation].push(member);
          });

          Object.keys(generations)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach((generation) => {
              htmlContent += `<div class="generation-group">`;
              htmlContent += `<div class="generation-title">Generation ${generation}:</div>`;

              generations[generation].forEach((member) => {
                htmlContent += `<div class="member-item">• ${member.name} (${member.role})</div>`;

                if (exportRequest.includeData.relationships) {
                  if (member.parents.length > 0) {
                    htmlContent += `<div class="relationship-info">Parents: ${member.parents
                      .map((p: any) => p.name)
                      .join(", ")}</div>`;
                  }
                  if (member.children.length > 0) {
                    htmlContent += `<div class="relationship-info">Children: ${member.children
                      .map((c: any) => c.name)
                      .join(", ")}</div>`;
                  }
                  if (member.spouses.length > 0) {
                    htmlContent += `<div class="relationship-info">Spouses: ${member.spouses
                      .map((s: any) => s.name)
                      .join(", ")}</div>`;
                  }
                }

                if (
                  exportRequest.includeData.personalInfo &&
                  member.personalInfo
                ) {
                  const info = member.personalInfo as any;
                  if (info.bio)
                    htmlContent += `<div class="relationship-info">Bio: ${info.bio}</div>`;
                  if (info.birthDate)
                    htmlContent += `<div class="relationship-info">Birth Date: ${info.birthDate}</div>`;
                  if (info.occupation)
                    htmlContent += `<div class="relationship-info">Occupation: ${info.occupation}</div>`;
                }
              });

              htmlContent += `</div>`;
            });
        } else if (exportRequest.config.familyTree.structure === "textTree") {
          console.log("🌳 Generating text tree format...");
          // Generate symbolic text tree format using ALL members from all families
          const allMembers = families.flatMap((f) => f.members);
          console.log("👥 Total members for tree:", allMembers.length);

          const treeContent = this.generateTextTreeFormat(
            allMembers,
            exportRequest
          );
          console.log("📄 Tree content generated, length:", treeContent.length);
          console.log(`<div class="tree-content">${treeContent}</div>`);

          htmlContent += `<div class="tree-content">${treeContent}</div>`;

          // For textTree format, also save the HTML version
          const timestamp = new Date().toISOString().split("T")[0];
          const htmlFilename = `family-tree-textTree-${timestamp}.html`;
          const exportsDir = path.join(
            __dirname,
            "..",
            "..",
            "public",
            "exports"
          );
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
          }
          const htmlFilePath = path.join(exportsDir, htmlFilename);
          fs.writeFileSync(htmlFilePath, htmlContent);
          console.log("📄 HTML version saved to file:", htmlFilePath);
        } else {
          // Simple list format
          family.members.forEach((member: any) => {
            htmlContent += `<div class="member-item">• ${member.name} (${member.role})</div>`;
          });
        }

        htmlContent += `</div>`;
      });

      htmlContent += `
        </body>
        </html>
      `;

      console.log("📄 Setting HTML content...");
      await page.setContent(htmlContent, {
        waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
      });

      console.log("⏳ Waiting for fonts to load...");
      await page.waitForFunction("document.fonts.ready");

      console.log("✅ HTML content set successfully");

      console.log("📊 Generating PDF...");
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
        printBackground: true,
        displayHeaderFooter: false,
      });

      console.log(
        "✅ PDF generated successfully, size:",
        pdfBuffer.length,
        "bytes"
      );

      await page.emulateMediaType("screen");

      // Generate unique filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `family-tree-${exportRequest.config.familyTree.structure}-${timestamp}.pdf`;

      // Ensure exports directory exists
      const exportsDir = path.join(__dirname, "..", "..", "public", "exports");
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      // Save PDF to file
      const filePath = path.join(exportsDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      console.log("💾 PDF saved to file:", filePath);

      // Return download URLs - use the full server URL
      const downloadUrl = `http://localhost:3001/api/v1/export/download/${filename}`;
      const result: any = { downloadUrl, filename };

      // For textTree format, also return HTML file info
      if (exportRequest.config.familyTree.structure === "textTree") {
        const timestamp = new Date().toISOString().split("T")[0];
        const htmlFilename = `family-tree-textTree-${timestamp}.html`;
        result.htmlUrl = `http://localhost:3001/api/v1/export/download/${htmlFilename}`;
        result.htmlFilename = htmlFilename;
      }

      return result;
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      throw new BadRequestException(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        console.log("🔒 Closing browser...");
        await browser.close();
        console.log("✅ Browser closed");
      }
    }
  }

  private generateTextTreeFormat(
    members: any[],
    exportRequest: ExportRequest
  ): string {
    console.log(
      "🔍 Starting generateTextTreeFormat with members:",
      members.length
    );

    let content = "";

    // PART 1: ASCII TREE STRUCTURE
    content += "=".repeat(80) + "\n";
    content += "FAMILY TREE VISUAL STRUCTURE\n";
    content += "=".repeat(80) + "\n\n";

    // Build proper family tree using existing relationships from database
    const memberMap = new Map<string, any>();

    // First pass: Index all members by ID and normalize data
    members.forEach((member) => {
      // console.log("----------------------------------------");
      // console.log("Family member :: ", { id: member.id, name: member.name });
      // console.log("Family member spouses :: ", member.spouses);
      // console.log("Family member children :: ", member.children);
      // console.log("----------------------------------------");
      const normalizedMember = {
        id: member.id,
        name: member.name,
        gender: member.gender || "UNKNOWN",
        parents: member.parents || [],
        children: member.children || [],
        spouses: member.spouses || [],
        generation: member.generation || 0,
        personalInfo: member.personalInfo,
      };
      memberMap.set(member.id, normalizedMember);
    });

    // Second pass: Include spouses' family members to ensure complete representation
    console.log(
      "🔗 Including spouses' family members for complete tree representation..."
    );
    const additionalMembers = new Map<string, any>();

    for (const [memberId, member] of memberMap.entries()) {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          // Add spouse if not already in memberMap
          if (!memberMap.has(spouse.id) && !additionalMembers.has(spouse.id)) {
            console.log(`👫 Adding spouse's family member: ${spouse.name}`);
            additionalMembers.set(spouse.id, {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender || "UNKNOWN",
              parents: spouse.parents || [],
              children: spouse.children || [],
              spouses: spouse.spouses || [],
              generation: spouse.generation || 0,
              personalInfo: spouse.personalInfo,
            });
          }

          // Add spouse's parents if they exist
          if (spouse.parents && spouse.parents.length > 0) {
            spouse.parents.forEach((parent: any) => {
              if (
                !memberMap.has(parent.id) &&
                !additionalMembers.has(parent.id)
              ) {
                console.log(`👴 Adding spouse's parent: ${parent.name}`);
                additionalMembers.set(parent.id, {
                  id: parent.id,
                  name: parent.name,
                  gender: parent.gender || "UNKNOWN",
                  parents: parent.parents || [],
                  children: parent.children || [],
                  spouses: parent.spouses || [],
                  generation: parent.generation || 0,
                  personalInfo: parent.personalInfo,
                });
              }
            });
          }

          // Add spouse's children if they exist
          if (spouse.children && spouse.children.length > 0) {
            spouse.children.forEach((child: any) => {
              if (
                !memberMap.has(child.id) &&
                !additionalMembers.has(child.id)
              ) {
                console.log(`👶 Adding spouse's child: ${child.name}`);
                additionalMembers.set(child.id, {
                  id: child.id,
                  name: child.name,
                  gender: child.gender || "UNKNOWN",
                  parents: child.parents || [],
                  children: child.children || [],
                  spouses: child.spouses || [],
                  generation: child.generation || 0,
                  personalInfo: child.personalInfo,
                });
              }
            });
          }
        });
      }
    }

    // Add additional members to the main memberMap
    for (const [memberId, member] of additionalMembers.entries()) {
      memberMap.set(memberId, member);
    }

    console.log(
      `📊 Total members after including spouses' families: ${memberMap.size}`
    );

    // Normalize relationships to ensure bidirectionality
    this.normalizeRelationships(memberMap);

    console.log("📊 Total members indexed:", memberMap.size);

    // Build parent-child relationships map for easier traversal
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    members.forEach((member) => {
      // Map children to their parents
      if (member.children && member.children.length > 0) {
        parentChildMap.set(
          member.id,
          member.children.map((c: any) => c.id)
        );

        // Also map each child back to this parent
        member.children.forEach((child: any) => {
          if (!childParentMap.has(child.id)) {
            childParentMap.set(child.id, []);
          }
          childParentMap.get(child.id)!.push(member.id);
        });
      }

      // Map parents to their children
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parent: any) => {
          if (!parentChildMap.has(parent.id)) {
            parentChildMap.set(parent.id, []);
          }
          if (!parentChildMap.get(parent.id)!.includes(member.id)) {
            parentChildMap.get(parent.id)!.push(member.id);
          }
        });

        childParentMap.set(
          member.id,
          member.parents.map((p: any) => p.id)
        );
      }
    });

    // Find true root ancestors with spouse consideration
    const potentialRoots = Array.from(memberMap.values()).filter((member) => {
      const parentIds = childParentMap.get(member.id) || [];
      return parentIds.length === 0;
    });

    // Filter out members who have no parents but their spouse has parents
    const trueRoots = potentialRoots.filter((member) => {
      // If member has no spouses, they are a true root
      if (!member.spouses || member.spouses.length === 0) {
        return true;
      }

      // Check if any spouse has parents
      const hasSpouseWithParents = member.spouses.some((spouse: any) => {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) return false;

        const spouseParentIds = childParentMap.get(spouse.id) || [];
        return spouseParentIds.length > 0;
      });

      // If spouse has parents, this member is not a true root
      return !hasSpouseWithParents;
    });

    console.log(
      "👴 True root ancestors found:",
      trueRoots.map((r) => r.name)
    );

    // Group married couples at the root level
    const rootAncestors = [];
    const processedRootIds = new Set();

    trueRoots.forEach((member) => {
      if (processedRootIds.has(member.id)) return;

      // Check if this member has a spouse who is also a root
      const spouseIds = member.spouses.map((s: any) => s.id);
      const rootSpouses = spouseIds
        .map((spouseId) => memberMap.get(spouseId))
        .filter(
          (spouse) => spouse && trueRoots.some((r) => r.id === spouse.id)
        );

      if (rootSpouses.length > 0) {
        // Create a couple entry - use the male as primary if possible
        const malePartner =
          member.gender === "MALE"
            ? member
            : rootSpouses.find((s) => s.gender === "MALE");
        const primaryPartner = malePartner || member;

        rootAncestors.push(primaryPartner);
        processedRootIds.add(member.id);
        rootSpouses.forEach((spouse) => processedRootIds.add(spouse.id));
      } else {
        // Single root ancestor
        rootAncestors.push(member);
        processedRootIds.add(member.id);
      }
    });

    rootAncestors.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate generations from each root
    const generations = new Map<string, number>();

    const assignGenerations = (
      memberId: string,
      generation: number,
      visited = new Set<string>()
    ) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);

      const existingGen = generations.get(memberId);
      if (existingGen === undefined || generation < existingGen) {
        generations.set(memberId, generation);
      }

      const childIds = parentChildMap.get(memberId) || [];
      childIds.forEach((childId) => {
        if (memberMap.has(childId)) {
          assignGenerations(childId, generation + 1, new Set(visited));
        }
      });
    };

    // Assign generations starting from roots
    rootAncestors.forEach((root) => {
      assignGenerations(root.id, 0);
    });

    const processedMembers = new Set<string>();

    // Identify all couples (with or without shared children)
    const coupleChildrenMap = new Map<string, string[]>();
    const allCouplesMap = new Map<string, { spouseId: string; spouse: any }>();
    const processedCouples = new Set<string>();

    console.log("🔍 Identifying couples from members...");
    members.forEach((member) => {
      if (member.spouses && member.spouses.length > 0) {
        console.log(
          `👤 Member ${member.name} has ${member.spouses.length} spouses`
        );
        member.spouses.forEach((spouse: any) => {
          const coupleKey1 = `${member.id}_${spouse.id}`;
          const coupleKey2 = `${spouse.id}_${member.id}`;

          if (
            !processedCouples.has(coupleKey1) &&
            !processedCouples.has(coupleKey2)
          ) {
            processedCouples.add(coupleKey1);

            // Store all couples
            allCouplesMap.set(coupleKey1, { spouseId: spouse.id, spouse });
            console.log(
              `💑 Identified couple: ${member.name} + ${spouse.name}`
            );

            // Find shared children between this couple
            const memberChildren = parentChildMap.get(member.id) || [];
            const spouseChildren = parentChildMap.get(spouse.id) || [];
            const sharedChildren = memberChildren.filter((childId) =>
              spouseChildren.includes(childId)
            );

            if (sharedChildren.length > 0) {
              coupleChildrenMap.set(coupleKey1, sharedChildren);
              console.log(
                `👶 Couple has ${sharedChildren.length} shared children`
              );
            } else {
              console.log(`👶 Couple has no shared children`);
            }
          }
        });
      }
    });

    console.log(`📊 Total couples identified: ${allCouplesMap.size}`);
    console.log(`👶 Couples with shared children: ${coupleChildrenMap.size}`);

    const generateTree = (
      memberId: string,
      prefix = "",
      isLast = true,
      depth = 0
    ): string => {
      if (
        processedMembers.has(memberId) ||
        depth > 8 ||
        !memberMap.has(memberId)
      ) {
        return "";
      }

      const member = memberMap.get(memberId);
      let result = "";

      // Check if this member is part of a couple with shared children
      let handledAsCouple = false;

      for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
        const [member1Id, member2Id] = coupleKey.split("_");

        if (member1Id === memberId && !processedMembers.has(member2Id)) {
          // This member is the primary in a couple - show both partners
          processedMembers.add(member1Id);
          processedMembers.add(member2Id);

          const spouse = memberMap.get(member2Id);
          const generation = generations.get(memberId) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          const genderSymbol1 = this.getGenderSymbol(member.gender);
          const genderSymbol2 = this.getGenderSymbol(
            spouse?.gender || "UNKNOWN"
          );

          result += `${prefix}${isLast ? "└── " : "├── "}${
            member.name
          } ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

          if (relationshipLabel) {
            result += ` [${relationshipLabel}]`;
          }
          result += "\n";

          // Add shared children
          const unprocessedChildren = sharedChildIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          unprocessedChildren.forEach((child, index) => {
            const childPrefix = prefix + (isLast ? "    " : "│   ");
            const childIsLast = index === unprocessedChildren.length - 1;
            result += generateTree(
              child.id,
              childPrefix,
              childIsLast,
              depth + 1
            );
          });

          handledAsCouple = true;
          break;
        }
      }

      if (!handledAsCouple) {
        // Handle as individual member
        processedMembers.add(memberId);

        const genderSymbol = this.getGenderSymbol(member.gender);
        const generation = generations.get(memberId) || 0;
        const relationshipLabel = this.getRelationshipLabel(generation);

        result += `${prefix}${isLast ? "└── " : "├── "}${
          member.name
        } ${genderSymbol}`;

        // Add spouse information
        if (member.spouses && member.spouses.length > 0) {
          const spouseNames = member.spouses
            .filter((spouse: any) => !processedMembers.has(spouse.id))
            .map((spouse: any) => {
              const spouseGender = this.getGenderSymbol(
                spouse.gender || "UNKNOWN"
              );
              if (spouse.id) processedMembers.add(spouse.id);
              return `${spouse.name} ${spouseGender}`;
            });

          if (spouseNames.length > 0) {
            result += ` ⚭ ${spouseNames.join(" & ")}`;
          }
        }

        // Add relationship label
        if (relationshipLabel) {
          result += ` [${relationshipLabel}]`;
        }
        result += "\n";

        // Add children
        const childIds = parentChildMap.get(memberId) || [];
        const unprocessedChildren = childIds
          .filter(
            (childId) =>
              !processedMembers.has(childId) && memberMap.has(childId)
          )
          .map((childId) => memberMap.get(childId))
          .sort((a, b) => {
            const genA = generations.get(a.id) || 0;
            const genB = generations.get(b.id) || 0;
            if (genA !== genB) return genA - genB;
            return a.name.localeCompare(b.name);
          });

        unprocessedChildren.forEach((child, index) => {
          const childPrefix = prefix + (isLast ? "    " : "│   ");
          const childIsLast = index === unprocessedChildren.length - 1;
          result += generateTree(child.id, childPrefix, childIsLast, depth + 1);
        });
      }

      return result;
    };

    // Generate trees for all root ancestors
    if (rootAncestors.length > 0) {
      rootAncestors.forEach((rootAncestor, index) => {
        if (index > 0) content += "\n\n";
        content += generateTree(rootAncestor.id);
      });
    } else {
      content += "=== All Family Members (No Clear Hierarchy) ===\n";
      Array.from(memberMap.values()).forEach((member) => {
        const genderSymbol = this.getGenderSymbol(member.gender);
        content += `${member.name} ${genderSymbol}\n`;
      });
    }

    // Add any remaining unprocessed members
    const unprocessedMembers = Array.from(memberMap.values()).filter(
      (m) => !processedMembers.has(m.id)
    );

    if (unprocessedMembers.length > 0) {
      content += "\n=== Additional Family Members ===\n";
      unprocessedMembers
        .sort((a, b) => {
          const genA = generations.get(a.id) || 0;
          const genB = generations.get(b.id) || 0;
          if (genA !== genB) return genA - genB;
          return a.name.localeCompare(b.name);
        })
        .forEach((member) => {
          const genderSymbol = this.getGenderSymbol(member.gender);
          const generation = generations.get(member.id) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          content += `${member.name} ${genderSymbol}`;
          if (relationshipLabel) content += ` [${relationshipLabel}]`;
          content += "\n";
        });
    }

    // PART 2: DETAILED MEMBER INFORMATION LIST
    content += "\n\n" + "=".repeat(80) + "\n";
    content += "DETAILED FAMILY MEMBERS INFORMATION\n";
    content += "=".repeat(80) + "\n\n";
    content += `Total Members: ${members.length}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Sort members by generation, then by name
    const sortedMembers = members.sort((a, b) => {
      const genA = a.generation || 0;
      const genB = b.generation || 0;
      if (genA !== genB) return genA - genB;
      return a.name.localeCompare(b.name);
    });

    sortedMembers.forEach((member, index) => {
      content += `${index + 1}. MEMBER DETAILS\n`;
      content += "-".repeat(40) + "\n";

      // Basic Information
      content += `ID: ${member.id}\n`;
      content += `Name: ${member.name}\n`;
      content += `Gender: ${
        member.gender || "Not specified"
      } ${this.getGenderSymbol(member.gender)}\n`;
      content += `Generation: ${
        member.generation || 0
      } ${this.getRelationshipLabel(member.generation || 0)}\n`;

      // Family Relationships
      content += `\nPARENTS (${member.parents?.length || 0}):\n`;
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parent: any, idx: number) => {
          content += `  ${idx + 1}. ${parent.name} (${parent.id}) - ${
            parent.gender || "Unknown"
          } ${this.getGenderSymbol(parent.gender)}\n`;
        });
      } else {
        content += "  No parents recorded\n";
      }

      content += `\nCHILDREN (${member.children?.length || 0}):\n`;
      if (member.children && member.children.length > 0) {
        member.children.forEach((child: any, idx: number) => {
          content += `  ${idx + 1}. ${child.name} (${child.id}) - ${
            child.gender || "Unknown"
          } ${this.getGenderSymbol(child.gender)}\n`;
        });
      } else {
        content += "  No children recorded\n";
      }

      content += `\nSPOUSES (${member.spouses?.length || 0}):\n`;
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any, idx: number) => {
          content += `  ${idx + 1}. ${spouse.name} (${spouse.id}) - ${
            spouse.gender || "Unknown"
          } ${this.getGenderSymbol(spouse.gender)}\n`;
        });
      } else {
        content += "  No spouses recorded\n";
      }

      // Personal Information (if available and requested)
      if (exportRequest.includeData.personalInfo && member.personalInfo) {
        content += `\nPERSONAL INFORMATION:\n`;
        const info = member.personalInfo as any;

        if (info.bio) content += `  Bio: ${info.bio}\n`;
        if (info.birthDate) content += `  Birth Date: ${info.birthDate}\n`;
        if (info.birthPlace) content += `  Birth Place: ${info.birthPlace}\n`;
        if (info.deathDate) content += `  Death Date: ${info.deathDate}\n`;
        if (info.deathPlace) content += `  Death Place: ${info.deathPlace}\n`;
        if (info.occupation) content += `  Occupation: ${info.occupation}\n`;
        if (info.education) content += `  Education: ${info.education}\n`;
        if (info.nationality) content += `  Nationality: ${info.nationality}\n`;
        if (info.religion) content += `  Religion: ${info.religion}\n`;
      }

      // Contact Information (if available and requested)
      if (exportRequest.includeData.contactInfo && member.personalInfo) {
        content += `\nCONTACT INFORMATION:\n`;
        const info = member.personalInfo as any;

        if (info.phone) content += `  Phone: ${info.phone}\n`;
        if (info.email) content += `  Email: ${info.email}\n`;
        if (info.address) content += `  Address: ${info.address}\n`;
        if (info.emergencyContact)
          content += `  Emergency Contact: ${info.emergencyContact}\n`;
      }

      // Profile Images (if available and requested)
      if (exportRequest.includeData.profileImages && member.personalInfo) {
        content += `\nPROFILE IMAGES:\n`;
        const info = member.personalInfo as any;

        if (info.profileImageUrl)
          content += `  Profile Image: ${info.profileImageUrl}\n`;
        if (info.additionalImages && Array.isArray(info.additionalImages)) {
          info.additionalImages.forEach((image: string, idx: number) => {
            content += `  Additional Image ${idx + 1}: ${image}\n`;
          });
        }
      }

      content += "\n" + "=".repeat(80) + "\n\n";
    });

    // SUMMARY STATISTICS
    content += "SUMMARY STATISTICS\n";
    content += "-".repeat(40) + "\n";

    const genderStats = {
      male: members.filter((m) => m.gender === "MALE").length,
      female: members.filter((m) => m.gender === "FEMALE").length,
      other: members.filter(
        (m) => m.gender === "OTHER" || m.gender === "PREFER_NOT_TO_SAY"
      ).length,
      unspecified: members.filter((m) => !m.gender).length,
    };

    content += `Total Members: ${members.length}\n`;
    content += `Male: ${genderStats.male}\n`;
    content += `Female: ${genderStats.female}\n`;
    content += `Other/Unspecified: ${
      genderStats.other + genderStats.unspecified
    }\n`;

    // Generation breakdown
    const generationStats = new Map<number, number>();
    members.forEach((member) => {
      const gen = member.generation || 0;
      generationStats.set(gen, (generationStats.get(gen) || 0) + 1);
    });

    content += `\nGeneration Breakdown:\n`;
    Array.from(generationStats.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([gen, count]) => {
        const label = this.getRelationshipLabel(gen);
        content += `  Generation ${gen} (${label}): ${count} members\n`;
      });

    // Relationship statistics
    const totalParents = members.reduce(
      (sum, m) => sum + (m.parents?.length || 0),
      0
    );
    const totalChildren = members.reduce(
      (sum, m) => sum + (m.children?.length || 0),
      0
    );
    const totalSpouses = members.reduce(
      (sum, m) => sum + (m.spouses?.length || 0),
      0
    );

    content += `\nRelationship Statistics:\n`;
    content += `Total Parent Relationships: ${totalParents}\n`;
    content += `Total Child Relationships: ${totalChildren}\n`;
    content += `Total Spouse Relationships: ${totalSpouses}\n`;
    content += `Average Children per Member: ${(
      totalChildren / members.length
    ).toFixed(2)}\n`;

    console.log(
      "✅ Combined tree and member list generation completed, content length:",
      content.length
    );
    return content;
  }

  private findRootAncestors(allMembers: any[]): any[] {
    // Find members with no parents (true root ancestors)
    const rootCandidates = allMembers.filter(
      (member) => !member.parents || member.parents.length === 0
    );

    if (rootCandidates.length > 0) {
      // Sort by name for consistent ordering
      return rootCandidates.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fallback: if circular references exist, find members with the fewest parents
    const membersByParentCount = allMembers
      .map((member) => ({
        ...member,
        parentCount: member.parents?.length || 0,
      }))
      .sort((a, b) => {
        if (a.parentCount !== b.parentCount)
          return a.parentCount - b.parentCount;
        return a.name.localeCompare(b.name);
      });

    // Take the first few members with minimal parent counts
    const minParentCount = membersByParentCount[0]?.parentCount || 0;
    return membersByParentCount.filter(
      (member) => member.parentCount === minParentCount
    );
  }

  private calculateProperGenerations(
    allMembers: any[],
    rootAncestors: any[]
  ): Map<string, number> {
    const generations = new Map<string, number>();
    const visited = new Set<string>();

    const assignGeneration = (memberId: string, generation: number): void => {
      if (visited.has(memberId)) return;

      visited.add(memberId);
      const existingGen = generations.get(memberId);

      // Use the generation closest to 0 to avoid extreme values
      if (
        existingGen === undefined ||
        Math.abs(generation) < Math.abs(existingGen)
      ) {
        generations.set(memberId, generation);
      }
    };

    // Start BFS from each root ancestor
    rootAncestors.forEach((root) => {
      const queue: { memberId: string; generation: number }[] = [
        { memberId: root.id, generation: 0 },
      ];
      const localVisited = new Set<string>();

      while (queue.length > 0) {
        const { memberId, generation } = queue.shift()!;

        if (localVisited.has(memberId)) continue;
        localVisited.add(memberId);

        assignGeneration(memberId, generation);

        const member = allMembers.find((m) => m.id === memberId);
        if (!member) continue;

        // Add children to next generation
        member.children?.forEach((child: any) => {
          if (!localVisited.has(child.id)) {
            queue.push({ memberId: child.id, generation: generation + 1 });
          }
        });

        // Add spouses to same generation
        member.spouses?.forEach((spouse: any) => {
          if (!localVisited.has(spouse.id)) {
            queue.push({ memberId: spouse.id, generation: generation });
          }
        });
      }
    });

    // Handle any remaining unprocessed members
    allMembers.forEach((member) => {
      if (!generations.has(member.id)) {
        // Assign based on average generation of known relatives
        let avgGeneration = 0;
        let relativeCount = 0;

        member.parents?.forEach((parent: any) => {
          const parentGen = generations.get(parent.id);
          if (parentGen !== undefined) {
            avgGeneration += parentGen - 1; // Child is one generation after parent
            relativeCount++;
          }
        });

        member.children?.forEach((child: any) => {
          const childGen = generations.get(child.id);
          if (childGen !== undefined) {
            avgGeneration += childGen + 1; // Parent is one generation before child
            relativeCount++;
          }
        });

        if (relativeCount > 0) {
          generations.set(member.id, Math.round(avgGeneration / relativeCount));
        } else {
          generations.set(member.id, 0); // Default generation
        }
      }
    });

    return generations;
  }

  private getGenderSymbol(gender: string): string {
    switch (gender?.toUpperCase()) {
      case "MALE":
        return "♂";
      case "FEMALE":
        return "♀";
      default:
        return "⚲"; // Gender-neutral symbol
    }
  }

  private calculateGenerations(member: any): Map<string, number> {
    // This method is kept for compatibility but uses the new proper calculation
    const allMembers = [member];
    const rootAncestors = this.findRootAncestors(allMembers);
    return this.calculateProperGenerations(allMembers, rootAncestors);
  }

  private getSpouseText(member: any, spouseMap: Map<string, any[]>): string {
    const spouses = spouseMap.get(member.id) || [];
    if (spouses.length === 0) return "";

    const spouseNames = spouses.map((spouse) => {
      const genderSymbol = spouse.gender === "MALE" ? "♂" : "♀";
      return `${spouse.name} ${genderSymbol}`;
    });

    return `⚭ ${spouseNames.join(" & ")}`;
  }

  private getRelationshipLabel(generation: number): string {
    // Return simple generation numbers
    return `Generation ${generation}`;
  }

  private normalizeRelationships(memberMap: Map<string, any>): void {
    console.log("🔄 Normalizing spouse relationships for bidirectionality...");

    // Simple approach: loop through each member's spouses and ensure bidirectionality
    for (const [memberId, member] of memberMap.entries()) {
      if (!member.spouses || member.spouses.length === 0) continue;

      // Loop through each spouse of this member
      for (const spouse of member.spouses) {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) continue;

        // Check if this member is in the spouse's spouse list
        const hasReciprocalRelationship = spouseMember.spouses?.some(
          (s: any) => s.id === memberId
        );

        // If not, add this member to the spouse's spouse list
        if (!hasReciprocalRelationship) {
          console.log(
            `🔗 Adding missing spouse relationship: ${member.name} ↔ ${spouseMember.name}`
          );

          if (!spouseMember.spouses) {
            spouseMember.spouses = [];
          }

          spouseMember.spouses.push({
            id: member.id,
            name: member.name,
            gender: member.gender,
          });
        }
      }
    }

    console.log("✅ Spouse relationship normalization completed");
  }

  private generateExcelTreeFormatWithIds(
    members: any[],
    exportRequest: ExportRequest
  ): {
    column: number;
    value: string;
    memberIds: { id: string; name: string; gender: string }[];
  }[] {
    console.log(
      "🔍 Starting generateExcelTreeFormatWithIds with members:",
      members.length
    );

    const treeData: {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[] = [];

    // Build proper family tree using existing relationships from database
    const memberMap = new Map<string, any>();

    // First pass: Index all members by ID and normalize data
    members.forEach((member) => {
      const normalizedMember = {
        id: member.id,
        name: member.name,
        gender: member.gender || "UNKNOWN",
        parents: member.parents || [],
        children: member.children || [],
        spouses: member.spouses || [],
        generation: member.generation || 0,
        personalInfo: member.personalInfo,
      };
      memberMap.set(member.id, normalizedMember);
    });

    // Second pass: Include spouses' family members to ensure complete representation
    console.log(
      "🔗 Including spouses' family members for complete tree representation..."
    );
    const additionalMembers = new Map<string, any>();

    for (const [memberId, member] of memberMap.entries()) {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          // Add spouse if not already in memberMap
          if (!memberMap.has(spouse.id) && !additionalMembers.has(spouse.id)) {
            console.log(`👫 Adding spouse's family member: ${spouse.name}`);
            additionalMembers.set(spouse.id, {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender || "UNKNOWN",
              parents: spouse.parents || [],
              children: spouse.children || [],
              spouses: spouse.spouses || [],
              generation: spouse.generation || 0,
              personalInfo: spouse.personalInfo,
            });
          }
        });
      }
    }

    // Add additional members to the main memberMap
    for (const [memberId, member] of additionalMembers.entries()) {
      memberMap.set(memberId, member);
    }

    console.log(
      `📊 Total members after including spouses' families: ${memberMap.size}`
    );

    // Normalize relationships to ensure bidirectionality
    this.normalizeRelationships(memberMap);

    console.log("📊 Total members indexed:", memberMap.size);

    // Build parent-child relationships map for easier traversal
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    members.forEach((member) => {
      // Map children to their parents
      if (member.children && member.children.length > 0) {
        parentChildMap.set(
          member.id,
          member.children.map((c: any) => c.id)
        );

        // Also map each child back to this parent
        member.children.forEach((child: any) => {
          if (!childParentMap.has(child.id)) {
            childParentMap.set(child.id, []);
          }
          childParentMap.get(child.id)!.push(member.id);
        });
      }

      // Map parents to their children
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parent: any) => {
          if (!parentChildMap.has(parent.id)) {
            parentChildMap.set(parent.id, []);
          }
          if (!parentChildMap.get(parent.id)!.includes(member.id)) {
            parentChildMap.get(parent.id)!.push(member.id);
          }
        });

        childParentMap.set(
          member.id,
          member.parents.map((p: any) => p.id)
        );
      }
    });

    // Find true root ancestors with spouse consideration
    const potentialRoots = Array.from(memberMap.values()).filter((member) => {
      const parentIds = childParentMap.get(member.id) || [];
      return parentIds.length === 0;
    });

    // Filter out members who have no parents but their spouse has parents
    const trueRoots = potentialRoots.filter((member) => {
      // If member has no spouses, they are a true root
      if (!member.spouses || member.spouses.length === 0) {
        return true;
      }

      // Check if any spouse has parents
      const hasSpouseWithParents = member.spouses.some((spouse: any) => {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) return false;

        const spouseParentIds = childParentMap.get(spouse.id) || [];
        return spouseParentIds.length > 0;
      });

      // If spouse has parents, this member is not a true root
      return !hasSpouseWithParents;
    });

    console.log(
      "👴 True root ancestors found:",
      trueRoots.map((r) => r.name)
    );

    // Group married couples at the root level
    const rootAncestors = [];
    const processedRootIds = new Set();

    trueRoots.forEach((member) => {
      if (processedRootIds.has(member.id)) return;

      // Check if this member has a spouse who is also a root
      const spouseIds = member.spouses.map((s: any) => s.id);
      const rootSpouses = spouseIds
        .map((spouseId) => memberMap.get(spouseId))
        .filter(
          (spouse) => spouse && trueRoots.some((r) => r.id === spouse.id)
        );

      if (rootSpouses.length > 0) {
        // Create a couple entry - use the male as primary if possible
        const malePartner =
          member.gender === "MALE"
            ? member
            : rootSpouses.find((s) => s.gender === "MALE");
        const primaryPartner = malePartner || member;

        rootAncestors.push(primaryPartner);
        processedRootIds.add(member.id);
        rootSpouses.forEach((spouse) => processedRootIds.add(spouse.id));
      } else {
        // Single root ancestor
        rootAncestors.push(member);
        processedRootIds.add(member.id);
      }
    });

    rootAncestors.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate generations from each root
    const generations = new Map<string, number>();

    const assignGenerations = (
      memberId: string,
      generation: number,
      visited = new Set<string>()
    ) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);

      const existingGen = generations.get(memberId);
      if (existingGen === undefined || generation < existingGen) {
        generations.set(memberId, generation);
      }

      const childIds = parentChildMap.get(memberId) || [];
      childIds.forEach((childId) => {
        if (memberMap.has(childId)) {
          assignGenerations(childId, generation + 1, new Set(visited));
        }
      });
    };

    // Assign generations starting from roots
    rootAncestors.forEach((root) => {
      assignGenerations(root.id, 0);
    });

    const processedMembers = new Set<string>();

    // Identify all couples (with or without shared children)
    const coupleChildrenMap = new Map<string, string[]>();
    const allCouplesMap = new Map<string, { spouseId: string; spouse: any }>();
    const processedCouples = new Set<string>();

    console.log("🔍 Identifying couples from members...");
    members.forEach((member) => {
      if (member.spouses && member.spouses.length > 0) {
        console.log(
          `👤 Member ${member.name} has ${member.spouses.length} spouses`
        );
        member.spouses.forEach((spouse: any) => {
          const coupleKey1 = `${member.id}_${spouse.id}`;
          const coupleKey2 = `${spouse.id}_${member.id}`;

          if (
            !processedCouples.has(coupleKey1) &&
            !processedCouples.has(coupleKey2)
          ) {
            processedCouples.add(coupleKey1);

            // Store all couples
            allCouplesMap.set(coupleKey1, { spouseId: spouse.id, spouse });
            console.log(
              `💑 Identified couple: ${member.name} + ${spouse.name}`
            );

            // Find shared children between this couple
            const memberChildren = parentChildMap.get(member.id) || [];
            const spouseChildren = parentChildMap.get(spouse.id) || [];
            const sharedChildren = memberChildren.filter((childId) =>
              spouseChildren.includes(childId)
            );

            if (sharedChildren.length > 0) {
              coupleChildrenMap.set(coupleKey1, sharedChildren);
              console.log(
                `👶 Couple has ${sharedChildren.length} shared children`
              );
            } else {
              console.log(`👶 Couple has no shared children`);
            }
          }
        });
      }
    });

    console.log(`📊 Total couples identified: ${allCouplesMap.size}`);
    console.log(`👶 Couples with shared children: ${coupleChildrenMap.size}`);

    const generateTree = (
      memberId: string,
      generation = 0,
      depth = 0
    ): {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[] => {
      console.log(
        `🌲 Traversing member: ${
          memberMap.get(memberId)?.name
        } (Gen ${generation}, depth ${depth})`
      );

      if (
        processedMembers.has(memberId) ||
        depth > 8 ||
        !memberMap.has(memberId)
      ) {
        console.log(
          `🚫 Skipping ${
            memberMap.get(memberId)?.name
          } - already processed or invalid`
        );
        return [];
      }

      const member = memberMap.get(memberId);
      const result: {
        column: number;
        value: string;
        memberIds: { id: string; name: string; gender: string }[];
      }[] = [];

      // Check if this member is part of any couple (with or without shared children)
      let handledAsCouple = false;

      // First check couples with shared children
      for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
        const [member1Id, member2Id] = coupleKey.split("_");

        if (member1Id === memberId && !processedMembers.has(member2Id)) {
          console.log(
            `💑 Found couple with children: ${member.name} + ${
              memberMap.get(member2Id)?.name
            }`
          );
          console.log(
            `👶 Shared children: ${sharedChildIds
              .map((id) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          // This member is the primary in a couple - show both partners
          processedMembers.add(member1Id);
          processedMembers.add(member2Id);

          const spouse = memberMap.get(member2Id);
          const relationshipLabel = this.getRelationshipLabel(generation);

          const genderSymbol1 = this.getGenderSymbol(member.gender);
          const genderSymbol2 = this.getGenderSymbol(
            spouse?.gender || "UNKNOWN"
          );

          let value = `${member.name} ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }
          const coupleMemberIds = [
            { id: member.id, name: member.name, gender: member.gender },
            { id: spouse.id, name: spouse.name, gender: spouse.gender },
          ];
          console.log(`👫 COUPLE WITH CHILDREN: ${value}`);
          console.log(
            `👫 Member IDs:`,
            coupleMemberIds.map((m) => `${m.name} (${m.id})`)
          );
          console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

          result.push({
            column: generation,
            value,
            memberIds: coupleMemberIds,
          });

          // Add shared children
          const unprocessedChildren = sharedChildIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} shared children`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });

          handledAsCouple = true;
          break;
        }
      }

      // If not handled as couple with children, check all couples
      if (!handledAsCouple) {
        for (const [coupleKey, coupleData] of allCouplesMap.entries()) {
          const [member1Id, member2Id] = coupleKey.split("_");

          if (member1Id === memberId && !processedMembers.has(member2Id)) {
            console.log(
              `💑 Found couple without children: ${member.name} + ${
                memberMap.get(member2Id)?.name
              }`
            );

            // This member is part of a couple - show both partners
            processedMembers.add(member1Id);
            processedMembers.add(member2Id);

            const spouse = memberMap.get(member2Id);
            const relationshipLabel = this.getRelationshipLabel(generation);

            const genderSymbol1 = this.getGenderSymbol(member.gender);
            const genderSymbol2 = this.getGenderSymbol(
              spouse?.gender || "UNKNOWN"
            );

            let value = `${member.name} ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }
            const coupleMemberIds = [
              { id: member.id, name: member.name, gender: member.gender },
              { id: spouse.id, name: spouse.name, gender: spouse.gender },
            ];
            console.log(`👫 COUPLE WITHOUT CHILDREN: ${value}`);
            console.log(
              `👫 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Add children from both partners
            const allChildren = new Set([
              ...(parentChildMap.get(member1Id) || []),
              ...(parentChildMap.get(member2Id) || []),
            ]);

            console.log(
              `👶 All children from both partners: ${Array.from(allChildren)
                .map((id) => memberMap.get(id)?.name)
                .join(", ")}`
            );

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} children from both partners`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            handledAsCouple = true;
            break;
          }
        }
      }

      if (!handledAsCouple) {
        // Check if this member has an unprocessed spouse - if so, create a couple entry
        let spouseHandled = false;
        if (member.spouses && member.spouses.length > 0) {
          const unprocessedSpouses = member.spouses.filter(
            (spouse: any) =>
              !processedMembers.has(spouse.id) && memberMap.has(spouse.id)
          );

          if (unprocessedSpouses.length > 0) {
            // Create a couple entry for this member and their spouse
            const spouse = unprocessedSpouses[0]; // Take the first unprocessed spouse
            const spouseMember = memberMap.get(spouse.id);

            console.log(
              `💑 Creating couple entry for: ${member.name} + ${spouseMember?.name}`
            );

            processedMembers.add(memberId);
            processedMembers.add(spouse.id);

            const genderSymbol1 = this.getGenderSymbol(member.gender);
            const genderSymbol2 = this.getGenderSymbol(
              spouseMember?.gender || "UNKNOWN"
            );
            const relationshipLabel = this.getRelationshipLabel(generation);

            let value = `${member.name} ${genderSymbol1} ⚭ ${spouseMember?.name} ${genderSymbol2}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }

            const coupleMemberIds = [
              { id: member.id, name: member.name, gender: member.gender },
              { id: spouse.id, name: spouse.name, gender: spouse.gender },
            ];

            console.log(`👫 COUPLE ENTRY: ${value}`);
            console.log(
              `👫 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Add children from both partners
            const allChildren = new Set([
              ...(parentChildMap.get(memberId) || []),
              ...(parentChildMap.get(spouse.id) || []),
            ]);

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} children from couple`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            spouseHandled = true;
          }
        }

        if (!spouseHandled) {
          console.log(`👤 Processing individual member: ${member.name}`);
          // Handle as individual member
          processedMembers.add(memberId);

          const genderSymbol = this.getGenderSymbol(member.gender);
          const relationshipLabel = this.getRelationshipLabel(generation);

          let value = `${member.name} ${genderSymbol}`;

          // Add spouse information for display (but spouses already processed)
          if (member.spouses && member.spouses.length > 0) {
            const spouseNames = member.spouses
              .filter((spouse: any) => processedMembers.has(spouse.id)) // Only show already processed spouses
              .map((spouse: any) => {
                const spouseGender = this.getGenderSymbol(
                  spouse.gender || "UNKNOWN"
                );
                return `${spouse.name} ${spouseGender}`;
              });

            if (spouseNames.length > 0) {
              value += ` ⚭ ${spouseNames.join(" & ")}`;
            }
          }

          // Add relationship label
          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }

          result.push({
            column: generation,
            value,
            memberIds: [
              { id: member.id, name: member.name, gender: member.gender },
            ],
          });

          // Add children
          const childIds = parentChildMap.get(memberId) || [];
          console.log(
            `👶 Individual member ${member.name} has ${
              childIds.length
            } children: ${childIds
              .map((id) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          const unprocessedChildren = childIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} unprocessed children for ${member.name}`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });
        }
      }

      return result;
    };

    console.log("🌳 Starting tree generation for root ancestors...");
    console.log(
      "👴 Root ancestors:",
      rootAncestors.map((r) => `${r.name} (Gen ${generations.get(r.id) || 0})`)
    );

    // Generate trees for all root ancestors
    if (rootAncestors.length > 0) {
      rootAncestors.forEach((rootAncestor, index) => {
        console.log(
          `🌲 Processing root ancestor ${index + 1}: ${rootAncestor.name}`
        );
        if (index > 0) {
          treeData.push({ column: 0, value: "", memberIds: [] }); // Empty line between trees
        }
        const treeEntries = generateTree(rootAncestor.id);
        console.log(
          `📄 Generated ${treeEntries.length} tree entries for ${rootAncestor.name}`
        );
        treeData.push(...treeEntries);
      });
    } else {
      treeData.push({
        column: 0,
        value: "=== All Family Members (No Clear Hierarchy) ===",
        memberIds: [],
      });
      Array.from(memberMap.values()).forEach((member) => {
        const genderSymbol = this.getGenderSymbol(member.gender);
        treeData.push({
          column: 0,
          value: `${member.name} ${genderSymbol}`,
          memberIds: [
            { id: member.id, name: member.name, gender: member.gender },
          ],
        });
      });
    }

    // Add any remaining unprocessed members
    const unprocessedMembers = Array.from(memberMap.values()).filter(
      (m) => !processedMembers.has(m.id)
    );

    if (unprocessedMembers.length > 0) {
      treeData.push({ column: 0, value: "", memberIds: [] });
      treeData.push({
        column: 0,
        value: "=== Additional Family Members ===",
        memberIds: [],
      });
      unprocessedMembers
        .sort((a, b) => {
          const genA = generations.get(a.id) || 0;
          const genB = generations.get(b.id) || 0;
          if (genA !== genB) return genA - genB;
          return a.name.localeCompare(b.name);
        })
        .forEach((member) => {
          const genderSymbol = this.getGenderSymbol(member.gender);
          const generation = generations.get(member.id) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          let value = `${member.name} ${genderSymbol}`;
          if (relationshipLabel) value += ` [${relationshipLabel}]`;
          treeData.push({
            column: generation,
            value,
            memberIds: [
              { id: member.id, name: member.name, gender: member.gender },
            ],
          });
        });
    }

    console.log(
      "✅ Excel tree generation with IDs completed, entries:",
      treeData.length
    );
    return treeData;
  }

  private generateFamilyExcelTreeFormatWithIds(
    allMembers: any[],
    targetFamilyMembers: any[],
    exportRequest: ExportRequest
  ): {
    column: number;
    value: string;
    memberIds: { id: string; name: string; gender: string }[];
  }[] {
    console.log(
      "🔍 Starting generateFamilyExcelTreeFormatWithIds with target family members:",
      targetFamilyMembers.length,
      "and all members:",
      allMembers.length
    );

    const treeData: {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[] = [];

    // Build proper family tree using existing relationships from database
    const memberMap = new Map<string, any>();

    // First pass: Index all members by ID and normalize data
    allMembers.forEach((member) => {
      const normalizedMember = {
        id: member.id,
        name: member.name,
        gender: member.gender || "UNKNOWN",
        parents: member.parents || [],
        children: member.children || [],
        spouses: member.spouses || [],
        generation: member.generation || 0,
        personalInfo: member.personalInfo,
      };
      memberMap.set(member.id, normalizedMember);
    });

    // Second pass: Include spouses' family members to ensure complete representation
    console.log(
      "🔗 Including spouses' family members for complete tree representation..."
    );
    const additionalMembers = new Map<string, any>();

    for (const [memberId, member] of memberMap.entries()) {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          // Add spouse if not already in memberMap
          if (!memberMap.has(spouse.id) && !additionalMembers.has(spouse.id)) {
            console.log(`👫 Adding spouse's family member: ${spouse.name}`);
            additionalMembers.set(spouse.id, {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender || "UNKNOWN",
              parents: spouse.parents || [],
              children: spouse.children || [],
              spouses: spouse.spouses || [],
              generation: spouse.generation || 0,
              personalInfo: spouse.personalInfo,
            });
          }
        });
      }
    }

    // Add additional members to the main memberMap
    for (const [memberId, member] of additionalMembers.entries()) {
      memberMap.set(memberId, member);
    }

    console.log(
      `📊 Total members after including spouses' families: ${memberMap.size}`
    );

    // Normalize relationships to ensure bidirectionality
    this.normalizeRelationships(memberMap);

    console.log("📊 Total members indexed:", memberMap.size);

    // Build parent-child relationships map for easier traversal
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    allMembers.forEach((member) => {
      // Map children to their parents
      if (member.children && member.children.length > 0) {
        parentChildMap.set(
          member.id,
          member.children.map((c: any) => c.id)
        );

        // Also map each child back to this parent
        member.children.forEach((child: any) => {
          if (!childParentMap.has(child.id)) {
            childParentMap.set(child.id, []);
          }
          childParentMap.get(child.id)!.push(member.id);
        });
      }

      // Map parents to their children
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parent: any) => {
          if (!parentChildMap.has(parent.id)) {
            parentChildMap.set(parent.id, []);
          }
          if (!parentChildMap.get(parent.id)!.includes(member.id)) {
            parentChildMap.get(parent.id)!.push(member.id);
          }
        });

        childParentMap.set(
          member.id,
          member.parents.map((p: any) => p.id)
        );
      }
    });

    // Find true root ancestors with spouse consideration - but only from target family
    const targetFamilyMemberIds = new Set(targetFamilyMembers.map((m) => m.id));
    const potentialRoots = Array.from(memberMap.values()).filter((member) => {
      // Only consider members from the target family as potential roots
      if (!targetFamilyMemberIds.has(member.id)) return false;

      const parentIds = childParentMap.get(member.id) || [];
      return parentIds.length === 0;
    });

    // Filter out members who have no parents but their spouse has parents
    const trueRoots = potentialRoots.filter((member) => {
      // If member has no spouses, they are a true root
      if (!member.spouses || member.spouses.length === 0) {
        return true;
      }

      // Check if any spouse has parents
      const hasSpouseWithParents = member.spouses.some((spouse: any) => {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) return false;

        const spouseParentIds = childParentMap.get(spouse.id) || [];
        return spouseParentIds.length > 0;
      });

      // If spouse has parents, this member is not a true root
      return !hasSpouseWithParents;
    });

    console.log(
      "👴 True root ancestors found (from target family):",
      trueRoots.map((r) => r.name)
    );

    // Group married couples at the root level
    const rootAncestors = [];
    const processedRootIds = new Set();

    trueRoots.forEach((member) => {
      if (processedRootIds.has(member.id)) return;

      // Check if this member has a spouse who is also a root
      const spouseIds = member.spouses.map((s: any) => s.id);
      const rootSpouses = spouseIds
        .map((spouseId) => memberMap.get(spouseId))
        .filter(
          (spouse) => spouse && trueRoots.some((r) => r.id === spouse.id)
        );

      if (rootSpouses.length > 0) {
        // Create a couple entry - use the male as primary if possible
        const malePartner =
          member.gender === "MALE"
            ? member
            : rootSpouses.find((s) => s.gender === "MALE");
        const primaryPartner = malePartner || member;

        rootAncestors.push(primaryPartner);
        processedRootIds.add(member.id);
        rootSpouses.forEach((spouse) => processedRootIds.add(spouse.id));
      } else {
        // Single root ancestor
        rootAncestors.push(member);
        processedRootIds.add(member.id);
      }
    });

    rootAncestors.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate generations from each root
    const generations = new Map<string, number>();

    const assignGenerations = (
      memberId: string,
      generation: number,
      visited = new Set<string>()
    ) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);

      const existingGen = generations.get(memberId);
      if (existingGen === undefined || generation < existingGen) {
        generations.set(memberId, generation);
      }

      const childIds = parentChildMap.get(memberId) || [];
      childIds.forEach((childId) => {
        if (memberMap.has(childId)) {
          assignGenerations(childId, generation + 1, new Set(visited));
        }
      });
    };

    // Assign generations starting from roots
    rootAncestors.forEach((root) => {
      assignGenerations(root.id, 0);
    });

    const processedMembers = new Set<string>();

    // Identify all couples (with or without shared children)
    const coupleChildrenMap = new Map<string, string[]>();
    const allCouplesMap = new Map<string, { spouseId: string; spouse: any }>();
    const processedCouples = new Set<string>();

    console.log("🔍 Identifying couples from members...");
    allMembers.forEach((member) => {
      if (member.spouses && member.spouses.length > 0) {
        console.log(
          `👤 Member ${member.name} has ${member.spouses.length} spouses`
        );
        member.spouses.forEach((spouse: any) => {
          const coupleKey1 = `${member.id}_${spouse.id}`;
          const coupleKey2 = `${spouse.id}_${member.id}`;

          if (
            !processedCouples.has(coupleKey1) &&
            !processedCouples.has(coupleKey2)
          ) {
            processedCouples.add(coupleKey1);

            // Store all couples
            allCouplesMap.set(coupleKey1, { spouseId: spouse.id, spouse });
            console.log(
              `💑 Identified couple: ${member.name} + ${spouse.name}`
            );

            // Find shared children between this couple
            const memberChildren = parentChildMap.get(member.id) || [];
            const spouseChildren = parentChildMap.get(spouse.id) || [];
            const sharedChildren = memberChildren.filter((childId) =>
              spouseChildren.includes(childId)
            );

            if (sharedChildren.length > 0) {
              coupleChildrenMap.set(coupleKey1, sharedChildren);
              console.log(
                `👶 Couple has ${sharedChildren.length} shared children`
              );
            } else {
              console.log(`👶 Couple has no shared children`);
            }
          }
        });
      }
    });

    console.log(`📊 Total couples identified: ${allCouplesMap.size}`);
    console.log(`👶 Couples with shared children: ${coupleChildrenMap.size}`);

    const generateTree = (
      memberId: string,
      generation = 0,
      depth = 0
    ): {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[] => {
      console.log(
        `🌲 Traversing member: ${
          memberMap.get(memberId)?.name
        } (Gen ${generation}, depth ${depth})`
      );

      if (
        processedMembers.has(memberId) ||
        depth > 8 ||
        !memberMap.has(memberId)
      ) {
        console.log(
          `🚫 Skipping ${
            memberMap.get(memberId)?.name
          } - already processed or invalid`
        );
        return [];
      }

      const member = memberMap.get(memberId);
      const result: {
        column: number;
        value: string;
        memberIds: { id: string; name: string; gender: string }[];
      }[] = [];

      // Check if this member is part of any couple (with or without shared children)
      let handledAsCouple = false;

      // First check couples with shared children
      for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
        const [member1Id, member2Id] = coupleKey.split("_");

        if (member1Id === memberId && !processedMembers.has(member2Id)) {
          console.log(
            `💑 Found couple with children: ${member.name} + ${
              memberMap.get(member2Id)?.name
            }`
          );
          console.log(
            `👶 Shared children: ${sharedChildIds
              .map((id) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          // This member is the primary in a couple - show both partners
          processedMembers.add(member1Id);
          processedMembers.add(member2Id);

          const spouse = memberMap.get(member2Id);
          const relationshipLabel = this.getRelationshipLabel(generation);

          const genderSymbol1 = this.getGenderSymbol(member.gender);
          const genderSymbol2 = this.getGenderSymbol(
            spouse?.gender || "UNKNOWN"
          );

          let value = `${member.name} ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }
          const coupleMemberIds = [
            { id: member.id, name: member.name, gender: member.gender },
            { id: spouse.id, name: spouse.name, gender: spouse.gender },
          ];
          console.log(`👫 COUPLE WITH CHILDREN: ${value}`);
          console.log(
            `👫 Member IDs:`,
            coupleMemberIds.map((m) => `${m.name} (${m.id})`)
          );
          console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

          result.push({
            column: generation,
            value,
            memberIds: coupleMemberIds,
          });

          // Add shared children
          const unprocessedChildren = sharedChildIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} shared children`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });

          handledAsCouple = true;
          break;
        }
      }

      // If not handled as couple with children, check all couples
      if (!handledAsCouple) {
        for (const [coupleKey, coupleData] of allCouplesMap.entries()) {
          const [member1Id, member2Id] = coupleKey.split("_");

          if (member1Id === memberId && !processedMembers.has(member2Id)) {
            console.log(
              `💑 Found couple without children: ${member.name} + ${
                memberMap.get(member2Id)?.name
              }`
            );

            // This member is part of a couple - show both partners
            processedMembers.add(member1Id);
            processedMembers.add(member2Id);

            const spouse = memberMap.get(member2Id);
            const relationshipLabel = this.getRelationshipLabel(generation);

            const genderSymbol1 = this.getGenderSymbol(member.gender);
            const genderSymbol2 = this.getGenderSymbol(
              spouse?.gender || "UNKNOWN"
            );

            let value = `${member.name} ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }
            const coupleMemberIds = [
              { id: member.id, name: member.name, gender: member.gender },
              { id: spouse.id, name: spouse.name, gender: spouse.gender },
            ];
            console.log(`👫 COUPLE WITHOUT CHILDREN: ${value}`);
            console.log(
              `👫 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Add children from both partners
            const allChildren = new Set([
              ...(parentChildMap.get(member1Id) || []),
              ...(parentChildMap.get(member2Id) || []),
            ]);

            console.log(
              `👶 All children from both partners: ${Array.from(allChildren)
                .map((id) => memberMap.get(id)?.name)
                .join(", ")}`
            );

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} children from both partners`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            handledAsCouple = true;
            break;
          }
        }
      }

      if (!handledAsCouple) {
        // Check if this member has an unprocessed spouse - if so, create a couple entry
        let spouseHandled = false;
        if (member.spouses && member.spouses.length > 0) {
          const unprocessedSpouses = member.spouses.filter(
            (spouse: any) =>
              !processedMembers.has(spouse.id) && memberMap.has(spouse.id)
          );

          if (unprocessedSpouses.length > 0) {
            // Create a couple entry for this member and their spouse
            const spouse = unprocessedSpouses[0]; // Take the first unprocessed spouse
            const spouseMember = memberMap.get(spouse.id);

            console.log(
              `💑 Creating couple entry for: ${member.name} + ${spouseMember?.name}`
            );

            processedMembers.add(memberId);
            processedMembers.add(spouse.id);

            const genderSymbol1 = this.getGenderSymbol(member.gender);
            const genderSymbol2 = this.getGenderSymbol(
              spouseMember?.gender || "UNKNOWN"
            );
            const relationshipLabel = this.getRelationshipLabel(generation);

            let value = `${member.name} ${genderSymbol1} ⚭ ${spouseMember?.name} ${genderSymbol2}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }

            const coupleMemberIds = [
              { id: member.id, name: member.name, gender: member.gender },
              { id: spouse.id, name: spouse.name, gender: spouse.gender },
            ];

            console.log(`👫 COUPLE ENTRY: ${value}`);
            console.log(
              `👫 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Add children from both partners
            const allChildren = new Set([
              ...(parentChildMap.get(memberId) || []),
              ...(parentChildMap.get(spouse.id) || []),
            ]);

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} children from couple`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            spouseHandled = true;
          }
        }

        if (!spouseHandled) {
          console.log(`👤 Processing individual member: ${member.name}`);
          // Handle as individual member
          processedMembers.add(memberId);

          const genderSymbol = this.getGenderSymbol(member.gender);
          const relationshipLabel = this.getRelationshipLabel(generation);

          let value = `${member.name} ${genderSymbol}`;

          // Add spouse information for display (but spouses already processed)
          if (member.spouses && member.spouses.length > 0) {
            const spouseNames = member.spouses
              .filter((spouse: any) => processedMembers.has(spouse.id)) // Only show already processed spouses
              .map((spouse: any) => {
                const spouseGender = this.getGenderSymbol(
                  spouse.gender || "UNKNOWN"
                );
                return `${spouse.name} ${spouseGender}`;
              });

            if (spouseNames.length > 0) {
              value += ` ⚭ ${spouseNames.join(" & ")}`;
            }
          }

          // Add relationship label
          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }

          result.push({
            column: generation,
            value,
            memberIds: [
              { id: member.id, name: member.name, gender: member.gender },
            ],
          });

          // Add children
          const childIds = parentChildMap.get(memberId) || [];
          console.log(
            `👶 Individual member ${member.name} has ${
              childIds.length
            } children: ${childIds
              .map((id) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          const unprocessedChildren = childIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} unprocessed children for ${member.name}`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });
        }
      }

      return result;
    };

    console.log("🌳 Starting tree generation for root ancestors...");
    console.log(
      "👴 Root ancestors:",
      rootAncestors.map((r) => `${r.name} (Gen ${generations.get(r.id) || 0})`)
    );

    // Generate trees for all root ancestors
    if (rootAncestors.length > 0) {
      rootAncestors.forEach((rootAncestor, index) => {
        console.log(
          `🌲 Processing root ancestor ${index + 1}: ${rootAncestor.name}`
        );
        if (index > 0) {
          treeData.push({ column: 0, value: "", memberIds: [] }); // Empty line between trees
        }
        const treeEntries = generateTree(rootAncestor.id);
        console.log(
          `📄 Generated ${treeEntries.length} tree entries for ${rootAncestor.name}`
        );
        treeData.push(...treeEntries);
      });
    } else {
      treeData.push({
        column: 0,
        value: "=== All Family Members (No Clear Hierarchy) ===",
        memberIds: [],
      });
      Array.from(memberMap.values()).forEach((member) => {
        const genderSymbol = this.getGenderSymbol(member.gender);
        treeData.push({
          column: 0,
          value: `${member.name} ${genderSymbol}`,
          memberIds: [
            { id: member.id, name: member.name, gender: member.gender },
          ],
        });
      });
    }

    // Add any remaining unprocessed members
    const unprocessedMembers = Array.from(memberMap.values()).filter(
      (m) => !processedMembers.has(m.id)
    );

    if (unprocessedMembers.length > 0) {
      treeData.push({ column: 0, value: "", memberIds: [] });
      treeData.push({
        column: 0,
        value: "=== Additional Family Members ===",
        memberIds: [],
      });
      unprocessedMembers
        .sort((a, b) => {
          const genA = generations.get(a.id) || 0;
          const genB = generations.get(b.id) || 0;
          if (genA !== genB) return genA - genB;
          return a.name.localeCompare(b.name);
        })
        .forEach((member) => {
          const genderSymbol = this.getGenderSymbol(member.gender);
          const generation = generations.get(member.id) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          let value = `${member.name} ${genderSymbol}`;
          if (relationshipLabel) value += ` [${relationshipLabel}]`;
          treeData.push({
            column: generation,
            value,
            memberIds: [
              { id: member.id, name: member.name, gender: member.gender },
            ],
          });
        });
    }

    console.log(
      "✅ Family-specific Excel tree generation with IDs completed, entries:",
      treeData.length
    );
    return treeData;
  }

  private generateExcelTreeFormat(
    members: any[],
    exportRequest: ExportRequest
  ): { column: number; value: string }[] {
    console.log(
      "🔍 Starting generateExcelTreeFormat with members:",
      members.length
    );

    const treeData: { column: number; value: string }[] = [];

    // Build proper family tree using existing relationships from database
    const memberMap = new Map<string, any>();

    // First pass: Index all members by ID and normalize data
    members.forEach((member) => {
      const normalizedMember = {
        id: member.id,
        name: member.name,
        gender: member.gender || "UNKNOWN",
        parents: member.parents || [],
        children: member.children || [],
        spouses: member.spouses || [],
        generation: member.generation || 0,
        personalInfo: member.personalInfo,
      };
      memberMap.set(member.id, normalizedMember);
    });

    // Second pass: Include spouses' family members to ensure complete representation
    console.log(
      "🔗 Including spouses' family members for complete tree representation..."
    );
    const additionalMembers = new Map<string, any>();

    for (const [memberId, member] of memberMap.entries()) {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          // Add spouse if not already in memberMap
          if (!memberMap.has(spouse.id) && !additionalMembers.has(spouse.id)) {
            console.log(`👫 Adding spouse's family member: ${spouse.name}`);
            additionalMembers.set(spouse.id, {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender || "UNKNOWN",
              parents: spouse.parents || [],
              children: spouse.children || [],
              spouses: spouse.spouses || [],
              generation: spouse.generation || 0,
              personalInfo: spouse.personalInfo,
            });
          }
        });
      }
    }

    // Add additional members to the main memberMap
    for (const [memberId, member] of additionalMembers.entries()) {
      memberMap.set(memberId, member);
    }

    console.log(
      `📊 Total members after including spouses' families: ${memberMap.size}`
    );

    // Normalize relationships to ensure bidirectionality
    this.normalizeRelationships(memberMap);

    console.log("📊 Total members indexed:", memberMap.size);

    // Build parent-child relationships map for easier traversal
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    members.forEach((member) => {
      // Map children to their parents
      if (member.children && member.children.length > 0) {
        parentChildMap.set(
          member.id,
          member.children.map((c: any) => c.id)
        );

        // Also map each child back to this parent
        member.children.forEach((child: any) => {
          if (!childParentMap.has(child.id)) {
            childParentMap.set(child.id, []);
          }
          childParentMap.get(child.id)!.push(member.id);
        });
      }

      // Map parents to their children
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parent: any) => {
          if (!parentChildMap.has(parent.id)) {
            parentChildMap.set(parent.id, []);
          }
          if (!parentChildMap.get(parent.id)!.includes(member.id)) {
            parentChildMap.get(parent.id)!.push(member.id);
          }
        });

        childParentMap.set(
          member.id,
          member.parents.map((p: any) => p.id)
        );
      }
    });

    // Find true root ancestors with spouse consideration
    const potentialRoots = Array.from(memberMap.values()).filter((member) => {
      const parentIds = childParentMap.get(member.id) || [];
      return parentIds.length === 0;
    });

    // Filter out members who have no parents but their spouse has parents
    const trueRoots = potentialRoots.filter((member) => {
      // If member has no spouses, they are a true root
      if (!member.spouses || member.spouses.length === 0) {
        return true;
      }

      // Check if any spouse has parents
      const hasSpouseWithParents = member.spouses.some((spouse: any) => {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) return false;

        const spouseParentIds = childParentMap.get(spouse.id) || [];
        return spouseParentIds.length > 0;
      });

      // If spouse has parents, this member is not a true root
      return !hasSpouseWithParents;
    });

    console.log(
      "👴 True root ancestors found:",
      trueRoots.map((r) => r.name)
    );

    // Group married couples at the root level
    const rootAncestors = [];
    const processedRootIds = new Set();

    trueRoots.forEach((member) => {
      if (processedRootIds.has(member.id)) return;

      // Check if this member has a spouse who is also a root
      const spouseIds = member.spouses.map((s: any) => s.id);
      const rootSpouses = spouseIds
        .map((spouseId) => memberMap.get(spouseId))
        .filter(
          (spouse) => spouse && trueRoots.some((r) => r.id === spouse.id)
        );

      if (rootSpouses.length > 0) {
        // Create a couple entry - use the male as primary if possible
        const malePartner =
          member.gender === "MALE"
            ? member
            : rootSpouses.find((s) => s.gender === "MALE");
        const primaryPartner = malePartner || member;

        rootAncestors.push(primaryPartner);
        processedRootIds.add(member.id);
        rootSpouses.forEach((spouse) => processedRootIds.add(spouse.id));
      } else {
        // Single root ancestor
        rootAncestors.push(member);
        processedRootIds.add(member.id);
      }
    });

    rootAncestors.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate generations from each root
    const generations = new Map<string, number>();

    const assignGenerations = (
      memberId: string,
      generation: number,
      visited = new Set<string>()
    ) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);

      const existingGen = generations.get(memberId);
      if (existingGen === undefined || generation < existingGen) {
        generations.set(memberId, generation);
      }

      const childIds = parentChildMap.get(memberId) || [];
      childIds.forEach((childId) => {
        if (memberMap.has(childId)) {
          assignGenerations(childId, generation + 1, new Set(visited));
        }
      });
    };

    // Assign generations starting from roots
    rootAncestors.forEach((root) => {
      assignGenerations(root.id, 0);
    });

    const processedMembers = new Set<string>();

    // Identify couples with shared children
    const coupleChildrenMap = new Map<string, string[]>();
    const processedCouples = new Set<string>();

    members.forEach((member) => {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          const coupleKey1 = `${member.id}_${spouse.id}`;
          const coupleKey2 = `${spouse.id}_${member.id}`;

          if (
            !processedCouples.has(coupleKey1) &&
            !processedCouples.has(coupleKey2)
          ) {
            processedCouples.add(coupleKey1);

            // Find shared children between this couple
            const memberChildren = parentChildMap.get(member.id) || [];
            const spouseChildren = parentChildMap.get(spouse.id) || [];
            const sharedChildren = memberChildren.filter((childId) =>
              spouseChildren.includes(childId)
            );

            if (sharedChildren.length > 0) {
              coupleChildrenMap.set(coupleKey1, sharedChildren);
            }
          }
        });
      }
    });

    const generateTree = (
      memberId: string,
      generation = 0,
      depth = 0
    ): { column: number; value: string }[] => {
      if (
        processedMembers.has(memberId) ||
        depth > 8 ||
        !memberMap.has(memberId)
      ) {
        return [];
      }

      const member = memberMap.get(memberId);
      const result: { column: number; value: string }[] = [];

      // Check if this member is part of a couple with shared children
      let handledAsCouple = false;

      for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
        const [member1Id, member2Id] = coupleKey.split("_");

        if (member1Id === memberId && !processedMembers.has(member2Id)) {
          // This member is the primary in a couple - show both partners
          processedMembers.add(member1Id);
          processedMembers.add(member2Id);

          const spouse = memberMap.get(member2Id);
          const relationshipLabel = this.getRelationshipLabel(generation);

          const genderSymbol1 = this.getGenderSymbol(member.gender);
          const genderSymbol2 = this.getGenderSymbol(
            spouse?.gender || "UNKNOWN"
          );

          let value = `${member.name} ${genderSymbol1} ⚭ ${spouse?.name} ${genderSymbol2}`;

          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }
          result.push({ column: generation, value });

          // Add shared children
          const unprocessedChildren = sharedChildIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });

          handledAsCouple = true;
          break;
        }
      }

      if (!handledAsCouple) {
        // Handle as individual member
        processedMembers.add(memberId);

        const genderSymbol = this.getGenderSymbol(member.gender);
        const relationshipLabel = this.getRelationshipLabel(generation);

        let value = `${member.name} ${genderSymbol}`;

        // Add spouse information
        if (member.spouses && member.spouses.length > 0) {
          const spouseNames = member.spouses
            .filter((spouse: any) => !processedMembers.has(spouse.id))
            .map((spouse: any) => {
              const spouseGender = this.getGenderSymbol(
                spouse.gender || "UNKNOWN"
              );
              if (spouse.id) processedMembers.add(spouse.id);
              return `${spouse.name} ${spouseGender}`;
            });

          if (spouseNames.length > 0) {
            value += ` ⚭ ${spouseNames.join(" & ")}`;
          }
        }

        // Add relationship label
        if (relationshipLabel) {
          value += ` [${relationshipLabel}]`;
        }
        result.push({ column: generation, value });

        // Add children
        const childIds = parentChildMap.get(memberId) || [];
        const unprocessedChildren = childIds
          .filter(
            (childId) =>
              !processedMembers.has(childId) && memberMap.has(childId)
          )
          .map((childId) => memberMap.get(childId))
          .sort((a, b) => {
            const genA = generations.get(a.id) || 0;
            const genB = generations.get(b.id) || 0;
            if (genA !== genB) return genA - genB;
            return a.name.localeCompare(b.name);
          });

        unprocessedChildren.forEach((child) => {
          result.push(...generateTree(child.id, generation + 1, depth + 1));
        });
      }

      return result;
    };

    // Generate trees for all root ancestors
    if (rootAncestors.length > 0) {
      rootAncestors.forEach((rootAncestor, index) => {
        if (index > 0) {
          treeData.push({ column: 0, value: "" }); // Empty line between trees
        }
        treeData.push(...generateTree(rootAncestor.id));
      });
    } else {
      treeData.push({
        column: 0,
        value: "=== All Family Members (No Clear Hierarchy) ===",
      });
      Array.from(memberMap.values()).forEach((member) => {
        const genderSymbol = this.getGenderSymbol(member.gender);
        treeData.push({ column: 0, value: `${member.name} ${genderSymbol}` });
      });
    }

    // Add any remaining unprocessed members
    const unprocessedMembers = Array.from(memberMap.values()).filter(
      (m) => !processedMembers.has(m.id)
    );

    if (unprocessedMembers.length > 0) {
      treeData.push({ column: 0, value: "" });
      treeData.push({ column: 0, value: "=== Additional Family Members ===" });
      unprocessedMembers
        .sort((a, b) => {
          const genA = generations.get(a.id) || 0;
          const genB = generations.get(b.id) || 0;
          if (genA !== genB) return genA - genB;
          return a.name.localeCompare(b.name);
        })
        .forEach((member) => {
          const genderSymbol = this.getGenderSymbol(member.gender);
          const generation = generations.get(member.id) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          let value = `${member.name} ${genderSymbol}`;
          if (relationshipLabel) value += ` [${relationshipLabel}]`;
          treeData.push({ column: generation, value });
        });
    }

    console.log(
      "✅ Excel tree generation completed, entries:",
      treeData.length
    );
    return treeData;
  }

  private async generateExcel(
    families: any[],
    exportRequest: ExportRequest
  ): Promise<{ downloadUrl: string; filename: string }> {
    console.log("📊 Starting Excel generation with ExcelJS");
    console.log("👨‍👩‍👧‍👦 Families to export:", families.length);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Family Tree Platform";
    workbook.lastModifiedBy = "Family Tree Platform";
    workbook.created = new Date();
    workbook.modified = new Date();

    // SHEET 1: Family Tree Structure (ASCII Tree Format)
    const treeSheet = workbook.addWorksheet("Family Tree");

    // Add header
    treeSheet.getCell("A1").value = "FAMILY TREE EXPORT";
    treeSheet.getCell("A1").font = { size: 16, bold: true };
    treeSheet.getCell(
      "A2"
    ).value = `Generated on: ${new Date().toLocaleString()}`;
    treeSheet.getCell("A3").value = `Structure: ASCII Tree Format`;

    let currentRow = 5;

    // Process each family
    families.forEach((family, familyIndex) => {
      console.log(`👨‍👩‍👧‍👦 Processing family ${familyIndex + 1}: ${family.name}`);

      // Family header
      treeSheet.getCell(`A${currentRow}`).value = `${family.name}`;
      treeSheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
      treeSheet.getCell(`A${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };
      currentRow += 2;

      // Generate tree data for this family
      const treeData = this.generateExcelTreeFormat(
        family.members,
        exportRequest
      );

      // Process each entry and place in appropriate column
      treeData.forEach((entry) => {
        const columnLetter = String.fromCharCode(65 + entry.column); // A = 65, B = 66, etc.
        const cell = treeSheet.getCell(`${columnLetter}${currentRow}`);
        cell.value = entry.value;
        cell.font = {
          name: "Courier New",
          size: 10,
        };
        currentRow++;
      });

      currentRow += 2; // Extra space between families
    });

    // Set column width for tree sheet
    // treeSheet.getColumn(1).width = 10;

    // SHEET 2: Members List
    const membersSheet = workbook.addWorksheet("Members List");

    // Add header
    membersSheet.getCell("A1").value = "FAMILY MEMBERS LIST";
    membersSheet.getCell("A1").font = { size: 16, bold: true };
    membersSheet.getCell(
      "A2"
    ).value = `Generated on: ${new Date().toLocaleString()}`;
    membersSheet.getCell("A3").value = `Total Members: ${
      families.flatMap((f) => f.members).length
    }`;

    // Table headers
    const headers = ["ID", "Name", "Gender", "Generation", "Role"];
    if (exportRequest.includeData.relationships) {
      headers.push("Parents", "Children", "Spouses");
    }
    if (exportRequest.includeData.personalInfo) {
      headers.push("Bio", "Birth Date", "Occupation");
    }
    if (exportRequest.includeData.contactInfo) {
      headers.push("Phone", "Email");
    }

    headers.forEach((header, index) => {
      const cell = membersSheet.getCell(`${String.fromCharCode(65 + index)}5`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };
    });

    // Add member data
    let memberRow = 6;
    const allMembers = families.flatMap((f) => f.members);

    allMembers.forEach((member) => {
      let col = 0;

      // Basic info
      membersSheet.getCell(
        `${String.fromCharCode(65 + col++)}${memberRow}`
      ).value = member.id;
      membersSheet.getCell(
        `${String.fromCharCode(65 + col++)}${memberRow}`
      ).value = member.name;
      membersSheet.getCell(
        `${String.fromCharCode(65 + col++)}${memberRow}`
      ).value = member.gender || "Not specified";
      membersSheet.getCell(
        `${String.fromCharCode(65 + col++)}${memberRow}`
      ).value = member.generation || 0;
      membersSheet.getCell(
        `${String.fromCharCode(65 + col++)}${memberRow}`
      ).value = member.role || "MEMBER";

      // Relationships
      if (exportRequest.includeData.relationships) {
        const parents =
          member.parents?.map((p: any) => p.name).join(", ") || "";
        const children =
          member.children?.map((c: any) => c.name).join(", ") || "";
        const spouses =
          member.spouses?.map((s: any) => s.name).join(", ") || "";

        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = parents;
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = children;
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = spouses;
      }

      // Personal info
      if (exportRequest.includeData.personalInfo && member.personalInfo) {
        const info = member.personalInfo as any;
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = info.bio || "";
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = info.birthDate || "";
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = info.occupation || "";
      } else if (exportRequest.includeData.personalInfo) {
        col += 3; // Skip personal info columns
      }

      // Contact info
      if (exportRequest.includeData.contactInfo && member.personalInfo) {
        const info = member.personalInfo as any;
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = info.phone || "";
        membersSheet.getCell(
          `${String.fromCharCode(65 + col++)}${memberRow}`
        ).value = info.email || "";
      }

      memberRow++;
    });

    // Auto-fit columns for members sheet
    membersSheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Generate unique filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `family-tree-excel-${timestamp}.xlsx`;

    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, "..", "..", "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Save Excel file
    const filePath = path.join(exportsDir, filename);
    await workbook.xlsx.writeFile(filePath);

    console.log("📊 Excel file saved to:", filePath);

    // Return download URL
    const downloadUrl = `http://localhost:3001/api/v1/export/download/${filename}`;

    return { downloadUrl, filename };
  }
}
