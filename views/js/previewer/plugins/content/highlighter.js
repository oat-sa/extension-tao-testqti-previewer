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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Highlighter Plugin
 */
define([
    'jquery',
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'tpl!taoQtiTestPreviewer/previewer/plugins/content/tpl/highlighter-tray',
    'tpl!taoQtiTest/runner/plugins/templates/button',
    'ui/highlighter',
    'css!taoQtiTestPreviewer/previewer/plugins/content/css/highlighterTray.css'
], function ($, __, hider, pluginFactory, highlighterTrayTpl, buttonTpl, highlighterFactory) {
    'use strict';

    function highlight(highlighter, selection) {
        highlighter.highlightRanges(getAllRanges(selection));
        //Sending the highlighIndex to parent so that it can be saved on MS side
        parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
    }

    function clearHighlights(highlighter) {
        highlighter.clearHighlights();
        parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
    }

    function getAllRanges(selection) {
        const allRanges = [];

        for (let i = 0; i < selection.rangeCount; i++) {
            allRanges.push(selection.getRangeAt(i));
        }
        return allRanges;
    }

    return pluginFactory({
        name: 'highlighter',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();

            if (!window.getSelection) {
                throw new Error('Browser does not support getSelection()');
            }
            this.selection = window.getSelection();

            const addListenerMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
            const addListener = window[addListenerMethod];
            const messageEvent = addListenerMethod === 'attachEvent' ? 'onmessage' : 'message';

            this.eventListener = e => {
                if (e.data.event === 'setIndex') {
                    // Applying any highlighIndex received from parent
                    this.highlighter.highlightFromIndex(e.data.payload);
                } else if (this.$highlighterTray) {
                    if (e.data.event === 'hide') {
                        this.hide();
                    } else if (e.data.event === 'show') {
                        this.show();
                    }
                }
            };

            this.highlighter = highlighterFactory({
                className: 'txt-user-highlight',
                containerSelector: '.qti-itemBody',
                containersBlackList: [],
                clearOnClick: true
            });

            addListener(messageEvent, this.eventListener);

            this.$highlighterTray = $(
                highlighterTrayTpl({
                    label: __('highlighter')
                })
            );
            //hide highlighter menu by default
            hider.hide(this.$highlighterTray);

            testRunner.after('renderitem', function () {
                parent.postMessage({ event: 'rendered' }, '*');
            });
        },

        /**
         * Called during the runner's render phase
         */
        render() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            $container.append(this.$highlighterTray);

            const $eraser = $container.find('button.icon-eraser');
            $eraser.on('click', e => {
                e.preventDefault();
                clearHighlights(this.highlighter, this.selection);
            });

            const $color = $container.find('.color-button');
            $color.on('click', e => {
                e.preventDefault();
                highlight(this.highlighter, this.selection);
            });
        },

        /**
         * Show the highlighter tray
         */
        show() {
            hider.show(this.$highlighterTray);
        },

        /**
         * Hide the highlighter tray
         */
        hide() {
            hider.hide(this.$highlighterTray);
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy() {
            this.$highlighterTray.remove();

            const removeListenerMethod = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
            const removeListener = window[removeListenerMethod];
            const messageEvent = window.removeEventListener === 'detachEvent' ? 'onmessage' : 'message';
            removeListener(messageEvent, this.eventListener);
        }
    });
});
