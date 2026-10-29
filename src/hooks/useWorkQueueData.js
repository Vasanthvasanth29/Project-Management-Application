import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { getIssueKeyPrefix } from '../utils/projectIdentity';
import { buildProjectTeamMembers, getEpicColor } from '../utils/sprintIssues';
/** Adapt one Work Queue row to the Iterations table's issue shape (same fields). */
export const toIterationIssue = (issue) => ({
    id: issue.id,
    key: issue.key,
    title: issue.title,
    type: issue.type,
    priority: issue.priority,
    status: issue.status,
    resolution: issue.resolution,
    releaseTag: issue.releaseTag,
    epicName: issue.epicName,
    epicColor: issue.epicColor,
    assigneeName: issue.assigneeName,
    assigneeInitial: issue.assigneeInitial,
    assigneeAvatarColor: issue.assigneeAvatarColor,
    avatarUrl: issue.avatarUrl,
    storyPoints: issue.storyPoints,
    updatedDate: issue.updatedDate,
});
/**
 * The single source of the Product Work Queue: real project tasks without a
 * sprint plus the domain seed rows, held in one local issue list. Every
 * consumer (Iterations left-panel Work Queue card + right-panel table, and the
 * standalone Backlog tab) reads this hook, so the queue count and items can
 * never drift between surfaces. Moving a real task updates the store; the
 * derived pool follows reactively.
 */
