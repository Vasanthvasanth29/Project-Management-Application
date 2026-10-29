/**
 * Legacy demo fields (Client Name, Business Priority, Environment, Target
 * Release, Customer Impact, QA Owner) that used to be pre-seeded onto every
 * demo-project issue. They are no longer shipped: the Details section starts
 * with core fields only, and custom fields exist solely when an Admin/PM adds
 * them via "Add Field" on a specific issue. These ids are kept so persisted
 * snapshots written before this change can drop them during hydration
 * (see utils/customFieldPersistence).
 */
export const LEGACY_SEED_CUSTOM_FIELD_IDS = [
    'cf-seed-client-name',
    'cf-seed-business-priority',
    'cf-seed-environment',
    'cf-seed-target-release',
    'cf-seed-customer-impact',
    'cf-seed-qa-owner',
];
export const isLegacySeedCustomFieldId = (id) => LEGACY_SEED_CUSTOM_FIELD_IDS.includes(id);
/**
 * Unwanted custom fields accidentally created through the old Details-page
 * "Add Field" flow: duplicate "Client Name" entries and a stray "dept" field.
 * Their definitions live only in persisted localStorage snapshots — they are
 * purged at hydration (and their stored values stripped) so they never render
 * again on any work item type, surviving refresh and navigation.
 */
export const UNWANTED_CUSTOM_FIELD_NAMES = [
    'client name',
    'clientname',
    'client_name',
    'client-name',
    'dept',
];
const normalizeFieldName = (name) => name.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
/** True when a field's name/label matches one of the unwanted purged fields. */
export const isUnwantedCustomFieldName = (name) => {
    const normalized = normalizeFieldName(name);
    return UNWANTED_CUSTOM_FIELD_NAMES.some((n) => normalizeFieldName(n) === normalized);
};
/** No demo definitions — custom fields are configured per project + type by Admins. */
export const SEED_CUSTOM_FIELD_DEFINITIONS = [];
