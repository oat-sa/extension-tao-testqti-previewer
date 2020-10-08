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
    'lodash',
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'tpl!taoQtiTestPreviewer/previewer/plugins/content/tpl/highlighter-tray',
    'tpl!taoQtiTest/runner/plugins/templates/button',
    'ui/highlighter',
    'css!taoQtiTestPreviewer/previewer/plugins/content/css/highlighterTray.css'
], function ($, _, __, hider, pluginFactory,  highlighterTrayTpl, buttonTpl, highlighterFactory) {
    'use strict';

    function highlight(highlighter, selection) {
        highlighter.highlightRanges(getAllRanges(selection));
        //Sending the highlighIndex to parent so that it can be saved on MS side
        parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
    }

    function clearHighlights(highlighter, selection) {
        highlighter.clearHighlights();
        parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
    }

    function getAllRanges(selection) {
        var i, allRanges = [];

        for (i = 0; i < selection.rangeCount; i++) {
            allRanges.push(selection.getRangeAt(i));
        }
        return allRanges;
    }

    return pluginFactory({
        name: 'highlighter',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;
            var testRunner = this.getTestRunner();

            if (!window.getSelection) throw new Error('Browser does not support getSelection()');
            self.selection = window.getSelection();

            var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
            var eventer = window[eventMethod];
            var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

            self.highlighter = highlighterFactory({
                className: 'txt-user-highlight',
                containerSelector: '.qti-itemBody',
                containersBlackList: [],
                clearOnClick: true
            });

            eventer(messageEvent, function (e) {
                if (e.data.event === 'setIndex') {
                    // Applying any highlighIndex received from parent
                    self.highlighter.highlightFromIndex(e.data.payload);
                } else if (self.$highlighterTray) {
                    if (e.data.event === 'hide') {
                        self.hide();
                    } else if (e.data.event === 'show') {
                        self.show();
                    }
                }
            });

            this.$highlight = $(
                buttonTpl({
                    control: 'highlight',
                    title: __('Highlight'),
                    icon: 'edit',
                    text: __('Highlight'),
                    className: 'context-action'
                })
            );

            this.$clear = $(
                buttonTpl({
                    control: 'highlight',
                    title: __('Clear Highlights'),
                    icon: 'close',
                    text: __('Clear Highlights'),
                    className: 'context-action'
                })
            );

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

            this.$highlight.on('click', function (e) {
                e.preventDefault();
                highlight(self.highlighter, self.selection);
            });

            this.$clear.on('click', function (e) {
                e.preventDefault();
                clearHighlights(self.highlighter, self.selection);
            });
        },

        /**
         * Called during the runner's render phase
         */
        render: function render() {
            var self = this;

            var $navigation = this.getAreaBroker().getArea('context');
            $navigation.append(this.$highlight);
            $navigation.append(this.$clear);

            var $container = this.getAreaBroker().getArea('contentWrapper');
            $container.append(this.$highlighterTray);

            var $eraser = $container.find('button.icon-eraser');
            $eraser.on('click', function (e) {
                e.preventDefault();
                clearHighlights(self.highlighter, self.selection);
            });

            var $color = $container.find('.color-button');
            $color.on('click', function (e) {
                e.preventDefault();
                highlight(self.highlighter, self.selection);
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
        destroy: function destroy() {
            this.$highlight.remove();
        }
    });
});