export const useWorkQueueData = (projectId) => {
    const { projects, tasks, users, teams } = useAppStore();
    const project = projects.find((p) => p.id === projectId);
    const projectKey = getIssueKeyPrefix(project) || 'PRJ';
    const projectTeamMembers = useMemo(() => buildProjectTeamMembers(project, teams, users), [project, teams, users]);
    // Domain templates for common project types
    const isHealthcare = project?.category?.toLowerCase().includes('health') || project?.name?.toLowerCase().includes('hospital');
    const isEcommerce = project?.category?.toLowerCase().includes('retail') || project?.name?.toLowerCase().includes('e-commerce') || project?.name?.toLowerCase().includes('commerce');
    const domainEpics = useMemo(() => {
        return isHealthcare
            ? ['Patient Records', 'Doctor Scheduling', 'Billing & Claims', 'Pharmacy & Lab', 'EMR Integration']
            : isEcommerce
                ? ['Checkout & Cart', 'Product Catalog', 'Payment Gateway', 'Order Processing', 'Search & Discovery']
                : ['Core Platform', 'Security & IAM', 'Workflow Engine', 'Integration APIs', 'Analytics & Reporting'];
    }, [isHealthcare, isEcommerce]);
    // Master pool of issues across Iterations and the Work Queue
    const initialIssues = useMemo(() => {
        const projectTasks = tasks.filter((t) => t.projectId === projectId && t.type !== 'EPIC');
        const domainSeedBacklog = isHealthcare
            ? [
                { title: 'HL7 FHIR Clinical Telemetry API Connector for Inpatient Monitors', epic: 'EMR Integration', points: 8, priority: 'CRITICAL', assignee: 'Alex Chen', isGroomed: true },
                { title: 'Patient Consent & HIPAA Audit Log Data Retention Automation', epic: 'Patient Records', points: 5, priority: 'HIGH', assignee: 'Priya Sharma', isGroomed: true },
                { title: 'Automated Pharmacy Formulary Drug-Drug Interaction Warning Guard', epic: 'Pharmacy & Lab', points: 5, priority: 'HIGH', assignee: 'David Kim', isGroomed: true },
                { title: 'Outpatient Telehealth WebRTC Session Recording & Cloud Archival', epic: 'EMR Integration', points: 3, priority: 'MEDIUM', assignee: 'Marcus Vance', isGroomed: false },
                { title: 'Medical Insurance Pre-Authorization Automated Claims EDI 278 Engine', epic: 'Billing & Claims', points: 8, priority: 'HIGH', assignee: 'Maya Patel', isGroomed: true },
                { title: 'Physician On-Call Rotations Shift Swapping Mobile Flow', epic: 'Doctor Scheduling', points: 3, priority: 'LOW', assignee: 'Elena Rostova', isGroomed: false },
                { title: 'Emergency Department Real-time Bed Occupancy Dashboard on Wallboard', epic: 'Doctor Scheduling', points: 5, priority: 'HIGH', assignee: 'Alex Chen', isGroomed: true },
                { title: 'Lab Results Automated SMS Patient Notification with Secure Token', epic: 'Pharmacy & Lab', points: 2, priority: 'MEDIUM', assignee: 'Priya Sharma', isGroomed: true },
            ]
            : isEcommerce
                ? [
                    { title: 'Apple Pay & Google Pay One-Touch Express Checkout Gateway', epic: 'Payment Gateway', points: 5, priority: 'CRITICAL', assignee: 'Elena Rostova', isGroomed: true },
                    { title: 'Real-time Multi-Warehouse Inventory Allocation & Split Shipments', epic: 'Order Processing', points: 8, priority: 'HIGH', assignee: 'Priya Sharma', isGroomed: true },
                    { title: 'AI-Powered Related Products Recommendation Carousel on PDP', epic: 'Search & Discovery', points: 5, priority: 'HIGH', assignee: 'Marcus Vance', isGroomed: true },
                    { title: 'Dynamic Multi-Currency Price Localization & Geolocation GeoIP', epic: 'Product Catalog', points: 3, priority: 'MEDIUM', assignee: 'Alex Chen', isGroomed: false },
                    { title: 'Automated Abandoned Cart Recovery Email Sequence with Discount Token', epic: 'Checkout & Cart', points: 5, priority: 'HIGH', assignee: 'Maya Patel', isGroomed: true },
                    { title: 'Customer Product Reviews & Star Rating System with Photo Upload', epic: 'Product Catalog', points: 3, priority: 'MEDIUM', assignee: 'David Kim', isGroomed: true },
                    { title: 'Self-Service Customer Returns Portal with Prepaid Return Label PDF', epic: 'Order Processing', points: 5, priority: 'HIGH', assignee: 'Marcus Vance', isGroomed: false },
                    { title: 'B2B Bulk Wholesale Order Matrix & Net-30 Invoicing Engine', epic: 'Checkout & Cart', points: 8, priority: 'MEDIUM', assignee: 'Liam O\'Connor', isGroomed: true },
                    { title: 'Automated TaxJar & Avalara Sales Tax Calculation Sync', epic: 'Payment Gateway', points: 3, priority: 'LOW', assignee: 'Elena Rostova', isGroomed: false },
                ]
                : [
                    { title: 'Multi-Tenant Database Row-Level Security Partitioning Engine', epic: 'Core Platform', points: 8, priority: 'CRITICAL', assignee: 'Priya Sharma', isGroomed: true },
                    { title: 'Real-time WebSocket Push Notification Service with Redis PubSub', epic: 'Integration APIs', points: 5, priority: 'HIGH', assignee: 'Alex Chen', isGroomed: true },
                    { title: 'Enterprise SSO SCIM 2.0 User Provisioning & Deprovisioning Flow', epic: 'Security & IAM', points: 5, priority: 'HIGH', assignee: 'Marcus Vance', isGroomed: true },
                    { title: 'Custom Workflow Visual State Diagram Editor with Node Connectors', epic: 'Workflow Engine', points: 8, priority: 'HIGH', assignee: 'David Kim', isGroomed: false },
                    { title: 'Automated PDF & CSV Scheduled Executive Delivery Export Queue', epic: 'Analytics & Reporting', points: 3, priority: 'MEDIUM', assignee: 'Maya Patel', isGroomed: true },
                    { title: 'API Rate Limiting by Tenant Tier with Cloudflare Worker Interceptor', epic: 'Integration APIs', points: 5, priority: 'HIGH', assignee: 'Elena Rostova', isGroomed: false },
                ];
        const result = [];
        // 1. Existing tasks from appStore
        projectTasks.forEach((t, index) => {
            const assignee = users.find((u) => u.id === t.assigneeId);
            const epic = domainEpics[index % domainEpics.length];
            const keyNum = 100 + index;
            result.push({
                id: t.id,
                key: t.issueKey || `${projectKey}-${keyNum}`,
                title: t.title,
                type: t.type === 'BUG_FIX' ? 'BUG' : t.type === 'FEATURE' ? 'STORY' : 'TASK',
                priority: t.priority,
                status: t.status,
                resolution: t.resolution,
                releaseTag: `${projectKey} PI24`,
                epicName: epic,
                epicColor: getEpicColor(epic),
                assigneeName: assignee ? assignee.name : 'Unassigned',
                assigneeInitial: assignee ? assignee.name[0] : 'U',
                assigneeAvatarColor: assignee?.avatarColor || '#64748b',
                avatarUrl: assignee?.avatarUrl,
                storyPoints: t.storyPoints || 3,
                updatedDate: t.updatedAt ? t.updatedAt.split('T')[0] : '2026-09-15',
                sprintId: t.sprintId || null,
                isGroomed: true,
                isFlagged: t.isFlagged,
            });
        });
        // 2. Unassigned candidate stories for the Product Work Queue pool
        domainSeedBacklog.forEach((seed, idx) => {
            const keyNum = 201 + idx;
            const assigneeUser = projectTeamMembers[idx % projectTeamMembers.length];
            result.push({
                id: `backlog-seed-${keyNum}`,
                key: `${projectKey}-${keyNum}`,
                title: seed.title,
                type: 'STORY',
                priority: seed.priority,
                status: 'TODO',
                releaseTag: `${projectKey} Work Queue`,
                epicName: seed.epic,
                epicColor: getEpicColor(seed.epic),
                assigneeName: assigneeUser ? assigneeUser.name : seed.assignee,
                assigneeInitial: assigneeUser ? assigneeUser.name[0] : seed.assignee[0],
                assigneeAvatarColor: assigneeUser?.avatarColor || '#0284c7',
                avatarUrl: assigneeUser?.avatarUrl,
                storyPoints: seed.points,
                updatedDate: '2026-09-15',
                sprintId: null, // specifically in unassigned backlog
                isGroomed: seed.isGroomed,
            });
        });
        // A seed row exists only until its real Task exists: opening (materialising)
        // a Work Queue row must REPLACE the seed with the live record — never show
        // both. Match on key or title, since some materialisation paths set the
        // Jira key and some only reuse the title.
        const isSeedRow = (r) => r.id.startsWith('backlog-seed-');
        const taskKeys = new Set(result.filter((r) => !isSeedRow(r)).map((r) => r.key.trim().toUpperCase()));
        const taskTitles = new Set(result.filter((r) => !isSeedRow(r)).map((r) => r.title.trim().toLowerCase()));
        return result.filter((r) => !isSeedRow(r) ||
            (!taskKeys.has(r.key.trim().toUpperCase()) && !taskTitles.has(r.title.trim().toLowerCase())));
    }, [tasks, projectId, projectKey, users, projectTeamMembers, domainEpics, isHealthcare, isEcommerce]);
    // Master issues state
    const [issues, setIssues] = useState(initialIssues);
    useEffect(() => {
        setIssues(initialIssues);
    }, [initialIssues]);
    // Work Queue pool — the unassigned rows. A seed row whose real task was
    // materialised into an iteration (via Open / Move Work Item) no longer counts
    // as queue work: the store task now renders inside that iteration instead.
    const workQueuePool = useMemo(() => {
        const placedTaskKeys = new Set();
        const placedTaskTitles = new Set();
        tasks.forEach((t) => {
            if (t.projectId !== projectId || !t.sprintId)
                return;
            if (t.issueKey)
                placedTaskKeys.add(t.issueKey.trim().toUpperCase());
            placedTaskTitles.add(t.title.trim().toLowerCase());
        });
        return issues.filter((issue) => {
            if (issue.sprintId !== null)
                return false;
            if (placedTaskKeys.has(issue.key.trim().toUpperCase()))
                return false;
            if (placedTaskTitles.has(issue.title.trim().toLowerCase()))
                return false;
            return true;
        });
    }, [issues, tasks, projectId]);
    const workQueueStats = useMemo(() => {
        let totalPoints = 0;
        let highPoints = 0;
        let groomedPoints = 0;
        let groomedCount = 0;
        workQueuePool.forEach((t) => {
            if (t.status === 'CANCELLED' || (t.status === 'DONE' && t.resolution === 'CANCELLED'))
                return;
            totalPoints += t.storyPoints;
            if (t.priority === 'HIGH' || t.priority === 'CRITICAL')
                highPoints += t.storyPoints;
            if (t.isGroomed) {
                groomedPoints += t.storyPoints;
                groomedCount++;
            }
        });
        const readinessPct = workQueuePool.length > 0 ? Math.round((groomedCount / workQueuePool.length) * 100) : 0;
        return {
            totalIssues: workQueuePool.length,
            totalPoints,
            highPoints,
            groomedPoints,
            groomedCount,
            readinessPct,
        };
    }, [workQueuePool]);
    return {
        project,
        projectKey,
        projectTeamMembers,
        domainEpics,
        isHealthcare,
        isEcommerce,
        issues,
        setIssues,
        workQueuePool,
        workQueueStats,
    };
};
