/**
 * @file Contains the logic for the Revert option in the Persistent Guides menu.
 * Restores the most recently replaced persistent guide injection to its
 * previous version (one level of undo), so a bad LLM generation can be
 * discarded in favor of what was there before.
 */
import { getContext, extensionName, debugLog } from './guideExports.js';

const notify = (type, message) => {
    try {
        if (typeof toastr !== 'undefined' && typeof toastr[type] === 'function') {
            toastr[type](message, 'Guided Generations');
            return;
        }
    } catch (_) {
        // ignore — fall through to console
    }
    console.warn(`[${extensionName}] ${message}`);
};

const revertGuide = async () => {
    debugLog('[RevertGuide] Button clicked');

    const context = getContext();
    if (!context || !context.chatMetadata) {
        notify('warning', 'No chat context available to revert.');
        return;
    }

    const guideId = context.chatMetadata.ggLastChangedGuide;
    const backup = guideId ? context.chatMetadata.ggPreviousGuideVersions?.[guideId] : null;

    if (!guideId || !backup) {
        notify('info', 'No previous guide version to revert to.');
        return;
    }

    // Reconstruct the injection entry using the backed-up metadata, in case the
    // guide was flushed in the meantime and no longer has a live entry.
    if (!context.chatMetadata.script_injects) {
        context.chatMetadata.script_injects = {};
    }
    context.chatMetadata.script_injects[guideId] = {
        ...(context.chatMetadata.script_injects[guideId] || {}),
        value: backup.value,
        depth: backup.depth,
        position: backup.position,
        scan: backup.scan,
        role: backup.role,
    };

    if (typeof context.setExtensionPrompt === 'function') {
        context.setExtensionPrompt(
            `script_inject_${guideId}`,
            backup.value,
            backup.position,
            backup.depth,
            backup.scan,
            backup.role,
            null
        );
    }

    // Only one level of undo is kept; drop the backup once it's been used.
    delete context.chatMetadata.ggPreviousGuideVersions[guideId];
    delete context.chatMetadata.ggLastChangedGuide;
    context.saveMetadataDebounced?.();

    debugLog(`[RevertGuide] Reverted guide "${guideId}" to its previous version.`);
    notify('success', `Reverted "${guideId}" guide to its previous version.`);
};

export default revertGuide;
