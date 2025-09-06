"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Member } from "@/types";

interface FamilyMemberSelectorProps {
  members: Member[];
  selectedMember: Member | null;
  onMemberSelect: (member: Member | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function FamilyMemberSelector({
  members,
  selectedMember,
  onMemberSelect,
  label = "Select Family Member",
  placeholder = "Search family members...",
  className,
}: FamilyMemberSelectorProps) {
  const [searchValue, setSearchValue] = useState("");

  // Filter members based on search
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="space-y-2">
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full"
        />
        <div className="max-h-40 overflow-y-auto border rounded-md">
          {filteredMembers.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No family members found
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => onMemberSelect(member)}
                className={cn(
                  "flex items-center space-x-2 p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0",
                  selectedMember?.id === member.id &&
                    "bg-blue-50 border-blue-200"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1">{member.name}</span>
                {selectedMember?.id === member.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
            ))
          )}
        </div>
        {selectedMember && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(selectedMember.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{selectedMember.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMemberSelect(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
