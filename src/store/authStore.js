import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { users, organization, demoCredentials } from '../data/mockData';
import { useAppStore } from './appStore';
import { useSSOStore } from './ssoStore';
import { createTrialSubscription } from '../utils/trialAccess';
export const useAuthStore = create()(persist((set, get) => ({
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    registeredAccounts: [],
    login: async (credentials) => {
        set({ isLoading: true, error: null });
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 600));
        const emailLower = credentials.email.toLowerCase().trim();
        // 0. Check SSO enforcement policy
        if (useSSOStore.getState().isDomainEnforced(emailLower)) {
            const domain = emailLower.split('@')[1];
            const errMsg = `Single Sign-On (SSO) is enforced for @${domain}. Please use your corporate SSO provider to sign in.`;
            set({ isLoading: false, error: errMsg });
            return { success: false, error: errMsg };
        }
        // 1. Check registered accounts
        const regAccount = (get().registeredAccounts || []).find((r) => r.email.toLowerCase().trim() === emailLower && r.password === credentials.password);
        if (regAccount) {
            const appUser = useAppStore.getState().users.find((u) => u.id === regAccount.user.id) || regAccount.user;
            if (appUser.status !== 'ACTIVE') {
                set({ isLoading: false, error: 'Account is not active. Please contact administrator.' });
                return { success: false };
            }
            const authUser = { ...appUser, authProvider: appUser.authProvider || 'PASSWORD', organization };
            set({ currentUser: authUser, isAuthenticated: true, isLoading: false, error: null });
            return { success: true, role: authUser.role };
        }
        // 2. Check demo accounts
        const demo = demoCredentials.find((d) => d.email.toLowerCase().trim() === emailLower && d.password === credentials.password);
        if (demo) {
            const appUsers = useAppStore.getState().users;
            const user = appUsers.find((u) => u.id === demo.userId) || users.find((u) => u.id === demo.userId);
            if (!user || user.status !== 'ACTIVE') {
                set({ isLoading: false, error: 'Account is not active. Please check your invitation email.' });
                return { success: false };
            }
            const authUser = { ...user, authProvider: user.authProvider || 'PASSWORD', organization };
            set({ currentUser: authUser, isAuthenticated: true, isLoading: false, error: null });
            return { success: true, role: user.role };
        }
        set({ isLoading: false, error: 'Invalid email or password.' });
        return { success: false };
    },
    loginWithSSO: async (claim) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 700));
        const emailLower = claim.email.toLowerCase().trim();
        const providerMap = {
            google: 'GOOGLE',
            microsoft: 'MICROSOFT',
            okta: 'OKTA',
            saml: 'SAML',
        };
        const authProvider = providerMap[claim.provider] || 'GOOGLE';
        // 1. Check existing app users
        const appUsers = useAppStore.getState().users;
        const existingUser = appUsers.find((u) => u.email.toLowerCase().trim() === emailLower);
        if (existingUser) {
            if (existingUser.status !== 'ACTIVE') {
                const errMsg = 'Account is not active. Please contact your organization administrator.';
                set({ isLoading: false, error: errMsg });
                return { success: false, error: errMsg };
            }
            // Update user's auth provider and lastActive
            useAppStore.getState().updateUser(existingUser.id, {
                authProvider,
                ssoExternalId: claim.id,
                lastActiveAt: new Date().toISOString(),
            });
            useAppStore.getState().addActivity({
                organizationId: organization.id,
                userId: existingUser.id,
                action: `signed in via SSO (${claim.provider.toUpperCase()})`,
                entityType: 'USER',
                entityId: existingUser.id,
                entityTitle: existingUser.name,
                createdAt: new Date().toISOString(),
            });
            const authUser = {
                ...existingUser,
                authProvider,
                ssoExternalId: claim.id,
                organization,
            };
            set({ currentUser: authUser, isAuthenticated: true, isLoading: false, error: null });
            return { success: true, role: authUser.role, isNewUser: false };
        }
        // 2. Check demo accounts
        const demo = demoCredentials.find((d) => d.email.toLowerCase().trim() === emailLower);
        if (demo) {
            const user = users.find((u) => u.id === demo.userId);
            if (user && user.status === 'ACTIVE') {
                const updatedUser = {
                    ...user,
                    authProvider,
                    ssoExternalId: claim.id,
                    lastActiveAt: new Date().toISOString(),
                };
                // Add or update in appStore
                const inApp = appUsers.some((u) => u.id === user.id);
                if (!inApp) {
                    useAppStore.setState((s) => ({ users: [...s.users, updatedUser] }));
                }
                else {
                    useAppStore.getState().updateUser(user.id, { authProvider, ssoExternalId: claim.id });
                }
                useAppStore.getState().addActivity({
                    organizationId: organization.id,
                    userId: user.id,
                    action: `signed in via SSO (${claim.provider.toUpperCase()})`,
                    entityType: 'USER',
                    entityId: user.id,
                    entityTitle: user.name,
                    createdAt: new Date().toISOString(),
                });
                const authUser = { ...updatedUser, organization };
                set({ currentUser: authUser, isAuthenticated: true, isLoading: false, error: null });
                return { success: true, role: user.role, isNewUser: false };
            }
        }
        // 3. User does not exist -> JIT Provisioning
        const ssoSettings = useSSOStore.getState().settings;
        if (!ssoSettings.jitProvisioningEnabled) {
            const errMsg = 'Account does not exist and Just-In-Time (JIT) provisioning is disabled for this organization.';
            set({ isLoading: false, error: errMsg });
            return { success: false, error: errMsg };
        }
        const avatarColors = ['#2563eb', '#7c3aed', '#0f766e', '#be185d', '#d97706', '#059669', '#0891b2', '#172554'];
        const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
        const assignedRole = claim.roleHint || ssoSettings.defaultRole || 'MEMBER';
        const roleDefaultJobTitles = {
            ADMIN: 'Administrator',
            PROJECT_MANAGER: 'Project Manager',
            TEAM_LEADER: 'Technical Lead',
            MEMBER: 'Software Engineer',
        };
        const newUser = {
            id: `u-sso-${Date.now()}`,
            organizationId: organization.id,
            employeeId: `EMP${Math.floor(2000 + Math.random() * 7999)}`,
            name: claim.name.trim() || emailLower.split('@')[0],
            email: emailLower,
            role: assignedRole,
            status: 'ACTIVE',
            avatarColor: randomColor,
            avatarUrl: claim.avatarUrl,
            jobTitle: claim.jobTitle || roleDefaultJobTitles[assignedRole],
            authProvider,
            ssoExternalId: claim.id,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };
        // Add to appStore users
        useAppStore.setState((s) => ({
            users: [...s.users, newUser],
        }));
        // Log audit activity
        useAppStore.getState().addActivity({
            organizationId: organization.id,
            userId: newUser.id,
            action: `provisioned via JIT SSO and signed in (${claim.provider.toUpperCase()})`,
            entityType: 'USER',
            entityId: newUser.id,
            entityTitle: newUser.name,
            createdAt: new Date().toISOString(),
        });
        const authUser = { ...newUser, organization };
        set({ currentUser: authUser, isAuthenticated: true, isLoading: false, error: null });
        return { success: true, role: newUser.role, isNewUser: true };
    },
    register: async (data) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 600));
        const emailLower = data.email.toLowerCase().trim();
        const existingDemo = demoCredentials.some((d) => d.email.toLowerCase().trim() === emailLower);
        const existingReg = (get().registeredAccounts || []).some((r) => r.email.toLowerCase().trim() === emailLower);
        const existingAppUser = useAppStore.getState().users.some((u) => u.email.toLowerCase().trim() === emailLower);
        if (existingDemo || existingReg || existingAppUser) {
            const errMsg = 'An account with this email already exists.';
            set({ isLoading: false, error: errMsg });
            return { success: false, error: errMsg };
        }
        const avatarColors = ['#2563eb', '#7c3aed', '#0f766e', '#be185d', '#d97706', '#059669', '#0891b2', '#172554'];
        const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
        const roleDefaultJobTitles = {
            ADMIN: 'Administrator',
            PROJECT_MANAGER: 'Project Manager',
            TEAM_LEADER: 'Technical Lead',
            MEMBER: 'Software Engineer',
        };
        const newUser = {
            id: `u-reg-${Date.now()}`,
            organizationId: organization.id,
            employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
            name: data.name.trim(),
            email: emailLower,
            role: data.role,
            status: 'ACTIVE',
            teamId: data.teamId,
            avatarColor: randomColor,
            jobTitle: data.jobTitle?.trim() || roleDefaultJobTitles[data.role],
            ...(data.subscription ? { subscription: data.subscription } : {}),
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };
        // Add to appStore users list
        useAppStore.setState((s) => ({
            users: [...s.users, newUser],
        }));
        // Log activity
        useAppStore.getState().addActivity({
            organizationId: organization.id,
            userId: newUser.id,
            action: 'registered a new user account',
            entityType: 'USER',
            entityId: newUser.id,
            entityTitle: newUser.name,
            createdAt: new Date().toISOString(),
        });
        const newAccount = {
            email: emailLower,
            password: data.password,
            user: newUser,
        };
        const authUser = { ...newUser, organization };
        set((s) => ({
            registeredAccounts: [...(s.registeredAccounts || []), newAccount],
            currentUser: authUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
        }));
        return { success: true, role: newUser.role };
    },
    /**
     * 7-Day Limited Trial sign-up: a new MEMBER account carrying a TRIAL
     * subscription record (see utils/trialAccess). No payment details.
     */
    registerTrial: (data) => get().register({
        ...data,
        role: 'MEMBER',
        jobTitle: 'Trial user',
        subscription: createTrialSubscription(),
    }),
    logout: () => {
        set({ currentUser: null, isAuthenticated: false, error: null });
    },
    clearError: () => set({ error: null }),
    updateCurrentUser: (updates) => {
        set((state) => ({
            currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
        }));
    },
}), {
    name: 'auth-storage',
    partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        registeredAccounts: state.registeredAccounts,
    }),
    onRehydrateStorage: () => (state) => {
        if (state && state.currentUser) {
            state.currentUser = {
                ...state.currentUser,
                organization,
            };
        }
    },
}));
