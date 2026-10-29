import React, { useState, useMemo, useEffect } from 'react';
import { X, FolderKanban, Calendar, Tag, Hash, KeyRound, Layers, AlertCircle, Sparkles, ArrowLeft, ArrowRight, Settings2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { SearchableUserSelect } from '../../components/common/SearchableUserSelect';
import { PROJECT_KEY_MAX_LENGTH, deriveIssueKeyPrefix, normalizeProjectName, sanitizeProjectKey, validateProjectKey, validateProjectName, } from '../../utils/projectIdentity';
import { TEMPLATE_OPTIONS, useAdminSettingsStore } from '../../store/adminSettingsStore';
import { toast } from 'sonner';
import { FieldConfigurationEditor, } from '../../components/admin/FieldConfigurationEditor';
import { normalizeFieldConfig } from '../../utils/fieldConfiguration';
const PROJECT_CATEGORIES = [
    'Software Development',
    'IT Infrastructure & Operations',
    'Mobile & Web Apps',
    'Healthcare & Life Sciences',
    'Finance & Fintech',
    'Marketing & Growth',
    'Operations & Business',
    'Product Design & Research',
    'Customer Success & Support',
    'Education & Training',
    'Custom / Other',
];
export const CreateProjectModal = ({ onClose }) => {
    const { createProject, createCustomField, users, projects, customFieldDefinitions } = useAppStore();
    const { currentUser } = useAuthStore();
    const projectDefaults = useAdminSettingsStore((s) => s.settings.projectDefaults);
    // Two-step wizard: step 1 = project identity, step 2 = work item fields.
    const [step, setStep] = useState(1);
    const [fieldDraft, setFieldDraft] = useState({
        standardFields: {},
        customFields: [],
    });
    // Field registry of the already-existing projects — offered by the step-2
    // "Add Existing Field" picker as reusable definitions for the new project.
    const externalFields = useMemo(() => {
        const projectNames = {};
        projects.forEach((p) => {
            projectNames[p.id] = p.name;
        });
        return { definitions: customFieldDefinitions, projectNames };
    }, [customFieldDefinitions, projects]);
    // Compute default next Project ID
    const nextDefaultId = useMemo(() => {
        const existingNumbers = projects
            .map((p) => {
            const match = p.id.match(/^proj-(\d+)$/i);
            return match ? parseInt(match[1], 10) : 0;
        })
            .filter((n) => !isNaN(n));
        const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : projects.length;
        return `proj-${String(maxNum + 1).padStart(3, '0')}`;
    }, [projects]);
    const [form, setForm] = useState({
        id: '',
        key: '',
        name: '',
        category: 'Software Development',
        customCategory: '',
        description: '',
        type: 'Web Application',
        startDate: '',
        targetDate: '',
        projectManagerId: '',
    });
    const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
    const [loading, setLoading] = useState(false);
    const [applyOrgDefaults, setApplyOrgDefaults] = useState(true);
    // Initialize ID with computed next ID
    useEffect(() => {
        setForm((prev) => ({ ...prev, id: prev.id || nextDefaultId }));
    }, [nextDefaultId]);
    // Helper to generate a Jira-style key from project name
    const generateKeyFromName = (name) => {
        const words = name.trim().split(/[\s-_]+/).filter(Boolean);
        if (words.length === 0)
            return '';
        if (words.length === 1) {
            return words[0].slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        return words
            .map((w) => w[0])
            .join('')
            .slice(0, 5)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
    };
    // Handle Project Name change with auto-key suggestion
    const handleNameChange = (name) => {
        setForm((prev) => {
            const nextForm = { ...prev, name };
            if (!isKeyManuallyEdited) {
                nextForm.key = generateKeyFromName(name);
            }
            return nextForm;
        });
    };
    // Handle Key input change (uppercase, digits and an optional version suffix)
    const handleKeyChange = (val) => {
        setIsKeyManuallyEdited(true);
        setForm((prev) => ({ ...prev, key: sanitizeProjectKey(val) }));
    };
    // Duplicate checks
    const isIdDuplicate = useMemo(() => {
        if (!form.id.trim())
            return false;
        return projects.some((p) => p.id.toLowerCase() === form.id.trim().toLowerCase());
    }, [form.id, projects]);
    // Format + unique key + unique derived issue prefix, all in one rule set.
    const keyValidation = useMemo(() => validateProjectKey(form.key, projects), [form.key, projects]);
    const keyPreviewPrefix = keyValidation.prefix || deriveIssueKeyPrefix(form.key);
    // Unique, whitespace-normalized name across existing projects.
    const nameValidation = useMemo(() => validateProjectName(form.name, projects), [form.name, projects]);
    const validateStep1 = () => {
        if (!nameValidation.ok) {
            toast.error(nameValidation.error || 'Invalid Project Name');
            return false;
        }
        if (!form.id.trim()) {
            toast.error('Please enter a Project ID');
            return false;
        }
        if (isIdDuplicate) {
            toast.error(`Project ID "${form.id}" already exists. Please choose a unique ID.`);
            return false;
        }
        if (!form.key.trim()) {
            toast.error('Please enter a Project Key');
            return false;
        }
        if (!keyValidation.ok) {
            toast.error(keyValidation.error || 'Invalid Project Key');
            return false;
        }
        if (!form.projectManagerId) {
            toast.error('Please select a Project Manager');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            if (!validateStep1())
                return;
            setStep(2);
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        const finalCategory = form.category === 'Custom / Other'
            ? form.customCategory.trim() || 'General'
            : form.category;
        const created = createProject({
            id: form.id.trim(),
            key: form.key.trim().toUpperCase(),
            category: finalCategory,
            organizationId: currentUser?.organizationId || 'org-001',
            name: normalizeProjectName(form.name),
            description: form.description.trim(),
            type: form.type,
            startDate: form.startDate,
            targetDate: form.targetDate,
            projectManagerId: form.projectManagerId,
            teamIds: [],
            createdByAdminId: currentUser?.id || 'u-admin-01',
            // Standard-field layout is created with the project so the very first
            // work item already honours the configured field set.
            fieldConfig: normalizeFieldConfig(fieldDraft.standardFields),
            ...(applyOrgDefaults
                ? {
                    template: projectDefaults.template,
                    defaultWorkflowName: projectDefaults.workflow.trim(),
                    defaultPriority: projectDefaults.defaultPriority,
                    defaultIssueTypes: [...projectDefaults.issueTypes],
                }
                : {}),
        });
        // Custom fields are created against the real project id.
        fieldDraft.customFields.forEach((draft) => {
            createCustomField({
                projectId: created.id,
                name: draft.name,
                label: draft.label,
                type: draft.type,
                required: draft.required,
                enabled: true,
                options: draft.options,
                defaultValue: draft.defaultValue,
                applicableIssueTypes: draft.applicableIssueTypes,
                order: draft.order,
                createdBy: currentUser?.id,
            });
        });
        const pm = users.find((u) => u.id === form.projectManagerId);
        const templateLabel = TEMPLATE_OPTIONS.find((t) => t.value === projectDefaults.template)?.label;
        toast.success(`Project "${form.name}" [${form.key.toUpperCase()}] created and assigned to ${pm?.name}${applyOrgDefaults && templateLabel ? ` · ${templateLabel} defaults applied` : ''}${fieldDraft.customFields.length > 0 ? ` · ${fieldDraft.customFields.length} custom field(s)` : ''}`);
        setLoading(false);
        onClose();
    };
    const projectTypes = [
        'Web Application',
        'Mobile Application',
        'Enterprise Application',
        'API Service',
        'Data Platform',
        'Other',
    ];
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-modal animate-scale-in max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FolderKanban className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Project</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Step {step} of 2 · {step === 1
            ? 'Configure project identity, category, key, and assign a Project Manager'
            : 'Configure standard and custom fields per work item type'}
              </p>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2].map((s) => (<div key={s} className={`h-1 rounded-full transition-all ${step === s ? 'w-8 bg-indigo-500' : step > s ? 'w-4 bg-indigo-300' : 'w-4 bg-slate-200'}`}/>))}
              </div>
            </div>
          </div>
          <button className="btn-ghost p-2 rounded-xl text-slate-400 hover:text-slate-700" onClick={onClose}>
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {step === 2 && (<div className="mb-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#f0fdfa]/60 border border-[#ccfbf1]">
              <Settings2 className="w-4 h-4 text-[#0d9488] shrink-0"/>
              <div className="text-xs text-slate-600 leading-relaxed">
                Field layout for <strong>{form.name || form.key}</strong> — toggles which standard
                fields appear for Epic/Story/Task/Bug/Sub-task, lets you enable existing fields and
                add project-specific custom fields. You can change this later in{' '}
                <strong>Project Settings → Work Item Fields</strong>.
              </div>
            </div>)}
          {step === 2 && (<FieldConfigurationEditor value={fieldDraft} onChange={setFieldDraft} external={externalFields}/>)}
          {step === 1 && (<>
          {/* Project Name */}
          <div>
            <label className="input-label" htmlFor="p-name">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input id="p-name" type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. E-Commerce Platform" className={`input ${form.name && !nameValidation.ok ? 'border-rose-400 focus:ring-rose-500' : ''}`} aria-invalid={form.name ? !nameValidation.ok : undefined} required/>
            {form.name && !nameValidation.ok && (<p className="text-[11px] text-rose-600 mt-1 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/> {nameValidation.error}
              </p>)}
          </div>

          {/* Project Key & Project ID Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="input-label mb-0" htmlFor="p-key">
                  Project Key <span className="text-rose-500">*</span>
                </label>
                {form.key && keyValidation.ok && (<span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded">
                    Prefix: {keyPreviewPrefix}-101
                  </span>)}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <input id="p-key" type="text" value={form.key} onChange={(e) => handleKeyChange(e.target.value)} placeholder="e.g. KEY4.0" maxLength={PROJECT_KEY_MAX_LENGTH} className={`input pl-9 uppercase font-mono tracking-wider font-semibold ${form.key.trim() && !keyValidation.ok ? 'border-rose-400 focus:ring-rose-500' : ''}`} required/>
              </div>
              {form.key.trim() && !keyValidation.ok ? (<p className="text-[11px] text-rose-600 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/> {keyValidation.error}
                </p>) : (<p className="text-[10px] text-slate-400 mt-1">
                  Issue numbers use the derived prefix (e.g. {keyPreviewPrefix || 'KEY'}-1)
                </p>)}
            </div>

            {/* Project ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="input-label mb-0" htmlFor="p-id">
                  Project ID <span className="text-rose-500">*</span>
                </label>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, id: nextDefaultId }))} className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5"/> Auto ID
                </button>
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <input id="p-id" type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. proj-005" className={`input pl-9 font-mono text-xs ${isIdDuplicate ? 'border-rose-400 focus:ring-rose-500' : ''}`} required/>
              </div>
              {isIdDuplicate ? (<p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> ID already in use. Choose another ID.
                </p>) : (<p className="text-[10px] text-slate-400 mt-1">
                  Unique system identifier
                </p>)}
            </div>
          </div>

          {/* Project Category & Project Type Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Category */}
            <div>
              <label className="input-label" htmlFor="p-category">
                Project Category
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <select id="p-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select pl-9">
                  {PROJECT_CATEGORIES.map((cat) => (<option key={cat} value={cat}>
                      {cat}
                    </option>))}
                </select>
              </div>
              {form.category === 'Custom / Other' && (<input type="text" value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} placeholder="Specify custom category..." className="input mt-2 text-xs" required/>)}
            </div>

            {/* Project Type */}
            <div>
              <label className="input-label" htmlFor="p-type">
                Project Type
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <select id="p-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select pl-9">
                  {projectTypes.map((t) => (<option key={t} value={t}>
                      {t}
                    </option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="input-label" htmlFor="p-desc">
              Description
            </label>
            <textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief project overview and deliverables..." className="input resize-none h-20"/>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label" htmlFor="p-start">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <input id="p-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input pl-9" required/>
              </div>
            </div>
            <div>
              <label className="input-label" htmlFor="p-end">
                Target Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                <input id="p-end" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="input pl-9" required/>
              </div>
            </div>
          </div>

          {/* Project Manager */}
          <div>
            <label className="input-label">Project Manager</label>
            <p className="text-xs text-slate-400 mb-2">Only active Project Managers are shown</p>
            <SearchableUserSelect users={users} value={form.projectManagerId} onChange={(id) => setForm({ ...form, projectManagerId: id })} placeholder="Search Project Manager by name or ID..." filterRole={['PROJECT_MANAGER']}/>
          </div>

          {/* Organization Defaults (Admin Settings → Project Defaults) */}
          <div className="p-3.5 rounded-xl bg-[#f0fdfa]/60 border border-[#ccfbf1] space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-4 h-4 text-[#0d9488]"/>
                <span className="text-xs font-bold text-slate-800">Organization Defaults</span>
                <span className="badge badge-teal text-[9px]">Admin Settings</span>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={applyOrgDefaults} onChange={(e) => setApplyOrgDefaults(e.target.checked)} className="w-3.5 h-3.5 accent-[#0d9488]"/>
                Apply to this project
              </label>
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 transition-opacity ${applyOrgDefaults ? '' : 'opacity-40 pointer-events-none'}`}>
              {[
                {
                    label: 'Template',
                    value: TEMPLATE_OPTIONS.find((t) => t.value === projectDefaults.template)?.label || projectDefaults.template,
                },
                { label: 'Workflow', value: projectDefaults.workflow || '—' },
                { label: 'Priority', value: projectDefaults.defaultPriority },
                { label: 'Issue Types', value: `${projectDefaults.issueTypes.length} Enabled` },
            ].map((item) => (<div key={item.label} className="px-2.5 py-2 rounded-lg bg-white border border-[#ccfbf1] min-w-0">
                  <div className="text-[9px] font-bold tracking-wider text-teal-600">{item.label}</div>
                  <div className="text-[11px] font-semibold text-slate-800 truncate" title={item.value}>
                    {item.value}
                  </div>
                </div>))}
            </div>
            {!applyOrgDefaults && (<p className="text-[10px] text-slate-500">
                Defaults skipped — this project starts without template, workflow, priority or issue-type preferences.
              </p>)}
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5"/>
            <p className="text-xs text-indigo-900 leading-relaxed">
              Assigned Project Manager will be notified and can immediately set up iterations, work queue items (with <strong>{keyPreviewPrefix || 'KEY'}-#</strong> issue keys), and workflow stages.
            </p>
          </div>
            </>)}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            {step === 2 && (<button type="button" className="btn-secondary flex-1 justify-center gap-2" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="w-4 h-4"/> Back
              </button>)}
            <button type="submit" className="btn-primary flex-1 justify-center gap-2" disabled={loading || isIdDuplicate || (form.key.trim() !== '' && !keyValidation.ok)}>
              {loading ? (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>) : step === 1 ? (<>
                  Next: Work Item Fields <ArrowRight className="w-4 h-4"/>
                </>) : (<>
                  <FolderKanban className="w-4 h-4"/> Create Project
                </>)}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
