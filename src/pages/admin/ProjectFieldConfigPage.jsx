import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { FieldConfigurationEditor, } from '../../components/admin/FieldConfigurationEditor';
import { normalizeFieldConfig } from '../../utils/fieldConfiguration';
/**
 * Admin → Project Settings → Work Item Fields.
 * Per-project editor for which standard fields appear for each work item
 * type, plus that project's custom field definitions. Changes are scoped to
 * this project only (standard fields → `Project.fieldConfig`, custom fields →
 * the store's project-scoped `customFieldDefinitions`).
 */
export const ProjectFieldConfigPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const project = useAppStore((s) => s.projects.find((p) => p.id === projectId));
    const allProjects = useAppStore((s) => s.projects);
    const allCustomFields = useAppStore((s) => s.customFieldDefinitions);
    const updateProject = useAppStore((s) => s.updateProject);
    const createCustomField = useAppStore((s) => s.createCustomField);
    const updateCustomField = useAppStore((s) => s.updateCustomField);
    const deleteCustomField = useAppStore((s) => s.deleteCustomField);
    // Draft seeded from the project's current configuration.
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    // Initialize (or re-initialize if the project id changes) the draft.
    useEffect(() => {
        if (!project)
            return;
        setDraft({
            standardFields: { ...(project.fieldConfig?.standardFields ?? {}) },
            customFields: allCustomFields
                .filter((f) => f.projectId === project.id)
                .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id]);
    const baseline = useMemo(() => {
        if (!project)
            return null;
        return {
            standardFields: project.fieldConfig?.standardFields ?? {},
            customFields: allCustomFields.filter((f) => f.projectId === project.id),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id, allCustomFields]);
    // Field registry from OTHER projects, offered by "Add Existing Field" as
    // reusable definitions (copied into this project at most once, never
    // duplicated alongside an already-added name).
    const external = useMemo(() => {
        const projectNames = {};
        allProjects.forEach((p) => {
            projectNames[p.id] = p.name;
        });
        return {
            definitions: project ? allCustomFields.filter((f) => f.projectId !== project.id) : [],
            projectNames,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allCustomFields, allProjects, project?.id]);
    if (!project) {
        return (<div className="p-8 text-center">
        <p className="text-sm text-slate-500">Project not found.</p>
        <button className="btn-secondary mt-3" onClick={() => navigate('/admin/projects')}>
          Back to Projects
        </button>
      </div>);
    }
    const handleSave = () => {
        if (!draft || !baseline || !project)
            return;
        setSaving(true);
        // 1) Standard-field config → Project.fieldConfig.
        updateProject(project.id, { fieldConfig: normalizeFieldConfig(draft.standardFields) });
        // 2) Custom fields: create new (temp id), update changed, delete removed.
        const baselineById = new Map(baseline.customFields.map((f) => [f.id, f]));
        const draftById = new Map(draft.customFields.map((f) => [f.id, f]));
        draft.customFields.forEach((field) => {
            if (field.id.startsWith('cf-draft-')) {
                createCustomField({
                    projectId: project.id,
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    enabled: field.enabled ?? true,
                    options: field.options,
                    defaultValue: field.defaultValue,
                    applicableIssueTypes: field.applicableIssueTypes,
                    order: field.order,
                });
                return;
            }
            const prev = baselineById.get(field.id);
            if (prev) {
                const changed = prev.name !== field.name ||
                    prev.label !== field.label ||
                    prev.type !== field.type ||
                    prev.required !== field.required ||
                    prev.enabled !== field.enabled ||
                    (prev.order ?? -1) !== (field.order ?? -1) ||
                    JSON.stringify(prev.options ?? []) !== JSON.stringify(field.options ?? []) ||
                    prev.defaultValue !== field.defaultValue ||
                    JSON.stringify(prev.applicableIssueTypes ?? []) !==
                        JSON.stringify(field.applicableIssueTypes ?? []);
                if (changed) {
                    updateCustomField(field.id, {
                        name: field.name,
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        enabled: field.enabled,
                        options: field.options,
                        defaultValue: field.defaultValue,
                        applicableIssueTypes: field.applicableIssueTypes,
                        order: field.order,
                    });
                }
            }
        });
        baseline.customFields.forEach((field) => {
            if (!draftById.has(field.id)) {
                deleteCustomField(field.id);
            }
        });
        // Re-seed the draft from the post-save store so temp ids resolve to the
        // real definitions and the next save diffs against fresh baselines.
        const state = useAppStore.getState();
        const saved = state.projects.find((p) => p.id === project.id);
        setDraft({
            standardFields: { ...(saved?.fieldConfig?.standardFields ?? {}) },
            customFields: state.customFieldDefinitions
                .filter((f) => f.projectId === project.id)
                .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)),
        });
        toast.success(`Field configuration saved for "${project.name}".`);
        setSaving(false);
    };
    if (!draft)
        return null;
    return (<div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488]">
            <Settings2 className="w-5 h-5"/>
          </div>
          <div>
            <h1 className="text-[19.2px] font-semibold text-[#343A40]">Work Item Fields</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure which standard fields appear for Epic, Story, Task, Bug and Sub-task in{' '}
              <strong>{project.name}</strong> ({project.key}), and manage this project's custom
              fields. Changes are scoped to this project only.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary inline-flex items-center gap-1.5" onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <button className="btn-primary inline-flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>) : (<Save className="w-4 h-4"/>)}
            Save Configuration
          </button>
        </div>
      </div>

      <FieldConfigurationEditor value={draft} onChange={setDraft} external={external}/>

      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e5ea]">
        <FolderKanban className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/>
        <p className="text-xs text-slate-500 leading-relaxed">
          Standard fields (Title, Type, Status) are always shown and cannot be removed. Toggling a
          standard field here only affects the Create / Edit forms and the Details → Information
          section for <strong>this project</strong>; other projects are unaffected. Custom fields
          added here become available for work item creation and editing in this project.
        </p>
      </div>
    </div>);
};
