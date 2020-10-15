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
    'ui/highlighter',
    'css!taoQtiTestPreviewer/previewer/plugins/content/css/highlighterTray.css'
], function ($, __, hider, pluginFactory, highlighterTrayTpl, highlighterFactory) {
    'use strict';

    function highlight(highlighter, selection) {
        highlighter.highlightRanges(getAllRanges(selection));
        //Sending the highlighIndex to parent so that it can be saved on MS side
        selection.removeAllRanges();
        window.parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
    }

    function clearHighlights(highlighter) {
        highlighter.clearHighlights();
        window.parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
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
                containersBlackList: []
            });

            window.addEventListener('message', this.eventListener);

            this.$highlighterTray = $(
                highlighterTrayTpl({
                    label: __('highlighter')
                })
            );

            testRunner.after('renderitem', function () {
                window.parent.postMessage({ event: 'rendered' }, '*');
            });
        },

        /**
         * Called during the runner's render phase
         */
        render() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            $container.append(this.$highlighterTray);

            //hide highlighter menu by default
            this.hide();

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
            const $container = this.getAreaBroker().getArea('contentWrapper');
            hider.show($container.find('.highlighter-tray'));
        },

        /**
         * Hide the highlighter tray
         */
        hide() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            hider.hide($container.find('.highlighter-tray'));
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy() {
            this.$highlighterTray.remove();
            window.removeEventListener('message', this.eventListener);
        }
    });
});
