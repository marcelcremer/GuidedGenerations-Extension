/**
 * @file Shared helpers for backing up and restoring the previous version of a
 * single persistent guide's injection (one level of undo, per guide id).
 * Used by the automatic guide runner (runGuide.js) before it overwrites a
 * guide with freshly generated content, and by the Edit Guides popup before
 * it saves a manual edit, so either path can be undone from the popup.
 */

const BACKUP_KEY = 'ggPreviousGuideVersions';

/**
 * Snapshot the currently live injection for a guide (if any) into the
 * per-guide backup store, overwriting whatever was backed up before.
 * @param {object} context - SillyTavern context (from getContext()).
 * @param {string} guideId - The guide's injection id (e.g. 'rules', 'thinking').
 */
export function backupCurrentGuideInjection(context, guideId) {
    const current = context?.chatMetadata?.script_injects?.[guideId];
    if (!context?.chatMetadata || !current) return;

    if (!context.chatMetadata[BACKUP_KEY]) {
        context.chatMetadata[BACKUP_KEY] = {};
    }
    context.chatMetadata[BACKUP_KEY][guideId] = {
        value: current.value,
        depth: current.depth,
        position: current.position,
        scan: current.scan,
        role: current.role,
    };
}

/**
 * Retrieve the backed-up previous version of a guide, if one exists.
 * @param {object} context - SillyTavern context (from getContext()).
 * @param {string} guideId - The guide's injection id.
 * @returns {{value: string, depth: number, position: number, scan: boolean, role: string}|null}
 */
export function getGuideBackup(context, guideId) {
    return context?.chatMetadata?.[BACKUP_KEY]?.[guideId] ?? null;
}
