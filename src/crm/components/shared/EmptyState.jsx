import React from "react";
import { Button } from "@crm/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ icon: Icon, title, description, onAction, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">{description}</p>
      {onAction && (
        <Button onClick={onAction} className="bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel || "Add New"}
        </Button>
      )}
    </div>
  );
}