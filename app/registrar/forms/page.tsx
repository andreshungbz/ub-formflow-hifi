"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";

interface FormType {
  id: string;
  name: string;
  description: string;
  requires_lecturer_approval: boolean;
  requires_dean_approval: boolean;
  requires_registrar_approval: boolean;
  requires_accounts_receivable_approval: boolean;
  template_file?: string;
}

export default function FormsManagementPage() {
  const [supabase] = useState(() => createClient());
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    requires_lecturer_approval: false,
    requires_dean_approval: false,
    requires_registrar_approval: true,
    requires_accounts_receivable_approval: false,
  });
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("form_types")
        .select("*")
        .order("name");

      if (error) throw error;
      setFormTypes(data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let templatePath = null;

      // 1. Upload template if provided
      if (templateFile) {
        const fileName = `templates/${Date.now()}-${templateFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("form-attachments")
          .upload(fileName, templateFile);

        if (uploadError) throw uploadError;
        templatePath = fileName;
      }

      // 2. Create form type
      const { error } = await supabase.from("form_types").insert([
        {
          ...newForm,
          template_file: templatePath,
        },
      ]);

      if (error) throw error;

      setIsCreating(false);
      setNewForm({
        name: "",
        description: "",
        requires_lecturer_approval: false,
        requires_dean_approval: false,
        requires_registrar_approval: true,
        requires_accounts_receivable_approval: false,
      });
      setTemplateFile(null);
      fetchForms();
    } catch (error) {
      console.error("Error creating form:", error);
      alert("Failed to create form");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Form Management</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Create New Form
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8 border-ub-purple border-2">
          <CardHeader>
            <CardTitle>Create New Form Type</CardTitle>
            <CardDescription>
              Define the workflow and template for a new student form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Form Name</Label>
                <Input
                  id="name"
                  value={newForm.name}
                  onChange={(e) =>
                    setNewForm({ ...newForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newForm.description}
                  onChange={(e) =>
                    setNewForm({ ...newForm, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template File (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="template"
                    type="file"
                    onChange={(e) =>
                      setTemplateFile(e.target.files?.[0] || null)
                    }
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Upload a PDF or DOCX template for students to download.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Approval Workflow (Check all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lecturer"
                      checked={newForm.requires_lecturer_approval}
                      onCheckedChange={(checked) =>
                        setNewForm({
                          ...newForm,
                          requires_lecturer_approval: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="lecturer">Lecturer Approval</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dean"
                      checked={newForm.requires_dean_approval}
                      onCheckedChange={(checked) =>
                        setNewForm({
                          ...newForm,
                          requires_dean_approval: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="dean">Dean Approval</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="registrar"
                      checked={newForm.requires_registrar_approval}
                      onCheckedChange={(checked) =>
                        setNewForm({
                          ...newForm,
                          requires_registrar_approval: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="registrar">Registrar Approval</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="finance"
                      checked={newForm.requires_accounts_receivable_approval}
                      onCheckedChange={(checked) =>
                        setNewForm({
                          ...newForm,
                          requires_accounts_receivable_approval:
                            checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="finance">
                      Accounts Receivable Approval
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Creating..." : "Create Form"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Loading forms...
        </div>
      ) : (
        <div className="grid gap-4">
          {formTypes.map((form) => (
            <Card key={form.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{form.name}</CardTitle>
                  {/* <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button> */}
                </div>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 flex-wrap text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Workflow:</span>
                    {form.requires_lecturer_approval && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Lecturer
                      </span>
                    )}
                    {form.requires_dean_approval && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        Dean
                      </span>
                    )}
                    {form.requires_registrar_approval && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Registrar
                      </span>
                    )}
                    {form.requires_accounts_receivable_approval && (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Finance
                      </span>
                    )}
                  </div>
                  {form.template_file && (
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Upload className="h-3 w-3" />
                      <span>Template available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
