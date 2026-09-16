/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Tool Plugin : Drawing canvas (Notes POC)
 *
 * Mode-based overlay: Notes captures pointer input except on answer widgets
 * (.text-container, checkbox/radio icons, ul.likert inside .qti-interaction). Respond leaves ink visible.
 */
define([
    'jquery',
    'i18n',
    'taoTests/runner/plugin',
    'util/shortcut',
    'css!taoQtiTestPreviewer/previewer/plugins/tools/drawingCanvas/css/drawingCanvas.css'
], function ($, __, pluginFactory, shortcut) {
    'use strict';

    const pluginName = 'drawingCanvas';
    const hostClass = 'drawing-canvas-host';
    const canvasClass = 'drawing-canvas';
    const drawingClass = 'is-drawing';
    const textModeClass = 'is-text-notes';
    const textLayerClass = 'drawing-text-layer';
    const textNoteClass = 'drawing-text-note';
    const textNoteHandleClass = 'drawing-text-note-handle';
    const textNoteBodyClass = 'drawing-text-note-body';
    const textNoteResizeClass = 'drawing-text-note-resize';
    const strokeStyle = '#c0392b';
    const lineWidth = 3;
    const interactionSelector = '.qti-interaction';
    const excludedWidgets = [
        '.text-container',
        '.icon-checkbox',
        '.icon-radio',
        '.real-label',
        'ul.likert'
    ];
    const excludedWidgetSelector = excludedWidgets.join(', ');
    const exclusionSelector = excludedWidgets
        .map(function prefixInteraction(selector) {
            return `${interactionSelector} ${selector}`;
        })
        .join(', ');

    const nativeListenerOpts = { capture: true, passive: false };
    const supportsPointer = typeof window.PointerEvent === 'function';

    /**
     * clientX/Y from pointer, mouse, or iPad touch (including touchend)
     * @param {PointerEvent|TouchEvent|Event} event
     * @returns {{clientX: number, clientY: number}|null}
     */
    function getClientCoords(event) {
        const src = event.changedTouches && event.changedTouches.length
            ? event.changedTouches[0]
            : event.touches && event.touches.length
                ? event.touches[0]
                : event;

        if (typeof src.clientX !== 'number' || typeof src.clientY !== 'number') {
            return null;
        }

        return {
            clientX: src.clientX,
            clientY: src.clientY
        };
    }

    /**
     * Map a pointer/touch event to canvas coordinates
     * @param {HTMLCanvasElement} canvas
     * @param {PointerEvent|TouchEvent|Event} event
     * @returns {{x: number, y: number}|null}
     */
    function getPoint(canvas, event) {
        const coords = getClientCoords(event);
        if (!coords) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width || 1;
        const scaleY = canvas.height / rect.height || 1;

        return {
            x: (coords.clientX - rect.left) * scaleX,
            y: (coords.clientY - rect.top) * scaleY
        };
    }

    /**
     * Restore stroke style after a canvas resize (setting width/height resets context)
     * @param {CanvasRenderingContext2D} context
     */
    function applyStrokeStyle(context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
    }

    return pluginFactory({
        name: pluginName,

        /**
         * Initialize the plugin (called during the runner's init)
         */
        init: function init() {
            const self = this;
            const testRunner = this.getTestRunner();

            let drawing = false;
            let textMode = false;
            let $canvas = $();
            let $host = $();
            let $textLayer = $();
            let canvas = null;
            let ctx = null;
            let inkCanvas = null;
            let inkCtx = null;
            let resizeObserver = null;
            let isStrokeActive = false;
            let skipNextMoveTo = false;
            let shortcutsPaused = false;
            let noteDrag = null;
            let noteResize = null;
            let inkStrokes = [];
            let activeStroke = [];
            const nativeListeners = [];

            /**
             * Overlay host: the item scroller (.content-wrapper) so ink follows scroll
             * @returns {jQuery}
             */
            function getHost() {
                const $content = self.getAreaBroker().getContentArea();
                const $wrapper = $content.closest('.content-wrapper');

                return $wrapper.length ? $wrapper : $content.parent();
            }

            /**
             * Measure the item, not the wrapper — an absolute canvas must not grow scrollHeight
             * @param {jQuery} host
             * @returns {{width: number, height: number}}
             */
            function getCanvasSize(host) {
                const hostEl = host.get(0);
                const $content = self.getAreaBroker().getContentArea();
                const $item = $content.find('.qti-item').first();
                const measureEl = $item.get(0) || $content.get(0) || hostEl;

                return {
                    width: Math.max(hostEl.clientWidth, host.innerWidth()),
                    height: Math.max(
                        measureEl.scrollHeight,
                        measureEl.offsetHeight,
                        hostEl.clientHeight
                    )
                };
            }

            /**
             * True when the pointer/finger is over an answer widget (not drawable).
             * @param {PointerEvent|TouchEvent|Event} event
             * @returns {Boolean}
             */
            function isExcludedEvent(event) {
                const coords = getClientCoords(event);
                if (!coords) {
                    return false;
                }

                const el = document.elementFromPoint(coords.clientX, coords.clientY);
                const $el = $(el);

                if ($el.closest(`.${textNoteClass}`).length) {
                    return true;
                }

                if (!$el.closest(interactionSelector).length) {
                    return false;
                }

                return $el.closest(excludedWidgetSelector).length > 0;
            }

            /**
             * Ignore extra fingers / non-primary pointers
             * @param {PointerEvent|TouchEvent|Event} event
             * @returns {Boolean}
             */
            function isPrimaryInput(event) {
                if (event.touches && event.touches.length > 1) {
                    return false;
                }
                if (typeof event.isPrimary === 'boolean') {
                    return event.isPrimary;
                }
                return true;
            }

            /**
             * Bind a non-passive listener (required so iPad cannot scroll while drawing)
             * @param {EventTarget} el
             * @param {String} type
             * @param {Function} handler
             */
            function addNativeListener(el, type, handler) {
                el.addEventListener(type, handler, nativeListenerOpts);
                nativeListeners.push({ el, type, handler });
            }

            /**
             * Remove listeners registered via addNativeListener
             */
            function removeNativeListeners() {
                nativeListeners.forEach(function unbind({ el, type, handler }) {
                    el.removeEventListener(type, handler, nativeListenerOpts);
                });
                nativeListeners.length = 0;
            }

            /**
             * Clear display pixels that overlap excluded widgets
             */
            function punchHoles() {
                if (!canvas || !ctx) {
                    return;
                }

                const canvasRect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / canvasRect.width || 1;
                const scaleY = canvas.height / canvasRect.height || 1;

                getHost()
                    .find(exclusionSelector)
                    .each(function punchInteraction() {
                        const rect = this.getBoundingClientRect();
                        ctx.clearRect(
                            (rect.left - canvasRect.left) * scaleX,
                            (rect.top - canvasRect.top) * scaleY,
                            rect.width * scaleX,
                            rect.height * scaleY
                        );
                    });
            }

            /**
             * Canvas point as a fraction of the current item, so ink can replay on another screen size
             * @param {{x: number, y: number}} point
             * @returns {{nx: number, ny: number}}
             */
            function toNorm(point) {
                return {
                    nx: point.x / (canvas.width || 1),
                    ny: point.y / (canvas.height || 1)
                };
            }

            /**
             * @param {{nx: number, ny: number}} point
             * @returns {{x: number, y: number}}
             */
            function fromNorm(point) {
                return {
                    x: point.nx * canvas.width,
                    y: point.ny * canvas.height
                };
            }

            /**
             * Redraw stored strokes at the current canvas size
             */
            function replayInk() {
                if (!inkCanvas || !inkCtx) {
                    return;
                }

                inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
                applyStrokeStyle(inkCtx);

                inkStrokes.forEach(function drawStroke(stroke) {
                    if (!stroke.length) {
                        return;
                    }
                    const first = fromNorm(stroke[0]);
                    inkCtx.beginPath();
                    inkCtx.moveTo(first.x, first.y);
                    if (stroke.length === 1) {
                        inkCtx.lineTo(first.x + 0.01, first.y);
                    } else {
                        stroke.forEach(function drawPoint(norm, index) {
                            if (index === 0) {
                                return;
                            }
                            const point = fromNorm(norm);
                            inkCtx.lineTo(point.x, point.y);
                        });
                    }
                    inkCtx.stroke();
                });
            }

            /**
             * Paint stored ink, then cut out current excluded widgets (live class targets)
             */
            function refreshDisplay() {
                if (!canvas || !ctx || !inkCanvas) {
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(inkCanvas, 0, 0);
                punchHoles();
                applyStrokeStyle(ctx);
            }

            /**
             * Size the canvas to the full item and replay notes against the live widgets
             */
            function syncCanvasSize() {
                const host = getHost();
                const hostEl = host.get(0);

                if (!hostEl || !canvas || !ctx || !inkCanvas || !inkCtx) {
                    return;
                }

                const { width, height } = getCanvasSize(host);

                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                    inkCanvas.width = width;
                    inkCanvas.height = height;
                    $canvas.css({
                        width: `${width}px`,
                        height: `${height}px`
                    });
                    if ($textLayer && $textLayer.length) {
                        $textLayer.css({
                            width: `${width}px`,
                            height: `${height}px`
                        });
                    }
                    applyStrokeStyle(ctx);
                    applyStrokeStyle(inkCtx);
                }

                replayInk();
                layoutTextNotes();
                refreshDisplay();
            }

            /**
             * Remove the canvas from the current item
             */
            function unmountCanvas() {
                const host = getHost();

                isStrokeActive = false;
                skipNextMoveTo = false;
                noteDrag = null;
                noteResize = null;
                inkStrokes = [];
                activeStroke = [];

                if (resizeObserver) {
                    resizeObserver.disconnect();
                    resizeObserver = null;
                }

                host.off(`.${pluginName}`);
                removeNativeListeners();

                if ($canvas && $canvas.length) {
                    $canvas.remove();
                }
                if ($textLayer && $textLayer.length) {
                    $textLayer.remove();
                }

                host.removeClass(`${hostClass} ${drawingClass} ${textModeClass}`);

                $canvas = $();
                $host = $();
                $textLayer = $();
                canvas = null;
                ctx = null;
                inkCanvas = null;
                inkCtx = null;

                if (shortcutsPaused) {
                    shortcut.enable();
                    shortcutsPaused = false;
                }
            }

            /**
             * Convert a viewport rect into host-scroll coordinates (same space as notes)
             * @param {DOMRect} domRect
             * @returns {{left: number, top: number, right: number, bottom: number}}
             */
            function toHostRect(domRect) {
                const hostEl = $host.get(0);
                const hostRect = hostEl.getBoundingClientRect();
                const left = domRect.left - hostRect.left + hostEl.scrollLeft;
                const top = domRect.top - hostRect.top + hostEl.scrollTop;

                return {
                    left,
                    top,
                    right: left + domRect.width,
                    bottom: top + domRect.height
                };
            }

            /**
             * Answer widgets the note box must not cover
             * @returns {Array<{left: number, top: number, right: number, bottom: number}>}
             */
            function getBlockedRects() {
                const rects = [];

                getHost()
                    .find(exclusionSelector)
                    .each(function collectBlocked() {
                        const rect = this.getBoundingClientRect();
                        if (rect.width && rect.height) {
                            rects.push(toHostRect(rect));
                        }
                    });

                return rects;
            }

            /**
             * @param {{left: number, top: number, right: number, bottom: number}} a
             * @param {{left: number, top: number, right: number, bottom: number}} b
             * @returns {Boolean}
             */
            function rectsOverlap(a, b) {
                return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            }

            /**
             * Keep the note fully on the overlay
             * @param {Number} left
             * @param {Number} top
             * @param {Number} width
             * @param {Number} height
             * @param {{left: number, top: number, right: number, bottom: number}} bounds
             * @returns {{left: number, top: number}}
             */
            function clampNotePosition(left, top, width, height, bounds) {
                return {
                    left: Math.min(Math.max(left, bounds.left), Math.max(bounds.left, bounds.right - width)),
                    top: Math.min(Math.max(top, bounds.top), Math.max(bounds.top, bounds.bottom - height))
                };
            }

            /**
             * Shift the note off excluded widgets; null if it cannot sit fully outside them
             * @param {Number} left
             * @param {Number} top
             * @param {Number} width
             * @param {Number} height
             * @param {Array} blockedRects
             * @param {{left: number, top: number, right: number, bottom: number}} bounds
             * @returns {{left: number, top: number}|null}
             */
            function resolveNotePosition(left, top, width, height, blockedRects, bounds) {
                function boxAt(pos) {
                    return {
                        left: pos.left,
                        top: pos.top,
                        right: pos.left + width,
                        bottom: pos.top + height
                    };
                }

                function isFree(pos) {
                    const box = boxAt(pos);
                    if (
                        box.left < bounds.left ||
                        box.top < bounds.top ||
                        box.right > bounds.right + 0.5 ||
                        box.bottom > bounds.bottom + 0.5
                    ) {
                        return false;
                    }

                    return !blockedRects.some(function overlapsBlocked(blocked) {
                        return rectsOverlap(box, blocked);
                    });
                }

                const origin = clampNotePosition(left, top, width, height, bounds);
                if (isFree(origin)) {
                    return origin;
                }

                const candidates = [origin];
                blockedRects.forEach(function addAroundBlocked(hit) {
                    candidates.push(
                        { left: hit.left - width, top: origin.top },
                        { left: hit.right, top: origin.top },
                        { left: origin.left, top: hit.top - height },
                        { left: origin.left, top: hit.bottom },
                        { left: hit.left - width, top: hit.top - height },
                        { left: hit.right, top: hit.top - height },
                        { left: hit.left - width, top: hit.bottom },
                        { left: hit.right, top: hit.bottom }
                    );
                });

                let best = null;
                let bestDist = Infinity;
                candidates.forEach(function scoreCandidate(candidate) {
                    const pos = clampNotePosition(candidate.left, candidate.top, width, height, bounds);
                    if (!isFree(pos)) {
                        return;
                    }
                    const dx = pos.left - left;
                    const dy = pos.top - top;
                    const dist = dx * dx + dy * dy;
                    if (dist < bestDist) {
                        bestDist = dist;
                        best = pos;
                    }
                });

                return best;
            }

            /**
             * Place a typed note at the pointer, fully outside excluded widgets
             * @param {PointerEvent|TouchEvent|Event} event
             * @returns {Boolean}
             */
            function createTextNote(event) {
                const coords = getClientCoords(event);
                const hostEl = $host.get(0);

                if (!coords || !hostEl || !$textLayer.length) {
                    return false;
                }

                const hostRect = hostEl.getBoundingClientRect();
                const left = coords.clientX - hostRect.left + hostEl.scrollLeft;
                const top = coords.clientY - hostRect.top + hostEl.scrollTop;
                const $note = $('<div>', {
                    class: textNoteClass
                });
                const $handle = $('<div>', {
                    class: textNoteHandleClass,
                    title: __('Move note')
                });
                const $body = $('<div>', {
                    class: textNoteBodyClass,
                    contenteditable: 'true',
                    spellcheck: 'false'
                });
                const $resize = $('<div>', {
                    class: textNoteResizeClass,
                    title: __('Resize note')
                });
                $note.append($handle, $body, $resize);

                $note.css({
                    left: `${left}px`,
                    top: `${top}px`,
                    visibility: 'hidden'
                });
                $textLayer.append($note);

                const noteWidth = $note.outerWidth();
                const noteHeight = $note.outerHeight();
                const layerEl = $textLayer.get(0);
                const bounds = {
                    left: 0,
                    top: 0,
                    right: layerEl.offsetWidth,
                    bottom: layerEl.offsetHeight
                };

                if (noteWidth > bounds.right || noteHeight > bounds.bottom) {
                    $note.remove();
                    return false;
                }

                const pos = resolveNotePosition(
                    left,
                    top,
                    noteWidth,
                    noteHeight,
                    getBlockedRects(),
                    bounds
                );

                if (!pos) {
                    $note.remove();
                    return false;
                }

                $note.css({
                    left: `${pos.left}px`,
                    top: `${pos.top}px`,
                    visibility: ''
                });
                rememberTextNoteLayout($note);
                bindTextNoteTyping($note);
                bindTextNoteDrag($note, $handle);
                bindTextNoteResize($note, $resize);
                $body.focus();
                return true;
            }

            /**
             * Overlay size in the same coordinates as note left/top
             * @returns {{left: number, top: number, right: number, bottom: number}}
             */
            function getNoteLayerBounds() {
                const layerEl = $textLayer.get(0);

                return {
                    left: 0,
                    top: 0,
                    right: layerEl ? layerEl.offsetWidth : 0,
                    bottom: layerEl ? layerEl.offsetHeight : 0
                };
            }

            /**
             * Pointer in host-scroll coordinates
             * @param {{clientX: number, clientY: number}} coords
             * @returns {{x: number, y: number}|null}
             */
            function clientToHostPoint(coords) {
                const hostEl = $host.get(0);
                if (!hostEl || !coords) {
                    return null;
                }
                const hostRect = hostEl.getBoundingClientRect();

                return {
                    x: coords.clientX - hostRect.left + hostEl.scrollLeft,
                    y: coords.clientY - hostRect.top + hostEl.scrollTop
                };
            }

            /**
             * @param {jQuery} $note
             * @param {Number} left
             * @param {Number} top
             */
            function applyNotePosition($note, left, top) {
                $note.css({
                    left: `${left}px`,
                    top: `${top}px`
                });
            }

            /**
             * Store text-note box as fractions of the item (same idea as ink)
             * @param {jQuery} $note
             */
            function rememberTextNoteLayout($note) {
                const bounds = getNoteLayerBounds();
                if (!bounds.right || !bounds.bottom) {
                    return;
                }

                $note.data({
                    nx: (parseFloat($note.css('left')) || 0) / bounds.right,
                    ny: (parseFloat($note.css('top')) || 0) / bounds.bottom,
                    nw: $note.outerWidth() / bounds.right,
                    nh: $note.outerHeight() / bounds.bottom
                });
            }

            /**
             * Scale text notes to the current item, then keep them off live excluded widgets
             */
            function layoutTextNotes() {
                if (!$textLayer || !$textLayer.length || noteDrag || noteResize) {
                    return;
                }

                const bounds = getNoteLayerBounds();
                if (!bounds.right || !bounds.bottom) {
                    return;
                }

                const blocked = getBlockedRects();

                $textLayer.children(`.${textNoteClass}`).each(function placeScaledNote() {
                    const $note = $(this);
                    if ($note.data('nx') == null) {
                        rememberTextNoteLayout($note);
                        return;
                    }

                    const width = ($note.data('nw') || 0) * bounds.right;
                    const height = ($note.data('nh') || 0) * bounds.bottom;
                    const left = $note.data('nx') * bounds.right;
                    const top = $note.data('ny') * bounds.bottom;
                    const minSize = getNoteMinSize($note);
                    const size = clampNoteSize(
                        left,
                        top,
                        width,
                        height,
                        bounds,
                        minSize.width,
                        minSize.height
                    );

                    applyNoteSize($note, size.width, size.height);

                    const pos = resolveNotePosition(left, top, size.width, size.height, blocked, bounds);
                    if (pos) {
                        applyNotePosition($note, pos.left, pos.top);
                    } else {
                        applyNotePosition(
                            $note,
                            clampNotePosition(left, top, size.width, size.height, bounds).left,
                            clampNotePosition(left, top, size.width, size.height, bounds).top
                        );
                    }
                });
            }

            /**
             * Keep the drop on the overlay and outside blocked widgets; otherwise revert
             * @param {jQuery} $note
             * @param {Number} left
             * @param {Number} top
             * @param {{left: number, top: number}} fallback
             */
            function dropNote($note, left, top, fallback) {
                const width = $note.outerWidth();
                const height = $note.outerHeight();
                const bounds = getNoteLayerBounds();
                const clamped = clampNotePosition(left, top, width, height, bounds);
                const box = {
                    left: clamped.left,
                    top: clamped.top,
                    right: clamped.left + width,
                    bottom: clamped.top + height
                };
                const blocked = getBlockedRects();
                const overlaps = blocked.some(function overlapsBlocked(rect) {
                    return rectsOverlap(box, rect);
                });

                if (overlaps) {
                    applyNotePosition($note, fallback.left, fallback.top);
                    rememberTextNoteLayout($note);
                    return;
                }

                applyNotePosition($note, clamped.left, clamped.top);
                rememberTextNoteLayout($note);
            }

            /**
             * Drag the note by its handle; drop is rejected on excluded widgets
             * @param {jQuery} $note
             * @param {jQuery} $handle
             */
            function bindTextNoteDrag($note, $handle) {
                const handleEl = $handle.get(0);
                const nativeOpts = { capture: true, passive: false };

                function onDragStart(e) {
                    if (!drawing || !isPrimaryInput(e)) {
                        return;
                    }
                    const coords = getClientCoords(e);
                    const hostPt = clientToHostPoint(coords);
                    if (!hostPt) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    const left = parseFloat($note.css('left')) || 0;
                    const top = parseFloat($note.css('top')) || 0;

                    noteDrag = {
                        $note,
                        startLeft: left,
                        startTop: top,
                        offsetX: hostPt.x - left,
                        offsetY: hostPt.y - top,
                        originX: coords.clientX,
                        originY: coords.clientY,
                        moved: false,
                        pointerId: e.pointerId
                    };

                    if (handleEl.setPointerCapture && e.pointerId != null) {
                        handleEl.setPointerCapture(e.pointerId);
                    }
                }

                function onDragMove(e) {
                    if (!noteDrag || noteDrag.$note.get(0) !== $note.get(0) || !isPrimaryInput(e)) {
                        return;
                    }
                    const coords = getClientCoords(e);
                    if (!coords) {
                        return;
                    }

                    const dx = coords.clientX - noteDrag.originX;
                    const dy = coords.clientY - noteDrag.originY;
                    if (!noteDrag.moved && dx * dx + dy * dy < 16) {
                        return;
                    }

                    e.preventDefault();
                    noteDrag.moved = true;
                    $note.addClass('is-dragging');

                    const hostPt = clientToHostPoint(coords);
                    if (!hostPt) {
                        return;
                    }

                    const pos = clampNotePosition(
                        hostPt.x - noteDrag.offsetX,
                        hostPt.y - noteDrag.offsetY,
                        $note.outerWidth(),
                        $note.outerHeight(),
                        getNoteLayerBounds()
                    );
                    applyNotePosition($note, pos.left, pos.top);
                }

                function onDragEnd() {
                    if (!noteDrag || noteDrag.$note.get(0) !== $note.get(0)) {
                        return;
                    }

                    const $dragged = noteDrag.$note;
                    const fallback = {
                        left: noteDrag.startLeft,
                        top: noteDrag.startTop
                    };
                    const moved = noteDrag.moved;
                    const left = parseFloat($dragged.css('left')) || 0;
                    const top = parseFloat($dragged.css('top')) || 0;

                    if (handleEl.releasePointerCapture && noteDrag.pointerId != null) {
                        try {
                            handleEl.releasePointerCapture(noteDrag.pointerId);
                        } catch (ignore) {
                            // capture already released
                        }
                    }

                    $dragged.removeClass('is-dragging');
                    noteDrag = null;

                    if (moved) {
                        dropNote($dragged, left, top, fallback);
                    } else {
                        $dragged.find(`.${textNoteBodyClass}`).focus();
                    }
                }

                if (supportsPointer) {
                    handleEl.addEventListener('pointerdown', onDragStart, nativeOpts);
                    handleEl.addEventListener('pointermove', onDragMove, nativeOpts);
                    handleEl.addEventListener('pointerup', onDragEnd, nativeOpts);
                    handleEl.addEventListener('pointercancel', onDragEnd, nativeOpts);
                } else {
                    handleEl.addEventListener('touchstart', onDragStart, nativeOpts);
                    handleEl.addEventListener('touchmove', onDragMove, nativeOpts);
                    handleEl.addEventListener('touchend', onDragEnd, nativeOpts);
                    handleEl.addEventListener('touchcancel', onDragEnd, nativeOpts);
                }
            }

            /**
             * @param {jQuery} $note
             * @param {Number} width
             * @param {Number} height
             */
            function applyNoteSize($note, width, height) {
                $note.css({
                    width: `${width}px`,
                    height: `${height}px`
                });
            }

            /**
             * Keep the note on the overlay and at least the default size
             * @param {Number} left
             * @param {Number} top
             * @param {Number} width
             * @param {Number} height
             * @param {{left: number, top: number, right: number, bottom: number}} bounds
             * @param {Number} minWidth
             * @param {Number} minHeight
             * @returns {{width: number, height: number}}
             */
            function clampNoteSize(left, top, width, height, bounds, minWidth, minHeight) {
                const maxWidth = Math.max(minWidth, bounds.right - left);
                const maxHeight = Math.max(minHeight, bounds.bottom - top);

                return {
                    width: Math.min(Math.max(width, minWidth), maxWidth),
                    height: Math.min(Math.max(height, minHeight), maxHeight)
                };
            }

            /**
             * @param {jQuery} $note
             * @returns {{width: number, height: number}}
             */
            function getNoteMinSize($note) {
                const style = window.getComputedStyle($note.get(0));

                return {
                    width: parseFloat(style.minWidth) || $note.outerWidth(),
                    height: parseFloat(style.minHeight) || $note.outerHeight()
                };
            }

            /**
             * Resize from the bottom-right; rejected if the box would cover excluded widgets
             * @param {jQuery} $note
             * @param {jQuery} $grip
             */
            function bindTextNoteResize($note, $grip) {
                const gripEl = $grip.get(0);
                const nativeOpts = { capture: true, passive: false };

                function onResizeStart(e) {
                    if (!drawing || !isPrimaryInput(e)) {
                        return;
                    }
                    const coords = getClientCoords(e);
                    if (!coords) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    const minSize = getNoteMinSize($note);
                    noteResize = {
                        $note,
                        startWidth: $note.outerWidth(),
                        startHeight: $note.outerHeight(),
                        left: parseFloat($note.css('left')) || 0,
                        top: parseFloat($note.css('top')) || 0,
                        minWidth: minSize.width,
                        minHeight: minSize.height,
                        moved: false,
                        pointerId: e.pointerId
                    };

                    if (gripEl.setPointerCapture && e.pointerId != null) {
                        gripEl.setPointerCapture(e.pointerId);
                    }
                }

                function onResizeMove(e) {
                    if (!noteResize || noteResize.$note.get(0) !== $note.get(0) || !isPrimaryInput(e)) {
                        return;
                    }
                    const coords = getClientCoords(e);
                    const hostPt = clientToHostPoint(coords);
                    if (!hostPt) {
                        return;
                    }

                    const size = clampNoteSize(
                        noteResize.left,
                        noteResize.top,
                        hostPt.x - noteResize.left,
                        hostPt.y - noteResize.top,
                        getNoteLayerBounds(),
                        noteResize.minWidth,
                        noteResize.minHeight
                    );

                    if (
                        !noteResize.moved &&
                        Math.abs(size.width - noteResize.startWidth) < 2 &&
                        Math.abs(size.height - noteResize.startHeight) < 2
                    ) {
                        return;
                    }

                    const box = {
                        left: noteResize.left,
                        top: noteResize.top,
                        right: noteResize.left + size.width,
                        bottom: noteResize.top + size.height
                    };
                    const overlaps = getBlockedRects().some(function overlapsBlocked(rect) {
                        return rectsOverlap(box, rect);
                    });
                    if (overlaps) {
                        return;
                    }

                    e.preventDefault();
                    noteResize.moved = true;
                    $note.addClass('is-resizing');
                    applyNoteSize($note, size.width, size.height);
                }

                function onResizeEnd() {
                    if (!noteResize || noteResize.$note.get(0) !== $note.get(0)) {
                        return;
                    }

                    const $resized = noteResize.$note;
                    const fallback = {
                        width: noteResize.startWidth,
                        height: noteResize.startHeight
                    };
                    const width = $resized.outerWidth();
                    const height = $resized.outerHeight();
                    const box = {
                        left: noteResize.left,
                        top: noteResize.top,
                        right: noteResize.left + width,
                        bottom: noteResize.top + height
                    };
                    const overlaps = getBlockedRects().some(function overlapsBlocked(rect) {
                        return rectsOverlap(box, rect);
                    });

                    if (gripEl.releasePointerCapture && noteResize.pointerId != null) {
                        try {
                            gripEl.releasePointerCapture(noteResize.pointerId);
                        } catch (ignore) {
                            // capture already released
                        }
                    }

                    $resized.removeClass('is-resizing');
                    noteResize = null;

                    if (overlaps) {
                        applyNoteSize($resized, fallback.width, fallback.height);
                    }
                    rememberTextNoteLayout($resized);
                }

                if (supportsPointer) {
                    gripEl.addEventListener('pointerdown', onResizeStart, nativeOpts);
                    gripEl.addEventListener('pointermove', onResizeMove, nativeOpts);
                    gripEl.addEventListener('pointerup', onResizeEnd, nativeOpts);
                    gripEl.addEventListener('pointercancel', onResizeEnd, nativeOpts);
                } else {
                    gripEl.addEventListener('touchstart', onResizeStart, nativeOpts);
                    gripEl.addEventListener('touchmove', onResizeMove, nativeOpts);
                    gripEl.addEventListener('touchend', onResizeEnd, nativeOpts);
                    gripEl.addEventListener('touchcancel', onResizeEnd, nativeOpts);
                }
            }

            /**
             * Keep previewer letter shortcuts (Next, calculator, …) from firing while typing
             */
            function pauseRunnerShortcuts() {
                if (shortcutsPaused) {
                    return;
                }
                shortcut.disable();
                shortcutsPaused = true;
            }

            /**
             * Restore letter shortcuts after leaving a text note
             */
            function resumeRunnerShortcuts() {
                window.setTimeout(function restoreShortcuts() {
                    if (!shortcutsPaused) {
                        return;
                    }
                    if (document.activeElement && document.activeElement.closest(`.${textNoteClass}`)) {
                        return;
                    }
                    shortcut.enable();
                    shortcutsPaused = false;
                }, 0);
            }

            /**
             * Stop key events from reaching runner shortcuts; pause them while the note is focused
             * @param {jQuery} $note
             */
            function bindTextNoteTyping($note) {
                $note.on('keydown keyup keypress', function stopNoteShortcut(e) {
                    e.stopPropagation();
                });
                $note.on('focusin', pauseRunnerShortcuts);
                $note.on('focusout', resumeRunnerShortcuts);
            }

            /**
             * Text-notes tool: click to type instead of draw (only while Notes is on)
             * @param {Boolean} enabled
             */
            function toggleTextMode(enabled) {
                textMode = Boolean(enabled) && drawing;

                if ($host && $host.length) {
                    $host.toggleClass(textModeClass, textMode);
                }

                if (self.buttonText) {
                    if (textMode) {
                        self.buttonText.turnOn();
                    } else {
                        self.buttonText.turnOff();
                    }
                }
            }

            /**
             * Show or hide tools that only apply while Notes is active
             */
            function syncNoteTools() {
                if (!self.buttonText) {
                    return;
                }
                if (drawing) {
                    self.buttonText.show();
                    self.buttonText.enable();
                } else {
                    toggleTextMode(false);
                    self.buttonText.hide();
                    self.buttonText.disable();
                }
            }

            /**
             * Switch between Notes (draw) and Respond (pass-through)
             * @param {Boolean} enabled
             */
            function toggleDrawing(enabled) {
                drawing = Boolean(enabled);

                if ($host && $host.length) {
                    $host.toggleClass(drawingClass, drawing);
                }

                if (drawing) {
                    syncCanvasSize();
                } else {
                    toggleTextMode(false);
                }

                syncNoteTools();

                if (self.buttonNotes) {
                    if (drawing) {
                        self.buttonNotes.turnOn();
                    } else {
                        self.buttonNotes.turnOff();
                    }
                }
            }

            /**
             * Erase ink on the current item
             */
            function clearCanvas() {
                if (!inkCanvas || !inkCtx) {
                    return;
                }
                inkStrokes = [];
                activeStroke = [];
                inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
                applyStrokeStyle(inkCtx);
                if ($textLayer && $textLayer.length) {
                    $textLayer.empty();
                }
                refreshDisplay();
            }

            /**
             * Mount a canvas inside .content-wrapper so it scrolls with the item
             */
            function mountCanvas() {
                unmountCanvas();

                $host = getHost();

                if (!$host.length) {
                    return;
                }

                $host.addClass(hostClass);

                $canvas = $('<canvas>', {
                    class: canvasClass,
                    'aria-hidden': 'true'
                });
                canvas = $canvas.get(0);
                ctx = canvas.getContext('2d');
                inkCanvas = document.createElement('canvas');
                inkCtx = inkCanvas.getContext('2d');
                $host.append($canvas);

                $textLayer = $('<div>', {
                    class: textLayerClass,
                    'aria-hidden': 'false'
                });
                $host.append($textLayer);

                syncCanvasSize();
                applyStrokeStyle(ctx);
                applyStrokeStyle(inkCtx);

                const hostEl = $host.get(0);

                function onDrawStart(e) {
                    if (!drawing || noteDrag || noteResize || !isPrimaryInput(e)) {
                        return;
                    }
                    if (isExcludedEvent(e)) {
                        return;
                    }
                    if (textMode) {
                        e.preventDefault();
                        if (createTextNote(e)) {
                            toggleTextMode(false);
                        }
                        return;
                    }
                    const point = getPoint(canvas, e);
                    if (!point) {
                        return;
                    }
                    e.preventDefault();
                    isStrokeActive = true;
                    skipNextMoveTo = false;
                    activeStroke = [toNorm(point)];
                    if (hostEl.setPointerCapture && e.pointerId != null) {
                        hostEl.setPointerCapture(e.pointerId);
                    }
                    inkCtx.beginPath();
                    inkCtx.moveTo(point.x, point.y);
                }

                function onDrawMove(e) {
                    if (!drawing || noteDrag || noteResize || textMode || !isStrokeActive || !isPrimaryInput(e)) {
                        return;
                    }
                    if (isExcludedEvent(e)) {
                        if (activeStroke.length) {
                            inkStrokes.push(activeStroke);
                            activeStroke = [];
                        }
                        skipNextMoveTo = true;
                        return;
                    }
                    const point = getPoint(canvas, e);
                    if (!point) {
                        return;
                    }
                    e.preventDefault();
                    if (skipNextMoveTo) {
                        inkCtx.beginPath();
                        inkCtx.moveTo(point.x, point.y);
                        activeStroke = [toNorm(point)];
                        skipNextMoveTo = false;
                    } else {
                        inkCtx.lineTo(point.x, point.y);
                        inkCtx.stroke();
                        activeStroke.push(toNorm(point));
                    }
                    refreshDisplay();
                }

                function onDrawEnd() {
                    if (activeStroke.length) {
                        inkStrokes.push(activeStroke);
                        activeStroke = [];
                    }
                    isStrokeActive = false;
                    skipNextMoveTo = false;
                    refreshDisplay();
                }

                if (supportsPointer) {
                    addNativeListener(hostEl, 'pointerdown', onDrawStart);
                    addNativeListener(hostEl, 'pointermove', onDrawMove);
                    addNativeListener(hostEl, 'pointerup', onDrawEnd);
                    addNativeListener(hostEl, 'pointercancel', onDrawEnd);
                } else {
                    addNativeListener(hostEl, 'touchstart', onDrawStart);
                    addNativeListener(hostEl, 'touchmove', onDrawMove);
                    addNativeListener(hostEl, 'touchend', onDrawEnd);
                    addNativeListener(hostEl, 'touchcancel', onDrawEnd);
                }

                const $item = self.getAreaBroker().getContentArea().find('.qti-item').first();
                const observeEl = $item.get(0) || hostEl;
                if (typeof ResizeObserver === 'function' && observeEl) {
                    resizeObserver = new ResizeObserver(function () {
                        syncCanvasSize();
                    });
                    resizeObserver.observe(observeEl);
                    if (observeEl !== hostEl) {
                        resizeObserver.observe(hostEl);
                    }
                }

                toggleDrawing(drawing);
            }

            this._unmountCanvas = unmountCanvas;
            this._toggleDrawing = toggleDrawing;
            this._syncNoteTools = syncNoteTools;

            this.buttonNotes = this.getAreaBroker()
                .getToolbox()
                .createEntry({
                    control: 'drawing-notes',
                    title: __('Draw notes on the item'),
                    icon: 'edit',
                    text: __('Notes')
                });

            this.buttonText = this.getAreaBroker()
                .getToolbox()
                .createEntry({
                    control: 'drawing-text-notes',
                    title: __('Type a text note on the item'),
                    icon: 'font',
                    text: __('Text notes')
                });

            this.buttonClear = this.getAreaBroker()
                .getToolbox()
                .createEntry({
                    control: 'drawing-notes-clear',
                    title: __('Clear notes on this item'),
                    icon: 'result-nok',
                    text: __('Clear notes')
                });

            this.buttonNotes.on('click', function (e) {
                e.preventDefault();
                if (self.getState('enabled') !== false) {
                    toggleDrawing(!drawing);
                }
            });

            this.buttonText.on('click', function (e) {
                e.preventDefault();
                if (self.getState('enabled') !== false && drawing) {
                    toggleTextMode(!textMode);
                }
            });

            this.buttonClear.on('click', function (e) {
                e.preventDefault();
                if (self.getState('enabled') !== false) {
                    clearCanvas();
                }
            });

            this.buttonText.hide();
            this.buttonText.disable();
            this.disable();

            testRunner
                .after('renderitem', function () {
                    mountCanvas();
                })
                .on('enabletools renderitem', function () {
                    self.enable();
                })
                .on('disabletools', function () {
                    self.disable();
                })
                .on('unloaditem', function () {
                    toggleDrawing(false);
                    unmountCanvas();
                    self.disable();
                });
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy: function destroy() {
            if (this._toggleDrawing) {
                this._toggleDrawing(false);
            }
            if (this._unmountCanvas) {
                this._unmountCanvas();
            }
            if (this.buttonNotes) {
                this.buttonNotes.off('click');
            }
            if (this.buttonText) {
                this.buttonText.off('click');
            }
            if (this.buttonClear) {
                this.buttonClear.off('click');
            }
        },

        /**
         * Enable the buttons
         */
        enable: function enable() {
            if (this.buttonNotes) {
                this.buttonNotes.enable();
            }
            if (this.buttonClear) {
                this.buttonClear.enable();
            }
            if (this._syncNoteTools) {
                this._syncNoteTools();
            }
        },

        /**
         * Disable the buttons
         */
        disable: function disable() {
            if (this.buttonNotes) {
                this.buttonNotes.disable();
            }
            if (this.buttonText) {
                this.buttonText.disable();
            }
            if (this.buttonClear) {
                this.buttonClear.disable();
            }
        },

        /**
         * Show the buttons
         */
        show: function show() {
            if (this.buttonNotes) {
                this.buttonNotes.show();
            }
            if (this.buttonClear) {
                this.buttonClear.show();
            }
            if (this._syncNoteTools) {
                this._syncNoteTools();
            }
        },

        /**
         * Hide the buttons
         */
        hide: function hide() {
            if (this.buttonNotes) {
                this.buttonNotes.hide();
            }
            if (this.buttonText) {
                this.buttonText.hide();
            }
            if (this.buttonClear) {
                this.buttonClear.hide();
            }
        }
    });
});
